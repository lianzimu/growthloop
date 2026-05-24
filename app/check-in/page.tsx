/**
 * 每日记录页 - Daily Check-in（Cloud + Local）
 *
 * Milestone 3 Step 5: 已登录用户保存到 Supabase，未登录用户使用 localStorage。
 * Milestone 3 Step 5.1: 修复云端模式 actionId 混入 mock ID、按钮无响应、Review 无数据等 bug。
 *
 * 核心修复：
 * - useEffect 初始化 state，而非 useState lazy initializer（避免首次渲染时 isLoggedIn=false 用 mock ID）
 * - initializedRef 确保只初始化一次，避免 cloud 数据更新后覆盖用户编辑
 * - 按钮使用 action.id（UUID）作为 key 查找 record，不会出现 mismatch
 * - 保存前清洗 invalid actionRecords（mock ID + 非 UUID）
 * - 保存后更新 dailyLog.id 为 Supabase 返回的真实 UUID
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { DailyLog, ActionRecord, ActionRecordStatus } from "@/types";
import { actions as mockActions } from "@/lib/mock-data";
import { getTodayActions } from "@/lib/stats";
import {
  todayStr,
  stableDailyLogId,
  stableActionRecordId,
  upsertTodayDailyLog,
  upsertActionRecordsForDate,
} from "@/lib/local-storage";
import { useGrowthLoopLocalData } from "@/hooks/use-growthloop-local-data";
import { useGrowthLoopCloudData } from "@/hooks/use-growthloop-cloud-data";
import { isUuid } from "@/lib/utils";
import type { Action } from "@/types";

// ==================== 常量 ====================
const USER_ID = "local-user-001";

// dev 调试标志
const DEV = process.env.NODE_ENV === "development";

// ==================== 默认 DailyLog 模板 ====================
function emptyDailyLog(date: string): DailyLog {
  return {
    id: stableDailyLogId(date),
    userId: USER_ID,
    date,
    sleepHours: 0,
    energyScore: 3,
    moodScore: 3,
    stressScore: 3,
    note: "",
    blockers: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** 为每个行动创建默认 record */
function makeDefaultRecords(
  date: string,
  dailyLogId: string,
  actions: Action[],
): ActionRecord[] {
  const now = new Date().toISOString();
  return actions.map((action) => ({
    id: stableActionRecordId(date, action.id),
    userId: USER_ID,
    actionId: action.id,
    dailyLogId,
    date,
    status: "skipped" as ActionRecordStatus,
    note: "",
    createdAt: now,
    updatedAt: now,
  }));
}

// ==================== 评分选项 ====================
const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

const SCORE_LABELS: Record<number, string> = {
  1: "1 - 很低",
  2: "2 - 偏低",
  3: "3 - 一般",
  4: "4 - 较好",
  5: "5 - 很好",
};

const STRESS_LABELS: Record<number, string> = {
  1: "1 - 很低",
  2: "2 - 偏低",
  3: "3 - 一般",
  4: "4 - 较高",
  5: "5 - 很高",
};

// ==================== 行动状态选项 ====================
const ACTION_STATUS_OPTIONS: {
  value: ActionRecordStatus;
  label: string;
}[] = [
  { value: "done", label: "✅ 已完成" },
  { value: "minimum_done", label: "🔶 最低完成" },
  { value: "skipped", label: "⏭️ 已跳过" },
  { value: "failed", label: "❌ 未完成" },
];

