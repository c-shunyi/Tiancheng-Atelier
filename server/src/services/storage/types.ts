/**
 * 文件存储后的元信息。
 */
export interface UploadResult {
  /** 存储 key（例如 `users/1/avatar/uuid.jpg`），与具体存储后端无关 */
  key: string;
  /** 对外可访问的完整 URL */
  url: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件 MIME 类型 */
  mimeType: string;
}

/**
 * 文件存储后端的统一抽象。
 * 现阶段实现为本地磁盘，后续切换 COS 时只需新增实现并更换工厂返回值。
 */
export interface StorageProvider {
  /**
   * 写入一个文件。
   * @param key      存储 key（包含路径与扩展名）
   * @param buffer   文件原始字节
   * @param mimeType MIME 类型，便于将来 COS 写入 Content-Type
   */
  put(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;

  /**
   * 删除一个文件，文件不存在时不抛错。
   */
  delete(key: string): Promise<void>;

  /**
   * 根据 key 读取原始字节，供后端内部需要二次处理时使用（如失败重试）。
   */
  get(key: string): Promise<{ buffer: Buffer; mimeType: string }>;

  /**
   * 根据 key 计算对外可访问的完整 URL。
   * 不做存在性检查，仅做 URL 拼接。
   */
  getPublicUrl(key: string): string;
}
