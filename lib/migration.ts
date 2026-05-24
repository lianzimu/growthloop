/**
 * localStorage → Supabase 迁移工具
 *
 * Milestone 3 Step 6: 安全、手动触发的迁移。
 *
 * - 仅在用户已登录时可执行
 * - 迁移顺序：goals → actions → dailyLogs → actionRecords
 * - 本地 ID → 云端 UUID 通过 Map 逐层传递
 * - 单条失败不中断整体迁移，记录到 errors[]
 * - 不会自动迁移
 */

import type { Goal, Action, DailyLog, ActionRecord } from "@/types";
import type { GoalRow, ActionRow, DailyLogRow, ActionRecordRow } from "@/types/supabase";
import {
  getLocalGoals,
  getLocalActions,
  getLocalDailyLogs,
  getLocalActionRecords,
  clearAllLocalData,
} from "@/lib/local-storage";
import {
  mapGoalToInsert,
  mapActionToInsert,
  mapDailyLogToInsert,
  mapActionRecordToInsert,
  mapGoalRowToGoal,
  mapActionRowToAction,
  mapDailyLogRowToDailyLog,
  mapActionRecordRowToActionRecord,
} from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/client";

// ==================== 类型 ====================

export interface MigrationSummary {
  /** 本地 goals 数量 */
  localGoalsCount: number;
  /** 本地 actions 数量 */
  localActionsCount: number;
  /** 本地 dailyLogs 数量 */
  localDailyLogsCount: number;
  /** 本地 actionRecords 数量 */
  localActionRecordsCount: number;
  /** 是否有任何本地数据 */
  hasLocalData: boolean;
}

export interface MigrationError {
  /** 数据类型 */
  type: "goal" | "action" | "dailyLog" | "actionRecord";
  /** 本地 ID（如有） */
  localId?: string;
  /** 错误信息 */
  message: string;
}

export interface MigrationReport {
  /** 成功迁移的 goals 数量 */
  migratedGoalsCount: number;
  /** 成功迁移的 actions 数量 */
  migratedActionsCount: number;
  /** 成功迁移的 dailyLogs 数量 */
  migratedDailyLogsCount: number;
  /** 成功迁移的 actionRecords 数量 */
  migratedActionRecordsCount: number;
  /** 跳过的数量（如 actionId 无法映射） */
  skippedCount: number;
  /** 错误列表 */
  errors: MigrationError[];
  /** 迁移是否全部成功（无 errors） */
  success: boolean;
}

// ==================== 辅助函数 ====================

/**
 * 获取当前登录用户 ID。
 * 未登录时抛出错误。
 */
async function getUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("用户未登录，请先登录后再迁移数据。");
  }
  return user.id;
}

/**
 * UUID 格式校验（宽松版，接受任何 hex UUID）。
 */
