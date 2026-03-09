export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">关于我们</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">平台愿景</h2>
          <p className="text-gray-600 mb-4">
            校友捐赠追踪平台致力于利用区块链技术，打造一个透明、可信、高效的校友捐赠生态系统。
            我们相信，每一笔捐赠都应该被尊重，每一分资金都应该被妥善使用。
          </p>
          <p className="text-gray-600">
            通过智能合约技术，我们消除了传统捐赠中的信任障碍，让捐赠者能够实时追踪资金流向，
            确保每一份爱心都能传递到最需要的地方。
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">项目发布</h3>
              <p className="text-gray-600 text-sm">
                学校或校友组织可以发布捐赠项目，设定目标金额和募集期限
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">透明捐赠</h3>
              <p className="text-gray-600 text-sm">
                所有捐赠记录上链存储，支持实名或匿名捐赠
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">资金追踪</h3>
              <p className="text-gray-600 text-sm">
                实时查看项目募集进度和资金使用情况
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">支出审批</h3>
              <p className="text-gray-600 text-sm">
                多层审批机制确保资金使用的合规性和透明度
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">技术架构</h2>
          <div className="bg-blue-50 p-6 rounded-lg">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                <strong>智能合约层：</strong>Solidity + Hardhat + OpenZeppelin
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                <strong>前端展示层：</strong>Next.js + Tailwind CSS + shadcn/ui
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                <strong>Web3 交互层：</strong>Wagmi + Viem + RainbowKit
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                <strong>数据存储层：</strong>Prisma ORM + PostgreSQL（可选）
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">联系我们</h2>
          <p className="text-gray-600 mb-4">
            如果您有任何问题或建议，欢迎与我们联系：
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>邮箱：</strong>contact@alumni-donation.org
            </p>
            <p className="text-gray-700 mt-2">
              <strong>地址：</strong>某某大学校友会办公室
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
