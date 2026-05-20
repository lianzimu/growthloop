# Milestone 3：Supabase 接入计划

版本：v0.1
状态：Step 0 文档与 SQL 完成，待进入 Step 1

---

## 1. 里程碑概述

Milestone 3 的目标是将 GrowthLoop 从纯 localStorage 的本地 MVP，升级为基于 Supabase 的云端应用。

**核心原则**：
- 每一步可独立验收，不破坏现有功能
- 先接入 Supabase Auth，再逐步迁移数据层
- localStorage 逻辑保留到最后，作为回退备用
- 不提前接入 OpenAI API

---

## 2. 阶段划分总览

| Step | 名称 | 内容 | 预估工作量 | 状态 |
|------|------|------|------------|------|
| Step 0 | 数据库与文档准备 | DDL、RLS、Seed、文档 | 1 天 | ✅ 完成 |
| Step 1 | 安装 Supabase SDK | npm install，配置 client | 0.5 天 | ⏳ 待开始 |
| Step 2 | 创建 Supabase client | browser/server client | 0.5 天 | ⏳ 待开始 |
| Step 3 | Auth 登录页面 | 邮箱登录/登出 UI | 1 天 | ⏳ 待开始 |
| Step 4 | Domains/Goals/Actions CRUD | 替换数据读写 | 1.5 天 | ⏳ 待开始 |
| Step 5 | Daily Logs/Action Records CRUD | Check-in 云端化 | 1 天 | ⏳ 待开始 |
| Step 6 | localStorage → Supabase 迁移 | 数据迁移工具 | 1 天 | ⏳ 待开始 |
| Step 7 | Dashboard/Review 云端化 | 完整切换到 Supabase | 1 天 | ⏳ 待开始 |

**总预估工作量**：约 7.5 天（含测试与修复）

---

## 3. Step 0：数据库与文档准备 ✅

### 3.1 目标

在动手写代码之前，完成所有数据库设计、安全策略和文档。

### 3.2 产出物

| 文件 | 说明 |
|------|------|
| `docs/SUPABASE_SETUP.md` | Supabase 项目创建与接入指南 |
| `docs/DATABASE.md` | 完整数据库设计文档（表结构、字段、关系、RLS、映射） |
| `supabase/schema.sql` | 8 张表的 DDL + RLS 策略 + 索引 + 触发器 |
| `supabase/seed.sql` | 默认 4 个 domains 的示例 INSERT |
| `docs/MILESTONE_3_PLAN.md` | 本文档 |

### 3.3 验收标准

- [x] SQL 文件可在 Supabase SQL Editor 中无错误执行
- [x] 8 张表完整创建，字段类型和约束符合设计
- [x] 所有表启用 RLS，每张表 4 条策略
- [x] 常用查询字段均已建立索引
- [x] updated_at 触发器覆盖所有需要的表
- [x] 文档清晰可读

---

## 4. Step 1：安装 Supabase SDK

### 4.1 目标

安装官方 Supabase SDK，为后续接入做准备。

### 4.2 具体任务

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 4.3 验收标准

- [ ] `@supabase/supabase-js` 安装成功，版本 ≥ 2.0
- [ ] `@supabase/ssr` 安装成功
- [ ] `package.json` 正确记录了依赖
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过
- [ ] 页面功能无变化

---

## 5. Step 2：创建 Supabase Client

### 5.1 目标

创建可在浏览器端和服务端使用的 Supabase client。

### 5.2 具体任务

创建以下文件：

```
lib/supabase/
  client.ts       — 浏览器端 client（客户端组件使用）
  server.ts       — 服务端 client（Server Components / Route Handlers）
  middleware.ts   — Next.js 中间件（Session 刷新）
```

### 5.3 关键代码

**lib/supabase/client.ts**:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**lib/supabase/server.ts**:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 5.4 验收标准

- [ ] `lib/supabase/client.ts` 创建完成
- [ ] `lib/supabase/server.ts` 创建完成
- [ ] `lib/supabase/middleware.ts` 创建完成（如需要）
- [ ] Client 可正常初始化（测试页面 `console.log` 验证）
- [ ] 不影响现有 localStorage 功能
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过

---

## 6. Step 3：Auth 登录页面

### 6.1 目标

实现用户认证流程，包括登录页面和 session 管理。

### 6.2 具体任务

1. 创建 `app/auth/page.tsx` — 登录页面
   - 邮箱输入框
   - 密码输入框
   - "登录"按钮
   - "注册"按钮
   - 成功/错误 toast 提示

2. 创建 `app/auth/callback/route.ts` — OAuth 回调（邮箱确认用）

