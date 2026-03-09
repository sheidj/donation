'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

// 简化 ABI
const STATS_ABI = [
  {
    inputs: [],
    name: 'getProjectCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDonationCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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
    name: 'donations',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'projectId', type: 'uint256' },
      { internalType: 'address', name: 'donor', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'string', name: 'message', type: 'string' },
      { internalType: 'bool', name: 'isAnonymous', type: 'bool' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function StatsPage() {
  const { isConnected } = useAccount();
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [donationTimeline, setDonationTimeline] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [totalRaised, setTotalRaised] = useState<string>('0');
  const [totalExpenses, setTotalExpenses] = useState<string>('0');

  // 获取项目数量
  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: STATS_ABI,
    functionName: 'getProjectCount',
  });

  // 获取捐赠数量
  const { data: donationCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: STATS_ABI,
    functionName: 'getDonationCount',
  });

  // 获取所有项目数据
  useEffect(() => {
    async function fetchRealData() {
      if (!projectCount || !donationCount) return;

      try {
        // 获取 provider
        const provider = await ethers.getDefaultProvider('http://127.0.0.1:8545');
        
        // 读取合约 ABI
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, provider);

        const count = Number(projectCount);
        const projects = [];
        let totalRaisedAmount = BigInt(0);
        let totalTargetAmount = BigInt(0);
        let activeCount = 0;
        let completedCount = 0;
        let pausedCount = 0;

        // 获取所有项目数据
        for (let i = 1; i <= count; i++) {
          try {
            const project = await contract.projects(i);
            if (project.exists) {
              projects.push({
                id: i,
                name: project.name,
                raisedAmount: project.raisedAmount,
                targetAmount: project.targetAmount,
                status: Number(project.status),
              });

              totalRaisedAmount += BigInt(project.raisedAmount.toString());
              totalTargetAmount += BigInt(project.targetAmount.toString());

              // 统计状态
              if (Number(project.status) === 0) activeCount++;
              else if (Number(project.status) === 1) completedCount++;
              else if (Number(project.status) === 2) pausedCount++;
            }
          } catch (e) {
            console.error('Error fetching project:', i, e);
          }
        }

        // 设置总金额
        setTotalRaised(formatEther(totalRaisedAmount));
        
        // TODO: 计算总支出（需要合约支持）
        setTotalExpenses('0');

        // 项目状态分布
        setProjectStats([
          { name: '进行中', value: activeCount, color: '#10B981' },
          { name: '已完成', value: completedCount, color: '#3B82F6' },
          { name: '已暂停', value: pausedCount, color: '#F59E0B' },
        ]);

        // Top 项目排行
        const sortedProjects = [...projects]
          .sort((a, b) => (b.raisedAmount > a.raisedAmount ? 1 : -1))
          .slice(0, 5);

        setTopProjects(
          sortedProjects.map((p) => ({
            name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
            raised: parseFloat(formatEther(p.raisedAmount)),
            target: parseFloat(formatEther(p.targetAmount)),
          }))
        );

        // 获取捐赠时间线（简化版）
        const timeline = [];
        const now = Math.floor(Date.now() / 1000);
        const months = 6;
        
        for (let i = months - 1; i >= 0; i--) {
          const monthStart = now - (i * 30 * 24 * 60 * 60);
          const monthEnd = now - ((i - 1) * 30 * 24 * 60 * 60);
          
          let monthAmount = BigInt(0);
          
          // 遍历所有捐赠记录
          for (let j = 1; j <= Number(donationCount); j++) {
            try {
              const donation = await contract.donations(j);
              if (donation.exists && donation.timestamp >= monthStart && donation.timestamp < monthEnd) {
                monthAmount += BigInt(donation.amount.toString());
              }
            } catch (e) {
              // Ignore
            }
          }
          
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          timeline.push({
            date: date.toLocaleDateString('zh-CN', { year: '2-digit', month: '2-digit' }),
            amount: parseFloat(formatEther(monthAmount)),
          });
        }

        setDonationTimeline(timeline);

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchRealData();
  }, [projectCount, donationCount]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">数据统计</h1>
          <p className="text-gray-600 mb-4">请先连接钱包查看统计数据</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">平台数据统计</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 mb-1">总项目数</p>
          <p className="text-3xl font-bold text-blue-600">{projectCount?.toString() || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 mb-1">总捐赠数</p>
          <p className="text-3xl font-bold text-green-600">{donationCount?.toString() || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 mb-1">总募集金额</p>
          <p className="text-3xl font-bold text-purple-600">{totalRaised} ETH</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 mb-1">总支出金额</p>
          <p className="text-3xl font-bold text-orange-600">{totalExpenses} ETH</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 项目状态分布 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目状态分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 捐赠趋势 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">捐赠趋势 (ETH)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donationTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 项目募资排行 */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目募资排行 (ETH)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="raised" name="已募集" fill="#10B981" />
              <Bar dataKey="target" name="目标金额" fill="#E5E7EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
