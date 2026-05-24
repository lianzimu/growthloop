/**
 * 通用工具函数
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 判断字符串是否为 UUID v4 格式
 * 用于开发阶段防御非 UUID actionId 被提交到 Supabase
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}