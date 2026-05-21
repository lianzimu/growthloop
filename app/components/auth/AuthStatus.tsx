"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Auth 状态指示器
 *
 * - 未登录：显示"登录"链接
 * - 已登录：显示用户邮箱 + "退出"按钮
 * - 退出后跳转到 /login
 *
 * 不依赖全局 context，自包含
 */
export function AuthStatus() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // 读取当前 session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  // 加载中，不渲染任何内容
  if (user === undefined) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        退出
      </button>
    </div>
  );
}