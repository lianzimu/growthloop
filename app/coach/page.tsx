/**
 * AI Coach 页
 *
 * Milestone 2: 展示预设问题按钮和聊天占位区。
 * 当前阶段不接入 OpenAI API。
 */

export default function CoachPage() {
  const presetQuestions = [
    "帮我拆解这个目标",
    "帮我分析最近为什么执行失败",
    "帮我生成下周计划",
    "帮我降低目标难度",
    "帮我判断目标是不是太多",
    "帮我做一次周复盘",
  ];

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">智能分析</p>
        <h1 className="text-xl font-semibold mt-1">AI Coach</h1>
      </section>

      {/* ===== 预设问题 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          快速提问
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {presetQuestions.map((q) => (
            <button
              key={q}
              disabled
              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 对话区域（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 min-h-[200px] flex flex-col">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          对话
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            AI Coach 即将上线，当前阶段不接入 OpenAI API
          </p>
        </div>
      </section>

      {/* ===== 输入区（占位） ===== */}
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
        <div className="flex gap-2">
          <input
            disabled
            placeholder="输入你的问题..."
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 placeholder-zinc-400 dark:placeholder-zinc-500 cursor-not-allowed"
          />
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}