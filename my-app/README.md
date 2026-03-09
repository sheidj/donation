# 区块链校友捐赠追踪平台

## 📋 项目概述

基于区块链技术的透明化校友捐赠管理平台，利用智能合约实现资金全流程可追溯、不可篡改的特性，为高校校友会提供安全、透明的捐赠管理解决方案。

### 核心特性

- ✅ **资金透明** - 所有捐赠和支出记录上链，公开可查
- ✅ **流程规范** - 多级审核机制，确保资金使用合规
- ✅ **实时统计** - 可视化数据展示，动态追踪项目进展
- ✅ **去中心化** - 基于以太坊智能合约，无需第三方托管

---

## 🛠️ 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Next.js 15 + React 19 | 服务端渲染 + 客户端交互 |
| **样式方案** | Tailwind CSS | 原子化 CSS |
| **Web3 交互** | Wagmi + Viem + RainbowKit | 钱包连接与合约调用 |
| **智能合约** | Solidity 0.8.20 | OpenZeppelin 标准库 |
| **开发环境** | Hardhat | 编译、部署、测试 |
| **区块链网络** | Ethereum Local (Hardhat) | 本地开发网络 |

### 系统架构图

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   用户界面   │─────▶│  Web3 层     │─────▶│ 智能合约层   │
│  Next.js    │      │ Wagmi/RK    │      │  Solidity   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  状态管理   │      │  事件监听    │      │  数据存储   │
│  useState   │      │  useWaitFor  │      │  Blockchain │
└─────────────┘      └──────────────┘      └─────────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- Git

### 安装步骤

```bash
# 进入项目目录
cd my-app

# 安装依赖
npm install

# 启动 Hardhat 本地节点（新窗口）
npx hardhat node

# 部署智能合约（新窗口）
npx hardhat ignition deploy ./ignition/modules/AlumniDonation.ts --network localhost

# 启动前端开发服务器
npm run dev
```

访问 `http://localhost:3000`

---

## 📦 项目结构

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   ├── providers.tsx       # Web3 Provider
│   │   ├── projects/           # 项目管理模块
│   │   ├── admin/              # 管理员后台
│   │   ├── stats/              # 数据统计页面
│   │   └── about/              # 关于页面
│   ├── components/             # React 组件
│   │   ├── Navbar.tsx          # 导航栏
│   │   └── DonateModal.tsx     # 捐赠弹窗
│   └── config/                 # 配置文件
│       └── contract.ts         # 合约地址和 ABI
├── contracts/                  # Solidity 合约
│   └── AlumniDonation.sol      # 主合约
├── ignition/                   # Hardhat Ignition 部署脚本
│   └── modules/
│       └── AlumniDonation.ts
└── package.json
```

---

## 🔗 智能合约设计

### 核心功能模块

#### 1. 项目管理
```solidity
struct Project {
    uint256 id;              // 项目 ID
    string name;             // 项目名称
    string description;      // 描述
    address creator;         // 创建者
    uint256 targetAmount;    // 目标金额
    uint256 raisedAmount;    // 已募集金额
    uint256 startTime;       // 开始时间
    uint256 endTime;         // 结束时间
    uint8 status;            // 状态：0-进行中，1-已完成，2-已暂停
    bool exists;             // 是否存在
}
```

#### 2. 捐赠管理
- 支持匿名/实名捐赠
- 自动记录捐赠者信息
- 实时更新项目募集进度
- 捐赠记录永久存储

#### 3. 支出审批流程

```
申请支出 → 待审核 → 管理员批准 → 执行转账 → 已完成
              ↓
           管理员驳回 → 已驳回
