import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase Auth Session 刷新中间件
 *
 * 职责：
 * - 读取 request cookies 中的 Supabase session
 * - 如果 session 存在且即将过期，自动刷新
 * - 将更新后的 session 写回 response cookies
 * - 不做任何路由保护（当前阶段不强制登录）
 *
 * Matcher：
 * - 排除静态资源路径（_next/static、_next/image、favicon.ico、图片文件）
 * - 匹配所有其他路径
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // 触发 session 刷新 —— getUser() 会自动续期即将过期的 JWT
  // 当前阶段不检查用户是否存在（不强制登录）
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp (image files)
     * - site.webmanifest
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|site\\.webmanifest).*)",
  ],
};