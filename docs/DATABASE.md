# GrowthLoop 数据库设计文档

版本：v0.1（Milestone 3 Step 0）
状态：设计完成，待 Supabase 接入后执行 DDL

---

## 1. 业务对象说明

GrowthLoop v0.1 包含 8 个核心业务对象，对应 8 张数据库表：

| 业务对象 | 表名 | 说明 | 数据来源 |
|----------|------|------|----------|
| 用户扩展信息 | `profiles` | 关联 Supabase Auth 用户，存储产品内的扩展信息 | 注册后自动创建 |
| 成长领域 | `domains` | 健康/认知/技能/财务 等分类 | 首次使用时创建默认值 |
| 目标 | `goals` | 用户在各领域内的长期/季度目标，支持层级 | 用户在 Goals 页面创建 |
| 行动 | `actions` | 归属于目标，具体可执行的任务，含标准/最低版本 | 用户在 Goals 页面拆解 |
| 每日记录 | `daily_logs` | 每日状态记录（睡眠/精力/情绪/压力） | Daily Check-in 页面 |
| 行动完成记录 | `action_records` | 每日每个行动的完成状态 | Daily Check-in 页面 |
| 周复盘 | `weekly_reviews` | 每周数据复盘，含 AI 反馈 | Weekly Review 页面 |
| AI 对话记录 | `ai_messages` | AI Coach 对话历史 | AI Coach 页面 |

---

## 2. 表结构说明

### 2.1 profiles — 用户扩展信息

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  timezone        TEXT DEFAULT 'Asia/Shanghai',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → auth.users(id) | 关联 Supabase Auth 用户 |
| `display_name` | TEXT | - | 用户显示名 |
| `timezone` | TEXT | DEFAULT 'Asia/Shanghai' | 时区 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**说明**：
- 与 `auth.users` 一对一关系
- 通过 `ON DELETE CASCADE`，用户删除时自动清理 profile
- 使用触发器自动更新 `updated_at`

---

### 2.2 domains — 成长领域

