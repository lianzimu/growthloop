/**
 * GrowthLoop 云端数据 Hook
 *
 * Milestone 3 Step 4.1: 修复云端写入路径。
 *
 * - 已登录时：domains/goals/actions 仅使用 Supabase 数据
 * - 未登录时：hook 返回空数据，页面 fallback 到 localStorage/mock
 * - 暴露 createGoal/createAction/refresh 供页面调用
 * - 登录后自动调用 ensureDefaultDomains
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Domain, Goal, Action } from "@/types";
import type { GoalInsert, ActionInsert } from "@/types/supabase";

// ==================== 类型 ====================
export interface UseCloudDataResult {
  /** Supabase 返回的 domains */
  domains: Domain[];
  /** Supabase 返回的 goals */
  goals: Goal[];
  /** Supabase 返回的 actions */
  actions: Action[];
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
  /** 刷新云端数据（创建/更新后调用） */
  refresh: () => Promise<void>;
  /** 创建 goal（仅已登录时可用） */
  createGoal: (input: GoalInsert) => Promise<Goal>;
  /** 创建 action（仅已登录时可用） */
  createAction: (input: ActionInsert) => Promise<Action>;
}

// ==================== Hook ====================
export function useGrowthLoopCloudData(): UseCloudDataResult {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
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

  // 加载云端数据（仅已登录时）
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

      return { domains: domainsData, goals: goalsData, actions: actionsData, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load cloud data";
      return { domains: [], goals: [], actions: [], error: msg };
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

        // 加载全量数据
        const result = await loadCloudData();

        if (!cancelled) {
          setDomains(result.domains);
          setGoals(result.goals);
          setActions(result.actions);
          setError(result.error);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to init cloud data";
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
  }, [isLoggedIn, loadCloudData]);

  // refresh 方法：重新加载全量数据
  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    const result = await loadCloudData();
    setDomains(result.domains);
    setGoals(result.goals);
    setActions(result.actions);
    setError(result.error);
  }, [isLoggedIn, loadCloudData]);

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

  const hasCloudDomains = domains.length > 0;
  const hasCloudGoals = goals.length > 0;
  const hasCloudActions = actions.length > 0;

  return {
    domains,
    goals,
    actions,
    hasCloudDomains,
    hasCloudGoals,
    hasCloudActions,
    isLoggedIn,
    loading,
    error,
    refresh,
    createGoal: createGoalFn,
    createAction: createActionFn,
  };
}