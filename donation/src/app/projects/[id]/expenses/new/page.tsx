'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';
import { parseEther } from 'viem';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// 简化 ABI
const EXPENSE_ABI = [
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
    inputs: [{ internalType: 'uint256', name: '_projectId', type: 'uint256' }],
    name: 'getProjectExpenses',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
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
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
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
] as const;

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取项目信息
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EXPENSE_ABI,
    functionName: 'projects',
    args: [projectId],
  });

  // 获取项目支出列表
  const { data: expenseIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EXPENSE_ABI,
    functionName: 'getProjectExpenses',
    args: [projectId],
  });

  // 检查是否有待审核的支出
  const { data: pendingExpense } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EXPENSE_ABI,
    functionName: 'expenses',
    args: expenseIds && expenseIds.length > 0 ? [expenseIds[expenseIds.length - 1]] : undefined,
    query: {
      enabled: !!(expenseIds && expenseIds.length > 0),
    },
  });

  const hasPendingExpense = pendingExpense && pendingExpense[8] && Number(pendingExpense[5]) === 0;

  const { writeContract: requestExpense, isPending, data: txHash } = useWriteContract();
  
  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // 交易成功后刷新页面
  useEffect(() => {
    console.log('Transaction status:', { isPending, isConfirming, isConfirmed, txHash });
    if (isConfirmed && txHash) {
      console.log('Transaction confirmed! Hash:', txHash);
      alert('支出申请提交成功！请等待管理员审核。');
      router.push(`/projects/${projectId.toString()}`);
    }
  }, [isConfirmed, isPending, isConfirming, txHash, router, projectId]);

  // 检查权限
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">申请支出</h1>
          <p className="text-gray-600 mb-4">请先连接钱包</p>
        </div>
      </div>
    );
  }

  if (projectData && address && projectData[3].toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">权限不足</h1>
          <p className="text-red-700 mb-4">只有项目创建者才能申请支出</p>
          <Link
            href={`/projects/${projectId.toString()}`}
            className="text-blue-600 hover:underline"
          >
            返回项目详情
          </Link>
        </div>
      </div>
    );
  }

  // 检查是否有待审核的支出
  if (hasPendingExpense) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-900 mb-2">已有待审核申请</h1>
          <p className="text-yellow-700 mb-4">您有一个支出申请正在等待管理员审核，请等待审核完成后再提交新的申请。</p>
          <Link
            href={`/projects/${projectId.toString()}`}
            className="text-blue-600 hover:underline"
          >
            返回项目详情
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || !description || !recipient) {
      setError('请填写所有必填字段');
      return;
    }

    // 验证地址格式
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setError('请输入有效的以太坊地址');
      return;
    }

    try {
      setIsSubmitting(true);
      requestExpense({
        address: CONTRACT_ADDRESS,
        abi: EXPENSE_ABI,
        functionName: 'requestExpense',
        args: [projectId, description, parseEther(amount), recipient as `0x${string}`],
      });
    } catch (err: any) {
      setError(err.message || '提交失败');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 面包屑导航 */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/projects" className="text-blue-600 hover:underline">
            项目列表
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/projects/${projectId.toString()}`} className="text-blue-600 hover:underline">
            项目详情
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">申请支出</span>
        </div>
      </nav>

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">申请资金支出</h1>
        <p className="text-gray-600 mt-1">
          项目: {projectData?.[1] || '...'}
        </p>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900">申请须知</h3>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>支出申请需要管理员审核通过后才能执行</li>
              <li>请确保支出金额不超过项目已募集金额</li>
              <li>详细的支出说明有助于快速通过审核</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 支出金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支出金额 (ETH) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 0.5"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              可用余额: {projectData ? `${Number(projectData[5]) / 1e18} ETH` : '...'}
            </p>
          </div>

          {/* 收款地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              收款地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="0x..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              资金将转入该地址，请仔细核对
            </p>
          </div>

          {/* 支出说明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支出说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="详细说明资金用途、使用计划等"
              required
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4 mt-8">
          <Link
            href={`/projects/${projectId.toString()}`}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isPending || isConfirming || isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isPending ? '提交中...' : isConfirming ? '确认中...' : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  );
}
