/**
 * Supabase domains API 封装
 *
 * 使用 browser Supabase client，通过 RLS 限制只能操作当前用户数据。
 * 未登录时抛出明确错误。
 */

import type { Domain } from "@/types";
import type { DomainRow } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { mapDomainRowToDomain, mapDomainToInsert } from "@/lib/supabase/mappers";

const DEFAULT_DOMAINS = [
  { name: "健康", sortOrder: 0 },
  { name: "认知", sortOrder: 1 },
  { name: "技能", sortOrder: 2 },
  { name: "财务", sortOrder: 3 },
];

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
 * 读取当前用户的所有 domains。
 */
export async function getDomains(): Promise<Domain[]> {
  const userId = await getUserId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch domains: ${error.message}`);
  }

  return (data as DomainRow[]).map(mapDomainRowToDomain);
}

/**
 * 创建 domain。
 */
export async function createDomain(input: {
  name: string;
  description?: string | null;
  sortOrder?: number;
}): Promise<Domain> {
  const userId = await getUserId();
  const supabase = createClient();

  const insert = mapDomainToInsert(
    input.name,
    userId,
    input.description ?? null,
    input.sortOrder,
  );

  const { data, error } = await supabase
    .from("domains")
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create domain: ${error.message}`);
  }

  return mapDomainRowToDomain(data as DomainRow);
}

/**
 * 更新 domain。
 */
export async function updateDomain(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<Domain> {
  const userId = await getUserId();
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("domains")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update domain: ${error.message}`);
  }

  return mapDomainRowToDomain(data as DomainRow);
}

/**
 * 删除 domain。
 */
export async function deleteDomain(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = createClient();

  const { error } = await supabase
    .from("domains")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete domain: ${error.message}`);
  }
}

/**
 * 确保当前用户有默认 domains。
 * 如果已有 domains，不重复创建。
 * 如果没有，则创建默认的 4 个：健康、认知、技能、财务。
 */
export async function ensureDefaultDomains(): Promise<Domain[]> {
  const userId = await getUserId();
  const supabase = createClient();

  // 检查是否已有 domains
  const { data: existing, error: fetchError } = await supabase
    .from("domains")
    .select("id")
    .eq("user_id", userId);

  if (fetchError) {
    throw new Error(`Failed to check existing domains: ${fetchError.message}`);
  }

  if (existing && existing.length > 0) {
    // 已有 domains，返回全部
    return getDomains();
  }

  // 创建默认 domains
  const inserts = DEFAULT_DOMAINS.map((d) => ({
    user_id: userId,
    name: d.name,
    sort_order: d.sortOrder,
  }));

  const { error: insertError } = await supabase
    .from("domains")
    .insert(inserts);

  if (insertError) {
    throw new Error(
      `Failed to create default domains: ${insertError.message}`,
    );
  }

  return getDomains();
}