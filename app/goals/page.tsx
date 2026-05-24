/**
 * 目标页 - 展示本地目标与行动，支持新增
 *
 * Milestone 2 Step 3: 本地优先，无数据 fallback mock。
 * Milestone 3 Step 4.1: 已登录时使用 Supabase 写入，未登录保留 localStorage。
 */

"use client";

import { useState, useCallback, useRef } from "react";
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
import {
  upsertLocalGoal,
  upsertLocalAction,
  exportAllLocalData,
  importAllLocalData,
  clearAllLocalData,
} from "@/lib/local-storage";
import { useGrowthLoopLocalData } from "@/hooks/use-growthloop-local-data";
import { useGrowthLoopCloudData } from "@/hooks/use-growthloop-cloud-data";
import { mapGoalToInsert, mapActionToInsert } from "@/lib/supabase/mappers";
import LocalDataMigrationCard from "@/app/components/migration/LocalDataMigrationCard";

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
function emptyGoalForm(defaultDomainId?: string): {
  title: string;
  domainId: string;
  horizon: GoalHorizon;
  description: string;
  isMainFocus: boolean;
} {
  return {
    title: "",
    domainId: defaultDomainId ?? mockDomains[0]?.id ?? "",
    horizon: "quarter",
    description: "",
    isMainFocus: false,
  };
}

function emptyActionForm(defaultGoalId?: string): {
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
    goalId: defaultGoalId ?? "",
    standardVersion: "",
    minimumVersion: "",
    frequency: "daily",
    difficulty: "easy",
    isWeeklyFocus: false,
  };
}

// ==================== 校验 ====================
interface GoalFormErrors {
  title?: string;
  domainId?: string;
  horizon?: string;
}

interface ActionFormErrors {
  title?: string;
  goalId?: string;
  standardVersion?: string;
  minimumVersion?: string;
}

function validateGoalForm(form: ReturnType<typeof emptyGoalForm>): GoalFormErrors {
  const errors: GoalFormErrors = {};
  if (!form.title.trim()) {
    errors.title = "目标名称不能为空";
  }
  if (!form.domainId) {
    errors.domainId = "必须选择领域";
  }
  if (!form.horizon) {
    errors.horizon = "必须选择目标周期";
  }
  return errors;
}

function validateActionForm(form: ReturnType<typeof emptyActionForm>): ActionFormErrors {
  const errors: ActionFormErrors = {};
  if (!form.title.trim()) {
    errors.title = "行动名称不能为空";
  }
  if (!form.goalId) {
    errors.goalId = "必须选择所属目标";
  }
  if (!form.standardVersion.trim()) {
    errors.standardVersion = "标准行动版本不能为空";
  }
  if (!form.minimumVersion.trim()) {
    errors.minimumVersion = "最低行动版本不能为空";
  }
  return errors;
}

