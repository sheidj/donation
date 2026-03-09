const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  // 读取编译后的合约
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'AlumniDonation.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;
  
  console.log('🚀 开始部署 AlumniDonation 合约...');
  console.log(`📊 合约字节码大小: ${bytecode.length / 2 - 1} bytes`);
  
  // 连接到本地 Hardhat 网络
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // 使用 Hardhat 的默认私钥（第一个账户）
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 部署账户: ${wallet.address}`);
  
  // 检查账户余额
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 账户余额: ${ethers.formatEther(balance)} ETH`);
  
  // 创建合约工厂
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // 部署合约
  console.log('⏳ 部署中...');
  const contract = await factory.deploy();
  
  // 等待部署完成
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log('✅ 合约部署成功!');
  console.log(`📄 合约地址: ${contractAddress}`);
  console.log(`🔗 交易哈希: ${contract.deploymentTransaction().hash}`);
  
  // 保存部署信息
  const deploymentInfo = {
    contractName: 'AlumniDonation',
    contractAddress: contractAddress,
    deployer: wallet.address,
    deployTime: new Date().toISOString(),
    network: 'hardhat-local',
    transactionHash: contract.deploymentTransaction().hash,
    abi: abi
  };
  
  const deploymentPath = path.join(__dirname, '..', 'artifacts', 'deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 部署信息已保存到: ${deploymentPath}`);
  
  // 验证部署 - 调用一些只读函数
  console.log('\n🔍 验证合约部署...');
  
  const projectCount = await contract.getProjectCount();
  console.log(`📊 项目数量: ${projectCount}`);
  
  const donationCount = await contract.getDonationCount();
  console.log(`📊 捐赠数量: ${donationCount}`);
  
  const contractBalance = await contract.getContractBalance();
  console.log(`💰 合约余额: ${ethers.formatEther(contractBalance)} ETH`);
  
  console.log('\n🎉 部署完成！');
  console.log('\n下一步操作:');
  console.log('1. 创建捐赠项目: 调用 createProject()');
  console.log('2. 进行捐赠: 调用 donate()');
  console.log('3. 查询项目: 调用 projects()');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 部署失败:', error);
    process.exit(1);
  });
