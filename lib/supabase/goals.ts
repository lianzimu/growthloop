/**
 * Supabase goals API 封装
 *
 * 使用 browser Supabase client，通过 RLS 限制只能操作当前用户数据。
 * insert/update/select/delete 都必须只操作当前用户数据。
 */

import type { Goal } from "@/types";
import type { GoalRow, GoalInsert } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { mapGoalRowToGoal } from "@/lib/supabase/mappers";

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
 * 读取当前用户的所有 goals。
 */
export async function getGoals(): Promise<Goal[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return (data as GoalRow[]).map(mapGoalRowToGoal);
}

/**
 * 创建 goal。
 */
export async function createGoal(input: GoalInsert): Promise<Goal> {
  const userId = await getUserId();
  const supabase = createClient();

  const insert = { ...input, user_id: userId };

  const { data, error } = await supabase
    .from("goals")
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return mapGoalRowToGoal(data as GoalRow);
}

/**
 * 更新 goal。
 */
export async function updateGoal(
  id: string,
  input: Partial<GoalInsert>,
): Promise<Goal> {
  const userId = await getUserId();
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  // Only include fields that are present
  for (const [key, value] of Object.entries(input)) {
    if (key !== "user_id") {
      updates[key] = value;
    }
  }

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return mapGoalRowToGoal(data as GoalRow);
}

/**
 * 删除 goal。
 */
export async function deleteGoal(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = createClient();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}