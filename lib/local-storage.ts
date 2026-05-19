/**
 * GrowthLoop localStorage 封装
 *
 * 在 Supabase 集成前，使用 localStorage 持久化用户数据。
 * 所有函数均处理浏览器环境判断，避免服务端渲染时报错。
 *
 * localStorage key 命名：
 * - growthloop_daily_logs
 * - growthloop_action_records
 *
 * 事件机制：
 * - 每次数据写入成功后 dispatch "growthloop:data-updated" CustomEvent
 * - Dashboard / Review 通过监听此事件实现响应式刷新
 */

import type { DailyLog, ActionRecord, Goal, Action } from "@/types";

// ==================== 常量 ====================
const DAILY_LOGS_KEY = "growthloop_daily_logs";
const ACTION_RECORDS_KEY = "growthloop_action_records";
const GOALS_KEY = "growthloop_goals";
const ACTIONS_KEY = "growthloop_actions";
export const DATA_UPDATED_EVENT = "growthloop:data-updated";

// ==================== 浏览器环境判断 ====================
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * 触发全局数据更新事件（仅在浏览器环境）
 */
function notifyDataUpdated(): void {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
  } catch {
    // 静默失败
  }
}

// ==================== 辅助：日期字符串 ====================
export function todayStr(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

// ==================== 稳定 ID 生成 ====================
/** DailyLog 稳定 ID：log-YYYY-MM-DD */
export function stableDailyLogId(date: string): string {
  return `log-${date}`;
}

/** ActionRecord 稳定 ID：YYYY-MM-DD-actionId */
export function stableActionRecordId(date: string, actionId: string): string {
  return `${date}-${actionId}`;
}

// ==================== DailyLogs ====================

/**
 * 读取所有 DailyLog，按 date 去重，保留最后出现的记录。
 */
export function getLocalDailyLogs(): DailyLog[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 按 date 去重，保留最后一条（即 index 最大的）
    const deduped = new Map<string, DailyLog>();
    for (const log of parsed) {
      if (log.date) {
        deduped.set(log.date, log);
      }
    }
    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

export function saveLocalDailyLogs(logs: DailyLog[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
    notifyDataUpdated();
  } catch {
    // 静默失败（localStorage 可能满或禁用）
  }
}

// ==================== ActionRecords ====================

/**
 * 读取所有 ActionRecord，按 `${date}-${actionId}` 去重，保留最后出现的记录。
 */
export function getLocalActionRecords(): ActionRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ACTION_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 按 date-actionId 去重
    const deduped = new Map<string, ActionRecord>();
    for (const record of parsed) {
      if (record.date && record.actionId) {
        const key = stableActionRecordId(record.date, record.actionId);
        deduped.set(key, record);
      }
    }
    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

export function saveLocalActionRecords(records: ActionRecord[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACTION_RECORDS_KEY, JSON.stringify(records));
    notifyDataUpdated();
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
 * 覆盖式保存今日 DailyLog。
 * 同一天只能有一条记录，按 date 替换旧记录（而非按 id）。
 */
export function upsertTodayDailyLog(log: DailyLog): void {
  const logs = getLocalDailyLogs();
  const idx = logs.findIndex((l) => l.date === log.date);
  if (idx >= 0) {
    logs[idx] = { ...log, updatedAt: new Date().toISOString() };
  } else {
    logs.push({ ...log, updatedAt: new Date().toISOString() });
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
 * 同一天同一个 actionId 只有一条记录。
 */
export function upsertActionRecordsForDate(
  date: string,
  records: ActionRecord[],
): void {
  const all = getLocalActionRecords();
  // 移除该日期的旧记录
  const filtered = all.filter((r) => r.date !== date);
  // 确保每条记录有 updatedAt 和稳定 id
  const now = new Date().toISOString();
  const stamped = records.map((r) => ({
    ...r,
    updatedAt: now,
  }));
  // 同一天同一 actionId 去重（保留最后出现的）
  const dedupedMap = new Map<string, ActionRecord>();
  for (const record of stamped) {
    if (record.actionId) {
      const key = stableActionRecordId(date, record.actionId);
      dedupedMap.set(key, record);
    }
  }
  const deduped = Array.from(dedupedMap.values());
  const updated = [...filtered, ...deduped];
  saveLocalActionRecords(updated);
}

// ==================== Goals ====================

/**
 * 读取所有本地 Goal。
 * 如果 localStorage 没有数据，返回空数组。
 */
export function getLocalGoals(): Goal[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalGoals(goals: Goal[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    notifyDataUpdated();
  } catch {
    // 静默失败
  }
}

/**
 * 按 goal.id 覆盖式保存。
 * 如果已存在同 id 目标，则替换；否则追加。
 */
export function upsertLocalGoal(goal: Goal): void {
  const goals = getLocalGoals();
  const idx = goals.findIndex((g) => g.id === goal.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    goals[idx] = { ...goal, updatedAt: now };
  } else {
    goals.push({ ...goal, updatedAt: now });
  }
  saveLocalGoals(goals);
}

/**
 * 删除指定 id 的目标。
 * TODO: 暂不级联删除关联的 actions，后续接入 Supabase 后由数据库外键处理。
 */
export function deleteLocalGoal(goalId: string): void {
  if (!isBrowser()) return;
  try {
    const goals = getLocalGoals();
    const filtered = goals.filter((g) => g.id !== goalId);
    saveLocalGoals(filtered);
  } catch {
    // 静默失败
  }
}

// ==================== Actions ====================

/**
 * 读取所有本地 Action。
 * 如果 localStorage 没有数据，返回空数组。
 */
export function getLocalActions(): Action[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalActions(actions: Action[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
    notifyDataUpdated();
  } catch {
    // 静默失败
  }
}

/**
 * 按 action.id 覆盖式保存。
 * 如果已存在同 id 行动，则替换；否则追加。
 */
export function upsertLocalAction(action: Action): void {
  const actions = getLocalActions();
  const idx = actions.findIndex((a) => a.id === action.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    actions[idx] = { ...action, updatedAt: now };
  } else {
    actions.push({ ...action, updatedAt: now });
  }
  saveLocalActions(actions);
}

/**
 * 删除指定 id 的行动。
 */
export function deleteLocalAction(actionId: string): void {
  if (!isBrowser()) return;
  try {
    const actions = getLocalActions();
    const filtered = actions.filter((a) => a.id !== actionId);
    saveLocalActions(filtered);
  } catch {
    // 静默失败
  }
}
