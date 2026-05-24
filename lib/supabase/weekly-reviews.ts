/**
 * Weekly Reviews Supabase CRUD 封装
 *
 * 处理 weekly_reviews 表的增删改查。
 * 所有查询均强制带上 user_id 保证数据隔离。
 */

import { createClient } from "@/lib/supabase/client";
import {
  mapWeeklyReviewRowToWeeklyReview,
  mapWeeklyReviewToInsert,
} from "@/lib/supabase/mappers";
import type { WeeklyReview } from "@/types";
import type { WeeklyReviewRow } from "@/types/supabase";

function _getClient() {
  return createClient();
}

/**
 * 获取当前用户所有周复盘记录
 */
export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const supabase = _getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录，无法读取周复盘");

  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false });

  if (error) throw error;

  return (data as WeeklyReviewRow[]).map(mapWeeklyReviewRowToWeeklyReview);
}

/**
 * 根据 week_start 获取当前用户的单条周复盘记录
 */
export async function getWeeklyReviewByWeekStart(
  weekStart: string,
): Promise<WeeklyReview | null> {
  const supabase = _getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录，无法读取周复盘");

  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return mapWeeklyReviewRowToWeeklyReview(data as WeeklyReviewRow);
}

/**
 * Upsert 周复盘记录。
 * 利用 user_id + week_start 唯一约束，同一周最多保存一条记录。
 * 返回 upsert 后的最新记录。
 */
export async function upsertWeeklyReview(
  review: WeeklyReview,
): Promise<WeeklyReview> {
  const supabase = _getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录，无法保存周复盘");

  const insert = mapWeeklyReviewToInsert(review, user.id);

  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(insert, { onConflict: "user_id,week_start" })
    .select()
    .single();

  if (error) throw error;

  return mapWeeklyReviewRowToWeeklyReview(data as WeeklyReviewRow);
}

/**
 * 删除一条周复盘记录
 */
export async function deleteWeeklyReview(id: string): Promise<void> {
  const supabase = _getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录，无法删除周复盘");

  const { error } = await supabase
    .from("weekly_reviews")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}