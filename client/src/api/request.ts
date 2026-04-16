import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/config";
import type { ApiResponse } from "@/types/api";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  url: string;
  method?: Method;
  data?: Record<string, unknown>;
  auth?: boolean;
}

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = "GET", data, auth = true } = options;
  const header: Record<string, string> = { "Content-Type": "application/json" };

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
