/**
 * 周复盘页 - 每周总结与回顾
 *
 * Milestone 2 Step 2.1: 使用 useGrowthLoopLocalData 实现响应式数据读取。
 * Milestone 3 Step 5: 已登录使用 Supabase dailyLogs/actionRecords，未登录使用 localStorage。
 * Milestone 3 Step 5.1: 修复 Review 无数据 bug — 添加 cloudLoading 状态、调试日志、空状态区分。
 */

"use client";

import { actionRecords as mockActionRecords, dailyLogs as mockDailyLogs } from "@/lib/mock-data";
import { getWeeklyReviewStats } from "@/lib/stats";
import { useGrowthLoopLocalData } from "@/hooks/use-growthloop-local-data";
import { useGrowthLoopCloudData } from "@/hooks/use-growthloop-cloud-data";

export default function ReviewPage() {
  const {
    dailyLogs: localDailyLogs,
    actionRecords: localActionRecords,
  } = useGrowthLoopLocalData();

  const {
    dailyLogs: cloudDailyLogs,
    actionRecords: cloudActionRecords,
    isLoggedIn,
    loading: cloudLoading,
  } = useGrowthLoopCloudData();

  // 数据源策略：
  // 已登录 → 仅 cloud 数据（即使为空也不 fallback localStorage/mock）
  // 未登录 → localStorage → mock
  const logs = isLoggedIn
    ? cloudDailyLogs
    : localDailyLogs.length > 0
      ? localDailyLogs
      : mockDailyLogs;
  const records = isLoggedIn
    ? cloudActionRecords
    : localActionRecords.length > 0
      ? localActionRecords
      : mockActionRecords;

  // ===== 调试日志（仅 development） =====
  if (process.env.NODE_ENV === "development") {
    console.log("[Review] Mode:", isLoggedIn ? "cloud" : "local");
    console.log("[Review] cloudLoading:", cloudLoading);
    console.log(
      "[Review] Data - dailyLogs:",
      logs.length,
      "| actionRecords:",
      records.length,
    );
    if (isLoggedIn) {
      console.log(
        "[Review] Cloud raw - dailyLogs:",
        cloudDailyLogs.length,
        "| actionRecords:",
        cloudActionRecords.length,
      );
    }
  }

  const stats = getWeeklyReviewStats(logs, records);

  // 本周日期范围
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const fmt = (d: Date) =>
    d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  const weekRange = `${fmt(monday)} - ${fmt(today)}`;

  const totalRecords =
    stats.standardDoneCount +
    stats.minimumDoneCount +
    stats.failedCount +
    stats.skippedCount;

  const completionRatePercent = Math.round(stats.actionCompletionRate * 100);

  // 状态评级的颜色映射
  function scoreColor(score: number): string {
    if (score >= 4) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 3) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  }

  // 压力反向映射（压力低 = 好）
  function stressLabel(score: number): string {
    if (score <= 2) return "低 ✓";
    if (score <= 3) return "适中";
    if (score <= 4) return "偏高";
    return "很高";
  }

  function stressColor(score: number): string {
    if (score <= 2) return "text-emerald-600 dark:text-emerald-400";
    if (score <= 3) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  }

  // ===== 加载中（云端模式） =====
  if (isLoggedIn && cloudLoading) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            本周数据汇总
          </p>
          <h1 className="text-xl font-semibold mt-1">周复盘</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {weekRange}
          </p>
        </section>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-12">
          加载中...
        </p>
      </div>
    );
  }

  // ===== 完全空状态判断 =====
  const hasDailyLogs = logs.length > 0;
  const hasActionRecords = records.length > 0;
  const isCompletelyEmpty = !hasDailyLogs && !hasActionRecords;

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          本周数据汇总
        </p>
        <h1 className="text-xl font-semibold mt-1">周复盘</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {weekRange}
        </p>
      </section>

      {/* ===== 完全空状态 ===== */}
      {isCompletelyEmpty && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {isLoggedIn
              ? "暂无云端数据，请先在 Check-in 页面完成每日记录"
              : "暂无本周数据，开始你第一次 Check-in"}
          </p>
        </section>
      )}

      {/* ===== 行动完成概览 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          行动完成率
        </h2>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-3xl font-bold">
            {totalRecords > 0 ? `${completionRatePercent}%` : "--"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 pb-0.5">
            {totalRecords > 0
              ? `${stats.standardDoneCount + stats.minimumDoneCount}/${totalRecords} 项`
              : "暂无数据"}
          </span>
        </div>
        {/* 进度条 */}
        <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
            style={{ width: `${completionRatePercent}%` }}
          />
        </div>
      </section>

      {/* ===== 各类状态计数 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          行动分布
        </h2>
        {totalRecords > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
              <span className="text-zinc-600 dark:text-zinc-300">
                标准完成
              </span>
              <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
                {stats.standardDoneCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
              <span className="text-zinc-600 dark:text-zinc-300">
                最低完成
              </span>
              <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
                {stats.minimumDoneCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
              <span className="text-zinc-600 dark:text-zinc-300">失败</span>
              <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
                {stats.failedCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
              <span className="text-zinc-600 dark:text-zinc-300">跳过</span>
              <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
                {stats.skippedCount}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            {hasDailyLogs
              ? "暂无本周行动记录"
              : "暂无本周数据"}
          </p>
        )}
      </section>

      {/* ===== 本周状态平均 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周状态
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              平均睡眠
            </p>
            <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
              {stats.avgSleepHours > 0
                ? `${stats.avgSleepHours} 小时`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              平均精力
            </p>
            <p
              className={`mt-1 font-medium ${scoreColor(stats.avgEnergyScore)}`}
            >
              {stats.avgEnergyScore > 0
                ? `${stats.avgEnergyScore} / 5`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              平均情绪
            </p>
            <p
              className={`mt-1 font-medium ${scoreColor(stats.avgMoodScore)}`}
            >
              {stats.avgMoodScore > 0
                ? `${stats.avgMoodScore} / 5`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              平均压力
            </p>
            <p
              className={`mt-1 font-medium ${stressColor(stats.avgStressScore)}`}
            >
              {stats.avgStressScore > 0
                ? `${stressLabel(stats.avgStressScore)}`
                : "--"}
            </p>
          </div>
        </div>
      </section>

      {/* ===== AI 复盘占位 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          AI 复盘
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          完成 7 天记录后可生成 AI 周复盘
        </p>
      </section>
    </div>
  );
}