3. 创建 `lib/auth.ts` — Auth 工具函数
   - `signUp(email, password)` — 注册
   - `signIn(email, password)` — 登录
   - `signOut()` — 登出
   - `getSession()` — 获取当前 session
   - `getUser()` — 获取当前用户

4. 修改 `app/layout.tsx`
   - 检测登录状态
   - 未登录时重定向到 `/auth`

5. 在 TopNav 或 Dashboard 添加登出按钮

### 6.3 验收标准

- [ ] 用户可以注册新账号
- [ ] 用户可以登录已有账号
- [ ] 登录失败时显示错误提示
- [ ] 登录成功后跳转到 Dashboard
- [ ] 未登录用户访问页面时重定向到登录页
- [ ] 登出功能正常
- [ ] Session 持久化（刷新页面不需要重新登录）
- [ ] localStorage 功能不受影响（已登录用户继续使用 localStorage 数据）

---

## 7. Step 4：Domains/Goals/Actions 云端 CRUD

### 7.1 目标

将 domains、goals、actions 的数据存储从 localStorage 迁移到 Supabase。

### 7.2 具体任务

创建以下文件：

```
lib/supabase/
  domains.ts   — domains 表的 CRUD 操作
  goals.ts     — goals 表的 CRUD 操作
  actions.ts   — actions 表的 CRUD 操作
```

### 7.3 关键逻辑

1. **首次登录自动创建默认 domains**：
   - 登录后检查 domains 表是否为空
   - 为空则插入 4 个默认领域（健康/认知/技能/财务）

2. **Domain CRUD**：
   - `getDomains()` — 查询用户所有 domains（按 sort_order 排序）
   - `createDomain(data)` — 创建新领域
   - `updateDomain(id, data)` — 更新领域
   - `deleteDomain(id)` — 删除领域（级联删除 goals）

3. **Goal CRUD**：
   - `getGoals()` — 查询用户所有 goals（含 JOIN domains）
   - `getGoalsByDomain(domainId)` — 按领域查询
   - `createGoal(data)` — 创建目标
   - `updateGoal(id, data)` — 更新目标
   - `deleteGoal(id)` — 删除目标

4. **Action CRUD**：
   - `getActions(goalId)` — 查询目标下的 actions
   - `getWeeklyFocusActions()` — 查询本周重点 action
   - `createAction(data)` — 创建行动
   - `updateAction(id, data)` — 更新行动
   - `deleteAction(id)` — 删除行动

5. **双写策略**（可选，降低风险）：
   - 写入 Supabase 同时也写入 localStorage
   - 读取时优先 Supabase

### 7.4 验收标准

- [ ] Goals 页面正常创建/编辑/删除目标
- [ ] Goals 页面正常创建/编辑/删除行动
- [ ] 默认 4 个 domains 首次登录时自动创建
- [ ] 数据正确存储在 Supabase（通过 Dashboard 验证）
- [ ] RLS 策略正确工作（不同用户数据隔离）
- [ ] localStorage 功能保留不删除
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过

---

## 8. Step 5：Daily Logs/Action Records 云端 CRUD

### 8.1 目标

将 Check-in 页面的每日记录和行动完成记录迁移到 Supabase。

### 8.2 具体任务

创建以下文件：

```
lib/supabase/
  daily-logs.ts      — daily_logs 表的 CRUD 操作
  action-records.ts  — action_records 表的 CRUD 操作
```

### 8.3 关键逻辑

1. **Daily Log CRUD**：
   - `getDailyLog(date)` — 查询某天的记录
   - `upsertDailyLog(data)` — upsert 每日记录（ON CONFLICT DO UPDATE）
   - `getDailyLogsInRange(startDate, endDate)` — 查询日期范围内的记录

2. **Action Record CRUD**：
   - `getActionRecords(date)` — 查询某天所有 action 的记录
   - `upsertActionRecord(data)` — upsert 单条 action record
   - `batchUpsertActionRecords(records)` — 批量 upsert

3. **Check-in 页面修改**：
   - 读取切换到 Supabase
   - 写入切换到 Supabase
   - 保留 localStorage 写（双写）

### 8.4 验收标准

- [ ] Check-in 页面正常加载当天记录
- [ ] 状态评分（睡眠/精力/情绪/压力）正常保存
- [ ] Action 完成状态（done/minimum_done/skipped/failed）正常保存
- [ ] 切换日期可以看到历史记录
- [ ] 数据正确存储在 Supabase
- [ ] RLS 策略正确工作
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过

---

## 9. Step 6：localStorage → Supabase 迁移

### 9.1 目标

