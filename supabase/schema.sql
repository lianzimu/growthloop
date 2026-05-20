-- ============================================================================
-- GrowthLoop v0.1 — 数据库 Schema
-- Milestone 3 Step 0：Supabase Database & Auth Preparation
-- ============================================================================
-- 使用说明：
--   1. 在 Supabase Dashboard → SQL Editor 中打开本文件
--   2. 全选并执行（确保已创建 auth schema，Supabase 默认已含）
--   3. 执行后检查 Tables 和 Policies 是否正确创建
-- ============================================================================

-- ============================================================================
-- 第一部分：updated_at 触发器函数
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 第二部分：创建表
-- ============================================================================

-- 2.1 profiles — 用户扩展信息
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  timezone        TEXT DEFAULT 'Asia/Shanghai',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 domains — 成长领域
CREATE TABLE IF NOT EXISTS domains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 goals — 目标
CREATE TABLE IF NOT EXISTS goals (
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

-- 2.4 actions — 行动
CREATE TABLE IF NOT EXISTS actions (
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

-- 2.5 daily_logs — 每日记录
CREATE TABLE IF NOT EXISTS daily_logs (
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

-- 2.6 action_records — 行动完成记录
CREATE TABLE IF NOT EXISTS action_records (
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

-- 2.7 weekly_reviews — 周复盘
CREATE TABLE IF NOT EXISTS weekly_reviews (
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

-- 2.8 ai_messages — AI 对话记录
CREATE TABLE IF NOT EXISTS ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  context_type    TEXT CHECK (context_type IN ('coach', 'daily_feedback', 'weekly_review', 'goal_decomposition')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 第三部分：索引
-- ============================================================================

-- domains
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);

-- goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_domain_id ON goals(domain_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_horizon ON goals(horizon);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- actions
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_goal_id ON actions(goal_id);
CREATE INDEX IF NOT EXISTS idx_actions_is_weekly_focus ON actions(is_weekly_focus);

-- daily_logs
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);

-- action_records
CREATE INDEX IF NOT EXISTS idx_action_records_user_id ON action_records(user_id);
CREATE INDEX IF NOT EXISTS idx_action_records_action_id ON action_records(action_id);
CREATE INDEX IF NOT EXISTS idx_action_records_date ON action_records(date);
CREATE INDEX IF NOT EXISTS idx_action_records_daily_log_id ON action_records(daily_log_id);

-- weekly_reviews
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week_start ON weekly_reviews(week_start);

-- ai_messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_context_type ON ai_messages(context_type);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- ============================================================================
-- 第四部分：updated_at 触发器
-- ============================================================================

-- 注意：ai_messages 表不需要 updated_at 触发器（消息不可修改）

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_records_updated_at
  BEFORE UPDATE ON action_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_reviews_updated_at
  BEFORE UPDATE ON weekly_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 第五部分：启用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 第六部分：RLS 策略 — profiles
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第七部分：RLS 策略 — domains
-- ============================================================================

CREATE POLICY "Users can view own domains"
  ON domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains"
  ON domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains"
  ON domains FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains"
  ON domains FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第八部分：RLS 策略 — goals
-- ============================================================================

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第九部分：RLS 策略 — actions
-- ============================================================================

CREATE POLICY "Users can view own actions"
  ON actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
  ON actions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第十部分：RLS 策略 — daily_logs
-- ============================================================================

CREATE POLICY "Users can view own daily_logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第十一部分：RLS 策略 — action_records
-- ============================================================================

CREATE POLICY "Users can view own action_records"
  ON action_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action_records"
  ON action_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action_records"
  ON action_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own action_records"
  ON action_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第十二部分：RLS 策略 — weekly_reviews
-- ============================================================================

CREATE POLICY "Users can view own weekly_reviews"
  ON weekly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly_reviews"
  ON weekly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly_reviews"
  ON weekly_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly_reviews"
  ON weekly_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 第十三部分：RLS 策略 — ai_messages
-- ============================================================================

CREATE POLICY "Users can view own ai_messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_messages"
  ON ai_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_messages"
  ON ai_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 完成
-- ============================================================================
-- 执行完毕后请检查：
-- 1. Tables: profiles, domains, goals, actions, daily_logs, action_records,
--    weekly_reviews, ai_messages 均已创建
-- 2. Policies: 每张表有 4 条 RLS 策略 (SELECT, INSERT, UPDATE, DELETE)
-- 3. Indexes: 所有业务查询字段均已有索引
-- 4. Triggers: 除 ai_messages 外，每张表的 updated_at 触发器已创建
-- ============================================================================