/**
 * Supabase snake_case ↔ 前端 camelCase 转换
 *
 * 所有转换逻辑集中在此文件，页面组件不散落字段转换。
 */

import type { DailyLog, ActionRecord, Domain, Goal, Action, WeeklyReview } from "@/types";
import type {
  DailyLogRow,
  ActionRecordRow,
  DailyLogInsert,
  ActionRecordInsert,
  DomainRow,
  GoalRow,
  ActionRow,
  DomainInsert,
  GoalInsert,
  ActionInsert,
  DomainUpdate,
  GoalUpdate,
  ActionUpdate,
  WeeklyReviewRow,
  WeeklyReviewInsert,
} from "@/types/supabase";

// ==================== Domain ====================

export function mapDomainRowToDomain(row: DomainRow): Domain {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDomainToInsert(
  name: string,
  userId: string,
  description?: string | null,
  sortOrder?: number,
): DomainInsert {
  return {
    name,
    user_id: userId,
    description: description ?? null,
    sort_order: sortOrder ?? 0,
  };
}

export function mapDomainUpdateToSnake(
  update: DomainUpdate,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (update.name !== undefined) result.name = update.name;
  if (update.description !== undefined) result.description = update.description;
  if (update.sort_order !== undefined) result.sort_order = update.sort_order;
  return result;
}

// ==================== Goal ====================

export function mapGoalRowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    domainId: row.domain_id,
    parentGoalId: row.parent_goal_id ?? null,
    title: row.title,
    description: row.description ?? undefined,
    horizon: row.horizon as Goal["horizon"],
    status: row.status as Goal["status"],
    isMainFocus: row.is_main_focus,
    startDate: row.start_date ?? undefined,
    targetDate: row.target_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGoalToInsert(goal: Goal, userId: string): GoalInsert {
  return {
    user_id: userId,
    domain_id: goal.domainId,
    parent_goal_id: goal.parentGoalId ?? null,
    title: goal.title,
    description: goal.description ?? null,
    horizon: goal.horizon,
    status: goal.status,
    is_main_focus: goal.isMainFocus,
    start_date: goal.startDate ?? null,
    target_date: goal.targetDate ?? null,
  };
}

export function mapGoalUpdateToSnake(
  update: GoalUpdate,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (update.domain_id !== undefined) result.domain_id = update.domain_id;
  if (update.parent_goal_id !== undefined) result.parent_goal_id = update.parent_goal_id;
  if (update.title !== undefined) result.title = update.title;
  if (update.description !== undefined) result.description = update.description;
  if (update.horizon !== undefined) result.horizon = update.horizon;
  if (update.status !== undefined) result.status = update.status;
  if (update.is_main_focus !== undefined) result.is_main_focus = update.is_main_focus;
  if (update.start_date !== undefined) result.start_date = update.start_date;
  if (update.target_date !== undefined) result.target_date = update.target_date;
  return result;
}

// ==================== Action ====================

export function mapActionRowToAction(row: ActionRow): Action {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    title: row.title,
    description: row.description ?? undefined,
    standardVersion: row.standard_version,
    minimumVersion: row.minimum_version,
    frequency: row.frequency as Action["frequency"],
    difficulty: row.difficulty as Action["difficulty"],
    isActive: row.is_active,
    isWeeklyFocus: row.is_weekly_focus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActionToInsert(
  action: Action,
  userId: string,
): ActionInsert {
  return {
    user_id: userId,
    goal_id: action.goalId,
    title: action.title,
    description: action.description ?? null,
    standard_version: action.standardVersion,
    minimum_version: action.minimumVersion,
    frequency: action.frequency,
    difficulty: action.difficulty,
    is_active: action.isActive,
    is_weekly_focus: action.isWeeklyFocus,
  };
}

export function mapActionUpdateToSnake(
  update: ActionUpdate,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (update.goal_id !== undefined) result.goal_id = update.goal_id;
  if (update.title !== undefined) result.title = update.title;
  if (update.description !== undefined) result.description = update.description;
  if (update.standard_version !== undefined) result.standard_version = update.standard_version;
  if (update.minimum_version !== undefined) result.minimum_version = update.minimum_version;
  if (update.frequency !== undefined) result.frequency = update.frequency;
  if (update.difficulty !== undefined) result.difficulty = update.difficulty;
  if (update.is_active !== undefined) result.is_active = update.is_active;
  if (update.is_weekly_focus !== undefined) result.is_weekly_focus = update.is_weekly_focus;
  return result;
}

// ==================== DailyLog ====================

export function mapDailyLogRowToDailyLog(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    sleepHours: row.sleep_hours ?? 0,
    energyScore: row.energy_score ?? 3,
    moodScore: row.mood_score ?? 3,
    stressScore: row.stress_score ?? 3,
    note: row.note ?? undefined,
    blockers: row.blockers ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDailyLogToInsert(
  log: DailyLog,
  userId: string,
): DailyLogInsert {
  return {
    user_id: userId,
    date: log.date,
    sleep_hours: log.sleepHours ?? null,
    energy_score: log.energyScore ?? null,
    mood_score: log.moodScore ?? null,
    stress_score: log.stressScore ?? null,
    note: log.note ?? null,
    blockers: log.blockers ?? null,
  };
}

// ==================== ActionRecord ====================

export function mapActionRecordRowToActionRecord(
  row: ActionRecordRow,
): ActionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    actionId: row.action_id,
    dailyLogId: row.daily_log_id ?? "",
    date: row.date,
    status: row.status as ActionRecord["status"],
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActionRecordToInsert(
  record: ActionRecord,
  userId: string,
  dailyLogId?: string,
): ActionRecordInsert {
  return {
    user_id: userId,
    action_id: record.actionId,
    daily_log_id: dailyLogId ?? null,
    date: record.date,
    status: record.status,
    note: record.note ?? null,
  };
}

// ==================== WeeklyReview ====================

export function mapWeeklyReviewRowToWeeklyReview(
  row: WeeklyReviewRow,
): WeeklyReview {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    summary: row.summary ?? undefined,
    metricsSnapshot: row.metrics_snapshot as unknown as WeeklyReview["metricsSnapshot"],
    aiFeedback: row.ai_feedback ?? undefined,
    nextWeekPlan: row.next_week_plan ?? undefined,
    userReflection: row.user_reflection ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWeeklyReviewToInsert(
  review: WeeklyReview,
  userId: string,
): WeeklyReviewInsert {
  return {
    user_id: userId,
    week_start: review.weekStart,
    week_end: review.weekEnd,
    summary: review.summary ?? null,
    metrics_snapshot: (review.metricsSnapshot ?? null) as Record<string, unknown> | null,
    ai_feedback: review.aiFeedback ?? null,
    next_week_plan: review.nextWeekPlan ?? null,
    user_reflection: review.userReflection ?? null,
  };
}