/**
 * Weekly Review AI API Route
 *
 * POST /api/ai/weekly-review
 *
 * 接收前端传入的 WeeklyReviewAIRequest，调用 DeepSeek 生成周复盘草稿。
 * 不读取 Supabase，不保存结果到数据库——本阶段只生成草稿。
 */

import { NextResponse } from "next/server";
import type { WeeklyReviewAIRequest, WeeklyReviewAIResponse } from "@/types/ai";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { buildWeeklyReviewMessages } from "@/lib/ai/prompts/weekly-review";

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    let body: WeeklyReviewAIRequest;
    try {
      body = (await request.json()) as WeeklyReviewAIRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    // 2. 基本校验
    if (
      !body ||
      (!body.dailyLogs?.length && !body.actionRecords?.length)
    ) {
      return NextResponse.json(
        { error: "暂无足够数据生成复盘" },
        { status: 400 },
      );
    }

    // 3. 构造 messages
    const messages = buildWeeklyReviewMessages(body);

    // 4. 调用 DeepSeek（jsonMode: true）
    const rawContent = await callDeepSeek({
      messages,
      jsonMode: true,
      maxTokens: 1200,
      temperature: 0.3,
    });

    // 5. 解析 JSON 并校验
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI 返回的不是合法 JSON", raw: rawContent.slice(0, 500) },
        { status: 500 },
      );
    }

    // 6. 校验必填字段
    const result = parsed as WeeklyReviewAIResponse;
    if (
      typeof result.summary !== "string" ||
      !Array.isArray(result.progress) ||
      !Array.isArray(result.blockers) ||
      !Array.isArray(result.possibleReasons) ||
      typeof result.loadJudgement !== "string" ||
      !Array.isArray(result.nextWeekSuggestions) ||
      !Array.isArray(result.keepActions) ||
      !Array.isArray(result.reduceActions) ||
      !Array.isArray(result.pauseActions)
    ) {
      return NextResponse.json(
        {
          error: "AI 返回的 JSON 字段不完整",
          partial: result,
        },
        { status: 500 },
      );
    }

    // 7. 返回
    return NextResponse.json(result);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[WeeklyReview API] Error:", err instanceof Error ? err.message : "Unknown error");
    }
    return NextResponse.json(
      { error: "AI 复盘生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}