```sql
CREATE TABLE domains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `name` | TEXT | NOT NULL | 领域名称（健康/认知/技能/财务） |
| `description` | TEXT | - | 领域描述 |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | 排序序号 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**说明**：
- 一个用户可以有多个领域
- 默认 4 个领域：健康、认知、技能、财务
- `sort_order` 用于控制领域在前端的显示顺序

---

### 2.3 goals — 目标

```sql
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id       UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  parent_goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  horizon         TEXT NOT NULL CHECK (horizon IN ('5_year', '3_year', '1_year', 'quarter')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  is_main_focus   BOOLEAN NOT NULL DEFAULT false,
  start_date      DATE,
  target_date     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `domain_id` | UUID | NOT NULL, FK → domains(id) | 所属领域 |
| `parent_goal_id` | UUID | FK → goals(id), ON DELETE SET NULL | 父目标（支持层级） |
| `title` | TEXT | NOT NULL | 目标标题 |
| `description` | TEXT | - | 目标描述 |
| `horizon` | TEXT | NOT NULL, CHECK | 目标周期：5_year / 3_year / 1_year / quarter |
| `status` | TEXT | NOT NULL, DEFAULT 'active', CHECK | 状态：active / paused / completed / archived |
| `is_main_focus` | BOOLEAN | NOT NULL, DEFAULT false | 是否当前主线目标 |
| `start_date` | DATE | - | 开始日期 |
| `target_date` | DATE | - | 目标日期 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**层级关系示例**：

```
5 年目标：成为 AI 产品开发能力的人
  └── 1 年目标：独立完成 3 个 AI 应用
      └── 季度目标：完成 GrowthLoop MVP
```

**说明**：
- `parent_goal_id` 支持目标嵌套，父目标删除时子目标不删除（SET NULL）
- `horizon` 用于按时间维度筛选目标
- `is_main_focus` 每周最多一个主线和两个辅助

---

### 2.4 actions — 行动

```sql
CREATE TABLE actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id           UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  standard_version  TEXT NOT NULL,
  minimum_version   TEXT NOT NULL,
  frequency         TEXT NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'custom')),
  difficulty        TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_weekly_focus   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `goal_id` | UUID | NOT NULL, FK → goals(id) | 所属目标 |
| `title` | TEXT | NOT NULL | 行动标题 |
| `description` | TEXT | - | 行动描述 |
| `standard_version` | TEXT | NOT NULL | 标准行动版本 |
| `minimum_version` | TEXT | NOT NULL | 最低行动版本（低状态备选） |
| `frequency` | TEXT | NOT NULL, CHECK | 频率：once / daily / weekly / custom |
| `difficulty` | TEXT | NOT NULL, CHECK | 难度：easy / medium / hard |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | 是否活跃 |
| `is_weekly_focus` | BOOLEAN | NOT NULL, DEFAULT false | 是否本周重点行动 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**说明**：
- 每个 Action 必须归属于一个 Goal
- `standard_version` 和 `minimum_version` 是核心设计，保证低状态时不归零
- Goal 删除时级联删除其下所有 Action

---

### 2.5 daily_logs — 每日记录

```sql
CREATE TABLE daily_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  sleep_hours     NUMERIC(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  energy_score    INT CHECK (energy_score >= 1 AND energy_score <= 5),
  mood_score      INT CHECK (mood_score >= 1 AND mood_score <= 5),
  stress_score    INT CHECK (stress_score >= 1 AND stress_score <= 5),
  note            TEXT,
  blockers        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `date` | DATE | NOT NULL | 记录日期（YYYY-MM-DD） |
| `sleep_hours` | NUMERIC(3,1) | CHECK 0-24 | 睡眠时长（小时） |
| `energy_score` | INT | CHECK 1-5 | 精力评分 |
| `mood_score` | INT | CHECK 1-5 | 情绪评分 |
| `stress_score` | INT | CHECK 1-5 | 压力评分 |
| `note` | TEXT | - | 今日一句话记录 |
| `blockers` | TEXT | - | 今日卡点 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**说明**：
- `UNIQUE(user_id, date)` 确保每个用户每天最多一条记录
- 评分采用 1-5 分钟
- Daily Check-in 页面使用 upsert 逻辑

---

### 2.6 action_records — 行动完成记录

```sql
CREATE TABLE action_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id       UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  daily_log_id    UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('done', 'minimum_done', 'skipped', 'failed')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, action_id)
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `action_id` | UUID | NOT NULL, FK → actions(id) | 关联行动 |
| `daily_log_id` | UUID | FK → daily_logs(id), ON DELETE SET NULL | 关联的每日记录 |
| `date` | DATE | NOT NULL | 记录日期 |
| `status` | TEXT | NOT NULL, CHECK | 完成状态：done / minimum_done / skipped / failed |
| `note` | TEXT | - | 记录备注 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**状态说明**：

| 状态 | 含义 | 是否计入"未归零" |
|------|------|------------------|
| `done` | 完成标准版本 | ✅ 是 |
| `minimum_done` | 完成最低版本 | ✅ 是 |
| `skipped` | 主动跳过 | ❌ 否 |
| `failed` | 想做但失败 | ❌ 否 |

**说明**：
- `UNIQUE(user_id, date, action_id)` 确保每天每个行动最多一条记录
- daily_log 删除时 action_record 保留（SET NULL），防止数据丢失
- 同一日期同一 action 使用 upsert 逻辑

---

### 2.7 weekly_reviews — 周复盘

```sql
CREATE TABLE weekly_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start        DATE NOT NULL,
  week_end          DATE NOT NULL,
  summary           TEXT,
  metrics_snapshot  JSONB,
  ai_feedback       TEXT,
  next_week_plan    TEXT,
  user_reflection   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `week_start` | DATE | NOT NULL | 周起始日期（周一） |
| `week_end` | DATE | NOT NULL | 周结束日期（周日） |
| `summary` | TEXT | - | 本周总结 |
| `metrics_snapshot` | JSONB | - | 本周数据快照 |
| `ai_feedback` | TEXT | - | AI 复盘反馈 |
| `next_week_plan` | TEXT | - | 下周计划 |
| `user_reflection` | TEXT | - | 用户补充反思 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**`metrics_snapshot` JSONB 结构**：

```json
{
  "actionCompletionRate": 0.75,
  "standardDoneCount": 5,
  "minimumDoneCount": 2,
  "failedCount": 1,
  "skippedCount": 1,
  "avgSleepHours": 7.2,
  "avgEnergyScore": 3.5,
  "avgMoodScore": 4.0,
  "avgStressScore": 2.8
}
```

**说明**：
- `UNIQUE(user_id, week_start)` 确保每周每用户最多一条复盘
- `metrics_snapshot` 使用 JSONB 保存快照，避免后续数据变化影响历史复盘
- JSONB 内的 key 使用 camelCase（与 TypeScript 类型保持一致）

---

### 2.8 ai_messages — AI 对话记录

```sql
CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  context_type    TEXT CHECK (context_type IN ('coach', 'daily_feedback', 'weekly_review', 'goal_decomposition')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 主键 |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | 所属用户 |
| `role` | TEXT | NOT NULL, CHECK | 角色：user / assistant / system |
| `content` | TEXT | NOT NULL | 消息内容 |
| `context_type` | TEXT | CHECK | 上下文类型：coach / daily_feedback / weekly_review / goal_decomposition |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |

**说明**：
- 用于 AI Coach 页面对话历史
- 也用于记录 Goal Decomposer / Daily Feedback / Weekly Reviewer 的 AI 输出
- 无 `updated_at`（消息不可修改）

---

## 3. 表之间关系

```
auth.users
  ├── profiles          (1:1)
  ├── domains           (1:N)
  │     └── goals       (1:N)
  │           ├── goals (parent_goal_id 自引用, 1:N)
  │           └── actions (1:N)
  │                 └── action_records (1:N)
  ├── daily_logs        (1:N)
  │     └── action_records (1:N, 通过 daily_log_id 关联)
  ├── weekly_reviews    (1:N)
  └── ai_messages       (1:N)
```

**关系说明**：

| 关系 | 类型 | 说明 |
|------|------|------|
| auth.users → profiles | 1:1 | 用户与其扩展信息 |
| auth.users → domains | 1:N | 用户创建多个领域 |
| domains → goals | 1:N | 领域下的多个目标 |
| goals → goals | 自引用 1:N | 目标层级（父目标 → 子目标） |
| goals → actions | 1:N | 目标拆解为多个行动 |
| daily_logs → action_records | 1:N | 一天的记录关联多个行动记录 |
| actions → action_records | 1:N | 一个行动有多天的完成记录 |
| auth.users → weekly_reviews | 1:N | 用户多周的复盘记录 |
| auth.users → ai_messages | 1:N | 用户的多条 AI 对话 |

---

## 4. RLS 策略说明

所有 8 张用户数据表均启用 Row Level Security（RLS）。

### 4.1 策略规则

所有表的 RLS 策略统一使用以下规则：

```sql
-- SELECT 策略
CREATE POLICY "Users can view own <table>"
ON <table> FOR SELECT
USING (auth.uid() = user_id);

-- INSERT 策略
CREATE POLICY "Users can insert own <table>"
ON <table> FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE 策略
CREATE POLICY "Users can update own <table>"
ON <table> FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 策略
CREATE POLICY "Users can delete own <table>"
ON <table> FOR DELETE
USING (auth.uid() = user_id);
```

### 4.2 策略覆盖

| 表名 | RLS 启用 | SELECT | INSERT | UPDATE | DELETE |
|------|----------|--------|--------|--------|--------|
| profiles | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| domains | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| goals | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| actions | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| daily_logs | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| action_records | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| weekly_reviews | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
| ai_messages | ✅ | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |

**说明**：
- ai_messages 的 UPDATE 和 DELETE 策略在 v0.1 中保留，但前端实际不会使用（消息不可修改）
- 后续若需要管理员角色，可通过新增策略扩展

---

## 5. 索引设计

为常用查询字段建立索引：

| 表 | 索引字段 | 索引类型 | 说明 |
|----|----------|----------|------|
| profiles | user_id | UNIQUE (已有) | 通过 user_id 查询 profile |
| domains | user_id | INDEX | 查询用户的所有领域 |
| goals | user_id | INDEX | 查询用户的所有目标 |
| goals | domain_id | INDEX | 按领域筛选目标 |
| goals | parent_goal_id | INDEX | 查询子目标 |
| goals | horizon | INDEX | 按时间维度筛选 |
| goals | status | INDEX | 按状态筛选 |
| actions | user_id | INDEX | 查询用户的所有行动 |
| actions | goal_id | INDEX | 按目标查询行动 |
| actions | is_weekly_focus | INDEX | 查询本周重点行动 |
| daily_logs | user_id | INDEX | 查询用户的所有记录 |
| daily_logs | date | INDEX | 按日期查询 |
| daily_logs | (user_id, date) | UNIQUE (已有) | 唯一约束索引 |
| action_records | user_id | INDEX | 查询用户的所有记录 |
| action_records | action_id | INDEX | 按行动查询记录 |
| action_records | date | INDEX | 按日期查询 |
| action_records | daily_log_id | INDEX | 按每日记录关联查询 |
| action_records | (user_id, date, action_id) | UNIQUE (已有) | 唯一约束索引 |
| weekly_reviews | user_id | INDEX | 查询用户的所有复盘 |
| weekly_reviews | week_start | INDEX | 按周查询 |
| weekly_reviews | (user_id, week_start) | UNIQUE (已有) | 唯一约束索引 |
| ai_messages | user_id | INDEX | 查询用户的对话 |
| ai_messages | context_type | INDEX | 按上下文类型筛选 |
| ai_messages | created_at | INDEX | 按时间排序 |

---

## 6. localStorage 字段到 Supabase 字段的映射

### 6.1 命名规则转化

| 层面 | 命名规则 | 示例 |
|------|----------|------|
| TypeScript / localStorage | camelCase | `sleepHours`, `createdAt` |
| Supabase / PostgreSQL | snake_case | `sleep_hours`, `created_at` |

迁移时需要按此映射进行字段名转换。

### 6.2 具体字段映射

#### Domain

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 迁移时保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `name` | `name` | TEXT | 直接映射 |
| `description` | `description` | TEXT | 直接映射 |
| `sortOrder` | `sort_order` | INT | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### Goal

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `domainId` | `domain_id` | UUID | 需映射到 Supabase 中的 domain.id |
| `parentGoalId` | `parent_goal_id` | UUID | 可为 null，需确保引用的 goal 已先迁移 |
| `title` | `title` | TEXT | 直接映射 |
| `description` | `description` | TEXT | 直接映射 |
| `horizon` | `horizon` | TEXT | CHECK 约束值一致 |
| `status` | `status` | TEXT | CHECK 约束值一致 |
| `isMainFocus` | `is_main_focus` | BOOLEAN | 直接映射 |
| `startDate` | `start_date` | DATE | 直接映射 |
| `targetDate` | `target_date` | DATE | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### Action

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `goalId` | `goal_id` | UUID | 需映射到 Supabase 中的 goal.id |
| `title` | `title` | TEXT | 直接映射 |
| `description` | `description` | TEXT | 直接映射 |
| `standardVersion` | `standard_version` | TEXT | 直接映射 |
| `minimumVersion` | `minimum_version` | TEXT | 直接映射 |
| `frequency` | `frequency` | TEXT | CHECK 约束值一致 |
| `difficulty` | `difficulty` | TEXT | CHECK 约束值一致 |
| `isActive` | `is_active` | BOOLEAN | 直接映射 |
| `isWeeklyFocus` | `is_weekly_focus` | BOOLEAN | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### DailyLog

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `date` | `date` | DATE | YYYY-MM-DD 格式一致 |
| `sleepHours` | `sleep_hours` | NUMERIC(3,1) | 直接映射 |
| `energyScore` | `energy_score` | INT | CHECK 1-5 |
| `moodScore` | `mood_score` | INT | CHECK 1-5 |
| `stressScore` | `stress_score` | INT | CHECK 1-5 |
| `note` | `note` | TEXT | 直接映射 |
| `blockers` | `blockers` | TEXT | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### ActionRecord

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `actionId` | `action_id` | UUID | 需映射到 Supabase 中的 action.id |
| `dailyLogId` | `daily_log_id` | UUID | 需映射到 Supabase 中的 daily_log.id |
| `date` | `date` | DATE | 直接映射 |
| `status` | `status` | TEXT | CHECK 约束值一致 |
| `note` | `note` | TEXT | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### WeeklyReview

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `weekStart` | `week_start` | DATE | 直接映射 |
| `weekEnd` | `week_end` | DATE | 直接映射 |
| `summary` | `summary` | TEXT | 直接映射 |
| `metricsSnapshot` | `metrics_snapshot` | JSONB | 整个对象序列化为 JSONB，内部 key 保持 camelCase |
| `aiFeedback` | `ai_feedback` | TEXT | 直接映射 |
| `nextWeekPlan` | `next_week_plan` | TEXT | 直接映射 |
| `userReflection` | `user_reflection` | TEXT | 直接映射 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | 直接映射 |

#### AIMessage

| localStorage (camelCase) | Supabase (snake_case) | 类型 | 说明 |
|--------------------------|-----------------------|------|------|
| `id` | `id` | UUID | 保持不变 |
| `userId` | `user_id` | UUID | 替换为已登录用户的 auth.uid() |
| `role` | `role` | TEXT | CHECK 约束值一致 |
| `content` | `content` | TEXT | 直接映射 |
| `contextType` | `context_type` | TEXT | CHECK 约束值一致 |
| `createdAt` | `created_at` | TIMESTAMPTZ | 直接映射 |

### 6.3 迁移注意事项

1. **外键依赖顺序**：先迁移 domains → goals → actions → daily_logs → action_records，确保外键引用有效
2. **user_id 替换**：迁移时将 `user_id` 统一替换为已登录用户的 `auth.uid()`
3. **ID 保留**：保持原 UUID id 不变，避免关联断裂
4. **冲突处理**：使用 `INSERT ... ON CONFLICT (unique_constraint) DO UPDATE` 处理可能重复的数据
5. **备份优先**：迁移前通过 `exportAllLocalData()` 导出完整 JSON 备份
6. **不删除 localStorage**：迁移完成后保留 localStorage 数据，作为回退备用

---

## 7. updated_at 触发器

所有含 `updated_at` 字段的表使用统一的触发器函数自动更新：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每张表创建触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (每张表类似)
```

注意：`ai_messages` 表不需要此触发器（无 `updated_at` 字段）。

---

## 8. 后续扩展预留

以下设计预留了 v0.2+ 的扩展空间，v0.1 暂不使用：

- `goals` 的 `target_date`：后续用于目标进度跟踪
- `metrics_snapshot` 使用 JSONB：后续可扩展更多统计字段
- `ai_messages` 的 `context_type`：后续可扩展更多 AI 交互场景
- `profiles` 的 `timezone`：后续多用户多时区支持