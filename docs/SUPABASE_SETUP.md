# Supabase 接入指南

GrowthLoop 使用 Supabase 作为 BaaS（Backend as a Service），提供：
- **Supabase Auth**：用户认证（邮箱/密码、OAuth 等）
- **Supabase Database (PostgreSQL)**：业务数据持久化
- **Row Level Security (RLS)**：行级安全策略，确保用户数据隔离
- **Supabase JS SDK**：前端直接调用数据库

---

## 1. Supabase 项目创建步骤

### 1.1 注册并创建项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写以下信息：
   - **Organization**：选择或创建一个组织
   - **Name**：`growthloop`（或自定义名称）
   - **Database Password**：设置一个强密码（务必记录）
   - **Region**：建议选择 `Southeast Asia (Singapore)` 或 `East Asia (Tokyo)`
   - **Pricing Plan**：选择 Free Plan（足够 MVP 阶段使用）
5. 点击 "Create Project"
6. 等待项目创建完成（约 1-2 分钟）

### 1.2 获取连接信息

项目创建完成后，在 Supabase Dashboard 中：

1. 进入项目 Dashboard
2. 左侧菜单 → **Settings** → **API**
3. 记录以下两个值：
   - **Project URL**：格式为 `https://<project-id>.supabase.co`
   - **anon public key**：以 `eyJ...` 开头的长字符串

---

## 2. `.env.local` 配置

在项目根目录创建 `.env.local` 文件（如果已存在则追加以下内容）：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# 以下变量用于服务端 API 调用（仅在需要时使用）
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 变量说明

| 变量名 | 是否必需 | 用途 |
|--------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 必需 | Supabase 项目 URL，前端可用 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 必需 | 匿名公钥，前端可用，受 RLS 限制 |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ 暂不需要 | 服务角色密钥，可绕过 RLS |

### 注意事项

> ⚠️ **重要**：`NEXT_PUBLIC_` 前缀的变量会被打包到前端 JS bundle 中，因此 **只能使用 anon key**。
>
> `SUPABASE_SERVICE_ROLE_KEY` 拥有完全数据库访问权限（绕过 RLS），**绝对不能**使用 `NEXT_PUBLIC_` 前缀暴露给前端。
>
> 本项目当前阶段不需要 service_role key，所有数据库操作通过 RLS 策略限制，用户只能访问自己的数据。

---

## 3. 为什么使用 Supabase Auth

### 3.1 不用自己造轮子

Supabase Auth 提供了开箱即用的：

- 邮箱密码登录
- 邮箱验证
- 密码重置
- Session 管理
- 用户表 (`auth.users`)
- JWT Token 自动处理

### 3.2 天然集成 RLS

Supabase Auth 与 RLS 深度集成。用户登录后，Supabase SDK 自动携带 JWT Token，数据库层面通过 `auth.uid()` 函数获取当前用户 ID，确保每条查询都在正确的 RLS 策略下执行。

### 3.3 免费额度充足

Supabase Free Plan 包含：
- 2 个项目
- 500MB 数据库空间
- 5GB 带宽/月
- 50,000 月活用户
- 免费 Auth 功能

对于个人使用 MVP 阶段完全足够。

---

## 4. 为什么需要 RLS

### 4.1 数据隔离是底线

GrowthLoop 未来可能从个人工具发展为多用户产品。即使用户目前只有一个人，也需要从一开始就设计好数据隔离机制。

### 4.2 RLS 的工作原理

Row Level Security 允许为每张表定义访问策略（Policy）。策略规则运行在 PostgreSQL 层面，**无法被前端绕过**。

示例策略：

```sql
-- 用户只能看到自己的 domains
CREATE POLICY "Users can view own domains"
ON domains FOR SELECT
USING (auth.uid() = user_id);
```

### 4.3 安全优势

- 即使前端代码出现 bug，恶意用户也无法访问他人数据
- 不需要编写后端 API 来验证数据归属
- 策略在数据库层执行，性能和安全性最优
- Supabase SDK 自动传递 JWT，无需手动处理

---

## 5. Supabase 接入阶段划分

GrowthLoop 的 Supabase 接入分为多个 Step，逐步推进，每个 Step 完成后进行验收。

### Step 0：数据库 SQL 与文档 ✅（当前阶段）

- 编写 `supabase/schema.sql`（DDL + RLS + 索引）
- 编写 `supabase/seed.sql`（默认数据示例）
- 编写 `docs/SUPABASE_SETUP.md`（本文档）
- 编写 `docs/DATABASE.md`（数据库设计文档）
- 编写 `docs/MILESTONE_3_PLAN.md`（M3 完整规划）

### Step 1：安装 Supabase SDK ✅（当前阶段完成）

已安装的依赖：

