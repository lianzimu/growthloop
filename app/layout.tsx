import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";
import { AuthStatus } from "./components/auth/AuthStatus";

// ===== Google Fonts 配置 =====
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ===== SEO 元数据 =====
export const metadata: Metadata = {
  title: "GrowthLoop",
  description: "AI 驱动的个人长期规划与反馈闭环系统",
};

// ===== 移动端视口配置 =====
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 适配 iPhone 刘海屏
};

/**
 * 根布局 - 移动端优先
 *
 * 结构：
 *   header（顶部导航栏，h-12）
 *   main（内容区，flex-1 + 底部留白 pb-24 让出导航空间）
 *   BottomNav（固定在底部的 5 Tab 导航）
 *
 * 内容最大宽度 max-w-lg（512px），适配手机屏幕
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex flex-col min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* ===== 顶部导航栏 ===== */}
        <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              GrowthLoop
            </span>
            <AuthStatus />
          </div>
        </header>

        {/* ===== 页面内容区 ===== */}
        <main className="flex-1 overflow-auto">
          {/* max-w-lg 限制宽度，模拟移动端卡片式布局 */}
          <div className="max-w-lg mx-auto w-full px-4 py-6 pb-24">
            {children}
          </div>
        </main>

        {/* ===== 底部导航（固定在底部，需要 "use client"） ===== */}
        <BottomNav />
      </body>
    </html>
  );
}