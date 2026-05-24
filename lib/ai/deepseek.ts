/**
 * DeepSeek API 服务端调用工具
 *
 * 只能在服务端使用（API Route / Server Component）。
 * 不要在客户端组件中导入此文件——它依赖 process.env 且无 NEXT_PUBLIC_ 前缀。
 */

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Please add it to .env.local",
    );
  }
  return key;
}

export interface DeepSeekChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekCallOptions {
  /** 消息列表（system + user） */
  messages: DeepSeekChatMessage[];
  /** max_tokens，默认 1200 */
  maxTokens?: number;
  /** temperature，默认 0.3 */
  temperature?: number;
  /** 是否使用 JSON 模式 */
  jsonMode?: boolean;
}

/**
 * 调用 DeepSeek Chat Completions API
 *
 * 使用 OpenAI 兼容格式。
 * 错误时抛出包含 status 和 message 的 Error。
 */
export async function callDeepSeek(options: DeepSeekCallOptions): Promise<string> {
  const {
    messages,
    maxTokens = 1200,
    temperature = 0.3,
    jsonMode = false,
  } = options;

  const apiKey = getApiKey();
  const url = `${DEEPSEEK_BASE_URL}/chat/completions`;

  // 构造请求体
  const body: Record<string, unknown> = {
    model: DEEPSEEK_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
    // 关闭 thinking 模式，降低成本和输出不确定性
    thinking: { type: "disabled" },
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  // 调试日志（不输出 API key）
  if (process.env.NODE_ENV === "development") {
    console.log("[DeepSeek] Calling", {
      baseUrl: DEEPSEEK_BASE_URL,
      model: DEEPSEEK_MODEL,
      messageCount: messages.length,
      maxTokens,
      temperature,
      jsonMode,
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }
    throw new Error(
      `DeepSeek API error (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const data = await response.json();

  // 提取 content
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("DeepSeek returned empty or invalid content");
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[DeepSeek] Response received", {
      contentLength: content.length,
      usage: data?.usage,
    });
  }

  return content;
}