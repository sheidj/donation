const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  const abi = [
    "function createProject(string name, string description, uint256 targetAmount, uint256 duration)",
    "function getProjectCount() view returns (uint256)",
    "event ProjectCreated(uint256 indexed projectId, string name, address indexed creator, uint256 targetAmount, uint256 endTime)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log('创建测试项目...');
  
  const tx = await contract.createProject(
    '图书馆扩建项目',
    '为母校图书馆扩建筹集资金，增加更多阅览座位和电子资源',
    ethers.parseEther('10'),  // 目标 10 ETH
    30 * 24 * 60 * 60        // 30天
  );
  
  console.log('交易已提交:', tx.hash);
  const receipt = await tx.wait();
  console.log('项目创建成功!');
  
  const count = await contract.getProjectCount();
  console.log('当前项目数量:', count.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
