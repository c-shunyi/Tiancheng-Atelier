import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/config";
import { ApiError, request } from "./request";
import type { ApiResponse } from "@/types/api";

/**
 * 上传成功后服务端返回的元信息。
 */
export interface UploadedFile {
  /** 存储 key（与具体后端无关） */
  key: string;
  /** 公开访问 URL */
  url: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;
  /** 用户上传时的原始文件名 */
  originalName: string;
}

/**
 * 服务端目前支持的上传分类，与 server `upload.service.ts` 保持一致。
 */
export type UploadCategory = "avatar" | "post" | "document";

/**
 * 单文件上传：用 `uni.uploadFile` 走 multipart/form-data。
 * 调用前请确保已登录（本函数会从 storage 读取 token）。
 */
export function uploadFile(params: {
  /** 本地文件临时路径（uni.chooseImage / chooseFile 拿到的） */
  filePath: string;
  /** 上传分类，决定服务端落到哪个目录、走哪条校验规则 */
  category: UploadCategory;
}): Promise<UploadedFile> {
  const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
  const header: Record<string, string> = {};
  if (token) header.Authorization = `Bearer ${token}`;

  return new Promise<UploadedFile>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/users/upload`,
      filePath: params.filePath,
      name: "file",
      formData: { category: params.category },
      header,
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as ApiResponse<UploadedFile>;
          if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
            resolve(body.data);
          } else {
            reject(new ApiError(body?.message ?? `上传失败 (${res.statusCode})`, body?.code ?? res.statusCode));
          }
        } catch {
          reject(new ApiError("上传响应解析失败", -1));
        }
      },
      fail: (err) => reject(new ApiError(err.errMsg ?? "网络异常", -1)),
    });
  });
}

/**
 * 删除指定 key 的文件。key 必须属于当前用户。
 */
export function deleteFile(key: string) {
  return request<null>({
    url: "/users/upload",
    method: "DELETE",
    data: { key },
  });
}
