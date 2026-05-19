"use client";

/**
 * GrowthLoop 本地数据响应式 Hook
 *
 * 负责：
 * 1. 首次加载时读取 localStorage 中的 dailyLogs 和 actionRecords
 * 2. 监听 growthloop:data-updated / storage / focus 事件自动刷新
 * 3. 暴露 refresh() 方法供外部主动刷新
 */

import { useCallback, useEffect, useState } from "react";
import type { DailyLog, ActionRecord } from "@/types";
import {
  getLocalDailyLogs,
  getLocalActionRecords,
  DATA_UPDATED_EVENT,
} from "@/lib/local-storage";

export interface GrowthLoopLocalData {
  dailyLogs: DailyLog[];
  actionRecords: ActionRecord[];
  hasLocalDailyLogs: boolean;
  hasLocalActionRecords: boolean;
  refresh: () => void;
}

export function useGrowthLoopLocalData(): GrowthLoopLocalData {
  // 使用 lazy initializer 初始化，避免 useEffect 同步 setState
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(
    () => getLocalDailyLogs(),
  );
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>(
    () => getLocalActionRecords(),
  );

  // 统一的刷新函数
  const refresh = useCallback(() => {
    setDailyLogs(getLocalDailyLogs());
    setActionRecords(getLocalActionRecords());
  }, []);

  useEffect(() => {
    // 监听自定义事件: growthloop:data-updated
    const onDataUpdated = () => {
      refresh();
    };

    // 监听 storage 事件（其他 tab 写入时触发）
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "growthloop_daily_logs" ||
        e.key === "growthloop_action_records"
      ) {
        refresh();
      }
    };

    // 监听 focus 事件（切换 tab 回来）
    const onFocus = () => {
      refresh();
    };

    window.addEventListener(DATA_UPDATED_EVENT, onDataUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, onDataUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const hasLocalDailyLogs = dailyLogs.length > 0;
  const hasLocalActionRecords = actionRecords.length > 0;

  return {
    dailyLogs,
    actionRecords,
    hasLocalDailyLogs,
    hasLocalActionRecords,
    refresh,
  };
}