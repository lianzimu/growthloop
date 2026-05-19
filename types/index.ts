/**
 * GrowthLoop 核心类型定义
 *
 * 涵盖：领域、目标、行动、每日记录、行动完成记录、周复盘、AI 消息
 */

// ===== 目标周期 =====
export type GoalHorizon = "5_year" | "3_year" | "1_year" | "quarter";

// ===== 目标状态 =====
export type GoalStatus = "active" | "paused" | "completed" | "archived";

// ===== 行动频率 =====
export type ActionFrequency = "once" | "daily" | "weekly" | "custom";

// ===== 行动难度 =====
export type ActionDifficulty = "easy" | "medium" | "hard";

// ===== 行动完成状态 =====
export type ActionRecordStatus = "done" | "minimum_done" | "skipped" | "failed";

// ===== AI 消息角色 =====
export type AIMessageRole = "user" | "assistant" | "system";

// ===== AI 上下文类型 =====
export type AIContextType =
  | "coach"
  | "daily_feedback"
  | "weekly_review"
  | "goal_decomposition";

// ==================== 领域 ====================
export interface Domain {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 目标 ====================
export interface Goal {
  id: string;
  userId: string;
  domainId: string;
  parentGoalId?: string | null;
  title: string;
  description?: string;
  horizon: GoalHorizon;
  status: GoalStatus;
  isMainFocus: boolean;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 行动 ====================
export interface Action {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description?: string;
  standardVersion: string;
  minimumVersion: string;
  frequency: ActionFrequency;
  difficulty: ActionDifficulty;
  isActive: boolean;
  isWeeklyFocus: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== 每日记录 ====================
export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  energyScore: number; // 1-5
  moodScore: number; // 1-5
  stressScore: number; // 1-5
  note?: string;
  blockers?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 行动完成记录 ====================
export interface ActionRecord {
  id: string;
  userId: string;
  actionId: string;
  dailyLogId: string;
  date: string; // YYYY-MM-DD
  status: ActionRecordStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 周复盘 ====================
export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  summary?: string;
  metricsSnapshot?: WeeklyMetricsSnapshot;
  aiFeedback?: string;
  nextWeekPlan?: string;
  userReflection?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 周复盘数据快照 =====
export interface WeeklyMetricsSnapshot {
  actionCompletionRate: number;
  standardDoneCount: number;
  minimumDoneCount: number;
  failedCount: number;
  skippedCount: number;
  avgSleepHours: number;
  avgEnergyScore: number;
  avgMoodScore: number;
  avgStressScore: number;
}

// ==================== AI 消息 ====================
export interface AIMessage {
  id: string;
  userId: string;
  role: AIMessageRole;
  content: string;
  contextType?: AIContextType;
  createdAt: string;
}

// ==================== 周复盘统计输出（lib/stats 使用） ====================
export interface WeeklyReviewStats {
  actionCompletionRate: number;
  standardDoneCount: number;
  minimumDoneCount: number;
  failedCount: number;
  skippedCount: number;
  avgSleepHours: number;
  avgEnergyScore: number;
  avgMoodScore: number;
  avgStressScore: number;
}