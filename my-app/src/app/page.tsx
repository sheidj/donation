'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract';
import { formatEther } from 'viem';
import { ProjectList } from '@/components/ProjectList';
import Link from 'next/link';

export default function Home() {
  // 读取统计数据
  const { data: projectCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCount',
  });

  const { data: donationCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getDonationCount',
  });

  const { data: contractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractBalance',
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              透明、可信的校友捐赠平台
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              基于区块链技术，每一笔捐赠都可追溯、可验证，让爱心传递更加透明高效
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/projects"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                浏览项目
              </Link>
              <Link
                href="/projects"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                我要捐赠
              </Link>
            </div>
            {/* 使用提示 */}
            <div className="mt-8 inline-flex items-center bg-blue-700 bg-opacity-50 rounded-full px-4 py-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">首次使用请先连接钱包，支持 MetaMask 等主流钱包</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {projectCount?.toString() || '0'}
              </div>
              <div className="text-gray-600">进行中的项目</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {donationCount?.toString() || '0'}
              </div>
              <div className="text-gray-600">累计捐赠次数</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {contractBalance ? parseFloat(formatEther(contractBalance)).toFixed(2) : '0'} ETH
              </div>
              <div className="text-gray-600">累计募集金额</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">热门项目</h2>
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部 →
            </Link>
          </div>
          <ProjectList />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            平台特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">透明可追溯</h3>
              <p className="text-gray-600">
                所有交易记录上链存储，每一笔资金流向都清晰可见
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">安全可信</h3>
              <p className="text-gray-600">
                智能合约自动执行，无需第三方介入，确保资金安全
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">校友互联</h3>
              <p className="text-gray-600">
                连接全球校友，共同为母校发展贡献力量
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好贡献您的力量了吗？
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            无论是发起项目还是参与捐赠，您的每一份贡献都将被永久记录
          </p>
          <Link
            href="/projects"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            立即开始
          </Link>
        </div>
      </section>
    </div>
  );
}
