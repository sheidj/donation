'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// 简化 ABI
const PROJECT_DETAIL_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'projects',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint256', name: 'targetAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'raisedAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'expenses',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'projectId', type: 'uint256' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
      { internalType: 'uint256', name: 'requestTime', type: 'uint256' },
      { internalType: 'uint256', name: 'executeTime', type: 'uint256' },
      { internalType: 'string', name: 'rejectReason', type: 'string' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_projectId', type: 'uint256' }],
    name: 'getProjectExpenses',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },

  {
    inputs: [
      { internalType: 'uint256', name: '_projectId', type: 'uint256' },
      { internalType: 'string', name: '_description', type: 'string' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
      { internalType: 'address', name: '_recipient', type: 'address' },
    ],
    name: 'requestExpense',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_projectId', type: 'uint256' },
      { internalType: 'uint256', name: '_expenseId', type: 'uint256' },
    ],
    name: 'approveExpense',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_expenseId', type: 'uint256' }],
    name: 'executeExpense',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// 项目状态
const projectStatus = ['未开始', '募集中', '已完成', '已取消'];
const statusColors = [
  'bg-gray-100 text-gray-600',
  'bg-green-100 text-green-600',
  'bg-blue-100 text-blue-600',
  'bg-red-100 text-red-600',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');

  // 获取项目信息
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_DETAIL_ABI,
    functionName: 'projects',
    args: [projectId],
  });

  // 获取支出记录数量
  const { data: expenseIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_DETAIL_ABI,
    functionName: 'getProjectExpenses',
    args: [projectId],
  });
  
  const expenseCount = expenseIds?.length || 0;

  if (!projectData || !projectData[9]) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">项目不存在</p>
          <Link href="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  const project = {
    id: projectData[0],
    name: projectData[1],
    description: projectData[2],
    creator: projectData[3],
    targetAmount: projectData[4],
    raisedAmount: projectData[5],
    startTime: projectData[6],
    endTime: projectData[7],
    status: Number(projectData[8]),
  };

  const progress = Number((project.raisedAmount * BigInt(100)) / project.targetAmount);
  const isCreator = address?.toLowerCase() === project.creator.toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 面包屑导航 */}
      <nav className="mb-4">
        <Link href="/projects" className="text-blue-600 hover:underline">
          ← 返回项目列表
        </Link>
      </nav>

      {/* 项目标题 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${statusColors[project.status]}`}>
                {projectStatus[project.status]}
              </span>
            </div>
            <p className="text-gray-600">{project.description}</p>
          </div>
          {isCreator && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              我是创建者
            </span>
          )}
        </div>
      </div>

      {/* 募集进度 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">募集进度</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">已募集</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{formatEther(project.raisedAmount)}</p>
            <p className="text-sm text-gray-500">已募集 (ETH)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{formatEther(project.targetAmount)}</p>
            <p className="text-sm text-gray-500">目标金额 (ETH)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{expenseCount?.toString() || '0'}</p>
            <p className="text-sm text-gray-500">支出记录</p>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            项目详情
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            资金使用 ({expenseCount?.toString() || '0'})
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      {activeTab === 'overview' && (
        <ProjectOverview project={project} isCreator={isCreator} />
      )}
      {activeTab === 'expenses' && (
        <ExpenseList
          projectId={projectId}
          expenseCount={Number(expenseCount || 0)}
          isCreator={isCreator}
        />
      )}
    </div>
  );
}

// 项目详情组件
function ProjectOverview({ project, isCreator }: { project: any; isCreator: boolean }) {
  const startDate = new Date(Number(project.startTime) * 1000);
  const endDate = new Date(Number(project.endTime) * 1000);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">项目信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">项目ID:</span>
            <span className="ml-2 font-mono">{project.id.toString()}</span>
          </div>
          <div>
            <span className="text-gray-500">创建者:</span>
            <span className="ml-2 font-mono">{project.creator}</span>
          </div>
          <div>
            <span className="text-gray-500">开始时间:</span>
            <span className="ml-2">{startDate.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">结束时间:</span>
            <span className="ml-2">{endDate.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isCreator && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 font-medium mb-2">创建者操作</h3>
          <p className="text-blue-700 text-sm mb-3">
            作为项目创建者，您可以申请使用募集的资金。所有支出申请需要管理员审核通过后才能执行。
          </p>
          <Link
            href={`/projects/${project.id}/expenses/new`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            申请支出
          </Link>
        </div>
      )}
    </div>
  );
}

// 支出列表组件
function ExpenseList({
  projectId,
  expenseCount,
  isCreator,
}: {
  projectId: bigint;
  expenseCount: number;
  isCreator: boolean;
}) {
  if (expenseCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无支出记录</h3>
        <p className="text-gray-500 mb-4">该项目尚未有资金支出记录</p>
        {isCreator && (
          <Link
            href={`/projects/${projectId}/expenses/new`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            申请第一笔支出
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isCreator && (
        <div className="flex justify-end">
          <Link
            href={`/projects/${projectId}/expenses/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            申请支出
          </Link>
        </div>
      )}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {Array.from({ length: expenseCount }, (_, i) => i).map((index) => (
          <ExpenseItem key={index} projectId={projectId} expenseIndex={BigInt(index)} />
        ))}
      </div>
    </div>
  );
}

// 支出项组件
function ExpenseItem({ projectId, expenseIndex }: { projectId: bigint; expenseIndex: bigint }) {
  const { data: expenseIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_DETAIL_ABI,
    functionName: 'getProjectExpenses',
    args: [projectId],
  });

  const expenseId = expenseIds && Array.isArray(expenseIds) && expenseIds.length > Number(expenseIndex) ? expenseIds[Number(expenseIndex)] : undefined;

  const { data: expenseData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROJECT_DETAIL_ABI,
    functionName: 'expenses',
    args: expenseId ? [expenseId] : undefined,
    query: {
      enabled: !!expenseId,
    },
  });

  if (!expenseData) return null;

  const expense = {
    id: expenseData[0],
    projectId: expenseData[1],
    description: expenseData[2],
    amount: expenseData[3],
    recipient: expenseData[4],
    status: Number(expenseData[5]),
    requestTime: expenseData[6],
    executeTime: expenseData[7],
    rejectReason: expenseData[8],
    exists: expenseData[9],
  };

  const requestDate = new Date(Number(expense.requestTime) * 1000);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">{expense.description}</span>
            {expense.status === 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                审核中
              </span>
            )}
            {expense.status === 1 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                已批准
              </span>
            )}
            {expense.status === 2 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                已驳回
              </span>
            )}
            {expense.status === 3 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                已执行
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>金额: {formatEther(expense.amount)} ETH</p>
            <p>收款方: {expense.recipient}</p>
            <p>申请时间: {requestDate.toLocaleString()}</p>
            {expense.status === 2 && expense.rejectReason && (
              <p className="text-red-600 mt-2">
                <span className="font-medium">驳回理由:</span> {expense.rejectReason}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatEther(expense.amount)} ETH</p>
          <p className="text-sm text-gray-500">支出 #{expense.id.toString()}</p>
        </div>
      </div>
    </div>
  );
}
