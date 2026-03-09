'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '@/config/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const abi = [
  "function donate(uint256 projectId, string message, bool isAnonymous) payable",
  "function projects(uint256) view returns (uint256 id, string name, string description, address creator, uint256 targetAmount, uint256 raisedAmount, uint256 startTime, uint256 endTime, uint8 status, bool exists)"
];

export function SimpleDonate({ projectId }: { projectId: bigint }) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!amount || !window.ethereum) return;
    
    setLoading(true);
    setStatus('连接钱包...');
    
    try {
      // 使用浏览器钱包
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setStatus('创建合约实例...');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      
      setStatus('发送交易...');
      const tx = await contract.donate(projectId, '测试捐赠', false, {
        value: ethers.parseEther(amount)
      });
      
      setStatus(`交易已提交: ${tx.hash.slice(0, 20)}...`);
      
      const receipt = await tx.wait();
      setStatus(`✅ 捐赠成功! Gas: ${receipt?.gasUsed?.toString() || 'unknown'}`);
      
      setAmount('');
    } catch (error: any) {
      console.error('捐赠错误:', error);
      setStatus(`❌ 错误: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <p className="text-gray-500">请先连接钱包</p>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-2">简单捐赠测试</h3>
      <input
        type="number"
        step="0.001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="输入 ETH 金额"
        className="w-full px-3 py-2 border rounded mb-2"
        disabled={loading}
      />
      <button
        onClick={handleDonate}
        disabled={loading || !amount}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? '处理中...' : '捐赠'}
      </button>
      {status && (
        <p className="mt-2 text-sm text-gray-600">{status}</p>
      )}
    </div>
  );
}
