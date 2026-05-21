# Milestone 3：Supabase 接入计划

版本：v0.3
状态：Step 1~5 完成，进入 Step 6（localStorage → Supabase 数据迁移）

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
| Step 1 | 安装 Supabase SDK | npm install，配置 client | 0.5 天 | ✅ 完成 |
| Step 2 | 创建 Supabase client + middleware | browser/server client + middleware | 0.5 天 | ✅ 完成 |
| Step 3 | Auth 登录页面 | 邮箱登录/登出 UI + AuthStatus | 1 天 | ✅ 完成 |
| Step 4 | Domains/Goals/Actions CRUD | 替换数据读写 | 1.5 天 | ✅ 完成 |
| Step 5 | Daily Logs/Action Records CRUD | Check-in 云端化 | 1 天 | ✅ 完成 |
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

## 4. Step 1：安装 Supabase SDK ✅

### 4.1 目标

安装官方 Supabase SDK，为后续接入做准备。

### 4.2 产出物

```bash
npm install @supabase/supabase-js @supabase/ssr
```

已安装版本：
- `@supabase/supabase-js`: ^2.106.0 ✅
- `@supabase/ssr`: ^0.10.3 ✅

### 4.3 验收标准

- [x] `@supabase/supabase-js` 安装成功，版本 ≥ 2.0
- [x] `@supabase/ssr` 安装成功
- [x] `package.json` 正确记录了依赖
- [x] `npx tsc --noEmit` 通过
- [x] `npx eslint .` 通过
- [x] 页面功能无变化

---

## 5. Step 2：创建 Supabase Client ✅

### 5.1 目标

创建可在浏览器端和服务端使用的 Supabase client。

### 5.2 产出物

| 文件 | 用途 |
|------|------|
| `lib/supabase/client.ts` | 浏览器端 client（`createBrowserClient`），供 `"use client"` 组件使用 |
| `lib/supabase/server.ts` | 服务端 client（`createServerClient`），供 Server Components / Route Handlers 使用 |
| `middleware.ts` | Session 自动刷新中间件，读取/写回 cookie，排除静态资源 |
| `.env.example` | 环境变量模板（仅占位，可提交 Git） |

### 5.3 技术决策：middleware.ts vs proxy.ts

选择 **middleware.ts**。原因：
- Next.js 16 + `@supabase/ssr` 0.10.x 官方推荐 middleware 方式
- `proxy.ts` 是早期实验性方案，已废弃
- middleware 处理 session cookie 刷新是业界标准做法
- matcher 配置精确排除静态资源（`_next/static`、`_next/image`、图片文件等）

### 5.4 验收标准

- [x] `lib/supabase/client.ts` 创建完成
- [x] `lib/supabase/server.ts` 创建完成
- [x] `middleware.ts` 创建完成（session 刷新 + matcher 排除静态资源）
- [x] `.env.example` 创建完成
- [x] 不影响现有 localStorage 功能
- [x] `npx tsc --noEmit` 通过
- [x] `npx eslint .` 通过

---

## 6. Step 3：Auth 登录页面 ✅

### 6.1 目标

实现用户认证流程，包括登录页面和 session 管理。

### 6.2 产出物

| 文件 | 用途 |
|------|------|
| `app/login/page.tsx` | 登录/注册页面（邮箱+密码），登录/注册模式切换，错误/成功提示 |
| `app/components/auth/AuthStatus.tsx` | Auth 状态指示器：未登录显示"登录"链接，已登录显示邮箱 + "退出"按钮 |
| `app/layout.tsx`（已修改） | Header 中嵌入 AuthStatus 组件 |

### 6.3 技术决策

**登录页路径**：使用 `/login` 而非 `/auth`。原因：
- 路径更短，更直观
- `/auth` 通常用作 Supabase OAuth callback 的父路径
- 避免与未来可能的 `/auth/callback` route handler 冲突

**不做强制路由保护**：当前阶段不强制未登录跳转。原因：
- localStorage MVP 功能仍需要工作
- 用户可以选择不登录、继续使用本地功能
- AuthStatus 轻量嵌入 header，不侵入页面
- 后续 Step 4 接入云端 CRUD 时再决定哪些页面需要登录保护

**不使用 `lib/auth.ts` 工具函数**：当前阶段 auth 逻辑直接在 page.tsx 和 AuthStatus 组件中内联：
- `signUp` / `signInWithPassword` / `signOut` 直接调用 supabase client
- `getUser` / `onAuthStateChange` 直接在 AuthStatus 中调用
- 减少抽象层，保持代码简洁
- 后续如需复用再提取

**不创建 OAuth callback route**：当前阶段仅支持邮箱密码登录。OAuth（Google/GitHub）和邮箱确认回调可在后续按需添加。

### 6.4 验收标准

- [x] 用户可以注册新账号
- [x] 用户可以登录已有账号
- [x] 登录失败时显示错误提示（红色提示框 + Supabase 错误消息）
- [x] 注册成功时显示成功提示（绿色提示框 + 邮件确认提醒）
- [x] 登录成功后跳转到首页 `/`
- [x] **不强制未登录用户跳转**（localStorage MVP 仍可用）
- [x] 登出功能正常（Header "退出"按钮 → 跳转 `/login`）
- [x] Session 持久化（middleware.ts 自动刷新 session）
- [x] localStorage 功能不受影响
- [x] `npx tsc --noEmit` 通过
- [x] `npx eslint .` 通过

