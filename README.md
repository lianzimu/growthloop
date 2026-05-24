# GrowthLoop 成长循环

GrowthLoop 是一个轻量级个人成长追踪工具，帮助你设定目标、追踪日常习惯、进行周复盘，并通过 AI 获取深度反馈。

## 核心功能

- **目标管理**：设定长期目标和可执行行动
- **每日打卡（Check-in）**：记录睡眠、精力、心情、压力及行动完成情况
- **周复盘（Weekly Review）**：自动统计一周数据，展示趋势
- **AI 周复盘**：通过 DeepSeek AI 生成个性化每周深度复盘
- **双模式数据存储**：未登录使用本地 localStorage，登录后数据保存到 Supabase 云端，支持跨设备同步
- **数据迁移**：支持将本地数据一键迁移到云端

## 技术栈

- **前端框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **后端 / 数据库**：Supabase（PostgreSQL + Auth）
- **AI**：DeepSeek API（通过 `/api/ai/weekly-review` 路由）
- **部署**：Vercel

## 本地运行

### 环境要求

- Node.js 18+
- npm 9+

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/lianzimu/growthloop.git
cd growthloop

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase 和 DeepSeek 配置

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器访问
# http://localhost:3000
```

## 环境变量

| 变量名 | 说明 | 必需 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 是（云端模式） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key | 是（云端模式） |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 是（AI 复盘） |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址，默认 `https://api.deepseek.com` | 否 |
| `DEEPSEEK_MODEL` | DeepSeek 模型名称，默认 `deepseek-chat` | 否 |

## 当前状态

- **Static MVP Shell**：✅ 完成
- **localStorage Local MVP**：✅ 完成
- **Supabase Auth + Cloud MVP**：✅ 完成
- **DeepSeek AI Weekly Review**：✅ 完成
- **Cloud MVP Hardening**：✅ 完成
- **部署准备**：✅ 就绪

## Roadmap

- [ ] AI Coach（个性化成长教练）
- [ ] 流式 AI 输出
- [ ] 数据可视化图表
- [ ] PWA 支持
- [ ] 多语言支持

## 免责声明

**GrowthLoop 是一个个人成长记录和复盘工具，不提供医学诊断、心理咨询、财务建议或任何形式的专业建议。**

AI 生成的复盘内容仅供参考，不应作为重要决策的唯一依据。如涉及健康、心理或财务问题，请咨询持证专业人士。

## 部署到 Vercel

请参阅 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) 了解详细的部署前检查清单和步骤。

## 更多文档

- [产品需求文档](docs/PRD.md)
- [数据库设计](docs/DATABASE.md)
- [Supabase 配置指南](docs/SUPABASE_SETUP.md)
- [AI 配置指南](docs/AI_SETUP.md)
- [本地 MVP 测试](docs/LOCAL_MVP_TESTING.md)
- [部署指南](docs/DEPLOYMENT.md)
- [MVP 验收清单](docs/MVP_ACCEPTANCE.md)