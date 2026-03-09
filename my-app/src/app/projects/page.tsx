'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';

// 简化 ABI
const PROJECT_ABI = [
  {
    "inputs": [],
    "name": "getProjectCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "uint256", "name": "_targetAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_duration", "type": "uint256" }
    ],
    "name": "createProject",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
import { parseEther, formatEther } from 'viem';
import { ProjectList } from '@/components/ProjectList';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ProjectsPage() {
  const { isConnected, address } = useAccount();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_ABI,
    functionName: 'getProjectCount',
  });

  // 检查是否是管理员（PLATFORM_ADMIN 角色）
  const { data: hasAdminRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" },
                   { "internalType": "address", "name": "account", "type": "address" }],
        "name": "hasRole",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
      }
    ] as const,
    functionName: 'hasRole',
    args: ['0x4ff52032f36e32ac782042a01802e20394d4255c84a3c046490be98ab632691b', address || '0x0'],
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    setIsAdmin(!!hasAdminRole);
  }, [hasAdminRole]);

  const { writeContract: createProject, isPending: isCreating, data: createHash } = useWriteContract();
  
  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // 交易成功后刷新数据
  useEffect(() => {
    if (isConfirmed) {
      // 重置表单
      setProjectName('');
      setProjectDesc('');
      setTargetAmount('');
      setDuration('');
      setShowCreateForm(false);
      
      // 刷新页面数据
      window.location.reload();
    }
  }, [isConfirmed]);

  const handleCreateProject = () => {
    if (!projectName || !targetAmount || !duration) return;
    
    createProject({
      address: CONTRACT_ADDRESS,
      abi: PROJECT_ABI,
      functionName: 'createProject',
      args: [
        projectName,
        projectDesc,
        parseEther(targetAmount),
        BigInt(parseInt(duration) * 24 * 60 * 60),
      ],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">捐赠项目</h1>
          <p className="text-gray-600 mt-2">
            共 {projectCount?.toString() || '0'} 个项目正在募集
          </p>
        </div>
        {isConnected && isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? '取消' : '创建项目'}
          </button>
        )}
      </div>

      {/* 管理员提示 */}
      {isConnected && !isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900">提示</h3>
              <p className="text-sm text-blue-700 mt-1">
                只有平台管理员才能创建捐赠项目。如果您有项目需要发布，请联系学校校友会办公室。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Form */}
      {showCreateForm && isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">创建新项目</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目名称 *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入项目名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标金额 (ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 10"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目描述
              </label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="详细描述项目用途和计划"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                募集天数 *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 30"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleCreateProject}
              disabled={isCreating || isConfirming || !projectName || !targetAmount || !duration}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isCreating ? '提交中...' : isConfirming ? '确认中...' : '确认创建'}
            </button>
          </div>
        </div>
      )}



      {/* Project List */}
      {!isConnected ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">连接钱包</h2>
          <p className="text-gray-600 mb-2">连接钱包后即可查看项目详情并参与捐赠</p>
          <p className="text-sm text-gray-500 mb-6">支持 MetaMask、Coinbase Wallet 等主流钱包</p>
          <ConnectButton />
        </div>
      ) : (
        <ProjectList />
      )}
    </div>
  );
}
