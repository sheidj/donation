'use client';

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Donation {
  id: bigint;
  projectId: bigint;
  donor: string;
  amount: bigint;
  timestamp: bigint;
  message: string;
  isAnonymous: boolean;
  exists: boolean;
}

function DonationCard({ donationId }: { donationId: bigint }) {
  const { data: donationData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'donations',
    args: [donationId],
  });

  const donationProjectId = donationData?.[1];
  
  const { data: projectData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'projects',
    args: donationProjectId ? [donationProjectId] : undefined,
    query: {
      enabled: !!donationProjectId,
    },
  });

  if (!donationData) return null;

  const [id, projId, donor, amount, timestamp, message, isAnonymous, exists] = donationData;
  
  if (!exists) return null;

  const donation: Donation = {
    id,
    projectId: projId,
    donor,
    amount,
    timestamp,
    message,
    isAnonymous,
    exists
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            捐赠 #{donation.id.toString()}
          </h3>
          <p className="text-sm text-gray-500">
            项目: {projectData?.[1] || '加载中...'}
          </p>
        </div>
        <span className="text-2xl font-bold text-green-600">
          {formatEther(donation.amount)} ETH
        </span>
      </div>
      
      {donation.message && (
        <p className="text-gray-600 mb-4 italic">
          "{donation.message}"
        </p>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {new Date(Number(donation.timestamp) * 1000).toLocaleString()}
        </span>
        {donation.isAnonymous && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            匿名捐赠
          </span>
        )}
      </div>
    </div>
  );
}

export default function MyDonationsPage() {
  const { address, isConnected } = useAccount();

  const { data: donorHistory } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getDonorHistory',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">我的捐赠</h1>
          <p className="text-gray-600 mb-2">连接钱包后即可查看您的捐赠记录</p>
          <p className="text-sm text-gray-500 mb-6">所有捐赠记录均存储在区块链上，永久可查</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const donationIds = donorHistory || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">我的捐赠记录</h1>
      
      {donationIds.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无捐赠记录</h2>
          <p className="text-gray-600 mb-4">您还没有进行过任何捐赠</p>
          <a
            href="/projects"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            去捐赠
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            您共进行了 {donationIds.length} 次捐赠
          </p>
          {donationIds.map((id) => (
            <DonationCard key={id.toString()} donationId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