提供从 localStorage 到 Supabase 的数据迁移工具，保留用户已有数据。

### 9.2 具体任务

创建 `lib/migration.ts`：

```ts
// 迁移逻辑
export async function migrateLocalToSupabase() {
  // 1. 从 localStorage 导出所有数据
  const localData = exportAllLocalData()

  // 2. 插入 domains（先检查不存在）
  // 3. 插入 goals（映射 userId/domainId）
  // 4. 插入 actions（映射 goalId）
  // 5. 插入 daily_logs
  // 6. 插入 action_records（映射 actionId/dailyLogId）
  // 7. 插入 weekly_reviews（jsonb 转换）
  // 8. 插入 ai_messages

  // 返回迁移报告
}
```

### 9.3 迁移顺序（外键依赖）

```
domains → goals → actions → daily_logs → action_records
                                          ↓
                                     weekly_reviews
                                     ai_messages
```

### 9.4 UI

- 在 Dashboard 或 Settings 页面添加"Migrate to Cloud"按钮
- 迁移前提示用户确认
- 迁移中显示进度
- 迁移后显示报告（各表迁移了多少条）
- 迁移完成后**不删除 localStorage 数据**

### 9.5 验收标准

- [ ] 迁移工具正确映射 camelCase → snake_case
- [ ] 迁移工具正确替换 user_id 为 auth.uid()
- [ ] 外键引用正确（通过 domainId/goalId 等关联到正确的 Supabase id）
- [ ] 迁移后数据完整性校验通过
- [ ] 迁移按钮仅在检测到 localStorage 有数据时显示
- [ ] 迁移完成后 localStorage 数据保留
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过

---

## 10. Step 7：Dashboard/Review 云端数据读取

### 10.1 目标

Dashboard 和 Weekly Review 页面完全切换到 Supabase 数据源。

### 10.2 具体任务

1. **Dashboard 页面修改**：
   - `getStats()` 从 Supabase 查询数据
   - 领域统计、行动统计、趋势图数据从 Supabase 读取
   - 如果 Supabase 无数据且 localStorage 有数据，提示迁移

2. **Weekly Review 页面修改**：
   - 读取本周 daily_logs 和 action_records
   - 读取历史 weekly_reviews
   - 创建/保存 weekly_review 到 Supabase
   - metrics_snapshot 使用 JSONB 存储

3. **AI Coach 页面**：
   - 读取 ai_messages 历史
   - 保存新消息到 ai_messages
   - （OpenAI API 接入后续再做）

4. **清理**：
   - 移除双写逻辑（确认 Supabase 稳定后）
   - 移除 feature flag
   - localStorage 读取逻辑保留作为 fallback

### 10.3 验收标准

- [ ] Dashboard 展示 Supabase 数据
- [ ] Weekly Review 展示 Supabase 数据
- [ ] AI Coach 对话历史从 Supabase 加载
- [ ] 各页面数据刷新正常
- [ ] 如果 Supabase 无数据，回退到 localStorage 读取
- [ ] Stat 统计正确
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx eslint .` 通过
- [ ] 完整功能回归测试通过

---

## 11. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Supabase 连接失败 | 应用无法使用 | 保留 localStorage fallback，增加重试逻辑 |
| 数据迁移丢失 | 用户数据丢失 | 迁移前自动导出 JSON 备份，迁移后校验 |
| RLS 策略配置错误 | 数据泄露或无法访问 | 每个 Step 验证数据隔离 |
| Auth session 过期 | 用户体验中断 | 配置自动 refresh + 中间件处理 |
| 包版本冲突 | 编译/运行时错误 | 固定版本号，锁定 dependencies |

---

## 12. 依赖关系

```
Step 0 (文档/SQL) ✅
  └── Step 1 (安装 SDK)
       └── Step 2 (Client 创建)
            └── Step 3 (Auth 登录) ← 关键节点：此后用户才有 user_id
                 ├── Step 4 (Goals/Actions CRUD)
                 ├── Step 5 (Daily Check-in CRUD)
                 │    └── Step 6 (数据迁移)
                 └── Step 7 (Dashboard/Review 云端化)
```

Step 3 是关键节点，完成 Auth 之后才能进行 CRUD 和数据迁移。

---

## 13. 总结

Milestone 3 完成后，GrowthLoop 将具备：

- ✅ 用户认证系统（注册/登录/登出）
- ✅ 云端数据持久化（PostgreSQL）
- ✅ 行级数据安全（RLS）
- ✅ 多设备同步能力
- ✅ 从 localStorage 平滑迁移能力
- ✅ 现有功能全部保留