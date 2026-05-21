/**
 * 首页 - 每日一览 Dashboard
 *
 * Milestone 2 Step 2.1: 使用 useGrowthLoopLocalData 实现响应式数据读取。
 * localStorage 有数据优先用，无数据 fallback mock。
 */

"use client";

import { actions as mockActions, actionRecords as mockActionRecords, dailyLogs as mockDailyLogs, goals as mockGoals } from "@/lib/mock-data";
import {
  getTodayActions,
  getWeekCompletionRate,
  getRecentDailyLogs,
} from "@/lib/stats";
import { useGrowthLoopLocalData } from "@/hooks/use-growthloop-local-data";
import { useGrowthLoopCloudData } from "@/hooks/use-growthloop-cloud-data";
import type { Action, Goal } from "@/types";

export default function HomePage() {
  const {
    dailyLogs: localDailyLogs,
    actionRecords: localActionRecords,
    actions: localActions,
    goals: localGoals,
  } = useGrowthLoopLocalData();

  // 从云端获取数据（Cloud-First）
  const {
    goals: cloudGoals,
    actions: cloudActions,
    isLoggedIn,
  } = useGrowthLoopCloudData();

  // 数据源策略：
  // 已登录 → 仅 cloud 数据（即使为空也不 fallback localStorage/mock）
  // 未登录 → localStorage → mock
  const logs = isLoggedIn
    ? []
    : localDailyLogs.length > 0
      ? localDailyLogs
      : mockDailyLogs;
  const records = isLoggedIn
    ? []
    : localActionRecords.length > 0
      ? localActionRecords
      : mockActionRecords;
  const actionSource: Action[] = isLoggedIn
    ? cloudActions
    : localActions.length > 0
      ? localActions
      : mockActions;
  const goalSource: Goal[] = isLoggedIn
    ? cloudGoals
    : localGoals.length > 0
      ? localGoals
      : mockGoals;

  const todayActions = getTodayActions(actionSource, records);
  const weekRate = getWeekCompletionRate(records);
  const recentLogs = getRecentDailyLogs(logs, 3);
  const mainGoal = goalSource.find((g) => g.isMainFocus);

  // 完成率百分比
  const ratePercent = Math.round(weekRate.rate * 100);

  // 今日行动状态标记
  function statusLabel(
    status?: string,
  ): { label: string; dotClass: string } {
    switch (status) {
      case "done":
        return {
          label: "已完成",
          dotClass:
            "bg-emerald-500 border-emerald-500 dark:bg-emerald-400 dark:border-emerald-400",
        };
      case "minimum_done":
        return {
          label: "最低完成",
          dotClass:
            "bg-amber-500 border-amber-500 dark:bg-amber-400 dark:border-amber-400",
        };
      case "failed":
        return {
          label: "未完成",
          dotClass: "border-red-400 dark:border-red-500",
        };
      case "skipped":
        return {
          label: "已跳过",
          dotClass: "border-zinc-300 dark:border-zinc-600",
        };
      default:
        return {
          label: "待完成",
          dotClass: "border-zinc-300 dark:border-zinc-600",
        };
    }
  }

  return (
    <div className="space-y-6">
      {/* ===== 问候区 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1 className="text-xl font-semibold mt-1">今日概要</h1>
      </section>

      {/* ===== 当前主线目标 ===== */}
      {mainGoal && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
          <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            当前主线
          </h2>
          <p className="text-sm font-medium mt-2">{mainGoal.title}</p>
          {mainGoal.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {mainGoal.description}
            </p>
          )}
        </section>
      )}

      {/* ===== 今日重点行动 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日重点
        </h2>
        <div className="mt-3 space-y-3">
          {todayActions.map(({ action, record }) => {
            const s = statusLabel(record?.status);
            return (
              <div key={action.id} className="flex items-start gap-3">
                {/* 状态圆点 */}
                <div
                  className={`h-5 w-5 mt-0.5 rounded-full border-2 shrink-0 ${s.dotClass}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {action.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    最低行动：{action.minimumVersion}
                  </p>
                  {record && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {s.label}
                      {record.note ? ` — ${record.note}` : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {todayActions.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              今日暂无行动
            </p>
          )}
        </div>
      </section>

      {/* ===== 本周完成率 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周完成率
        </h2>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-3xl font-bold">
            {weekRate.total > 0 ? `${ratePercent}%` : "--"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 pb-0.5">
            {weekRate.total > 0
              ? `${weekRate.doneCount + weekRate.minimumDoneCount}/${weekRate.total} 项`
              : "暂无数据"}
          </span>
        </div>
        {/* 进度条 */}
        <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
            style={{ width: `${ratePercent}%` }}
          />
        </div>
        {/* 细分统计 */}
        {weekRate.total > 0 && (
          <div className="mt-3 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>✅ {weekRate.doneCount} 标准</span>
            <span>🔶 {weekRate.minimumDoneCount} 最低</span>
            <span>❌ {weekRate.failedCount} 失败</span>
            <span>⏭️ {weekRate.skippedCount} 跳过</span>
          </div>
        )}
      </section>

      {/* ===== 最近 3 天状态概览 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          最近 3 天状态
        </h2>
        {recentLogs.length > 0 ? (
          <div className="mt-3 space-y-3">
            {recentLogs.map((log) => {
              const dateLabel = new Date(
                log.date + "T00:00:00",
              ).toLocaleDateString("zh-CN", {
                month: "short",
                day: "numeric",
                weekday: "short",
              });
              return (
                <div
                  key={log.id}
                  className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {dateLabel}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <span>
                      睡眠{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.sleepHours}h
                      </span>
                    </span>
                    <span>
                      精力{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.energyScore}/5
                      </span>
                    </span>
                    <span>
                      情绪{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.moodScore}/5
                      </span>
                    </span>
                    <span>
                      压力{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.stressScore}/5
                      </span>
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {log.note}
                    </p>
                  )}
                  {log.blockers && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                      卡点：{log.blockers}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            暂无记录，开始你第一次 Check-in
          </p>
        )}
      </section>

      {/* ===== AI 建议（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          AI 建议
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          完成 7 天记录后可生成 AI 建议
        </p>
      </section>
    </div>
  );
}