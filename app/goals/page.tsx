/**
 * 目标页 - 展示本地目标与行动，支持新增
 *
 * Milestone 2 Step 3: 本地优先，无数据 fallback mock。
 * 支持新增目标和行动（卡片内表单，可折叠）。
 */

"use client";

import { useState, useCallback } from "react";
import type {
  Goal,
  Action,
  GoalHorizon,
  ActionFrequency,
  ActionDifficulty,
} from "@/types";
import { domains as mockDomains } from "@/lib/mock-data";
import {
  goals as mockGoals,
  actions as mockActions,
} from "@/lib/mock-data";
import { upsertLocalGoal, upsertLocalAction } from "@/lib/local-storage";
import { useGrowthLoopLocalData } from "@/hooks/use-growthloop-local-data";

// ==================== 常量 ====================
const USER_ID = "local-user-001";

const HORIZON_OPTIONS: { value: GoalHorizon; label: string }[] = [
  { value: "5_year", label: "5 年" },
  { value: "3_year", label: "3 年" },
  { value: "1_year", label: "1 年" },
  { value: "quarter", label: "季度" },
];

const FREQUENCY_OPTIONS: { value: ActionFrequency; label: string }[] = [
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "once", label: "一次性" },
  { value: "custom", label: "自定义" },
];

const DIFFICULTY_OPTIONS: { value: ActionDifficulty; label: string }[] = [
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];

// ==================== 默认表单模板 ====================
function emptyGoalForm(): {
  title: string;
  domainId: string;
  horizon: GoalHorizon;
  description: string;
  isMainFocus: boolean;
} {
  return {
    title: "",
    domainId: mockDomains[0]?.id ?? "",
    horizon: "quarter",
    description: "",
    isMainFocus: false,
  };
}

function emptyActionForm(): {
  title: string;
  goalId: string;
  standardVersion: string;
  minimumVersion: string;
  frequency: ActionFrequency;
  difficulty: ActionDifficulty;
  isWeeklyFocus: boolean;
} {
  return {
    title: "",
    goalId: "",
    standardVersion: "",
    minimumVersion: "",
    frequency: "daily",
    difficulty: "easy",
    isWeeklyFocus: false,
  };
}