| 包名 | 版本 | 用途 |
|------|------|------|
| `@supabase/supabase-js` | ^2.x | Supabase JS 核心 SDK，提供数据库、Auth、Storage 等 API |
| `@supabase/ssr` | ^0.x | Supabase 官方 Next.js SSR 集成，支持 cookie 自动管理 |

已创建的文件：

| 文件 | 用途 |
|------|------|
| `lib/supabase/client.ts` | 浏览器端 client — 供 `"use client"` 组件和 Hook 使用 |
| `lib/supabase/server.ts` | 服务端 client — 供 Server Components、Route Handlers、Server Actions 使用 |
| `.env.example` | 环境变量模板 — 不包含真实 key，可提交到 Git |

### client.ts 和 server.ts 的区别

**`lib/supabase/client.ts`（浏览器端）**
- 使用 `createBrowserClient()` 创建
- 只能用于标记了 `"use client"` 的组件
- 不直接操作 cookie，通过浏览器 JS 维持 session
- 调用 API 时自动在 header 中携带当前登录用户的 JWT

**`lib/supabase/server.ts`（服务端）**
- 使用 `createServerClient()` 创建
- 用于 Server Components（默认就是服务端组件）、Route Handlers、Server Actions
- 直接读写 Next.js cookie，自动处理 session 刷新
- `cookies()` 在当前 Next.js 16 中是 async，已正确 `await`

### .env.local 和 .env.example 的区别

| 文件 | 是否提交 Git | 内容 |
|------|-------------|------|
| `.env.example` | ✅ 提交 | 仅包含变量名占位，不含真实值，供团队成员参考 |
| `.env.local` | ❌ 不提交（已在 `.gitignore`） | 包含真实的 Project URL 和 anon key，仅本地使用 |

### 为什么 NEXT_PUBLIC_SUPABASE_ANON_KEY 可以暴露给浏览器

Supabase 的 **anon key** 是设计为公开的：
- 它是一把"受限"的钥匙——只能执行 **受 RLS 策略约束** 的操作
- 即使攻击者拿到 anon key，也只能在数据库中访问 RLS 允许的数据
- 没有登录用户的 JWT 时，`auth.uid()` 返回 `null`，RLS 策略拒绝所有访问
- 登录后，SDK 自动在请求中携带 JWT，数据库通过 `auth.uid() = user_id` 验证权限

### 为什么 service_role key 绝对不能暴露

Supabase 的 **service_role key** 拥有以下危险能力：
- **绕过所有 RLS 策略**——可以读写任何用户的数据
- **直接操作用户表** (`auth.users`)——可以删除任何用户
- 这份 key 等同于数据库的 root 访问权限
- **绝对不能** 以 `NEXT_PUBLIC_` 开头（会被打包进前端 JS bundle）
- **绝对不能** 出现在客户端代码中

> 本项目当前不使用、也不需要 service_role key。所有操作通过 RLS 策略在用户权限范围内执行。

### Step 2：创建 Supabase client ✅（已合并到 Step 1）

- 浏览器端 client：`lib/supabase/client.ts` ✅
- 服务端 client：`lib/supabase/server.ts` ✅
- 环境变量模板：`.env.example` ✅
- Middleware（session 刷新）：待 Step 3 登录时再创建


### Step 3：登录页面

- 创建 `app/auth/page.tsx` 登录页面
- 创建 `app/auth/callback/route.ts` OAuth 回调
- 创建 `lib/auth.ts` Auth 工具函数
- 实现邮箱登录 UI
- 实现登录/登出状态管理

### Step 4：domains/goals/actions 云端 CRUD

- 创建 `lib/supabase/domains.ts`
- 创建 `lib/supabase/goals.ts`
- 创建 `lib/supabase/actions.ts`
- 替换当前页面中的数据读写逻辑
- **暂时保留 localStorage 逻辑**，双写或通过 feature flag 切换

### Step 5：daily_logs/action_records 云端 CRUD

- 创建 `lib/supabase/daily-logs.ts`
- 创建 `lib/supabase/action-records.ts`
- 替换 Check-in 页面的数据读写
- 验证数据正确存储到 Supabase

### Step 6：localStorage → Supabase 迁移

- 创建 `lib/migration.ts` 迁移工具
- 提供一键迁移按钮（Dashboard 页面）
- 迁移后验证数据完整性
- **保留 localStorage 数据不删除**，作为备份

### Step 7：Dashboard/Review 云端数据读取

- Dashboard 切换到 Supabase 数据源
- Weekly Review 切换到 Supabase 数据源
- 验证所有页面展示正确
- 移除 feature flag，完全切换到 Supabase

---

## 6. 环境变量安全检查清单

- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] 没有将实际密钥提交到 Git 仓库
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是 anon key（非 service_role key）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 未使用 `NEXT_PUBLIC_` 前缀
- [ ] Vercel 部署时通过 Environment Variables 配置而非硬编码

---

## 7. 参考资料

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase 集成指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)