/**
 * GrowthLoop 云端数据 Hook
 *
 * Milestone 3 Step 5: 添加 dailyLogs / actionRecords 云端读写。
 * Milestone 4 Step 2: 添加 weeklyReviews 云端读写。
 *
 * - 已登录时：domains/goals/actions/dailyLogs/actionRecords/weeklyReviews 仅使用 Supabase 数据
 * - 未登录时：hook 返回空数据，页面 fallback 到 localStorage/mock
 * - 暴露 createGoal/createAction/refresh/upsertDailyCheckIn/refreshDailyData 供页面调用
 * - 登录后自动调用 ensureDefaultDomains
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Domain,
  Goal,
  Action,
  DailyLog,
  ActionRecord,
  WeeklyReview,
} from "@/types";
import type { GoalInsert, ActionInsert } from "@/types/supabase";

// ==================== 类型 ====================
export interface UseCloudDataResult {
  /** Supabase 返回的 domains */
  domains: Domain[];
  /** Supabase 返回的 goals */
  goals: Goal[];
  /** Supabase 返回的 actions */
  actions: Action[];
  /** Supabase 返回的 dailyLogs */
  dailyLogs: DailyLog[];
  /** Supabase 返回的 actionRecords */
  actionRecords: ActionRecord[];
  /** Supabase 返回的 weeklyReviews */
  weeklyReviews: WeeklyReview[];
  /** 是否有 Supabase 返回的 domains */
  hasCloudDomains: boolean;
  /** 是否有 Supabase 返回的 goals */
  hasCloudGoals: boolean;
  /** 是否有 Supabase 返回的 actions */
  hasCloudActions: boolean;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 是否正在加载云端数据 */
  loading: boolean;
  /** 云端加载是否出错 */
  error: string | null;
  /** 刷新云端全部数据（创建/更新后调用） */
  refresh: () => Promise<void>;
  /** 刷新 dailyLogs + actionRecords */
  refreshDailyData: () => Promise<void>;
  /** 刷新 weeklyReviews */
  refreshWeeklyReviews: () => Promise<void>;
  /** 获取当前周的已保存复盘（按 week_start 查询），无记录返回 null */
  getCurrentWeekReview: (weekStart: string) => Promise<WeeklyReview | null>;
  /** 保存每周复盘到 Supabase（upsert） */
  upsertWeeklyReview: (review: WeeklyReview) => Promise<WeeklyReview>;
  /** 创建 goal（仅已登录时可用） */
  createGoal: (input: GoalInsert) => Promise<Goal>;
  /** 创建 action（仅已登录时可用） */
  createAction: (input: ActionInsert) => Promise<Action>;
  /**
   * 保存每日签到到 Supabase
   *
   * @param dailyLog - 每日日志
   * @param records - action 完成记录列表
   * @returns 保存后的 dailyLog（含 Supabase id）
   */
  upsertDailyCheckIn: (
    dailyLog: DailyLog,
    records: ActionRecord[],
  ) => Promise<DailyLog>;
}

