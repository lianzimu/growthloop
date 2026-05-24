/**
 * Supabase daily_logs API 封装
 *
 * 使用 browser Supabase client，通过 RLS 限制只能操作当前用户数据。
 * 未登录时抛出明确错误。
 */

import type { DailyLog } from "@/types";
import type { DailyLogRow } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import {
  mapDailyLogRowToDailyLog,
  mapDailyLogToInsert,
} from "@/lib/supabase/mappers";

/**
 * 获取当前登录用户，未登录时抛出错误。
 */
async function getUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not logged in");
  }
  return user.id;
}

/**
 * 读取当前用户的所有 daily_logs。
 */
export async function getDailyLogs(): Promise<DailyLog[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch daily logs: ${error.message}`);
  }

  return (data as DailyLogRow[]).map(mapDailyLogRowToDailyLog);
}

/**
 * 按日期范围读取 daily_logs。
 */
export async function getDailyLogsByDateRange(
  startDate: string,
  endDate: string,
): Promise<DailyLog[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch daily logs by date range: ${error.message}`,
    );
  }

  return (data as DailyLogRow[]).map(mapDailyLogRowToDailyLog);
}

/**
 * 按日期读取 single daily_log。
 * 返回 null 表示该日期无记录。
 */
export async function getDailyLogByDate(
  date: string,
): Promise<DailyLog | null> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch daily log by date: ${error.message}`);
  }

  if (!data) return null;

  return mapDailyLogRowToDailyLog(data as DailyLogRow);
}

/**
 * Upsert daily_log。
 *
 * 使用唯一约束 user_id + date：
 * - 该日期无记录 → INSERT
 * - 该日期已有记录 → UPDATE
 *
 * 返回最新的完整记录。
 */
export async function upsertDailyLog(log: DailyLog): Promise<DailyLog> {
  const userId = await getUserId();
  const supabase = createClient();

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
    throw new Error(`Failed to upsert daily log: ${error.message}`);
  }

  return mapDailyLogRowToDailyLog(data as DailyLogRow);
}

/**
 * 删除 daily_log。
 */
export async function deleteDailyLog(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = createClient();

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete daily log: ${error.message}`);
  }
}