/**
 * Weekly Review Prompt 构造器
 *
 * 将 prompts/weekly-reviewer.md 的核心规则编码为 system prompt，
 * 并结合实际数据构造 user prompt。
 */

import type { WeeklyReviewAIRequest } from "@/types/ai";

// ==================== System Prompt ====================

/** 内嵌 prompts/weekly-reviewer.md 的核心规则 */
const SYSTEM_PROMPT = `你是 GrowthLoop 的 AI 周复盘助手。

你的任务是根据用户的目标、行动、每日记录和行动完成情况，生成一份具体、克制、可执行的周复盘。

你不是心理医生，不进行医学诊断。
你不是鸡汤型教练，不输出空泛鼓励。
你需要帮助用户发现执行问题，并提出下周调整建议。

## 分析重点

- 本周主要完成了什么
- 哪些行动完成率较高
- 哪些行动持续失败
- 是否存在目标过多
- 是否存在行动设计过大
- 睡眠、精力、情绪、压力是否影响执行
- 哪些行动应该保留
- 哪些行动应该降低难度
- 哪些行动应该暂停
- 下周应该聚焦什么

## 输出原则

- 具体：引用实际数据
- 克制：不夸大、不包装
- 可执行：每条建议必须是用户可以明天开始做的
- 不鸡汤：不输出空泛鼓励
- 不诊断：不进行医学或心理诊断
- 不增加额外压力
- 优先帮助用户收敛目标

## 输出格式

你必须只输出 JSON，不要输出任何 markdown 或其他文本。
JSON 必须严格符合以下 TypeScript 类型：

\`\`\`ts
interface WeeklyReviewAIResponse {
  summary: string;
  progress: string[];
  blockers: string[];
  possibleReasons: string[];
  loadJudgement: string;
  nextWeekSuggestions: string[];
  keepActions: string[];
  reduceActions: string[];
  pauseActions: string[];
}
\`\`\`

不要添加多余字段。
不要使用 markdown 代码块包裹 JSON。
直接输出 JSON 对象。`;

// ==================== User Prompt 构造 ====================

/**
 * 构造 user prompt：将数据序列化为 JSON 嵌入
 *
 * 控制输入范围：
 * - 只传精简后的字段（不传完整对象）
 * - dailyLogs / actionRecords 只传最近 7 天
 */
export function buildWeeklyReviewUserPrompt(
  data: WeeklyReviewAIRequest,
): string {
  const { goals, actions, dailyLogs, actionRecords, weeklyStats } = data;

  // 按 action 汇总完成统计
  const byAction = new Map<
    string,
    {
      title: string;
      done: number;
      minimum_done: number;
      skipped: number;
      failed: number;
    }
  >();

  for (const r of actionRecords) {
    const action = actions.find((a) => a.id === r.actionId);
    const title = action?.title || "未知行动";
    if (!byAction.has(r.actionId)) {
      byAction.set(r.actionId, {
        title,
        done: 0,
        minimum_done: 0,
        skipped: 0,
        failed: 0,
      });
    }
    const entry = byAction.get(r.actionId)!;
    if (r.status === "done") entry.done++;
    else if (r.status === "minimum_done") entry.minimum_done++;
    else if (r.status === "skipped") entry.skipped++;
    else if (r.status === "failed") entry.failed++;
  }

  const input = {
    goals: goals.map((g) => ({
      title: g.title,
      domain: g.domainName || "未分类",
    })),
    actions: actions.map((a) => ({
      title: a.title,
      goal: a.goalTitle || "未关联目标",
    })),
    dailyLogs: dailyLogs.map((d) => ({
      date: d.date,
      sleepHours: d.sleepHours,
      energy: d.energyScore,
      mood: d.moodScore,
      stress: d.stressScore,
      note: d.note || "",
    })),
    actionRecordsSummary: Array.from(byAction.values()),
    weeklyStats,
  };

  return `请根据以下数据生成本周复盘：\n\n${JSON.stringify(input, null, 2)}`;
}

// ==================== Messages 构造 ====================

/**
 * 构造完整的 messages 数组，可直接传给 DeepSeek
 */
export function buildWeeklyReviewMessages(data: WeeklyReviewAIRequest) {
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildWeeklyReviewUserPrompt(data) },
  ];
}