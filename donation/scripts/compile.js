const fs = require('fs');
const path = require('path');
const solc = require('solc');

// 合约文件路径
const contractPath = path.join(__dirname, '..', 'contracts', 'AlumniDonation.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// OpenZeppelin 合约路径
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// 创建输入对象
const input = {
  language: 'Solidity',
  sources: {
    'AlumniDonation.sol': {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

// 导入回调函数
function findImports(importPath) {
  // 处理 @openzeppelin 导入
  if (importPath.startsWith('@openzeppelin/')) {
    const fullPath = path.join(nodeModulesPath, importPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      return { contents: content };
    } catch (e) {
      return { error: `File not found: ${fullPath}` };
    }
  }
  return { error: `Unsupported import: ${importPath}` };
}

// 编译
console.log('正在编译合约...');
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

// 检查错误
if (output.errors) {
  const hasError = output.errors.some(error => error.severity === 'error');
  output.errors.forEach(error => {
    console.error(error.formattedMessage);
  });
  if (hasError) {
    process.exit(1);
  }
}

// 提取编译结果
const contractName = 'AlumniDonation';
const compiledContract = output.contracts['AlumniDonation.sol'][contractName];

const abi = compiledContract.abi;
const bytecode = compiledContract.evm.bytecode.object;

// 创建 artifacts 目录
const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// 保存编译结果
const artifactPath = path.join(artifactsDir, `${contractName}.json`);
const artifact = {
  contractName: contractName,
  abi: abi,
  bytecode: `0x${bytecode}`,
  deployedBytecode: `0x${compiledContract.evm.deployedBytecode.object}`,
  sourceMap: compiledContract.evm.bytecode.sourceMap,
  deployedSourceMap: compiledContract.evm.deployedBytecode.sourceMap,
  source: source,
  compiler: {
    name: 'solc',
    version: solc.version()
  }
};

fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

console.log(`✅ 编译成功!`);
console.log(`📄 ABI 和字节码已保存到: ${artifactPath}`);
console.log(`📊 合约大小: ${bytecode.length / 2} bytes`);
