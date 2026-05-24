/**
 * Supabase action_records API 封装
 *
 * 使用 browser Supabase client，通过 RLS 限制只能操作当前用户数据。
 * 未登录时抛出明确错误。
 */

import type { ActionRecord } from "@/types";
import type { ActionRecordRow } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import {
  mapActionRecordRowToActionRecord,
  mapActionRecordToInsert,
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
 * 读取当前用户的所有 action_records。
 */
export async function getActionRecords(): Promise<ActionRecord[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_records")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch action records: ${error.message}`);
  }

  return (data as ActionRecordRow[]).map(mapActionRecordRowToActionRecord);
}

/**
 * 按日期读取 action_records。
 */
export async function getActionRecordsByDate(
  date: string,
): Promise<ActionRecord[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_records")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) {
    throw new Error(
      `Failed to fetch action records by date: ${error.message}`,
    );
  }

  return (data as ActionRecordRow[]).map(mapActionRecordRowToActionRecord);
}

/**
 * 按日期范围读取 action_records。
 */
export async function getActionRecordsByDateRange(
  startDate: string,
  endDate: string,
): Promise<ActionRecord[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_records")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch action records by date range: ${error.message}`,
    );
  }

  return (data as ActionRecordRow[]).map(mapActionRecordRowToActionRecord);
}

/**
 * 批量 upsert 某一天的 action_records。
 *
 * 逻辑：
 * - 使用唯一约束 user_id + date + action_id 保证同一天同一个 action 只有一条记录
 * - 每条记录带 user_id、date、daily_log_id、action_id、status、note
 * - 先删除该日期该用户的所有旧记录，再批量插入新记录
 *   这样能处理用户删掉某个 action 后不再提交该 action 的情况
 *
 * 返回最新记录的数组。
 */
export async function upsertActionRecordsForDate(
  date: string,
  dailyLogId: string,
  records: ActionRecord[],
): Promise<ActionRecord[]> {
  const userId = await getUserId();
  const supabase = createClient();

  if (records.length === 0) {
    // 无记录时，删除该日期所有旧记录
    await supabase
      .from("action_records")
      .delete()
      .eq("user_id", userId)
      .eq("date", date);

    return [];
  }

  // 使用 upsert 确保同一天同一个 actionId 只有一条记录
  const inserts = records.map((record) =>
    mapActionRecordToInsert(record, userId, dailyLogId),
  );

  const { data, error } = await supabase
    .from("action_records")
    .upsert(inserts, {
      onConflict: "user_id,date,action_id",
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    throw new Error(
      `Failed to upsert action records: ${error.message}`,
    );
  }

  return (data as ActionRecordRow[]).map(mapActionRecordRowToActionRecord);
}

/**
 * 删除某日期的所有 action_records。
 */
export async function deleteActionRecordsByDate(
  date: string,
): Promise<void> {
  const userId = await getUserId();
  const supabase = createClient();

  const { error } = await supabase
    .from("action_records")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);

  if (error) {
    throw new Error(
      `Failed to delete action records by date: ${error.message}`,
    );
  }
}