// ==================== 组件 ====================
export default function GoalsPage() {
  const { goals: localGoals, actions: localActions } =
    useGrowthLoopLocalData();

  // --- 数据源：local 优先，fallback mock ---
  const allGoals: Goal[] = localGoals.length > 0 ? localGoals : mockGoals;
  const allActions: Action[] = localActions.length > 0 ? localActions : mockActions;

  // --- 表单折叠状态 ---
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);

  // --- 表单数据 ---
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [actionForm, setActionForm] = useState(emptyActionForm);

  // --- 保存提示 ---
  const [goalSaved, setGoalSaved] = useState(false);
  const [actionSaved, setActionSaved] = useState(false);

  // --- 新增目标 ---
  const handleSaveGoal = useCallback(() => {
    if (!goalForm.title.trim()) return;
    const now = new Date().toISOString();
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      userId: USER_ID,
      domainId: goalForm.domainId,
      title: goalForm.title.trim(),
      description: goalForm.description.trim() || undefined,
      horizon: goalForm.horizon,
      status: "active",
      isMainFocus: goalForm.isMainFocus,
      createdAt: now,
      updatedAt: now,
    };
    upsertLocalGoal(newGoal);
    setGoalForm(emptyGoalForm());
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 3000);
  }, [goalForm]);

  // --- 新增行动 ---
  const handleSaveAction = useCallback(() => {
    if (!actionForm.title.trim() || !actionForm.goalId) return;
    const now = new Date().toISOString();
    const newAction: Action = {
      id: `act-${Date.now()}`,
      userId: USER_ID,
      goalId: actionForm.goalId,
      title: actionForm.title.trim(),
      description: undefined,
      standardVersion: actionForm.standardVersion.trim(),
      minimumVersion: actionForm.minimumVersion.trim(),
      frequency: actionForm.frequency,
      difficulty: actionForm.difficulty,
      isActive: true,
      isWeeklyFocus: actionForm.isWeeklyFocus,
      createdAt: now,
      updatedAt: now,
    };
    upsertLocalAction(newAction);
    setActionForm(emptyActionForm());
    setActionSaved(true);
    setTimeout(() => setActionSaved(false), 3000);
  }, [actionForm]);

  // --- 展示用派生数据 ---
  // 本周主线目标
  const mainFocusGoal = allGoals.find((g) => g.isMainFocus);

  // 按领域分组
  const domainGroups = mockDomains
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((domain) => {
      const domainGoals = allGoals.filter((g) => g.domainId === domain.id);
      return {
        domain,
        goals: domainGoals,
        goalCount: domainGoals.length,
        actionCount: domainGoals.reduce(
          (sum, g) =>
            sum +
            allActions.filter((a) => a.goalId === g.id && a.isActive).length,
          0,
        ),
      };
    });

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">目标管理</p>
        <h1 className="text-xl font-semibold mt-1">我的目标</h1>
      </section>

      {/* ===== 本周主线 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周主线
        </h2>
        {mainFocusGoal ? (
          <div className="mt-3">
            <p className="text-sm font-medium">{mainFocusGoal.title}</p>
            {mainFocusGoal.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {mainFocusGoal.description}
              </p>
            )}
            {/* 本周聚焦行动 */}
            <div className="mt-3 space-y-2">
              {allActions
                .filter(
                  (a) =>
                    a.goalId === mainFocusGoal.id &&
                    a.isActive &&
                    a.isWeeklyFocus,
                )
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-zinc-400 mt-0.5">•</span>
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300">
                        {action.title}
                      </p>
                      <p className="text-zinc-400 dark:text-zinc-500 mt-0.5">
                        最低：{action.minimumVersion}
                      </p>
                    </div>
                  </div>
                ))}
              {allActions.filter(
                (a) =>
                  a.goalId === mainFocusGoal.id &&
                  a.isActive &&
                  a.isWeeklyFocus,
              ).length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  本周暂无聚焦行动
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            暂无主线目标
          </p>
        )}
      </section>

      {/* ===== 辅助目标 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          辅助目标
        </h2>
        <div className="mt-3 space-y-3">
          {allGoals
            .filter((g) => !g.isMainFocus && g.status === "active")
            .map((goal) => {
              const goalActions = allActions.filter(
                (a) => a.goalId === goal.id && a.isActive,
              );
              return (
                <div
                  key={goal.id}
                  className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <p className="text-sm font-medium">{goal.title}</p>
                  {goal.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {goal.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {goalActions.length} 个行动
                  </p>
                </div>
              );
            })}
          {allGoals.filter((g) => !g.isMainFocus && g.status === "active")
            .length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              暂无辅助目标
            </p>
          )}
        </div>
      </section>

      {/* ===== 四大成长领域 ===== */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          成长领域
        </h2>
        {domainGroups.map(({ domain, goalCount, actionCount }) => (
          <div
            key={domain.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900"
          >
            <p className="text-sm font-medium">{domain.name}</p>
            {domain.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {domain.description}
              </p>
            )}
            <div className="mt-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{goalCount} 个目标</span>
              <span>{actionCount} 个行动</span>
            </div>
          </div>
        ))}
      </section>

      {/* ===== 新建目标 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => {
            setShowGoalForm((v) => !v);
            setShowActionForm(false);
          }}
          className="w-full text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center justify-between"
        >
          新建目标
          <span>{showGoalForm ? "收起 ▲" : "展开 ▼"}</span>
        </button>

        {showGoalForm && (
          <div className="mt-4 space-y-3">
            {/* 标题 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                标题 *
              </label>
              <input
                type="text"
                value={goalForm.title}
                onChange={(e) =>
                  setGoalForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="例如：每周运动 2 次"
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 领域 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                领域 *
              </label>
              <select
                value={goalForm.domainId}
                onChange={(e) =>
                  setGoalForm((f) => ({ ...f, domainId: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {mockDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 时间周期 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                时间周期
              </label>
              <select
                value={goalForm.horizon}
                onChange={(e) =>
                  setGoalForm((f) => ({
                    ...f,
                    horizon: e.target.value as GoalHorizon,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {HORIZON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 描述 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                描述
              </label>
              <textarea
                value={goalForm.description}
                onChange={(e) =>
                  setGoalForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="描述这个目标的具体内容..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* 是否主线 */}
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={goalForm.isMainFocus}
                onChange={(e) =>
                  setGoalForm((f) => ({ ...f, isMainFocus: e.target.checked }))
                }
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              设为本周主线目标
            </label>

            {/* 保存按钮 */}
            <button
              type="button"
              onClick={handleSaveGoal}
              disabled={!goalForm.title.trim()}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存目标
            </button>
            {goalSaved && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                ✓ 目标已保存
              </p>
            )}
          </div>
        )}
      </section>

      {/* ===== 新建行动 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => {
            setShowActionForm((v) => !v);
            setShowGoalForm(false);
          }}
          className="w-full text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center justify-between"
        >
          新建行动
          <span>{showActionForm ? "收起 ▲" : "展开 ▼"}</span>
        </button>

        {showActionForm && (
          <div className="mt-4 space-y-3">
            {/* 标题 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                标题 *
              </label>
              <input
                type="text"
                value={actionForm.title}
                onChange={(e) =>
                  setActionForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="例如：运动 30 分钟"
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 所属目标 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                所属目标 *
              </label>
              <select
                value={actionForm.goalId}
                onChange={(e) =>
                  setActionForm((f) => ({ ...f, goalId: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">请选择目标</option>
                {allGoals
                  .filter((g) => g.status === "active")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}{g.isMainFocus ? " (主线)" : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* 标准版本 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                标准版本
              </label>
              <input
                type="text"
                value={actionForm.standardVersion}
                onChange={(e) =>
                  setActionForm((f) => ({
                    ...f,
                    standardVersion: e.target.value,
                  }))
                }
                placeholder="例如：跑步 30 分钟"
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 最低版本 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                最低版本
              </label>
              <input
                type="text"
                value={actionForm.minimumVersion}
                onChange={(e) =>
                  setActionForm((f) => ({
                    ...f,
                    minimumVersion: e.target.value,
                  }))
                }
                placeholder="例如：散步 10 分钟"
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 频率 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                频率
              </label>
              <select
                value={actionForm.frequency}
                onChange={(e) =>
                  setActionForm((f) => ({
                    ...f,
                    frequency: e.target.value as ActionFrequency,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 难度 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                难度
              </label>
              <select
                value={actionForm.difficulty}
                onChange={(e) =>
                  setActionForm((f) => ({
                    ...f,
                    difficulty: e.target.value as ActionDifficulty,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 是否本周聚焦 */}
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={actionForm.isWeeklyFocus}
                onChange={(e) =>
                  setActionForm((f) => ({
                    ...f,
                    isWeeklyFocus: e.target.checked,
                  }))
                }
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              标记为本周聚焦行动
            </label>

            {/* 保存按钮 */}
            <button
              type="button"
              onClick={handleSaveAction}
              disabled={!actionForm.title.trim() || !actionForm.goalId}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存行动
            </button>
            {actionSaved && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                ✓ 行动已保存
              </p>
            )}
          </div>
        )}
      </section>

      {/* 底部间距（避免 BottomNav 遮挡） */}
      <div className="pb-16" />
    </div>
  );
}