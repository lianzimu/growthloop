/**
 * GrowthLoop 基础统计函数
 *
 * 对 mock 数据（或未来真实数据）执行聚合计算。
 * 所有函数均接收数据数组作为参数，不直接依赖特定数据源。
 */

import type {
  Action,
  ActionRecord,
  DailyLog,
  WeeklyReviewStats,
} from "@/types";

// ==================== 辅助：当日日期字符串 ====================
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ==================== 获取今日行动 ====================
/**
 * 筛选出今日应执行的行动及当天的完成记录。
 *
 * 规则：
 * - "daily" 频率的行动每天都出现
 * - "weekly" / "once" / "custom" 行动在 isWeeklyFocus 时也加入
 * - 不区分具体星期几（v0.1 简化处理）
 */
export function getTodayActions(
  actions: Action[],
  records: ActionRecord[],
): { action: Action; record?: ActionRecord }[] {
  const today = todayStr();
  const todayRecords = records.filter((r) => r.date === today);

  // 今日候选行动：daily 频率 或 本周启用的行动
  const candidateActions = actions.filter(
    (a) =>
      a.isActive &&
      (a.frequency === "daily" || a.isWeeklyFocus),
  );

  return candidateActions.map((action) => {
    const record = todayRecords.find((r) => r.actionId === action.id);
    return { action, record };
  });
}

// ==================== 获取本周完成率 ====================
/**
 * 计算本周（过去 7 天）的行动完成率。
 *
 * 完成率 = (done + minimum_done) / 总记录数
 * 如果本周无记录，返回 0。
 *
 * 返回：
 * - rate: 0-1 之间的小数
 * - total: 本周总记录数
 * - doneCount: done 数量
 * - minimumDoneCount: minimum_done 数量
 * - failedCount: failed 数量
 * - skippedCount: skipped 数量
 */
export function getWeekCompletionRate(records: ActionRecord[]): {
  rate: number;
  total: number;
  doneCount: number;
  minimumDoneCount: number;
  failedCount: number;
  skippedCount: number;
} {
  // 计算本周一 ~ 今天
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周一为起始
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const mondayStr = monday.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const weekRecords = records.filter(
    (r) => r.date >= mondayStr && r.date <= todayStr,
  );

  const total = weekRecords.length;
  const doneCount = weekRecords.filter((r) => r.status === "done").length;
  const minimumDoneCount = weekRecords.filter(
    (r) => r.status === "minimum_done",
  ).length;
  const failedCount = weekRecords.filter((r) => r.status === "failed").length;
  const skippedCount = weekRecords.filter(
    (r) => r.status === "skipped",
  ).length;

  const rate = total > 0 ? (doneCount + minimumDoneCount) / total : 0;

  return { rate, total, doneCount, minimumDoneCount, failedCount, skippedCount };
}

// ==================== 获取最近 N 天每日记录 ====================
/**
 * 返回最近 `days` 天的 DailyLog，按日期倒序（最新在前）。
 *
 * @param logs 全部每日记录
 * @param days 返回天数，默认 3
 */
export function getRecentDailyLogs(
  logs: DailyLog[],
  days: number = 3,
): DailyLog[] {
  const today = todayStr();
  // 计算 N 天前的日期
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return logs
    .filter((log) => log.date >= cutoffStr && log.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date)); // 最新在前
}

// ==================== 获取周复盘统计数据 ====================
/**
 * 汇总本周（周一 ~ 今天）的复盘指标。
 *
 * 返回 WeeklyReviewStats，包含：
 * - 行动完成率、各类状态计数
 * - 平均睡眠、精力、情绪、压力
 */
export function getWeeklyReviewStats(
  logs: DailyLog[],
  records: ActionRecord[],
): WeeklyReviewStats {
  // 计算本周一 ~ 今天
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const mondayStr = monday.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  // 筛选本周数据
  const weekLogs = logs.filter(
    (l) => l.date >= mondayStr && l.date <= todayStr,
  );
  const weekRecords = records.filter(
    (r) => r.date >= mondayStr && r.date <= todayStr,
  );

  // 行动统计
  const total = weekRecords.length;
  const standardDoneCount = weekRecords.filter(
    (r) => r.status === "done",
  ).length;
  const minimumDoneCount = weekRecords.filter(
    (r) => r.status === "minimum_done",
  ).length;
  const failedCount = weekRecords.filter(
    (r) => r.status === "failed",
  ).length;
  const skippedCount = weekRecords.filter(
    (r) => r.status === "skipped",
  ).length;
  const actionCompletionRate =
    total > 0 ? (standardDoneCount + minimumDoneCount) / total : 0;

  // 状态平均
  const logCount = weekLogs.length;
  const avgSleepHours =
    logCount > 0
      ? weekLogs.reduce((sum, l) => sum + l.sleepHours, 0) / logCount
      : 0;
  const avgEnergyScore =
    logCount > 0
      ? weekLogs.reduce((sum, l) => sum + l.energyScore, 0) / logCount
      : 0;
  const avgMoodScore =
    logCount > 0
      ? weekLogs.reduce((sum, l) => sum + l.moodScore, 0) / logCount
      : 0;
  const avgStressScore =
    logCount > 0
      ? weekLogs.reduce((sum, l) => sum + l.stressScore, 0) / logCount
      : 0;

  return {
    actionCompletionRate: Math.round(actionCompletionRate * 100) / 100,
    standardDoneCount,
    minimumDoneCount,
    failedCount,
    skippedCount,
    avgSleepHours: Math.round(avgSleepHours * 10) / 10,
    avgEnergyScore: Math.round(avgEnergyScore * 10) / 10,
    avgMoodScore: Math.round(avgMoodScore * 10) / 10,
    avgStressScore: Math.round(avgStressScore * 10) / 10,
  };
}