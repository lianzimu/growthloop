/**
 * GrowthLoop localStorage 封装
 *
 * 在 Supabase 集成前，使用 localStorage 持久化用户数据。
 * 所有函数均处理浏览器环境判断，避免服务端渲染时报错。
 *
 * localStorage key 命名：
 * - growthloop_daily_logs
 * - growthloop_action_records
 */

import type { DailyLog, ActionRecord } from "@/types";

// ==================== 常量 ====================
const DAILY_LOGS_KEY = "growthloop_daily_logs";
const ACTION_RECORDS_KEY = "growthloop_action_records";

// ==================== 浏览器环境判断 ====================
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// ==================== 辅助：日期字符串 ====================
export function todayStr(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

// ==================== DailyLogs ====================

export function getLocalDailyLogs(): DailyLog[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalDailyLogs(logs: DailyLog[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // 静默失败（localStorage 可能满或禁用）
  }
}

// ==================== ActionRecords ====================

export function getLocalActionRecords(): ActionRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ACTION_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalActionRecords(records: ActionRecord[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACTION_RECORDS_KEY, JSON.stringify(records));
  } catch {
    // 静默失败
  }
}

// ==================== 单日操作 ====================

/**
 * 获取指定日期的 DailyLog，没有则返回 undefined。
 */
export function getTodayLocalDailyLog(date: string): DailyLog | undefined {
  const logs = getLocalDailyLogs();
  return logs.find((l) => l.date === date);
}

/**
 * 覆盖式保存今日 DailyLog（如已有则替换，否则追加）。
 */
export function upsertTodayDailyLog(log: DailyLog): void {
  const logs = getLocalDailyLogs();
  const idx = logs.findIndex((l) => l.date === log.date);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  saveLocalDailyLogs(logs);
}

// ==================== 按日期操作 ActionRecords ====================

/**
 * 获取指定日期的所有 ActionRecord。
 */
export function getActionRecordsByDate(date: string): ActionRecord[] {
  const records = getLocalActionRecords();
  return records.filter((r) => r.date === date);
}

/**
 * 覆盖式保存某一日期的所有 ActionRecord。
 * 先删除该日期的所有旧记录，再追加新记录。
 */
export function upsertActionRecordsForDate(
  date: string,
  records: ActionRecord[],
): void {
  const all = getLocalActionRecords();
  // 移除该日期的旧记录
  const filtered = all.filter((r) => r.date !== date);
  // 追加新记录
  const updated = [...filtered, ...records];
  saveLocalActionRecords(updated);
}