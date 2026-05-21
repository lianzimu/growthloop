/**
 * Supabase actions API 封装
 *
 * 使用 browser Supabase client，通过 RLS 限制只能操作当前用户数据。
 * insert/update/select/delete 都必须只操作当前用户数据。
 */

import type { Action } from "@/types";
import type { ActionRow, ActionInsert } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { mapActionRowToAction } from "@/lib/supabase/mappers";

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
 * 读取当前用户的所有 actions。
 */
export async function getActions(): Promise<Action[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch actions: ${error.message}`);
  }

  return (data as ActionRow[]).map(mapActionRowToAction);
}

/**
 * 创建 action。
 */
export async function createAction(input: ActionInsert): Promise<Action> {
  const userId = await getUserId();
  const supabase = createClient();

  const insert = { ...input, user_id: userId };

  const { data, error } = await supabase
    .from("actions")
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create action: ${error.message}`);
  }

  return mapActionRowToAction(data as ActionRow);
}

/**
 * 更新 action。
 */
export async function updateAction(
  id: string,
  input: Partial<ActionInsert>,
): Promise<Action> {
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
    .from("actions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update action: ${error.message}`);
  }

  return mapActionRowToAction(data as ActionRow);
}

/**
 * 删除 action。
 */
export async function deleteAction(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = createClient();

  const { error } = await supabase
    .from("actions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete action: ${error.message}`);
  }
}