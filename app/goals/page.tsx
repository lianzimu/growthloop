/**
 * 目标页 - 展示用户设定的成长目标
 *
 * 结构：
 * - 本周主线（最高优先级行动）
 * - 成长领域（健康、认知、技能、财务）
 *
 * 当前为静态占位，实际目标数据尚未接入
 */
export default function GoalsPage() {
  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">目标管理</p>
        <h1 className="text-xl font-semibold mt-1">我的目标</h1>
      </section>

      {/* ===== 本周主线 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          本周主线
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无主线目标
        </p>
      </section>

      {/* ===== 四大成长领域 ===== */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          成长领域
        </h2>
        {["健康", "认知", "技能", "财务"].map((domain) => (
          <div
            key={domain}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900"
          >
            <p className="text-sm font-medium">{domain}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              暂无目标
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}