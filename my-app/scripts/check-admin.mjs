import { ethers } from 'ethers';

async function checkAdmin() {
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // 简化 ABI
    const abi = [
      "function PLATFORM_ADMIN() view returns (bytes32)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function getProjectCount() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // 获取 PLATFORM_ADMIN 角色哈希
    const adminRole = await contract.PLATFORM_ADMIN();
    console.log('Platform Admin Role:', adminRole);
    
    // 检查是否是管理员
    const hasRole = await contract.hasRole(adminRole, adminAddress);
    console.log(`Address ${adminAddress} is admin:`, hasRole);
    
    // 获取合约中的项目数量
    const projectCount = await contract.getProjectCount();
    console.log('Project count:', projectCount.toString());
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdmin();
