/**
 * localStorage → Supabase 迁移卡片
 *
 * Milestone 3 Step 6: 手动触发的迁移 UI。
 *
 * - 只在用户已登录时显示
 * - 显示本地数据摘要
 * - 二次确认后才触发迁移
 * - 迁移中显示 loading 状态
 * - 迁移完成后显示报告
 * - 提供"清空本地数据"按钮（二次确认）
 */

"use client";

import { useState, useCallback } from "react";
import {
  getLocalMigrationSummary,
  migrateLocalDataToSupabase,
  clearLocalDataAfterMigration,
} from "@/lib/migration";
import type { MigrationSummary, MigrationReport } from "@/lib/migration";

type Phase = "idle" | "migrating" | "done";

interface Props {
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 迁移完成后刷新云端数据 */
  onRefresh: () => void;
}

export default function LocalDataMigrationCard({ isLoggedIn, onRefresh }: Props) {
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmMigrate, setConfirmMigrate] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  // 用于在清空 localStorage 后强制刷新摘要
  const [refreshKey, setRefreshKey] = useState(0);

  // 直接同步计算摘要，无需 useEffect
  const summary: MigrationSummary = getLocalMigrationSummary();

  // 重新计算摘要（用于清空后）
  const refreshSummary = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // 执行迁移
  const handleMigrate = useCallback(async () => {
    setError(null);
    setPhase("migrating");
    setConfirmMigrate(false);

    try {
      const result = await migrateLocalDataToSupabase();
      setReport(result);
      setPhase("done");
      refreshSummary();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "迁移过程发生未知错误");
      setPhase("idle");
    }
  }, [refreshSummary, onRefresh]);

  // 清空本地数据
  const handleClear = useCallback(() => {
    setConfirmClear(false);
    clearLocalDataAfterMigration();
    refreshSummary();
    if (onRefresh) onRefresh();
  }, [refreshSummary, onRefresh]);

  // 重置
  const handleReset = useCallback(() => {
    setReport(null);
    setError(null);
    setPhase("idle");
    refreshSummary();
  }, [refreshSummary]);

  // 未登录不显示
  if (!isLoggedIn) return null;

  // 无本地数据
  if (!summary.hasLocalData && phase === "idle") {
    return (
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 mt-6">
        <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          数据迁移
        </h3>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
          暂无可迁移的本地数据
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 mt-6">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        数据迁移
      </h3>

      {/* 迁移中 */}
      {phase === "migrating" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              正在迁移到云端...
            </p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            请不要关闭页面
          </p>
        </div>
      )}

      {/* 空闲或已完成 */}
      {(phase === "idle" || phase === "done") && (
        <>
          {/* 摘要 */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              本地目标：{summary.localGoalsCount}
            </div>
            <div>
              本地行动：{summary.localActionsCount}
            </div>
            <div>
              每日记录：{summary.localDailyLogsCount}
            </div>
            <div>
              行动记录：{summary.localActionRecordsCount}
            </div>
          </div>

          {/* 迁移按钮 */}
          {!confirmMigrate && phase === "idle" && (
            <button
              type="button"
              onClick={() => setConfirmMigrate(true)}
              className="mt-3 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-2 text-sm transition active:scale-[0.98]"
            >
              迁移本地数据到云端
            </button>
          )}

          {/* 二次确认 */}
          {confirmMigrate && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ 确认将本地数据迁移到云端？建议先导出本地备份。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMigrate}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 text-sm transition active:scale-[0.98]"
                >
                  确认迁移
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmMigrate(false)}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </>
      )}

      {/* 迁移报告 */}
      {phase === "done" && report && (
        <div className="mt-3 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            迁移报告
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="text-zinc-500 dark:text-zinc-400">✅ 目标：</div>
            <div className="text-zinc-700 dark:text-zinc-300 font-medium">
              {report.migratedGoalsCount}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">✅ 行动：</div>
            <div className="text-zinc-700 dark:text-zinc-300 font-medium">
              {report.migratedActionsCount}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">
              ✅ 每日记录：
            </div>
            <div className="text-zinc-700 dark:text-zinc-300 font-medium">
              {report.migratedDailyLogsCount}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">
              ✅ 行动记录：
            </div>
            <div className="text-zinc-700 dark:text-zinc-300 font-medium">
              {report.migratedActionRecordsCount}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">⏭️ 跳过：</div>
            <div className="text-zinc-700 dark:text-zinc-300 font-medium">
              {report.skippedCount}
            </div>
          </div>

          {/* 错误详情 */}
          {report.errors.length > 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                ❌ 错误 ({report.errors.length})
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {report.errors.map((err, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-600 dark:text-red-400 leading-relaxed"
                  >
                    [{err.type}] {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 清空本地数据 */}
          <div className="space-y-2">
            {summary.hasLocalData && !confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                清空已迁移的本地数据
              </button>
            )}

            {confirmClear && (
              <div className="space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ 确认清空本地数据？此操作不可撤销。
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium py-2 text-sm transition active:scale-[0.98]"
                  >
                    确认清空
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            >
              重新检查本地数据
            </button>
          </div>
        </div>
      )}
    </section>
  );
}