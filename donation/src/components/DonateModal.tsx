'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';

// 简化 ABI，只包含需要的函数
const DONATE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_projectId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_message",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "_isAnonymous",
        "type": "bool"
      }
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "projects",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "raisedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
import { parseEther, formatEther } from 'viem';
import { useReadContract } from 'wagmi';

interface DonateModalProps {
  projectId: bigint;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DonateModal({ projectId, isOpen, onClose, onSuccess }: DonateModalProps) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 获取项目信息
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONATE_ABI,
    functionName: 'projects',
    args: [projectId],
    query: {
      enabled: isOpen,
    },
  });

  // 写入合约
  const { 
    writeContract, 
    isPending: isWriting, 
    data: writeData,
    error: writeError,
    reset: resetWrite,
    status: writeStatus
  } = useWriteContract();

  // 调试：监听状态变化
  useEffect(() => {
    console.log('writeStatus:', writeStatus);
    console.log('writeData:', writeData);
    console.log('writeError:', writeError);
  }, [writeStatus, writeData, writeError]);

  // 等待交易确认
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // 监听交易成功
  useEffect(() => {
    if (isConfirmed) {
      setTxHash(writeData as string);
      // 延迟关闭弹窗，让用户看到成功消息
      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 2000);
    }
  }, [isConfirmed, writeData, onSuccess, onClose]);

  const resetForm = () => {
    setAmount('');
    setMessage('');
    setIsAnonymous(false);
    setTxHash(null);
    resetWrite();
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      console.log('金额无效');
      return;
    }
    
    console.log('开始捐赠:', {
      projectId: projectId.toString(),
      amount,
      message,
      isAnonymous,
      contractAddress: CONTRACT_ADDRESS
    });
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: DONATE_ABI,
        functionName: 'donate',
        args: [projectId, message, isAnonymous],
        value: parseEther(amount),
      });
      console.log('writeContract 已调用');
    } catch (error) {
      console.error('捐赠出错:', error);
    }
  };

  const handleClose = () => {
    if (!isWriting && !isConfirming) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const projectName = projectData ? projectData[1] : '加载中...';
  const isProcessing = isWriting || isConfirming;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">进行捐赠</h2>
        <p className="text-gray-600 mb-2">
          项目: <span className="font-medium text-gray-900">{projectName}</span>
        </p>
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">提示：</span>
            您的捐赠将直接转入智能合约，资金使用情况可在区块链上查询。
          </p>
        </div>

        {/* 交易状态显示 */}
        {isWriting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">正在提交交易...</span>
            </div>
          </div>
        )}

        {isConfirming && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
              <span className="text-yellow-700">等待区块链确认...</span>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="text-green-700 font-medium">捐赠成功！</span>
                {txHash && (
                  <p className="text-xs text-green-600 mt-1">
                    交易哈希: {txHash.slice(0, 20)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(writeError || confirmError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-red-700 font-medium">交易失败</span>
                <p className="text-xs text-red-600 mt-1">
                  {writeError?.message || confirmError?.message || '未知错误'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 捐赠表单 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              捐赠金额 (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="例如: 0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              留言
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isProcessing || isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="输入捐赠留言（可选）"
              rows={2}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous-modal"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isProcessing || isConfirmed}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="anonymous-modal" className="ml-2 text-sm text-gray-700">
              匿名捐赠
            </label>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleDonate}
            disabled={isProcessing || isConfirmed || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isWriting ? '提交中...' : isConfirming ? '确认中...' : isConfirmed ? '已完成' : '确认捐赠'}
          </button>
        </div>
      </div>
    </div>
  );
}
