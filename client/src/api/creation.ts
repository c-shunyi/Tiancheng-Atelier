import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/config";
import { ApiError, request } from "./request";
import type { ApiResponse, Creation, CreationList } from "@/types/api";

/**
 * 发起一次图生图：使用 multipart/form-data 同时上传参考图与提示词。
 */
export function createCreation(params: {
  /** 本地参考图临时路径（uni.chooseImage 拿到的） */
  filePath: string;
  /** 选中的提示词预设 id */
  promptId: number;
}): Promise<Creation> {
  const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
  const header: Record<string, string> = {};
  if (token) header.Authorization = `Bearer ${token}`;

  return new Promise<Creation>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/creations`,
      filePath: params.filePath,
      name: "file",
      formData: { promptId: String(params.promptId) },
      header,
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as ApiResponse<Creation>;
          if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
            resolve(body.data);
          } else {
            reject(
              new ApiError(
                body?.message ?? `生成失败 (${res.statusCode})`,
                body?.code ?? res.statusCode,
              ),
            );
          }
        } catch {
          reject(new ApiError("生成响应解析失败", -1));
        }
      },
      fail: (err) => reject(new ApiError(err.errMsg ?? "网络异常", -1)),
    });
  });
}

/**
 * 查询单条创作记录（用于轮询 pending 任务状态）。
 */
export function getCreation(id: number) {
  return request<Creation>({
    url: `/creations/${id}`,
    method: "GET",
  });
}

/**
 * 获取当前用户的创作历史分页列表。
 */
export function listCreations(params?: { page?: number; pageSize?: number }) {
  return request<CreationList>({
    url: "/creations",
    method: "GET",
    data: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  });
}

/**
 * 重试一条失败的创作记录（不用再上传图片，后端复用原参考图 + 提示词）。
 */
export function retryCreation(id: number) {
  return request<Creation>({
    url: `/creations/${id}/retry`,
    method: "POST",
  });
}

/**
 * 删除一条创作记录（同时清理两张图）。
 */
export function deleteCreation(id: number) {
  return request<null>({
    url: `/creations/${id}`,
    method: "DELETE",
  });
}
