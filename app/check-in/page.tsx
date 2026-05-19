/**
 * 每日记录页 - Daily Check-in（可交互版）
 *
 * Milestone 2 Step 2: 用户可以填写状态评分、行动状态、笔记、卡点，
 * 并保存到 localStorage。刷新后数据仍在。
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { DailyLog, ActionRecord, ActionRecordStatus } from "@/types";
import { actions as mockActions } from "@/lib/mock-data";
import { getTodayActions } from "@/lib/stats";
import {
  todayStr,
  getLocalDailyLogs,
  getLocalActionRecords,
  upsertTodayDailyLog,
  upsertActionRecordsForDate,
} from "@/lib/local-storage";

// ==================== 常量 ====================
const USER_ID = "local-user-001";

// ==================== 辅助：生成 ID ====================
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== 默认 DailyLog 模板 ====================
function emptyDailyLog(date: string): DailyLog {
  return {
    id: genId("log"),
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

  // ===== 状态 =====
  // 今日应执行的行动列表（来自 mock，用于展示选项）
  const todayActions = useMemo(() => getTodayActions(mockActions, []), []);

  // 从 localStorage 读取今天的记录（初始化）
  const initialData = useMemo(() => {
    const localLogs = getLocalDailyLogs();
    const localRecords = getLocalActionRecords();
    const existingLog = localLogs.find((l) => l.date === date) ?? null;
    const existingRecords = localRecords.filter((r) => r.date === date);

    // 如果没有记录，为每个今日行动创建空白记录
    let records: ActionRecord[];
    if (existingRecords.length > 0) {
      records = existingRecords;
    } else {
      records = todayActions.map(({ action }) => ({
        id: genId("rec"),
        userId: USER_ID,
        actionId: action.id,
        dailyLogId: existingLog?.id ?? "",
        date,
        status: "skipped" as ActionRecordStatus,
        note: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    return {
      log: existingLog ?? emptyDailyLog(date),
      records,
    };
  }, [date, todayActions]);

  const [dailyLog, setDailyLog] = useState<DailyLog>(initialData.log);
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>(initialData.records);
  const [saved, setSaved] = useState(false);

  // ===== 更新 DailyLog 字段 =====
  const updateLog = useCallback(
    (field: keyof DailyLog, value: string | number) => {
      setDailyLog((prev) => ({
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString(),
      }));
      setSaved(false);
    },
    [],
  );

  // ===== 更新某条 ActionRecord 的状态 =====
  const updateRecordStatus = useCallback(
    (actionId: string, status: ActionRecordStatus) => {
      setActionRecords((prev) =>
        prev.map((r) =>
          r.actionId === actionId
            ? { ...r, status, updatedAt: new Date().toISOString() }
            : r,
        ),
      );
      setSaved(false);
    },
    [],
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
  }, []);

  // ===== 保存 =====
  const handleSave = useCallback(() => {
    upsertTodayDailyLog(dailyLog);
    upsertActionRecordsForDate(date, actionRecords);
    setSaved(true);
    // 3 秒后隐藏提示
    setTimeout(() => setSaved(false), 3000);
  }, [dailyLog, actionRecords, date]);

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
        {todayActions.length > 0 ? (
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
        {saved && (
          <p className="mt-2 text-center text-sm text-emerald-600 dark:text-emerald-400 transition">
            ✓ 已保存
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
          数据保存在浏览器本地，不会丢失
        </p>
      </section>
    </div>
  );
}