function isUuidLike(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ==================== 摘要 ====================

/**
 * 获取本地数据迁移摘要。
 * 可在登录前调用，仅读取 localStorage。
 */
export function getLocalMigrationSummary(): MigrationSummary {
  const goals = getLocalGoals();
  const actions = getLocalActions();
  const dailyLogs = getLocalDailyLogs();
  const actionRecords = getLocalActionRecords();

  return {
    localGoalsCount: goals.length,
    localActionsCount: actions.length,
    localDailyLogsCount: dailyLogs.length,
    localActionRecordsCount: actionRecords.length,
    hasLocalData:
      goals.length > 0 ||
      actions.length > 0 ||
      dailyLogs.length > 0 ||
      actionRecords.length > 0,
  };
}

// ==================== 迁移 ====================

/**
 * 将本地 localStorage 数据迁移到 Supabase。
 *
 * 迁移顺序：
 *   A. goals → 建立 localGoalId → cloudGoalId 映射
 *   B. actions → 建立 localActionId → cloudActionId 映射，同时重映射 goalId
 *   C. dailyLogs → 建立 date → cloudDailyLogId 映射
 *   D. actionRecords → 重映射 actionId 和 dailyLogId
 *
 * 单条失败不中断整体，记录到 errors[]。
 *
 * @returns MigrationReport
 */
export async function migrateLocalDataToSupabase(): Promise<MigrationReport> {
  const errors: MigrationError[] = [];
  let skippedCount = 0;

  let migratedGoalsCount = 0;
  let migratedActionsCount = 0;
  let migratedDailyLogsCount = 0;
  let migratedActionRecordsCount = 0;

  // ID 映射
  const goalIdMap = new Map<string, string>(); // localGoalId → cloudGoalId
  const actionIdMap = new Map<string, string>(); // localActionId → cloudActionId
  const dailyLogIdMap = new Map<string, string>(); // date → cloudDailyLogId

  try {
    // 验证登录
    const userId = await getUserId();
    const supabase = createClient();

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Starting migration for user:", userId);
    }

    // ==================== A0. 迁移 domains（从 goals 提取） ====================
    const localGoals = getLocalGoals();
    // 收集所有唯一的 domainId + domainName
    // localStorage 中不存储 Domain 表，需从 mock-data 的 domains 数组获取映射
    const { domains: mockDomains } = await import("@/lib/mock-data");
    const domainIdMap = new Map<string, string>(); // localDomainId → cloudDomainId

    const uniqueDomainIds = [...new Set(localGoals.map((g) => g.domainId))];

    for (const localDomainId of uniqueDomainIds) {
      const mockDomain = mockDomains.find((d) => d.id === localDomainId);
      const domainName = mockDomain?.name ?? localDomainId;
      const domainDescription = mockDomain?.description ?? null;

      try {
        // 先查是否已存在同名 domain
        const { data: existing } = await supabase
          .from("domains")
          .select("id")
          .eq("user_id", userId)
          .eq("name", domainName)
          .maybeSingle();

        if (existing) {
          domainIdMap.set(localDomainId, existing.id);
        } else {
          // 不存在则创建
          const { data: created, error } = await supabase
            .from("domains")
            .insert({
              user_id: userId,
              name: domainName,
              description: domainDescription,
              sort_order: mockDomain?.sortOrder ?? 0,
            })
            .select("id")
            .single();

          if (error) {
            errors.push({
              type: "goal",
              message: `Failed to create domain "${domainName}": ${error.message}`,
            });
          } else {
            domainIdMap.set(localDomainId, created.id);
          }
        }
      } catch (err) {
        errors.push({
          type: "goal",
          message: `Failed to create domain "${domainName}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Domains done:", {
        uniqueCount: uniqueDomainIds.length,
        mappedCount: domainIdMap.size,
        errors: errors.filter(
          (e) =>
            e.type === "goal" &&
            e.message.startsWith("Failed to create domain"),
        ).length,
      });
    }

    // ==================== A. 迁移 goals ====================
    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Migrating goals:", localGoals.length);
    }

    for (const goal of localGoals) {
      try {
        const cloudDomainId = domainIdMap.get(goal.domainId);

        if (!cloudDomainId) {
          // 如果没有映射到 cloudDomainId，则 domain_id 不合法，跳过此 goal
          errors.push({
            type: "goal",
            localId: goal.id,
            message: `Skipped goal "${goal.title}": domainId "${goal.domainId}" could not be mapped to a cloud domain UUID.`,
          });
          skippedCount++;
          continue;
        }

        const insert = mapGoalToInsert(goal, userId);
        // 覆写 domain_id 为云端 UUID
        insert.domain_id = cloudDomainId;

        const { data, error } = await supabase
          .from("goals")
          .insert(insert)
          .select()
          .single();

        if (error) {
          errors.push({
            type: "goal",
            localId: goal.id,
            message: `Failed to migrate goal "${goal.title}": ${error.message}`,
          });
        } else {
          const cloudGoal = mapGoalRowToGoal(data as GoalRow);
          goalIdMap.set(goal.id, cloudGoal.id);
          migratedGoalsCount++;
        }
      } catch (err) {
        errors.push({
          type: "goal",
          localId: goal.id,
          message: `Failed to migrate goal "${goal.title}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Goals done:", {
        migrated: migratedGoalsCount,
        skipped: skippedCount,
        errors: errors.filter((e) => e.type === "goal").length,
        mapSize: goalIdMap.size,
      });
    }

    // ==================== B. 迁移 actions ====================
    const localActions = getLocalActions();

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Migrating actions:", localActions.length);
    }

    for (const action of localActions) {
      try {
        // 重映射 goalId：如果本地 goalId 有映射，替换为 cloud goalId
        const cloudGoalId = goalIdMap.get(action.goalId);

        // 构建 insert，手动处理 goalId 映射
        const insert = mapActionToInsert(action, userId);
        if (cloudGoalId) {
          insert.goal_id = cloudGoalId;
        } else {
          // 如果 goalId 无法映射且不是 UUID，记录警告但继续
          // goal_id 在 schema 中引用 goals(id)，必须是有效的 UUID
          // 如果映射不到且不是有效 UUID，将跳过
          if (!isUuidLike(action.goalId)) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[Migration] Action "${action.title}" has non-UUID goalId "${action.goalId}" and no mapping found, skipping goal_id.`,
              );
            }
            // 设置为 null：goal_id 在 schema 中可为 NULL（如果允许的话），但 schema 中 NOT NULL
            // 实际看 schema 中 goal_id UUID NOT NULL REFERENCES goals(id)
            // 所以如果映射不到且不是 UUID，跳过这条 action
            errors.push({
              type: "action",
              localId: action.id,
              message: `Failed to migrate action "${action.title}": goal_id "${action.goalId}" is not a valid UUID and no cloud mapping found.`,
            });
            skippedCount++;
            continue;
          }
        }

        const { data, error } = await supabase
          .from("actions")
          .insert(insert)
          .select()
          .single();

        if (error) {
          errors.push({
            type: "action",
            localId: action.id,
            message: `Failed to migrate action "${action.title}": ${error.message}`,
          });
        } else {
          const cloudAction = mapActionRowToAction(data as ActionRow);
          actionIdMap.set(action.id, cloudAction.id);
          migratedActionsCount++;
        }
      } catch (err) {
        errors.push({
          type: "action",
          localId: action.id,
          message: `Failed to migrate action "${action.title}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Actions done:", {
        migrated: migratedActionsCount,
        skipped: skippedCount,
        errors: errors.filter((e) => e.type === "action").length,
        mapSize: actionIdMap.size,
      });
    }

    // ==================== C. 迁移 dailyLogs ====================
    const localDailyLogs = getLocalDailyLogs();

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Migrating dailyLogs:", localDailyLogs.length);
    }

    for (const log of localDailyLogs) {
      try {
        const insert = mapDailyLogToInsert(log, userId);
        const { data, error } = await supabase
          .from("daily_logs")
          .upsert(insert, {
            onConflict: "user_id,date",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          errors.push({
            type: "dailyLog",
            localId: log.id,
            message: `Failed to migrate dailyLog for date "${log.date}": ${error.message}`,
          });
        } else {
          const cloudLog = mapDailyLogRowToDailyLog(data as DailyLogRow);
          dailyLogIdMap.set(log.date, cloudLog.id);
          migratedDailyLogsCount++;
        }
      } catch (err) {
        errors.push({
          type: "dailyLog",
          localId: log.id,
          message: `Failed to migrate dailyLog for date "${log.date}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] DailyLogs done:", {
        migrated: migratedDailyLogsCount,
        errors: errors.filter((e) => e.type === "dailyLog").length,
        mapSize: dailyLogIdMap.size,
      });
    }

    // ==================== D. 迁移 actionRecords ====================
    const localActionRecords = getLocalActionRecords();

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] Migrating actionRecords:", localActionRecords.length);
    }

    for (const record of localActionRecords) {
      try {
        // 重映射 actionId
        const cloudActionId = actionIdMap.get(record.actionId);
        if (!cloudActionId) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[Migration] Skipping actionRecord: no cloud action mapping for local actionId "${record.actionId}"`,
            );
          }
          skippedCount++;
          continue;
        }

        // 重映射 dailyLogId（按 date 查找）
        const cloudDailyLogId = dailyLogIdMap.get(record.date);

        // 构建 insert
        const insert = mapActionRecordToInsert(record, userId, cloudDailyLogId ?? undefined);
        // 覆写 action_id 为云端 UUID
        insert.action_id = cloudActionId;
        // 如果 daily_log_id 未映射到，允许 null
        if (!cloudDailyLogId) {
          insert.daily_log_id = null;
        }

        const { error } = await supabase
          .from("action_records")
          .upsert(insert, {
            onConflict: "user_id,date,action_id",
            ignoreDuplicates: false,
          })
          .select();

        if (error) {
          errors.push({
            type: "actionRecord",
            localId: record.id,
            message: `Failed to migrate actionRecord for actionId "${record.actionId}" on date "${record.date}": ${error.message}`,
          });
        } else {
          migratedActionRecordsCount++;
        }
      } catch (err) {
        errors.push({
          type: "actionRecord",
          localId: record.id,
          message: `Failed to migrate actionRecord: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Migration] ActionRecords done:", {
        migrated: migratedActionRecordsCount,
        skipped: skippedCount,
        errors: errors.filter((e) => e.type === "actionRecord").length,
      });
      console.log("[Migration] Migration complete:", {
        goals: migratedGoalsCount,
        actions: migratedActionsCount,
        dailyLogs: migratedDailyLogsCount,
        actionRecords: migratedActionRecordsCount,
        skipped: skippedCount,
        totalErrors: errors.length,
      });
    }
  } catch (err) {
    // 顶层错误（如未登录）
    errors.push({
      type: "goal",
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    migratedGoalsCount,
    migratedActionsCount,
    migratedDailyLogsCount,
    migratedActionRecordsCount,
    skippedCount,
    errors,
    success: errors.length === 0,
  };
}

// ==================== 清空本地数据 ====================

/**
 * 清空所有 GrowthLoop 本地 localStorage 数据。
 *
 * 建议在迁移成功且用户确认后调用。
 * 清空后触发 growthloop:data-updated 事件，页面会自动刷新。
 */
export function clearLocalDataAfterMigration(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Migration] Clearing all local data...");
  }
  clearAllLocalData();
  if (process.env.NODE_ENV === "development") {
    console.log("[Migration] Local data cleared.");
  }
}