```

**关键函数：**
- `requestExpense()` - 项目创建者提交支出申请
- `approveExpense()` - 管理员批准申请
- `rejectExpense(string reason)` - 管理员驳回（需填写理由）
- `executeExpense()` - 执行已批准的转账

#### 4. 权限控制

| 角色 | 哈希 | 权限 |
|------|------|------|
| DEFAULT_ADMIN_ROLE | 0x00...00 | 默认管理员 |
| PLATFORM_ADMIN | 0x4f...1b | 平台管理员（审核支出） |
| PROJECT_AUDITOR | 0x9f...3c | 项目审核员 |

---

## 💻 功能模块详解

### 1. 首页 (`/`)

**功能：**
- Hero 区域展示平台愿景
- 实时统计数据卡片
- 特色项目列表
- 快速入口引导

**技术实现：**
- 使用 `useReadContract` 获取链上数据
- 局部刷新优化性能
- 响应式布局适配移动端

### 2. 项目列表页 (`/projects`)

**功能：**
- 所有项目卡片展示
- 搜索和筛选功能
- 创建新项目按钮
- 项目进度可视化

**关键代码：**
```typescript
const { data: projects } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getProjectCount',
});
```

### 3. 项目详情页 (`/projects/[id]`)

**功能：**
- 项目详细信息展示
- 捐赠记录列表
- 资金使用明细
- 立即捐赠按钮

**状态同步机制：**
1. 交易提交后显示 loading 状态
2. `useWaitForTransactionReceipt` 监听确认
3. 确认后自动刷新数据
4. 弹出成功提示 + 下一步指引

### 4. 管理员后台 (`/admin`)

**功能：**
- 项目审核管理
- 支出申请审批
- 驳回理由录入
- 执行资金划转

**交互优化：**
- 批准/驳回双按钮设计
- 驳回理由输入框（必填验证）
- 交易状态实时反馈
- 自动刷新避免重复提交

### 5. 数据统计页 (`/stats`)

**可视化图表：**
- 📊 项目状态分布饼图
- 📈 捐赠趋势折线图
- 📊 项目募资排行柱状图

**数据来源：**
- 遍历合约项目数组
- 累加计算总金额
- 按月聚合捐赠记录
- Top5 项目排序展示

---

## 🔐 安全机制

### 1. 重入攻击防护
```solidity
modifier nonReentrant() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}
```

### 2. 权限校验
```solidity
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "Access denied");
    _;
}
```

### 3. 支出审核多重确认
- 项目创建者发起申请
- 管理员审核批准
- 再次确认后执行转账

### 4. 紧急暂停机制
```solidity
function pause() external onlyRole(PLATFORM_ADMIN) {
    _pause();
}
```

---

## 🎨 UI/UX 设计规范

### 色彩体系

| 类型 | 颜色 | 用途 |
|------|------|------|
| 主色 | Blue (#3B82F6) | 按钮、链接 |
| 成功 | Green (#10B981) | 批准、完成状态 |
| 警告 | Yellow (#F59E0B) | 待审核状态 |
| 危险 | Red (#EF4444) | 驳回、错误 |
| 中性 | Gray (#6B7280) | 次要文本 |

### 交互反馈三要素

1. **精准刷新** - 仅重绘变更区域
2. **状态同步** - 实时反映后端真实状态
3. **明确提示** - 成功/失败 + 原因 + 下一步

**示例：**
```typescript
// 交易成功后
alert('项目创建成功！已同步至最新状态。下一步：点击进入项目详情查看配置。');
router.push(`/projects/${projectId}`);
```

---

## 🧪 测试指南

### 单元测试（待实现）

```bash
npx hardhat test
```

### 手动测试清单

- [ ] 连接钱包
- [ ] 创建项目
- [ ] 进行捐赠
- [ ] 申请支出
- [ ] 批准/驳回支出
- [ ] 执行支出
- [ ] 查看统计数据

---

## 📊 性能优化

### 1. 数据缓存策略
- 使用 `useReadContract` 的 `cacheTime` 配置
- 避免频繁链上查询

### 2. 批量数据处理
- 分页加载大额数据
- 异步并发请求

### 3. 组件优化
- `React.memo` 避免不必要的重渲染
- `useCallback` 缓存回调函数

---

## 🚧 已知限制

1. **当前使用本地测试网络** - 数据不持久化
2. **支出总额统计未实现** - 需要合约添加辅助函数
3. **移动端适配待完善** - 部分图表在小屏显示不佳

---

## 🔮 未来规划

### Phase 1: 基础功能（已完成 ✅）
- [x] 智能合约开发
- [x] 前端页面结构
- [x] 捐赠和支出流程
- [x] 数据可视化

### Phase 2: 功能增强（进行中 🚧）
- [ ] 数据库集成（Prisma + PostgreSQL）
- [ ] 用户认证系统
- [ ] 邮件通知服务
- [ ] 导出报表功能

### Phase 3: 生产部署（计划中 📅）
- [ ] 部署到 Sepolia 测试网
- [ ] Gas 费用优化
- [ ] 多签钱包集成
- [ ] 审计和安全加固

---

## 👥 团队协作

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/stats-page

# 提交代码
git commit -m "feat: 添加数据统计页面"

# 推送到远程
git push origin feature/stats-page
```

### Commit 规范

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- OpenZeppelin Contracts
- RainbowKit
- Recharts
- Next.js Team

---

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。
