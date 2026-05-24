# GrowthLoop 部署指南

本文档覆盖将 GrowthLoop 部署到 Vercel 的完整流程。

## 部署前检查清单

- [ ] 代码已推送到 GitHub 仓库
- [ ] `.env.local` 不在版本控制中（已在 `.gitignore` 中）
- [ ] Supabase 项目已创建并运行中
- [ ] Supabase schema 已应用（`supabase/schema.sql`）
- [ ] DeepSeek API Key 已获取
- [ ] `npm run build` 通过
- [ ] `npx tsc --noEmit` 通过
- [ ] 手动测试完成（参考 MVP_ACCEPTANCE.md）

## GitHub 仓库准备

```bash
# 确认 .env.local 不会提交
cat .gitignore | grep .env.local

# 推送到 GitHub
git add .
git commit -m "Milestone 5: Cloud MVP Hardening"
git push origin main
```

## Vercel 部署步骤

### 1. 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择你的 GitHub 仓库（`lianzimu/growthloop`）
4. 点击 **Import**

### 2. 配置环境变量

在 Vercel 项目设置 → Environment Variables，添加以下变量：

| 变量名 | 值 | 环境 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 项目 URL (如 `https://xxxxx.supabase.co`) | Production / Preview / Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key | Production / Preview / Development |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key | Production / Preview / Development |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` (默认) | Production / Preview / Development |
| `DEEPSEEK_MODEL` | `deepseek-chat` (默认) | Production / Preview / Development |

> ⚠️ **重要**：以下划线 `_` 开头的环境变量名如 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_BASE_URL` 以及 `DEEPSEEK_MODEL` 在 Next.js 服务端可用，但不会被暴露到客户端。

### 3. 部署

- Vercel 会在代码推送后自动部署
- 首次导入时会触发一次部署
- 可在 Project Settings → Git 中配置分支部署规则

## Supabase Auth 配置

部署后需要配置 Supabase Auth 的 Site URL 和 Redirect URLs：

### Site URL

在 Supabase Dashboard → Authentication → URL Configuration：

- **Site URL**：`https://your-app.vercel.app`
- **Redirect URLs**（添加所有需要的 URL）：
  - `https://your-app.vercel.app`
  - `https://your-app.vercel.app/**`
  - `http://localhost:3000`（本地开发用）
  - `http://localhost:3000/**`（本地开发用）

### 生产域名

如果你使用自定义域名，需要同时添加：
- `https://your-custom-domain.com`
- `https://your-custom-domain.com/**`

## 不要上传 .env.local

确保 `.env.local` 在 `.gitignore` 中：

```
# local env files
.env.local
.env.*.local
```

`.env.example` 可以提交，它不包含真实密钥。

## 部署后测试清单

部署完成后，按以下顺序测试：

### Auth
- [ ] 注册新用户 → 检查邮箱确认流程
- [ ] 登录已有用户 → 成功跳转首页
- [ ] 刷新页面 → 保持登录状态
- [ ] 退出登录 → 回到本地模式

### Goals
- [ ] 创建新目标 → 成功显示
- [ ] 创建行动关联到目标 → 成功显示
- [ ] 刷新页面 → 数据保持

### Check-in
- [ ] 填写每日打卡 → 成功保存
- [ ] 刷新页面 → 打卡记录保持
- [ ] 查看当日统计 → 数据正确

### Weekly Review
- [ ] 查看本周统计 → 数据正确（平均值、完成率等）
- [ ] 无数据时显示空状态提示

### AI 复盘
- [ ] 点击"生成 AI 复盘" → 成功返回结果
- [ ] 填写用户反思 → 成功保存
- [ ] 刷新页面 → 已保存复盘回填

### localStorage 迁移
- [ ] 本地模式创建数据
- [ ] 登录 → 看到迁移提示卡片
- [ ] 点击迁移 → 成功迁移
- [ ] 迁移后云端可见所有数据

### Cloud/Local 模式
- [ ] 未登录 → 显示"本地模式"提示
- [ ] 已登录 → 显示"云端模式"提示
- [ ] 退出登录 → 数据切换到本地

## 常见问题

### 构建失败："Supabase URL is required"
确认 Vercel 环境变量中已配置 `NEXT_PUBLIC_SUPABASE_URL`。

### AI 复盘返回 500
确认 `DEEPSEEK_API_KEY` 已正确配置，且 DeepSeek API 可访问。

### 登录后无法获取云端数据
检查 Supabase RLS 策略是否正确配置（参考 `supabase/schema.sql`）。

### 注册后未收到确认邮件
在 Supabase Dashboard → Authentication → Settings 中检查邮件设置。开发阶段可以关闭邮箱确认（不推荐生产环境）。

## 下一步

部署完成并通过测试后，参考：
- [MVP_ACCEPTANCE.md](MVP_ACCEPTANCE.md) 的"下一阶段建议"
- [PRD.md](PRD.md) 的产品路线图