import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/config";
import type { ApiResponse } from "@/types/api";

type Method = "GET" | "POST" | "PUT" | "DELETE";

/**
 * 单次请求的入参。
 */
interface RequestOptions {
  /** 业务路径（不含 API_BASE_URL 前缀），例如 `/wx/login` */
  url: string;
  /** HTTP 方法，默认 GET */
  method?: Method;
  /** 请求体 / query 参数 */
  data?: Record<string, unknown>;
  /** 是否自动附带 Authorization 头，默认 true */
  auth?: boolean;
}

/**
 * 业务/网络错误的统一封装。
 * - `code` 为后端返回的业务码或 HTTP 状态码；网络异常时为 -1。
 */
export class ApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

/**
 * 通用请求函数。
 * 自动注入 token、解包 `{ code, message, data }` 结构，业务失败抛出 ApiError。
 */
export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = "GET", data, auth = true } = options;
  const header: Record<string, string> = { "Content-Type": "application/json" };

  // 默认带上本地缓存的 token；如果 auth=false（如登录接口）则跳过
  if (auth) {
    const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
    if (token) header.Authorization = `Bearer ${token}`;
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        // HTTP 2xx 且业务 code === 0 才算成功
        if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
          resolve(body.data);
        } else {
          const message = body?.message ?? `请求失败 (${res.statusCode})`;
          reject(new ApiError(message, body?.code ?? res.statusCode));
        }
      },
      fail: (err) => reject(new ApiError(err.errMsg ?? "网络异常", -1)),
    });
  });
}
