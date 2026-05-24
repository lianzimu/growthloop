# AI 配置指南

## 为什么第一版选择 DeepSeek

- **成本极低**：deepseek-v4-flash 价格远低于 GPT-4o，适合个人工具高频使用
- **质量足够**：周复盘任务（结构化 JSON 输出）无需最强模型
- **中文原生**：DeepSeek 对中文支持优秀
- **API 兼容**：兼容 OpenAI Chat Completions 格式，迁移成本低

## 需要配置的环境变量

在 `.env.local` 中添加（不要提交到 Git）：

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

获取 API Key：https://platform.deepseek.com/api_keys

## 为什么 DEEPSEEK_API_KEY 不能加 NEXT_PUBLIC_

- `NEXT_PUBLIC_` 前缀的环境变量会被 Next.js 打包进浏览器 bundle
- 任何人都可以通过浏览器 DevTools 查看你的 API Key
- API Key 泄露可能导致被盗刷
- **正确做法**：只在服务端（API Route / Server Component）通过 `process.env.DEEPSEEK_API_KEY` 读取

## 默认模型

- **当前**：`deepseek-v4-flash` — 低成本、快速、适合结构化输出
- **后续可切换**：`deepseek-v4-pro` — 更高质量，适合复杂分析

## 当前 AI 功能范围

| 功能 | 状态 | 调用方式 |
|------|------|----------|
| Weekly Review 周复盘 | ✅ 已实现 | 用户点击按钮手动触发 |
| AI Coach 对话 | ❌ 未实现 | 后续计划 |
| Daily Feedback 每日反馈 | ❌ 未实现 | 后续计划 |
| Goal Decomposition 目标分解 | ❌ 未实现 | 后续计划 |

## 成本控制原则

1. **只在用户点击按钮时调用** — 不自动生成、不后台轮询
2. **控制输入数据范围** — 只传入最近 7 天的数据
3. **限制 max_tokens** — 当前设置为 1200
4. **关闭 thinking 模式** — 使用 `thinking: { type: "disabled" }` 降低成本
5. **使用低温度** — temperature 设置为 0.3，减少随机性
6. **优先使用 flash 模型** — deepseek-v4-flash 比 pro 便宜数倍