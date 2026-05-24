/**
 * AI 相关类型定义
 *
 * 当前仅用于 Weekly Review AI 复盘
 * 后续可扩展 AI Coach、Daily Feedback、Goal Decomposition 等
 */

import type { ActionRecordStatus } from "@/types";

// ==================== Weekly Review AI Request ====================

/** 精简版 Goal — 只传 AI 需要的字段 */
export interface AIRequestGoal {
  id: string;
  title: string;
  domainName?: string;
}

/** 精简版 Action — 只传 AI 需要的字段 */
export interface AIRequestAction {
  id: string;
  title: string;
  goalTitle?: string;
}

/** 精简版 DailyLog — 只传 AI 需要的字段 */
export interface AIRequestDailyLog {
  date: string;
  sleepHours: number;
  energyScore: number;
  moodScore: number;
  stressScore: number;
  note: string;
}

/** 精简版 ActionRecord — 只传 AI 需要的字段 */
export interface AIRequestActionRecord {
  actionId: string;
  date: string;
  status: ActionRecordStatus;
  note: string;
}

/** 精简版统计 — 由 lib/stats 计算 */
export interface AIRequestWeeklyStats {
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

/** Weekly Review API Request — 由前端 Review 页面 POST 到 /api/ai/weekly-review */
export interface WeeklyReviewAIRequest {
  goals: AIRequestGoal[];
  actions: AIRequestAction[];
  dailyLogs: AIRequestDailyLog[];
  actionRecords: AIRequestActionRecord[];
  weeklyStats: AIRequestWeeklyStats;
}

// ==================== Weekly Review AI Response ====================

/** Weekly Review AI Response — DeepSeek 返回的结构化 JSON */
export interface WeeklyReviewAIResponse {
  /** 本周总结（2-3 句话） */
  summary: string;

  /** 主要进展（1-3 条） */
  progress: string[];

  /** 执行卡点（1-3 条） */
  blockers: string[];

  /** 可能原因（结合数据分析） */
  possibleReasons: string[];

  /** 目标负荷判断 */
  loadJudgement: string;

  /** 下周建议（3-5 条） */
  nextWeekSuggestions: string[];

  /** 建议保留的行动 */
  keepActions: string[];

  /** 建议降低难度的行动 */
  reduceActions: string[];

  /** 建议暂停的行动 */
  pauseActions: string[];
}