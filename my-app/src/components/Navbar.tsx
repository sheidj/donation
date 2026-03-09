'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/config/contract';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '项目列表' },
  { href: '/stats', label: '数据统计' },
  { href: '/my-donations', label: '我的捐赠' },
  { href: '/about', label: '关于我们' },
];

// 管理员角色哈希 (keccak256("PLATFORM_ADMIN"))
const PLATFORM_ADMIN_ROLE = '0x4ff52032f36e32ac782042a01802e20394d4255c84a3c046490be98ab632691b';

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  // 检查是否是管理员
  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
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
    ] as const,
    functionName: 'hasRole',
    args: [PLATFORM_ADMIN_ROLE, address || '0x0'],
    query: {
      enabled: !!address,
    },
  });

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">捐</span>
              </div>
              <span className="text-xl font-bold text-gray-900">校友捐赠平台</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* 管理员入口 - 仅管理员可见 */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors flex items-center ${
                  pathname === '/admin'
                    ? 'text-red-600'
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                管理后台
              </Link>
            )}
          </div>

          {/* Connect Button */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