export default function CheckInPage() {
  const date = todayStr();

  // ===== 本地数据 =====
  const {
    dailyLogs: localDailyLogs,
    actionRecords: localActionRecords,
    actions: localActions,
  } = useGrowthLoopLocalData();

  // ===== 云端数据 =====
  const {
    actions: cloudActions,
    isLoggedIn,
    loading: cloudLoading,
    dailyLogs: cloudDailyLogs,
    actionRecords: cloudActionRecords,
    upsertDailyCheckIn,
  } = useGrowthLoopCloudData();

  // ===== 判断数据是否就绪 =====
  // Cloud 模式：需要 isLoggedIn && !cloudLoading
  // Local 模式：始终就绪（localStorage 同步读取）
  const isCloudReady = isLoggedIn && !cloudLoading;
  const isLocalReady = !isLoggedIn;

  // ===== 初始化标记 =====
  // 防止初始化后因依赖变化重复初始化（覆盖用户编辑）
  const initializedRef = useRef(false);
  // 追踪上一次 login 状态，用于检测 login/logout 切换
  const prevLoggedInRef = useRef(isLoggedIn);

  // ===== 表单 state =====
  // 初始值用空模板，useEffect 在数据就绪后会填充
  const [dailyLog, setDailyLog] = useState<DailyLog>(() =>
    emptyDailyLog(date),
  );
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ===== 初始化 state（数据就绪时同步一次） =====
  useEffect(() => {
    // 检测 login/logout 切换，重置初始化标记
    if (prevLoggedInRef.current !== isLoggedIn) {
      prevLoggedInRef.current = isLoggedIn;
      initializedRef.current = false;
    }

    // 跳过已初始化的组件（同一登录会话内不重复初始化）
    if (initializedRef.current) return;

    if (isCloudReady) {
      // === 云端模式：从 Supabase 数据初始化 ===
      const cloudLog = cloudDailyLogs.find((l) => l.date === date);
      const cloudRecords = cloudActionRecords.filter((r) => r.date === date);

      const log = cloudLog ?? emptyDailyLog(date);
      const records =
        cloudRecords.length > 0
          ? cloudRecords
          : cloudActions.length > 0
            ? makeDefaultRecords(date, log.id, cloudActions)
            : [];

      // eslint-disable-next-line react-hooks/set-state-in-effect -- 从外部数据源同步初始化表单 state
      setDailyLog(log);
      setActionRecords(records);
      initializedRef.current = true;

      if (DEV) {
        console.log("[CheckIn] Cloud initialized:", {
          logDate: log.date,
          existingLog: !!cloudLog,
          existingRecordCount: cloudRecords.length,
          generatedRecordCount:
            cloudRecords.length > 0
              ? 0
              : cloudActions.length > 0
                ? cloudActions.length
                : 0,
          cloudActionsCount: cloudActions.length,
        });
        if (records.length > 0) {
          console.log(
            "[CheckIn] actionRecord IDs:",
            records.map((r) => r.actionId),
          );
        }
      }
    } else if (isLocalReady) {
      // === 本地模式：从 localStorage 初始化 ===
      const existingLog = localDailyLogs.find((l) => l.date === date);
      const existingRecords = localActionRecords.filter((r) => r.date === date);

      const log = existingLog ?? emptyDailyLog(date);
      const sourceActions: Action[] =
        localActions.length > 0 ? localActions : mockActions;
      const records =
        existingRecords.length > 0
          ? existingRecords
          : sourceActions.length > 0
            ? makeDefaultRecords(date, log.id, sourceActions)
            : [];

      setDailyLog(log);
      setActionRecords(records);
      initializedRef.current = true;

      if (DEV) {
        console.log("[CheckIn] Local initialized:", {
          source: localActions.length > 0 ? "localStorage" : "mock",
          actionCount: sourceActions.length,
          recordCount: records.length,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- date and isCloudReady/isLocalReady derived from listed deps
  }, [
    isLoggedIn,
    cloudLoading,
    date,
    cloudDailyLogs,
    cloudActionRecords,
    cloudActions,
    localDailyLogs,
    localActionRecords,
    localActions,
    isCloudReady,
    isLocalReady,
  ]);

  // ===== 今日行动来源（仅用于 UI 渲染判断） =====
  // 云端模式仅使用 cloudActions，不 fallback mock
  const actionSource: Action[] = isLoggedIn
    ? cloudActions
    : localActions.length > 0
      ? localActions
      : mockActions;

  // ===== 今日应执行的行动列表（用于确定哪些 action 显示） =====
  const todayActions = useMemo(
    () => {
      const records = isLoggedIn ? cloudActionRecords : localActionRecords;
      return getTodayActions(actionSource, records);
    },
    [actionSource, isLoggedIn, cloudActionRecords, localActionRecords],
  );

  // ===== 调试日志（仅 development） =====
  if (DEV) {
    console.log("[CheckIn] Mode:", isLoggedIn ? "cloud" : "local");
    console.log(
      "[CheckIn] Actions source:",
      isLoggedIn
        ? `cloud (${cloudActions.length})`
        : localActions.length > 0
          ? `local (${localActions.length})`
          : `mock (${mockActions.length})`,
    );
    console.log("[CheckIn] todayActions count:", todayActions.length);
    console.log("[CheckIn] actionRecords count:", actionRecords.length);
    console.log(
      "[CheckIn] cloudDailyLogs:",
      cloudDailyLogs.length,
      "| cloudActionRecords:",
      cloudActionRecords.length,
    );
    if (actionRecords.length > 0) {
      console.log(
        "[CheckIn] actionRecord sample ids:",
        actionRecords.slice(0, 3).map((r) => r.actionId),
      );
    }
  }

  // ===== 更新 DailyLog 字段 =====
  const updateLog = useCallback(
    (field: keyof DailyLog, value: string | number) => {
      setDailyLog((prev) => ({
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString(),
      }));
      setSaved(false);
      setSaveError(null);
    },
    [],
  );

  // ===== 更新某条 ActionRecord 的状态 =====
  // 使用 actionId (UUID) 作为 key，不依赖数组 index
  const updateRecordStatus = useCallback(
    (actionId: string, status: ActionRecordStatus) => {
      setActionRecords((prev) => {
        // 如果该 actionId 不存在于当前 records 中，创建新 record
        const exists = prev.some((r) => r.actionId === actionId);
        if (!exists) {
          const now = new Date().toISOString();
          const newRecord: ActionRecord = {
            id: stableActionRecordId(date, actionId),
            userId: USER_ID,
            actionId,
            dailyLogId: dailyLog.id,
            date,
            status,
            note: "",
            createdAt: now,
            updatedAt: now,
          };
          return [...prev, newRecord];
        }
        return prev.map((r) =>
          r.actionId === actionId
            ? { ...r, status, updatedAt: new Date().toISOString() }
            : r,
        );
      });
      setSaved(false);
      setSaveError(null);
    },
    [date, dailyLog.id],
  );

  // ===== 更新某条 ActionRecord 的备注 =====
  const updateRecordNote = useCallback((actionId: string, note: string) => {
    setActionRecords((prev) =>
      prev.map((r) =>
        r.actionId === actionId
          ? { ...r, note, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
    setSaved(false);
    setSaveError(null);
  }, []);

  // ===== 保存 =====
  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaved(false);

    try {
      if (isLoggedIn) {
        // === 已登录：保存到 Supabase ===

        // 过滤：只保留 actionId 存在于 cloudActions 的记录
        const validRecords = actionRecords.filter((r) => {
          const exists = cloudActions.some((a) => a.id === r.actionId);
          if (!exists && DEV) {
            console.warn(
              "[CheckIn] Filtered out invalid record (actionId not in cloudActions):",
              r.actionId,
            );
          }
          return exists;
        });

        // UUID 校验：拒绝非 UUID 的 actionId
        const invalidUuidRecords = validRecords.filter(
          (r) => !isUuid(r.actionId),
        );
        if (invalidUuidRecords.length > 0) {
          const ids = invalidUuidRecords.map((r) => r.actionId).join(", ");
          throw new Error(
            `云端保存失败：检测到非 UUID actionId (${ids})，请刷新页面后重试。`,
          );
        }

        if (DEV) {
          console.log("[CheckIn] Saving to cloud - payload:", {
            dailyLog: { date: dailyLog.date, sleepHours: dailyLog.sleepHours },
            actionRecords: validRecords.map((r) => ({
              actionId: r.actionId,
              status: r.status,
            })),
            filteredCount: actionRecords.length - validRecords.length,
          });
        }

        const logToSave = {
          ...dailyLog,
          updatedAt: new Date().toISOString(),
        };

        const savedLog = await upsertDailyCheckIn(logToSave, validRecords);

        // 更新本地 state 为验证后的数据 + Supabase 返回的真实 ID
        setDailyLog((prev) => ({ ...prev, id: savedLog.id }));
        setActionRecords(validRecords);
        setSaveMessage("✓ 已保存到云端");
        setSaved(true);
      } else {
        // === 未登录：保存到 localStorage ===
        const logWithStableId = {
          ...dailyLog,
          id: stableDailyLogId(date),
          updatedAt: new Date().toISOString(),
        };
        upsertTodayDailyLog(logWithStableId);

        const recordsWithStableId = actionRecords.map((r) => ({
          ...r,
          id: stableActionRecordId(date, r.actionId),
          dailyLogId: stableDailyLogId(date),
          updatedAt: new Date().toISOString(),
        }));
        upsertActionRecordsForDate(date, recordsWithStableId);

        setDailyLog(logWithStableId);
        setActionRecords(recordsWithStableId);
        setSaveMessage("✓ 已保存到本地");
        setSaved(true);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "保存失败，请重试";
      setSaveError(msg);
      setSaved(false);
    }

    // 3 秒后隐藏提示
    setTimeout(() => {
      setSaved(false);
      setSaveMessage("");
    }, 3000);
  }, [
    dailyLog,
    actionRecords,
    date,
    isLoggedIn,
    cloudActions,
    upsertDailyCheckIn,
  ]);

  // ===== 加载中 =====
  if (isLoggedIn && cloudLoading) {
    return (
      <div className="space-y-6">
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
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-12">
          加载中...
        </p>
      </div>
    );
  }

  // ===== 渲染 =====
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

      {/* ===== 睡眠 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          睡眠时长（小时）
        </label>
        <input
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={dailyLog.sleepHours || ""}
          onChange={(e) =>
            updateLog("sleepHours", parseFloat(e.target.value) || 0)
          }
          className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="例如：7.5"
        />
      </section>

      {/* ===== 精力评分 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          精力评分
        </label>
        <div className="mt-2 flex gap-2">
          {SCORE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateLog("energyScore", s)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                dailyLog.energyScore === s
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              {SCORE_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 情绪评分 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          情绪评分
        </label>
        <div className="mt-2 flex gap-2">
          {SCORE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateLog("moodScore", s)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                dailyLog.moodScore === s
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              {SCORE_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 压力评分 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          压力评分
        </label>
        <div className="mt-2 flex gap-2">
          {SCORE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateLog("stressScore", s)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                dailyLog.stressScore === s
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              {STRESS_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 今日行动完成状态 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日行动
        </h2>
        {isLoggedIn && cloudActions.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            暂无云端行动，请先在 Goals 页面创建本周行动
          </p>
        ) : todayActions.length > 0 ? (
          <div className="mt-3 space-y-4">
            {todayActions.map(({ action }) => {
              const record = actionRecords.find(
                (r) => r.actionId === action.id,
              );
              const currentStatus = record?.status ?? "skipped";

              return (
                <div
                  key={action.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {action.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    标准：{action.standardVersion}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    最低：{action.minimumVersion}
                  </p>

                  {/* 状态选择 */}
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {ACTION_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateRecordStatus(action.id, opt.value)
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs transition ${
                          currentStatus === opt.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* 备注 */}
                  <input
                    type="text"
                    value={record?.note ?? ""}
                    onChange={(e) =>
                      updateRecordNote(action.id, e.target.value)
                    }
                    placeholder="备注（可选）"
                    className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            今日暂无行动
          </p>
        )}
      </section>

      {/* ===== 今日一句话记录 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          今日记录
        </label>
        <textarea
          value={dailyLog.note ?? ""}
          onChange={(e) => updateLog("note", e.target.value)}
          placeholder="今天发生了什么？有什么想记录的？"
          rows={3}
          className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </section>

      {/* ===== 卡点 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
          今日卡点
        </label>
        <input
          type="text"
          value={dailyLog.blockers ?? ""}
          onChange={(e) => updateLog("blockers", e.target.value)}
          placeholder="例如：加班、目标太多、情绪低落..."
          className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </section>

      {/* ===== 保存按钮 ===== */}
      <section className="pb-20">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-3 text-sm transition active:scale-[0.98]"
        >
          保存记录
        </button>
        {saved && saveMessage && (
          <p className="mt-2 text-center text-sm text-emerald-600 dark:text-emerald-400 transition">
            {saveMessage}
          </p>
        )}
        {saveError && (
          <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400 transition">
            {saveError}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
          {isLoggedIn ? "数据保存到云端" : "数据保存在浏览器本地"}
        </p>
      </section>
    </div>
  );
}