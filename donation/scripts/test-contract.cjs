const { ethers } = require('ethers');

async function main() {
  // 连接到本地 Hardhat 节点
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // 使用第一个默认账户
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('测试账户:', wallet.address);
  
  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log('账户余额:', ethers.formatEther(balance), 'ETH');
  
  // 合约地址
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  // 最小 ABI
  const abi = [
    "function getProjectCount() view returns (uint256)",
    "function projects(uint256) view returns (uint256 id, string name, string description, address creator, uint256 targetAmount, uint256 raisedAmount, uint256 startTime, uint256 endTime, uint8 status, bool exists)",
    "function donate(uint256 projectId, string message, bool isAnonymous) payable",
    "event DonationReceived(uint256 indexed donationId, uint256 indexed projectId, address indexed donor, uint256 amount, bool isAnonymous)"
  ];
  
  // 连接合约
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  try {
    // 测试读取项目数量
    const count = await contract.getProjectCount();
    console.log('项目数量:', count.toString());
    
    // 如果有项目，测试读取第一个项目
    if (count > 0) {
      const project = await contract.projects(1);
      console.log('项目1信息:');
      console.log('  名称:', project.name);
      console.log('  目标金额:', ethers.formatEther(project.targetAmount), 'ETH');
      console.log('  已募集:', ethers.formatEther(project.raisedAmount), 'ETH');
      console.log('  状态:', project.status);
      
      // 测试捐赠（可选）
      console.log('\n尝试捐赠 0.01 ETH 到项目1...');
      const tx = await contract.donate(1, '测试捐赠', false, {
        value: ethers.parseEther('0.01')
      });
      console.log('交易已提交:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('交易已确认! Gas used:', receipt.gasUsed.toString());
      
      // 再次读取项目信息
      const projectAfter = await contract.projects(1);
      console.log('\n捐赠后项目1信息:');
      console.log('  已募集:', ethers.formatEther(projectAfter.raisedAmount), 'ETH');
    }
    
    console.log('\n✅ 合约测试成功！');
  } catch (error) {
    console.error('❌ 合约测试失败:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