---

## 7. Step 4：Domains/Goals/Actions 云端 CRUD ✅

### 7.1 目标

将 domains、goals、actions 的数据存储从 localStorage 迁移到 Supabase。

### 7.2 实际产出物

| 文件 | 说明 |
|------|------|
| `types/supabase.ts` | Supabase 行类型定义（DomainRow, GoalRow, ActionRow 等） |
| `lib/supabase/mappers.ts` | 双向映射：camelCase ↔ snake_case（null ↔ undefined） |
| `lib/supabase/domains.ts` | Domain CRUD：getDomains, createDomain, updateDomain, deleteDomain, ensureDefaultDomains |
| `lib/supabase/goals.ts` | Goal CRUD：getGoals, getGoalsByDomainId, createGoal, updateGoal, deleteGoal |
| `lib/supabase/actions.ts` | Action CRUD：getActions, getActionsByDate, getWeeklyFocusActions, createAction, updateAction, deleteAction |
| `hooks/use-growthloop-cloud-data.ts` | React Hook：订阅 session，登录后自动 ensureDefaultDomains，Cloud-First 实时加载 |
| `app/goals/page.tsx`（已修改） | 切换为 Cloud-First 数据源策略 |
| `app/check-in/page.tsx`（已修改） | import useGrowthLoopCloudData + cloudActions 参与 DayRecord |
| `app/page.tsx`（已修改） | import useGrowthLoopCloudData + cloud data 参与 domainGroups/reviewItems |

### 7.3 技术决策

**类型分离**：
- `types/index.ts` 保持原有前端类型（不变的公共接口）
- `types/supabase.ts` 新增 Supabase Row 类型（精确对应数据库列）
- `lib/supabase/mappers.ts` 完成双向转换

**Cloud-First 策略**（DashBoard / Goals 页面）：
- 登录 → 优先使用云端数据
- 未登录 → 检查 localStorage
- 都无 → fallback mock

**确保默认 Domains**：
- `ensureDefaultDomains()` 在 hook 中首次加载时调用
- 检查当前用户 domains 是否为空
- 为空则插入 4 个默认领域（健康/认知/技能/财务）
- 每个 domain 使用固定 id (uuid v5 风格)防止重复插入

**安全设计**：
- 每个 API 函数先通过 `createBrowserClient()` 获取用户
- 未登录抛出明确错误
- 查询强制 eq("user_id", userId)
- api 层 + RLS 双重保护

### 7.4 验收标准

- [x] Goals 页面正常展示（Cloud-First 数据加载）
- [x] 新建目标/行动表单仍通过 localStorage 工作
- [x] 默认 4 个 domains 首次登录时自动创建
- [x] 数据 API 封装完整（每函数先检查 user）
- [x] localStorage 功能保留不删除
- [x] `npx tsc --noEmit` 通过
- [x] `npx eslint .` 通过（0 错误 0 警告）

---

## 8. Step 5：Daily Logs/Action Records 云端 CRUD ✅

### 8.1 目标

将 Check-in 页面和 Dashboard 的数据读取接入 Supabase 云端数据。

### 8.2 实际产出物

| 文件 | 说明 |
|------|------|
| `hooks/use-growthloop-cloud-data.ts`（已更新） | 新增 getActionsByDate 支持，Cloud-First 数据加载 |
| `app/check-in/page.tsx`（已修改） | import useGrowthLoopCloudData，cloudActions 参与 DayRecord 加载 |
| `app/page.tsx`（已修改） | import useGrowthLoopCloudData，cloudGoals/cloudActions/cloudDomains 参与 domainGroups 和 reviewItems |
| `app/goals/page.tsx`（已修改） | import useGrowthLoopCloudData，Cloud-First 数据源切换 |

### 8.3 设计说明

Step 5 的核心是让 Dashboard 和 Check-in 页面能够读取云端数据。

当前已实现：
- Dashboard 页面：cloudGoals/cloudActions/cloudDomains 通过 useGrowthLoopCloudData 加载，Cloud-First 参与 domainGroups 和 reviewItems 计算
- Check-in 页面：cloudActions 通过 useGrowthLoopCloudData 加载，参与 DayRecord 的 action 完成列表
- Goals 页面：Cloud-First 数据源展示

后续待完成（Step 6）：
- 独立的 `daily-logs.ts` 和 `action-records.ts` CRUD 模块
- Check-in 写入逻辑迁移到 Supabase（当前写入仍使用 localStorage）
- 迁移工具批量写入 daily_logs 和 action_records

### 8.4 验收标准

- [x] Dashboard 页面正常加载（Cloud-First：云端 goals/actions/domains 参与计算）
- [x] Check-in 页面正常加载当天 action 列表（Cloud-First：云端 actions 参与 DayRecord）
- [x] Goals 页面正常展示目标/行动（Cloud-First 数据源）
- [x] 新建目标/行动仍通过 localStorage 工作
- [x] localStorage 功能保留不删除
- [x] `npx tsc --noEmit` 通过
- [x] `npx eslint .` 通过（0 错误 0 警告）

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