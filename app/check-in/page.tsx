/**
 * 每日记录页 - Daily Check-in
 *
 * Milestone 2: 使用 mock 数据展示今日状态和行动完成入口。
 * 目前展示只读视图，后续接入表单交互。
 */

import { actions, actionRecords, dailyLogs, goals } from "@/lib/mock-data";
import { getTodayActions, getRecentDailyLogs } from "@/lib/stats";

export default function CheckInPage() {
  const todayActions = getTodayActions(actions, actionRecords);
  const todayLog = dailyLogs.find((d) => d.date === new Date().toISOString().split("T")[0]);

  function statusLabel(status?: string): string {
    switch (status) {
      case "done":
        return "✅ 已完成";
      case "minimum_done":
        return "🔶 最低完成";
      case "failed":
        return "❌ 未完成";
      case "skipped":
        return "⏭️ 已跳过";
      default:
        return "○ 待完成";
    }
  }

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1 className="text-xl font-semibold mt-1">每日记录</h1>
      </section>

      {/* ===== 今日状态 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          状态评分
        </h2>
        {todayLog ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">睡眠</p>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                {todayLog.sleepHours} 小时
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">精力</p>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                {todayLog.energyScore} / 5
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">情绪</p>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                {todayLog.moodScore} / 5
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">压力</p>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                {todayLog.stressScore} / 5
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            今日尚未记录
          </p>
        )}
      </section>

      {/* ===== 今日行动记录 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日行动
        </h2>
        {todayActions.length > 0 ? (
          <div className="mt-3 space-y-3">
            {todayActions.map(({ action, record }) => (
              <div
                key={action.id}
                className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {action.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      标准：{action.standardVersion}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      最低：{action.minimumVersion}
                    </p>
                  </div>
                  <span className="text-xs shrink-0 text-zinc-500 dark:text-zinc-400">
                    {statusLabel(record?.status)}
                  </span>
                </div>
                {record?.note && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {record.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            今日暂无行动
          </p>
        )}
      </section>

      {/* ===== 今日笔记 ===== */}
      {todayLog && (todayLog.note || todayLog.blockers) && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
          <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            今日记录
          </h2>
          {todayLog.note && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-3">
              {todayLog.note}
            </p>
          )}
          {todayLog.blockers && (
            <div className="mt-2">
              <p className="text-xs text-red-500 dark:text-red-400">
                卡点：{todayLog.blockers}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ===== 快速填写入口（占位） ===== */}
      <section className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
          互动表单即将上线
        </p>
      </section>
    </div>
  );
}