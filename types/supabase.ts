/**
 * Supabase 数据库行类型（snake_case）
 *
 * 本文件仅定义从 Supabase 返回的原始行类型。
 * 前端应用层继续使用 types/index.ts 中的 camelCase 类型。
 * mappers（lib/supabase/mappers.ts）负责两者之间的转换。
 */

// ==================== Domain Row ====================
export interface DomainRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ==================== Goal Row ====================
export interface GoalRow {
  id: string;
  user_id: string;
  domain_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string | null;
  horizon: string;
  status: string;
  is_main_focus: boolean;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Action Row ====================
export interface ActionRow {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string | null;
  standard_version: string;
  minimum_version: string;
  frequency: string;
  difficulty: string;
  is_active: boolean;
  is_weekly_focus: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Domain Insert ====================
export interface DomainInsert {
  user_id: string;
  name: string;
  description?: string | null;
  sort_order?: number;
}

// ==================== Goal Insert ====================
export interface GoalInsert {
  user_id: string;
  domain_id: string;
  parent_goal_id?: string | null;
  title: string;
  description?: string | null;
  horizon: string;
  status?: string;
  is_main_focus?: boolean;
  start_date?: string | null;
  target_date?: string | null;
}

// ==================== Action Insert ====================
export interface ActionInsert {
  user_id: string;
  goal_id: string;
  title: string;
  description?: string | null;
  standard_version: string;
  minimum_version: string;
  frequency: string;
  difficulty: string;
  is_active?: boolean;
  is_weekly_focus?: boolean;
}

// ==================== Domain Update ====================
export interface DomainUpdate {
  name?: string;
  description?: string | null;
  sort_order?: number;
}

// ==================== Goal Update ====================
export interface GoalUpdate {
  domain_id?: string;
  parent_goal_id?: string | null;
  title?: string;
  description?: string | null;
  horizon?: string;
  status?: string;
  is_main_focus?: boolean;
  start_date?: string | null;
  target_date?: string | null;
}

// ==================== Action Update ====================
export interface ActionUpdate {
  goal_id?: string;
  title?: string;
  description?: string | null;
  standard_version?: string;
  minimum_version?: string;
  frequency?: string;
  difficulty?: string;
  is_active?: boolean;
  is_weekly_focus?: boolean;
}

// ==================== DailyLog Row ====================
export interface DailyLogRow {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  energy_score: number | null;
  mood_score: number | null;
  stress_score: number | null;
  note: string | null;
  blockers: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== ActionRecord Row ====================
export interface ActionRecordRow {
  id: string;
  user_id: string;
  action_id: string;
  daily_log_id: string | null;
  date: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== DailyLog Insert ====================
export interface DailyLogInsert {
  user_id: string;
  date: string;
  sleep_hours?: number | null;
  energy_score?: number | null;
  mood_score?: number | null;
  stress_score?: number | null;
  note?: string | null;
  blockers?: string | null;
}

// ==================== ActionRecord Insert ====================
export interface ActionRecordInsert {
  user_id: string;
  action_id: string;
  daily_log_id?: string | null;
  date: string;
  status: string;
  note?: string | null;
}
