/**
 * 复盘页 - 每周数据回顾与反思
 *
 * 结构：
 * - 本周数据汇总（行动完成率、睡眠、精力、情绪等指标）
 * - AI 复盘（完成 7 天记录后自动生成）
 * - 用户自我反思
 *
 * 当前为静态占位，实际数据和 AI 生成逻辑未接入
 */
export default function ReviewPage() {
  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">每周复盘</p>
        <h1 className="text-xl font-semibold mt-1">周复盘</h1>
      </section>

      {/* ===== 本周数据汇总（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周数据
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {[
            { label: "行动完成率", value: "--" },
            { label: "标准完成", value: "--" },
            { label: "最低完成", value: "--" },
            { label: "失败", value: "--" },
            { label: "跳过", value: "--" },
            { label: "平均睡眠", value: "--h" },
            { label: "平均精力", value: "--" },
            { label: "平均情绪", value: "--" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              <p className="text-lg font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== AI 周复盘（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          AI 复盘
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          完成 7 天记录后可生成 AI 周复盘
        </p>
        <button
          disabled
          className="mt-4 w-full py-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed"
        >
          生成 AI 复盘
        </button>
      </section>

      {/* ===== 用户反思（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          我的反思
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无反思记录
        </p>
      </section>
    </div>
  );
}