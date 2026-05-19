/**
 * 首页 - 每日一览 Dashboard
 *
 * 展示：问候语 + 今日重点行动 + 本周完成率 + 状态概览 + AI 建议
 * 均为静态占位数据，实际功能未接入
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* ===== 问候区 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1 className="text-xl font-semibold mt-1">今日概要</h1>
      </section>

      {/* ===== 今日重点行动（占位数据） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日重点
        </h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-3">
            {/* 空心圆圈 = 未完成 */}
            <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">完成项目骨架搭建</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                最低行动：搭建 Layout + 底部导航
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">完成 5 个页面路由</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                最低行动：创建占位页面
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 本周完成率（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周完成率
        </h2>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-3xl font-bold">--</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 pb-0.5">
            暂无数据
          </span>
        </div>
        {/* 进度条 */}
        <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-zinc-300 dark:bg-zinc-600 w-0" />
        </div>
      </section>

      {/* ===== 最近状态概览（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          最近 3 天状态
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无记录，开始你的第一次 Check-in
        </p>
      </section>

      {/* ===== AI 建议（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          AI 建议
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          完成 7 天记录后可生成 AI 建议
        </p>
      </section>
    </div>
  );
}