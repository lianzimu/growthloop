import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端 Supabase client
 *
 * 使用场景：
 * - Server Components（默认就是服务端组件）
 * - Route Handlers（app/api/...）
 * - Server Actions
 * - 任何需要访问 auth session 并在服务端调用 Supabase 的场景
 *
 * 安全说明：
 * - 运行在服务端，可以安全地访问 cookie session
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY 用于标识项目（授权由 RLS 控制）
 * - 绝不使用 service_role key
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 中无法 set cookies。
            // 如果项目后续添加了 Middleware 用于 session 刷新，
            // 这里抛出错误时可以安全忽略。
          }
        },
      },
    },
  );
}