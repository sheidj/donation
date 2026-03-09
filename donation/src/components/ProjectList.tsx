'use client';

import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';

// 简化 ABI
const PROJECT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "projects",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint256", "name": "targetAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "raisedAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "endTime", "type": "uint256" },
      { "internalType": "uint8", "name": "status", "type": "uint8" },
      { "internalType": "bool", "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProjectCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
import { formatEther } from 'viem';
import { DonateModal } from './DonateModal';
import Link from 'next/link';

interface Project {
  id: bigint;
  name: string;
  description: string;
  creator: string;
  targetAmount: bigint;
  raisedAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  status: number;
  exists: boolean;
}

const statusMap = ['草稿', '募集中', '已完成', '已取消'];
const statusColorMap = ['bg-gray-500', 'bg-green-500', 'bg-blue-500', 'bg-red-500'];

// 单个项目卡片组件
function ProjectCard({ projectId, onDonate }: { projectId: bigint; onDonate: (id: bigint) => void }) {
  const { data: projectData, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_ABI,
    functionName: 'projects',
    args: [projectId],
  });

  if (!projectData) return null;

  const [id, name, description, creator, targetAmount, raisedAmount, startTime, endTime, status, exists] = projectData;
  
  if (!exists) return null;

  const project: Project = {
    id,
    name,
    description,
    creator,
    targetAmount,
    raisedAmount,
    startTime,
    endTime,
    status,
    exists
  };

  const progress = Number(project.targetAmount) > 0 
    ? (Number(project.raisedAmount) / Number(project.targetAmount)) * 100 
    : 0;
  
  const isActive = project.status === 1;
  const isCompleted = project.status === 2;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {project.name}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full text-white ${statusColorMap[project.status]}`}>
            {statusMap[project.status]}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">募集进度</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isCompleted ? 'bg-blue-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        
        {/* 金额信息 */}
        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="text-gray-500">已募集</p>
            <p className="font-semibold text-green-600">
              {formatEther(project.raisedAmount)} ETH
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">目标</p>
            <p className="font-semibold text-gray-900">
              {formatEther(project.targetAmount)} ETH
            </p>
          </div>
        </div>
        
        {/* 时间信息 */}
        <div className="text-xs text-gray-500 mb-4">
          <p>开始时间: {new Date(Number(project.startTime) * 1000).toLocaleDateString()}</p>
          <p>结束时间: {new Date(Number(project.endTime) * 1000).toLocaleDateString()}</p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <Link
            href={`/projects/${project.id.toString()}`}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors text-center text-sm"
          >
            查看详情
          </Link>
          {isActive && (
            <button 
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              onClick={() => onDonate(project.id)}
            >
              立即捐赠
            </button>
          )}
        </div>
        {isCompleted && (
          <div className="w-full bg-gray-100 text-gray-600 py-2 rounded-md text-center text-sm">
            项目已完成募集
          </div>
        )}
        {project.status === 0 && (
          <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-md text-center text-sm">
            项目未开始
          </div>
        )}
        {project.status === 3 && (
          <div className="w-full bg-red-50 text-red-600 py-2 rounded-md text-center text-sm">
            项目已取消
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectList() {
  const [selectedProjectId, setSelectedProjectId] = useState<bigint | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_ABI,
    functionName: 'getProjectCount',
  });

  const count = Number(projectCount || 0);

  const handleDonateSuccess = () => {
    // 触发刷新
    setRefreshKey(prev => prev + 1);
  };

  if (count === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">暂无捐赠项目</p>
        <p className="text-sm text-gray-400 mt-2">创建第一个项目开始募集吧！</p>
      </div>
    );
  }

  return (
    <>
      <div key={refreshKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }, (_, i) => (
          <ProjectCard 
            key={`${i + 1}-${refreshKey}`} 
            projectId={BigInt(i + 1)} 
            onDonate={setSelectedProjectId}
          />
        ))}
      </div>

      {/* 捐赠弹窗 */}
      <DonateModal
        projectId={selectedProjectId || BigInt(0)}
        isOpen={selectedProjectId !== null}
        onClose={() => setSelectedProjectId(null)}
        onSuccess={handleDonateSuccess}
      />
    </>
  );
}
