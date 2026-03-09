'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import Link from 'next/link';

// 管理员角色哈希
const PLATFORM_ADMIN_ROLE = '0x4ff52032f36e32ac782042a01802e20394d4255c84a3c046490be98ab632691b';

// 简化 ABI
const ADMIN_ABI = [
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
    inputs: [],
    name: 'getProjectCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_projectId', type: 'uint256' },
      { internalType: 'uint8', name: '_newStatus', type: 'uint8' },
    ],
    name: 'updateProjectStatus',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ internalType: 'uint256', name: '_expenseId', type: 'uint256' }],
    name: 'approveExpense',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_expenseId', type: 'uint256' },
      { internalType: 'string', name: '_reason', type: 'string' },
    ],
    name: 'rejectExpense',
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

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'projects' | 'expenses' | 'permissions'>('projects');
  const [newAdminAddress, setNewAdminAddress] = useState('');

  // 检查是否是管理员
  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'hasRole',
    args: [PLATFORM_ADMIN_ROLE, address || '0x0'],
    query: {
      enabled: !!address,
    },
  });

  // 获取项目数量
  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'getProjectCount',
  });

  // 写操作
  const { writeContract: updateStatus, isPending: isUpdating } = useWriteContract();
  const { writeContract: grantRole, isPending: isGranting } = useWriteContract();
  const { writeContract: revokeRole, isPending: isRevoking } = useWriteContract();

  // 非管理员重定向
  if (isConnected && isAdmin === false) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">权限不足</h1>
          <p className="text-red-700 mb-4">您没有管理员权限，无法访问此页面</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">管理员后台</h1>
          <p className="text-gray-600 mb-4">请先连接钱包</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const handleStatusChange = (projectId: bigint, newStatus: number) => {
    updateStatus({
      address: CONTRACT_ADDRESS,
      abi: ADMIN_ABI,
      functionName: 'updateProjectStatus',
      args: [projectId, newStatus],
    });
  };

  const handleGrantAdmin = () => {
    if (!newAdminAddress) return;
    grantRole({
      address: CONTRACT_ADDRESS,
      abi: ADMIN_ABI,
      functionName: 'grantRole',
      args: [PLATFORM_ADMIN_ROLE, newAdminAddress as `0x${string}`],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理员后台</h1>
        <p className="text-gray-600 mt-2">管理平台项目、权限和运营数据</p>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            项目管理
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            支出审核
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            权限管理
          </button>
        </nav>
      </div>

      {/* 项目管理 */}
      {activeTab === 'projects' && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">项目列表</h2>
              <p className="text-sm text-gray-500">共 {projectCount?.toString() || '0'} 个项目</p>
            </div>
            <div className="divide-y divide-gray-200">
              {projectCount && Number(projectCount) > 0 ? (
                Array.from({ length: Number(projectCount) }, (_, i) => i + 1).map((id) => (
                  <AdminProjectRow
                    key={id}
                    projectId={BigInt(id)}
                    onStatusChange={handleStatusChange}
                    isUpdating={isUpdating}
                  />
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">暂无项目</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 支出审核 */}
      {activeTab === 'expenses' && (
        <ExpenseApprovalList />
      )}

      {/* 权限管理 */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">添加管理员</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              placeholder="输入钱包地址 (0x...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGrantAdmin}
              disabled={isGranting || !newAdminAddress}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isGranting ? '添加中...' : '添加管理员'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            添加后，该地址将拥有管理员权限，可以管理项目和用户
          </p>
        </div>
      )}
    </div>
  );
}

// 项目行组件
function AdminProjectRow({
  projectId,
  onStatusChange,
  isUpdating,
}: {
  projectId: bigint;
  onStatusChange: (id: bigint, status: number) => void;
  isUpdating: boolean;
}) {
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'projects',
    args: [projectId],
  });

  if (!projectData) return null;

  const project = {
    id: projectData[0],
    name: projectData[1],
    description: projectData[2],
    creator: projectData[3],
    targetAmount: projectData[4],
    raisedAmount: projectData[5],
    status: Number(projectData[8]),
    exists: projectData[9],
  };

  if (!project.exists) return null;

  const progress = Number((project.raisedAmount * BigInt(100)) / project.targetAmount);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[project.status]}`}>
              {projectStatus[project.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>目标: {formatEther(project.targetAmount)} ETH</span>
            <span>已募集: {formatEther(project.raisedAmount)} ETH</span>
            <span>进度: {progress}%</span>
          </div>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <select
            value={project.status}
            onChange={(e) => onStatusChange(project.id, Number(e.target.value))}
            disabled={isUpdating}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>未开始</option>
            <option value={1}>募集中</option>
            <option value={2}>已完成</option>
            <option value={3}>已取消</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// 支出审核列表组件
function ExpenseApprovalList() {
  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'getProjectCount',
  });

  const [pendingExpenses, setPendingExpenses] = useState<Array<{ projectId: bigint; expenseIndex: bigint }>>([]);

  useEffect(() => {
    if (!projectCount) return;
    
    // 收集所有待审核的支出
    const expenses: Array<{ projectId: bigint; expenseIndex: bigint }> = [];
    for (let i = 1; i <= Number(projectCount); i++) {
      // 这里简化处理，实际应该查询每个项目的支出
      expenses.push({ projectId: BigInt(i), expenseIndex: BigInt(0) });
    }
    setPendingExpenses(expenses);
  }, [projectCount]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">待审核支出</h2>
        <p className="text-sm text-gray-500">审核项目创建者的资金支出申请</p>
      </div>
      <div className="divide-y divide-gray-200">
        {projectCount && Number(projectCount) > 0 ? (
          Array.from({ length: Number(projectCount) }, (_, i) => i + 1).map((projectId) => (
            <ProjectExpenses key={projectId} projectId={BigInt(projectId)} />
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">暂无项目</div>
        )}
      </div>
    </div>
  );
}

// 项目支出列表
function ProjectExpenses({ projectId }: { projectId: bigint }) {
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'projects',
    args: [projectId],
  });

  const { data: expenseIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'getProjectExpenses',
    args: [projectId],
  });

  console.log(`Project ${projectId}:`, { expenseIds, projectExists: projectData?.[9] });

  if (!projectData || !projectData[9]) return null;

  const projectName = projectData[1];
  const ids = expenseIds || [];
  const count = ids.length;

  console.log(`Project ${projectName} has ${count} expenses`, ids);

  if (count === 0) return null;

  return (
    <div className="px-6 py-4">
      <h3 className="font-medium text-gray-900 mb-3">{projectName}</h3>
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => i).map((index) => (
          <ExpenseItem key={index} projectId={projectId} expenseIndex={BigInt(index)} />
        ))}
      </div>
    </div>
  );
}

// 支出项组件
function ExpenseItem({ projectId, expenseIndex }: { projectId: bigint; expenseIndex: bigint }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // 先获取项目支出列表
  const { data: expenseIds, refetch: refetchIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'getProjectExpenses',
    args: [projectId],
  });

  const expenseId = expenseIds && Array.isArray(expenseIds) && expenseIds.length > Number(expenseIndex) ? expenseIds[Number(expenseIndex)] : undefined;

  const { data: expenseData, refetch: refetchExpense } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ADMIN_ABI,
    functionName: 'expenses',
    args: expenseId ? [expenseId] : undefined,
    query: {
      enabled: !!expenseId,
    },
  });

  const { writeContract: approveExpense, isPending: isApproving, data: approveHash } = useWriteContract();
  const { writeContract: rejectExpense, isPending: isRejecting, data: rejectHash } = useWriteContract();
  const { writeContract: executeExpense, isPending: isExecuting, data: executeHash } = useWriteContract();

  // 等待批准交易确认
  const { isLoading: isConfirmingApprove, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // 等待驳回交易确认
  const { isLoading: isConfirmingReject, isSuccess: isRejected } = useWaitForTransactionReceipt({
    hash: rejectHash,
  });

  // 等待执行交易确认
  const { isLoading: isConfirmingExecute, isSuccess: isExecuted } = useWaitForTransactionReceipt({
    hash: executeHash,
  });

  // 交易成功后刷新数据
  useEffect(() => {
    if (isApproved || isRejected || isExecuted) {
      setShowSuccess(true);
      refetchExpense();
      refetchIds();
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [isApproved, isRejected, isExecuted, refetchExpense, refetchIds]);

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

  // 检查支出是否存在
  if (!expense.exists || expense.id === BigInt(0)) return null;

  const requestDate = new Date(Number(expense.requestTime) * 1000);

  const handleApprove = () => {
    approveExpense({
      address: CONTRACT_ADDRESS,
      abi: ADMIN_ABI,
      functionName: 'approveExpense',
      args: [expense.id],
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请输入驳回理由');
      return;
    }
    rejectExpense({
      address: CONTRACT_ADDRESS,
      abi: ADMIN_ABI,
      functionName: 'rejectExpense',
      args: [expense.id, rejectReason.trim()],
    });
  };

  const handleExecute = () => {
    executeExpense({
      address: CONTRACT_ADDRESS,
      abi: ADMIN_ABI,
      functionName: 'executeExpense',
      args: [expense.id],
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="mb-3 bg-green-100 border border-green-200 rounded-md p-2 flex items-center">
          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-800">审核通过！</span>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">{expense.description}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              expense.status === 0 ? 'bg-yellow-100 text-yellow-700' : 
              expense.status === 1 ? 'bg-green-100 text-green-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {expense.status === 0 ? '待审核' : expense.status === 1 ? '已批准' : '已执行'}
            </span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>金额: {formatEther(expense.amount)} ETH</p>
            <p>收款方: {expense.recipient}</p>
            <p>申请时间: {requestDate.toLocaleString()}</p>
          </div>
        </div>
        {expense.status === 0 && (
          <div className="flex space-x-2">
            <button
              onClick={handleApprove}
              disabled={isApproving || isConfirmingApprove}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {isApproving ? '提交中...' : isConfirmingApprove ? '确认中...' : '批准'}
            </button>
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isRejecting || isConfirmingReject}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                驳回
              </button>
            ) : (
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回理由..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isConfirmingReject}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isRejecting ? '提交中...' : isConfirmingReject ? '确认中...' : '确认驳回'}
                  </button>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                    disabled={isRejecting || isConfirmingReject}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {expense.status === 1 && (
          <button
            onClick={handleExecute}
            disabled={isExecuting || isConfirmingExecute}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isExecuting ? '提交中...' : isConfirmingExecute ? '确认中...' : '执行转账'}
          </button>
        )}
        {expense.status === 2 && (
          <div className="flex flex-col items-end space-y-1">
            <span className="px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm">已驳回</span>
            {expense.rejectReason && (
              <span className="text-xs text-red-600 max-w-48 text-right">
                理由: {expense.rejectReason}
              </span>
            )}
          </div>
        )}
        {expense.status === 3 && (
          <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm">已执行</span>
        )}
      </div>
    </div>
  );
}
