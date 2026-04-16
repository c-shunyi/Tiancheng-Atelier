import { request } from "./request";
import type { PromptPreset } from "@/types/api";

/**
 * 拉取后端启用的提示词预设列表。
 */
export function listPromptPresets() {
  return request<PromptPreset[]>({
    url: "/prompts",
    method: "GET",
  });
}
