"use client"; // 需要客户端渲染，因为用了 usePathname()

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

// ===== SVG 图标 Props =====
interface IconProps {
  active: boolean; // 当前 Tab 是否选中，影响线条粗细
}

// ===== 首页图标 =====
const HomeIcon: ComponentType<IconProps> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
  </svg>
);

// ===== 目标图标（同心圆靶心） =====
const GoalsIcon: ComponentType<IconProps> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// ===== 打卡图标（日历） =====
const CheckInIcon: ComponentType<IconProps> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
  </svg>
);

// ===== 复盘图标（文档） =====
const ReviewIcon: ComponentType<IconProps> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h2" />
    <path d="M8 17h5" />
  </svg>
);

// ===== Coach 图标（带 AI 标识的人物） =====
const CoachIcon: ComponentType<IconProps> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    <path d="M16 14l2 2 4-4" />
  </svg>
);

// ===== 导航项数据结构 =====
interface NavItem {
  label: string;
  href: string;
  Icon: ComponentType<IconProps>;
}

// ===== 5 个 Tab 定义 =====
const navItems: NavItem[] = [
  { label: "Home", href: "/", Icon: HomeIcon },
  { label: "Goals", href: "/goals", Icon: GoalsIcon },
  { label: "Check-in", href: "/check-in", Icon: CheckInIcon },
  { label: "Review", href: "/review", Icon: ReviewIcon },
  { label: "Coach", href: "/coach", Icon: CoachIcon },
];

/**
 * 底部导航栏
 * - 固定在页面底部，z-50 确保在最上层
 * - 使用 CSS 变量适配 iPhone 安全区
 * - active 态判断：/ 用精确匹配，其他路由用 startsWith
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
      style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 px-2">
        {navItems.map(({ label, href, Icon }) => {
          // 首页用精确匹配，避免 / 匹配所有路径
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 h-full w-16 rounded-md transition-colors ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <Icon active={isActive} />
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}