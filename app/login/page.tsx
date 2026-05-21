"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 登录 / 注册页面
 *
 * 移动端优先，极简工具型扁平风
 * - 通过 mode 状态在"登录"和"注册"之间切换
 * - 仅支持邮箱 + 密码
 * - 登录成功跳转首页 /
 * - 注册成功后提示检查邮箱（如 Supabase 启用了 email confirmation）
 */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccessMsg(
            "注册成功！如果 Supabase 启用了邮箱确认，请检查收件箱确认邮箱后即可登录。也可以在下方切换到登录尝试。",
          );
          setPassword("");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          {mode === "login" ? "登录" : "注册"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "login"
            ? "使用邮箱和密码登录 GrowthLoop"
            : "创建一个新账号开始使用"}
        </p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 邮箱 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            邮箱
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
        </label>

        {/* 密码 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            密码
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="至少 6 位"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
        </label>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* 成功提示 */}
        {successMsg && (
          <p className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            {successMsg}
          </p>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading
            ? "处理中..."
            : mode === "login"
              ? "登录"
              : "注册"}
        </button>
      </form>

      {/* 切换模式 */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccessMsg("");
          }}
          className="text-sm text-zinc-500 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}