// ==================== 组件 ====================
export default function GoalsPage() {
  const {
    goals: localGoals,
    actions: localActions,
    hasLocalGoals,
    hasLocalActions,
  } = useGrowthLoopLocalData();

  const {
    goals: cloudGoals,
    actions: cloudActions,
    domains: cloudDomains,
    isLoggedIn,
    loading: cloudLoading,
    refresh: cloudRefresh,
    createGoal: cloudCreateGoal,
    createAction: cloudCreateAction,
  } = useGrowthLoopCloudData();

  // --- 数据源策略 ---
  // 已登录：仅 cloud 数据（不 fallback localStorage/mock）
  // 未登录：localStorage → mock
  const useCloud = isLoggedIn;

  const allGoals: Goal[] = useCloud
    ? cloudGoals
    : hasLocalGoals
      ? localGoals
      : mockGoals;

  const allActions: Action[] = useCloud
    ? cloudActions
    : hasLocalActions
      ? localActions
      : hasLocalGoals
        ? []
        : mockActions;

  // domain 选择器数据源
  const domainSource = useCloud && cloudDomains.length > 0 ? cloudDomains : mockDomains;

  // --- 表单折叠状态 ---
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);

  // --- 表单数据 ---
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [actionForm, setActionForm] = useState(emptyActionForm);

  // --- 校验错误 ---
  const [goalErrors, setGoalErrors] = useState<GoalFormErrors>({});
  const [actionErrors, setActionErrors] = useState<ActionFormErrors>({});

  // --- 保存提示 ---
  const [goalSaved, setGoalSaved] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [actionSaved, setActionSaved] = useState(false);
  const [actionSaveError, setActionSaveError] = useState<string | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  // --- 新增目标 ---
  const handleSaveGoal = useCallback(async () => {
    const errors = validateGoalForm(goalForm);
    setGoalErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGoalSaveError("请检查表单中的错误");
      setTimeout(() => setGoalSaveError(null), 3000);
      return;
    }

    setGoalSaving(true);
    setGoalSaveError(null);

    try {
      if (isLoggedIn) {
        // 已登录：写入 Supabase
        const now = new Date().toISOString();
        const tempGoal: Goal = {
          id: "", // Supabase 会生成 uuid
          userId: "",
          domainId: goalForm.domainId,
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || undefined,
          horizon: goalForm.horizon,
          status: "active",
          isMainFocus: goalForm.isMainFocus,
          createdAt: now,
          updatedAt: now,
        };
        const insert = mapGoalToInsert(tempGoal, ""); // user_id 由 createGoal 内部覆盖
        await cloudCreateGoal(insert);
        // 刷新云端数据
        await cloudRefresh();

        if (process.env.NODE_ENV === "development") {
          console.log("[GrowthLoop Goals] Goal saved to Supabase");
        }
      } else {
        // 未登录：写入 localStorage
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
      }

      setGoalForm(emptyGoalForm(domainSource[0]?.id));
      setGoalErrors({});
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 3000);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "保存失败";
      const userMsg = rawMsg.length > 80 ? "保存失败，请稍后重试" : rawMsg;
      setGoalSaveError(userMsg);
      setTimeout(() => setGoalSaveError(null), 5000);
      if (process.env.NODE_ENV === "development") {
        console.error("[GrowthLoop Goals] Failed to save goal:", err);
      }
    } finally {
      setGoalSaving(false);
    }
  }, [goalForm, isLoggedIn, cloudCreateGoal, cloudRefresh, domainSource]);

  // --- 新增行动 ---
  const handleSaveAction = useCallback(async () => {
    const errors = validateActionForm(actionForm);
    setActionErrors(errors);

    if (Object.keys(errors).length > 0) {
      setActionSaveError("请检查表单中的错误");
      setTimeout(() => setActionSaveError(null), 3000);
      return;
    }

    setActionSaving(true);
    setActionSaveError(null);

    try {
      if (isLoggedIn) {
        // 已登录：写入 Supabase
        const now = new Date().toISOString();
        const tempAction: Action = {
          id: "", // Supabase 会生成 uuid
          userId: "",
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
        const insert = mapActionToInsert(tempAction, ""); // user_id 由 createAction 内部覆盖
        await cloudCreateAction(insert);
        // 刷新云端数据
        await cloudRefresh();

        if (process.env.NODE_ENV === "development") {
          console.log("[GrowthLoop Goals] Action saved to Supabase");
        }
      } else {
        // 未登录：写入 localStorage
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
      }

      const firstGoalId = allGoals.filter((g) => g.status === "active")[0]?.id;
      setActionForm(emptyActionForm(firstGoalId));
      setActionErrors({});
      setActionSaved(true);
      setTimeout(() => setActionSaved(false), 3000);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "保存失败";
      const userMsg = rawMsg.length > 80 ? "保存失败，请稍后重试" : rawMsg;
      setActionSaveError(userMsg);
      setTimeout(() => setActionSaveError(null), 5000);
      if (process.env.NODE_ENV === "development") {
        console.error("[GrowthLoop Goals] Failed to save action:", err);
      }
    } finally {
      setActionSaving(false);
    }
  }, [actionForm, isLoggedIn, cloudCreateAction, cloudRefresh, allGoals]);

  // ===== 本地数据管理 =====
  const [showDataManager, setShowDataManager] = useState(false);
  const [importMsg, setImportMsg] = useState<"success" | "error" | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data = exportAllLocalData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growthloop-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const raw = evt.target?.result;
          if (typeof raw !== "string") {
            setImportMsg("error");
            return;
          }
          const parsed = JSON.parse(raw);
          const ok = importAllLocalData(parsed);
          setImportMsg(ok ? "success" : "error");
        } catch {
          setImportMsg("error");
        }
        setTimeout(() => setImportMsg(null), 3000);
      };
      reader.onerror = () => {
        setImportMsg("error");
        setTimeout(() => setImportMsg(null), 3000);
      };
      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleClear = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    clearAllLocalData();
    setClearConfirm(false);
  }, [clearConfirm]);

  // --- 展示用派生数据 ---
  const mainFocusGoal = allGoals.find((g) => g.isMainFocus);

  // 按领域分组（使用 domainSource）
  const domainGroups = domainSource
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

  const hasAnyGoal = allGoals.some((g) => g.status === "active");

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">目标管理</p>
            <h1 className="text-xl font-semibold mt-1">
              我的目标
              {useCloud && (
                <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                  云端
                </span>
              )}
            </h1>
          </div>
        </div>
        {cloudLoading && useCloud && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            加载中...
          </p>
        )}
      </section>

      {/* ===== 空状态：全局 ===== */}
      {!hasAnyGoal && !cloudLoading && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            还没有目标，先创建一个本周主线目标
          </p>
        </section>
      )}

      {/* ===== 本周主线目标 ===== */}
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
            还没有主线目标，请先创建或设置主线目标
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
            {goalCount > 0 ? (
              <div className="mt-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{goalCount} 个目标</span>
                <span>{actionCount} 个行动</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                暂无目标
              </p>
            )}
          </div>
        ))}
      </section>

      {/* ===== 新建目标 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => {
            if (!showGoalForm) {
              // 展开时，使用当前数据源中第一个 domain 的 ID 作为默认值
              setGoalForm(emptyGoalForm(domainSource[0]?.id));
            }
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
                onChange={(e) => {
                  setGoalForm((f) => ({ ...f, title: e.target.value }));
                  if (goalErrors.title) {
                    setGoalErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="例如：每周运动 2 次"
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  goalErrors.title
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              {goalErrors.title && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {goalErrors.title}
                </p>
              )}
            </div>

            {/* 领域 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                领域 *
              </label>
              <select
                value={goalForm.domainId}
                onChange={(e) => {
                  setGoalForm((f) => ({ ...f, domainId: e.target.value }));
                  if (goalErrors.domainId) {
                    setGoalErrors((prev) => ({ ...prev, domainId: undefined }));
                  }
                }}
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  goalErrors.domainId
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {domainSource.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {goalErrors.domainId && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {goalErrors.domainId}
                </p>
              )}
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
              disabled={goalSaving}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {goalSaving ? "保存中..." : "保存目标"}
            </button>
            {goalSaved && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                ✓ 目标已保存
              </p>
            )}
            {goalSaveError && (
              <p className="text-center text-xs text-red-500 dark:text-red-400">
                {goalSaveError}
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
            if (!showActionForm) {
              // 展开时，使用当前数据源中第一个 goal 的 ID 作为默认值
              const firstGoalId = allGoals.filter((g) => g.status === "active")[0]?.id;
              setActionForm(emptyActionForm(firstGoalId));
            }
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
                onChange={(e) => {
                  setActionForm((f) => ({ ...f, title: e.target.value }));
                  if (actionErrors.title) {
                    setActionErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="例如：运动 30 分钟"
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  actionErrors.title
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              {actionErrors.title && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {actionErrors.title}
                </p>
              )}
            </div>

            {/* 所属目标 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                所属目标 *
              </label>
              <select
                value={actionForm.goalId}
                onChange={(e) => {
                  setActionForm((f) => ({ ...f, goalId: e.target.value }));
                  if (actionErrors.goalId) {
                    setActionErrors((prev) => ({ ...prev, goalId: undefined }));
                  }
                }}
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  actionErrors.goalId
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
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
              {allGoals.filter((g) => g.status === "active").length === 0 && (
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  请先创建目标
                </p>
              )}
              {actionErrors.goalId && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {actionErrors.goalId}
                </p>
              )}
            </div>

            {/* 标准版本 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                标准版本 *
              </label>
              <input
                type="text"
                value={actionForm.standardVersion}
                onChange={(e) => {
                  setActionForm((f) => ({
                    ...f,
                    standardVersion: e.target.value,
                  }));
                  if (actionErrors.standardVersion) {
                    setActionErrors((prev) => ({
                      ...prev,
                      standardVersion: undefined,
                    }));
                  }
                }}
                placeholder="例如：跑步 30 分钟"
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  actionErrors.standardVersion
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              {actionErrors.standardVersion && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {actionErrors.standardVersion}
                </p>
              )}
            </div>

            {/* 最低版本 */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                最低版本 *
              </label>
              <input
                type="text"
                value={actionForm.minimumVersion}
                onChange={(e) => {
                  setActionForm((f) => ({
                    ...f,
                    minimumVersion: e.target.value,
                  }));
                  if (actionErrors.minimumVersion) {
                    setActionErrors((prev) => ({
                      ...prev,
                      minimumVersion: undefined,
                    }));
                  }
                }}
                placeholder="例如：散步 10 分钟"
                className={`mt-1 w-full rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  actionErrors.minimumVersion
                    ? "border-red-400 dark:border-red-500"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              {actionErrors.minimumVersion && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {actionErrors.minimumVersion}
                </p>
              )}
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
              disabled={actionSaving}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionSaving ? "保存中..." : "保存行动"}
            </button>
            {actionSaved && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                ✓ 行动已保存
              </p>
            )}
            {actionSaveError && (
              <p className="text-center text-xs text-red-500 dark:text-red-400">
                {actionSaveError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ===== 本地数据管理（折叠卡片） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDataManager((v) => !v)}
          className="w-full text-left p-4 flex items-center justify-between"
        >
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            本地数据管理
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {showDataManager ? "收起 ▲" : "展开 ▼"}
          </span>
        </button>

        {showDataManager && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              数据保存在浏览器本地，可导出为 JSON 备份或导入恢复。
            </p>

            {/* 导出 */}
            <button
              type="button"
              onClick={handleExport}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              导出数据 (JSON)
            </button>

            {/* 导入 */}
            <div>
              <label className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer text-center">
                导入数据 (JSON)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              {importMsg === "success" && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 text-center">
                  ✓ 导入成功
                </p>
              )}
              {importMsg === "error" && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 text-center">
                  导入失败，请检查 JSON 格式
                </p>
              )}
            </div>

            {/* 清空 */}
            <button
              type="button"
              onClick={handleClear}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                clearConfirm
                  ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              {clearConfirm ? "确认清空所有本地数据？再次点击确认" : "清空所有本地数据"}
            </button>
          </div>
        )}
      </section>

      {/* ===== 数据迁移（登录用户可见） ===== */}
      <LocalDataMigrationCard
        isLoggedIn={isLoggedIn}
        onRefresh={cloudRefresh}
      />

      {/* 底部间距（避免 BottomNav 遮挡） */}
      <div className="pb-16" />
    </div>
  );
}
