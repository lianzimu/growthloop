/**
 * 打卡页 - 每日记录
 *
 * 结构：
 * - 状态评分（睡眠、精力、情绪、压力）
 * - 今日行动完成情况
 * - 一句话记录
 *
 * 当前为静态占位，实际表单和提交逻辑未接入
 */
export default function CheckInPage() {
  return (
    <div className="space-y-6">
      {/* ===== 页面标题（带日期） ===== */}
      <section>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">每日记录</p>
        <h1 className="text-xl font-semibold mt-1">
          {new Date().toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
          })}
          {" "}Check-in
        </h1>
      </section>

      {/* ===== 状态评分（占位数据） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日状态
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {[
            { label: "睡眠", value: "--", unit: "小时" },
            { label: "精力", value: "--", unit: "/5" },
            { label: "情绪", value: "--", unit: "/5" },
            { label: "压力", value: "--", unit: "/5" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {item.value}
                <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500 ml-0.5">
                  {item.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 今日行动完成（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日行动
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无本周行动
        </p>
      </section>

      {/* ===== 一句话记录（占位） ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          今日记录
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
          暂无记录
        </p>
      </section>

      {/* ===== 提交按钮（未上线） ===== */}
      <button
        disabled
        className="w-full py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed"
      >
        保存记录（功能未上线）
      </button>
    </div>
  );
}