/**
 * Coach 页 - AI 驱动的个人教练
 *
 * 结构：
 * - 快速提问（预设问题模板）
 * - 对话记录（历史对话展示）
 * - 输入框（自由提问，未上线）
 *
 * 当前为静态占位，AI 对话和预设提问功能未接入
 */
export default function CoachPage() {
  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">AI 助手</p>
        <h1 className="text-xl font-semibold mt-1">AI Coach</h1>
      </section>

      {/* ===== 快速提问（预设问题，点击后发起对话） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          快速提问
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "帮我拆解这个目标",
            "帮我分析最近为什么执行失败",
            "帮我生成下周计划",
            "帮我降低目标难度",
            "帮我判断目标是不是太多",
            "帮我做一次周复盘",
          ].map((question) => (
            <button
              key={question}
              disabled
              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 cursor-not-allowed"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 对话记录（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          对话记录
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无对话，完成目标创建和记录后可向 AI Coach 提问
        </p>
      </section>

      {/* ===== 自由提问输入框（未上线） ===== */}
      <div className="flex gap-2">
        <input
          type="text"
          disabled
          placeholder="输入你的问题..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-400 dark:text-zinc-500 placeholder-zinc-300 dark:placeholder-zinc-600 cursor-not-allowed"
        />
        <button
          disabled
          className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  );
}