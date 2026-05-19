/**
 * 目标页 - 展示用户设定的成长目标
 *
 * Milestone 2: 使用 mock 数据展示真实目标和领域信息。
 * 结构：
 * - 本周主线（最高优先级目标 + 本周聚焦行动）
 * - 成长领域（每领域下的目标数和行动数）
 */

import { domains, goals, actions } from "@/lib/mock-data";

export default function GoalsPage() {
  // 本周主线目标
  const mainFocusGoal = goals.find((g) => g.isMainFocus);

  // 按领域分组
  const domainGroups = domains
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((domain) => {
      const domainGoals = goals.filter((g) => g.domainId === domain.id);
      return {
        domain,
        goals: domainGoals,
        goalCount: domainGoals.length,
        actionCount: domainGoals.reduce(
          (sum, g) =>
            sum +
            actions.filter((a) => a.goalId === g.id && a.isActive).length,
          0,
        ),
      };
    });

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
        {mainFocusGoal ? (
          <div className="mt-3">
            <p className="text-sm font-medium">{mainFocusGoal.title}</p>
            {mainFocusGoal.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {mainFocusGoal.description}
              </p>
            )}
            {/* 本周聚焦行动 */}
            <div className="mt-3 space-y-2">
              {actions
                .filter(
                  (a) =>
                    a.goalId === mainFocusGoal.id &&
                    a.isActive &&
                    a.isWeeklyFocus,
                )
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-zinc-400 mt-0.5">•</span>
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300">
                        {action.title}
                      </p>
                      <p className="text-zinc-400 dark:text-zinc-500 mt-0.5">
                        最低：{action.minimumVersion}
                      </p>
                    </div>
                  </div>
                ))}
              {actions.filter(
                (a) =>
                  a.goalId === mainFocusGoal.id &&
                  a.isActive &&
                  a.isWeeklyFocus,
              ).length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  本周暂无聚焦行动
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3">
            暂无主线目标
          </p>
        )}
      </section>

      {/* ===== 辅助目标 ===== */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          辅助目标
        </h2>
        <div className="mt-3 space-y-3">
          {goals
            .filter((g) => !g.isMainFocus && g.status === "active")
            .map((goal) => {
              const goalActions = actions.filter(
                (a) => a.goalId === goal.id && a.isActive,
              );
              return (
                <div
                  key={goal.id}
                  className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <p className="text-sm font-medium">{goal.title}</p>
                  {goal.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {goal.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {goalActions.length} 个行动
                  </p>
                </div>
              );
            })}
          {goals.filter((g) => !g.isMainFocus && g.status === "active")
            .length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              暂无辅助目标
            </p>
          )}
        </div>
      </section>

      {/* ===== 四大成长领域 ===== */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          成长领域
        </h2>
        {domainGroups.map(({ domain, goalCount, actionCount }) => (
          <div
            key={domain.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900"
          >
            <p className="text-sm font-medium">{domain.name}</p>
            {domain.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {domain.description}
              </p>
            )}
            <div className="mt-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{goalCount} 个目标</span>
              <span>{actionCount} 个行动</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}