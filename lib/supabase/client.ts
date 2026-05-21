"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase client
 *
 * 使用场景：
 * - 客户端组件（"use client" 的页面或 hook）
 * - 浏览器环境调用 Supabase API
 *
 * 安全说明：
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY 是可以暴露在浏览器中的公开 key
 *   （经由 RLS 控制访问权限）
 * - 绝不使用 service_role key，它拥有绕过 RLS 的完整数据库权限
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}