// ==================== Hook ====================
export function useGrowthLoopCloudData(): UseCloudDataResult {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 监听登录状态变化
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const [{ createClient }] = await Promise.all([
          import("@/lib/supabase/client"),
        ]);
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setIsLoggedIn(!!session);
        }

        // 监听 auth 变化
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (!cancelled) {
            setIsLoggedIn(!!newSession);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        // 静默处理
      }
    }

    const cleanupPromise = checkAuth();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  // 加载云端 domains/goals/actions（仅已登录时）
  const loadCloudData = useCallback(async (): Promise<{
    domains: Domain[];
    goals: Goal[];
    actions: Action[];
    error: string | null;
  }> => {
    try {
      const [{ getDomains }, { getGoals }, { getActions }] =
        await Promise.all([
          import("@/lib/supabase/domains"),
          import("@/lib/supabase/goals"),
          import("@/lib/supabase/actions"),
        ]);

      const [domainsData, goalsData, actionsData] = await Promise.all([
        getDomains().catch(() => [] as Domain[]),
        getGoals().catch(() => [] as Goal[]),
        getActions().catch(() => [] as Action[]),
      ]);

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Data loaded", {
          domains: domainsData.length,
          goals: goalsData.length,
          actions: actionsData.length,
        });
      }

      return {
        domains: domainsData,
        goals: goalsData,
        actions: actionsData,
        error: null,
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load cloud data";
      return { domains: [], goals: [], actions: [], error: msg };
    }
  }, []);

  // 加载 dailyLogs + actionRecords
  const loadDailyData = useCallback(async (): Promise<{
    dailyLogs: DailyLog[];
    actionRecords: ActionRecord[];
    error: string | null;
  }> => {
    try {
      const [{ getDailyLogs }, { getActionRecords }] = await Promise.all([
        import("@/lib/supabase/daily-logs"),
        import("@/lib/supabase/action-records"),
      ]);

      const [dailyLogsData, actionRecordsData] = await Promise.all([
        getDailyLogs().catch(() => [] as DailyLog[]),
        getActionRecords().catch(() => [] as ActionRecord[]),
      ]);

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Daily data loaded", {
          dailyLogs: dailyLogsData.length,
          actionRecords: actionRecordsData.length,
        });
      }

      return {
        dailyLogs: dailyLogsData,
        actionRecords: actionRecordsData,
        error: null,
      };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load daily data";
      return { dailyLogs: [], actionRecords: [], error: msg };
    }
  }, []);

  // 加载 weeklyReviews
  const loadWeeklyReviews = useCallback(async (): Promise<{
    weeklyReviews: WeeklyReview[];
    error: string | null;
  }> => {
    try {
      const { getWeeklyReviews } = await import(
        "@/lib/supabase/weekly-reviews"
      );

      const data = await getWeeklyReviews().catch(() => [] as WeeklyReview[]);

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Weekly reviews loaded", {
          count: data.length,
        });
      }

      return { weeklyReviews: data, error: null };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load weekly reviews";
      return { weeklyReviews: [], error: msg };
    }
  }, []);

  // 登录后自动加载数据 + ensureDefaultDomains
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isLoggedIn) {
        if (!cancelled) {
          setDomains([]);
          setGoals([]);
          setActions([]);
          setDailyLogs([]);
          setActionRecords([]);
          setWeeklyReviews([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        // 确保默认 domains 存在
        const [{ ensureDefaultDomains }] = await Promise.all([
          import("@/lib/supabase/domains"),
        ]);

        if (process.env.NODE_ENV === "development") {
          console.log("[GrowthLoop Cloud] Ensuring default domains...");
        }

        await ensureDefaultDomains();

        if (process.env.NODE_ENV === "development") {
          console.log("[GrowthLoop Cloud] Default domains ensured");
        }

        // 并行加载全量数据
        const [coreResult, dailyResult, weeklyResult] = await Promise.all([
          loadCloudData(),
          loadDailyData(),
          loadWeeklyReviews(),
        ]);

        if (!cancelled) {
          setDomains(coreResult.domains);
          setGoals(coreResult.goals);
          setActions(coreResult.actions);
          setDailyLogs(dailyResult.dailyLogs);
          setActionRecords(dailyResult.actionRecords);
          setWeeklyReviews(weeklyResult.weeklyReviews);
          setError(coreResult.error ?? dailyResult.error ?? weeklyResult.error);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to init cloud data";
          setError(msg);
          if (process.env.NODE_ENV === "development") {
            console.error("[GrowthLoop Cloud] Init error:", msg);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loadCloudData, loadDailyData, loadWeeklyReviews]);

  // refresh 方法：重新加载全量数据（包括 domains/goals/actions）
  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    const result = await loadCloudData();
    setDomains(result.domains);
    setGoals(result.goals);
    setActions(result.actions);
    setError(result.error);
  }, [isLoggedIn, loadCloudData]);

  // refreshDailyData：重新加载 dailyLogs + actionRecords
  const refreshDailyData = useCallback(async () => {
    if (!isLoggedIn) return;
    const result = await loadDailyData();
    setDailyLogs(result.dailyLogs);
    setActionRecords(result.actionRecords);
    if (result.error) setError(result.error);
  }, [isLoggedIn, loadDailyData]);

  // refreshWeeklyReviews：重新加载 weeklyReviews
  const refreshWeeklyReviews = useCallback(async () => {
    if (!isLoggedIn) return;
    const result = await loadWeeklyReviews();
    setWeeklyReviews(result.weeklyReviews);
    if (result.error) setError(result.error);
  }, [isLoggedIn, loadWeeklyReviews]);

  // getCurrentWeekReview：按 weekStart 查询单条记录
  const getCurrentWeekReview = useCallback(
    async (weekStart: string): Promise<WeeklyReview | null> => {
      if (!isLoggedIn) return null;

      try {
        const { getWeeklyReviewByWeekStart } = await import(
          "@/lib/supabase/weekly-reviews"
        );
        return await getWeeklyReviewByWeekStart(weekStart);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[GrowthLoop Cloud] Failed to get current week review:",
            err,
          );
        }
        return null;
      }
    },
    [isLoggedIn],
  );

  // upsertWeeklyReview：保存每周复盘
  const upsertWeeklyReviewFn = useCallback(
    async (review: WeeklyReview): Promise<WeeklyReview> => {
      if (!isLoggedIn) {
        throw new Error("Cannot save weekly review: user not logged in");
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Saving weekly review", {
          weekStart: review.weekStart,
          weekEnd: review.weekEnd,
        });
      }

      const { upsertWeeklyReview } = await import(
        "@/lib/supabase/weekly-reviews"
      );
      const result = await upsertWeeklyReview(review);

      // 刷新本地 state
      await refreshWeeklyReviews();

      return result;
    },
    [isLoggedIn, refreshWeeklyReviews],
  );

  // createGoal 方法
  const createGoalFn = useCallback(
    async (input: GoalInsert): Promise<Goal> => {
      if (!isLoggedIn) {
        throw new Error("Cannot create goal: user not logged in");
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Creating goal", {
          title: input.title,
          domain_id: input.domain_id,
          horizon: input.horizon,
        });
      }

      const { createGoal } = await import("@/lib/supabase/goals");
      const result = await createGoal(input);

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Goal created", { id: result.id });
      }

      return result;
    },
    [isLoggedIn],
  );

  // createAction 方法
  const createActionFn = useCallback(
    async (input: ActionInsert): Promise<Action> => {
      if (!isLoggedIn) {
        throw new Error("Cannot create action: user not logged in");
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Creating action", {
          title: input.title,
          goal_id: input.goal_id,
          frequency: input.frequency,
        });
      }

      const { createAction } = await import("@/lib/supabase/actions");
      const result = await createAction(input);

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Action created", { id: result.id });
      }

      return result;
    },
    [isLoggedIn],
  );

  // upsertDailyCheckIn：保存每日签到
  const upsertDailyCheckIn = useCallback(
    async (
      dailyLog: DailyLog,
      records: ActionRecord[],
    ): Promise<DailyLog> => {
      if (!isLoggedIn) {
        throw new Error("Cannot save check-in: user not logged in");
      }

      // dev 模式下输出详细 payload 用于调试
      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Saving check-in", {
          date: dailyLog.date,
          recordsCount: records.length,
          recordActionIds: records.map((r) => r.actionId),
        });
      }

      const [{ upsertDailyLog }, { upsertActionRecordsForDate }] =
        await Promise.all([
          import("@/lib/supabase/daily-logs"),
          import("@/lib/supabase/action-records"),
        ]);

      // 1. 先 upsert dailyLog，获得 dailyLog.id
      const savedLog = await upsertDailyLog(dailyLog);

      // 2. 再 upsert actionRecords
      const savedRecords = await upsertActionRecordsForDate(
        dailyLog.date,
        savedLog.id,
        records,
      );

      if (process.env.NODE_ENV === "development") {
        console.log("[GrowthLoop Cloud] Check-in saved", {
          dailyLogId: savedLog.id,
          savedRecordsCount: savedRecords.length,
        });
      }

      // 3. 刷新本地 state
      await refreshDailyData();

      return savedLog;
    },
    [isLoggedIn, refreshDailyData],
  );

  const hasCloudDomains = domains.length > 0;
  const hasCloudGoals = goals.length > 0;
  const hasCloudActions = actions.length > 0;

  return {
    domains,
    goals,
    actions,
    dailyLogs,
    actionRecords,
    weeklyReviews,
    hasCloudDomains,
    hasCloudGoals,
    hasCloudActions,
    isLoggedIn,
    loading,
    error,
    refresh,
    refreshDailyData,
    refreshWeeklyReviews,
    getCurrentWeekReview,
    upsertWeeklyReview: upsertWeeklyReviewFn,
    createGoal: createGoalFn,
    createAction: createActionFn,
    upsertDailyCheckIn,
  };
}