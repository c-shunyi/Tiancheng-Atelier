import { promises as fs } from "node:fs";
import path from "node:path";

import type { StorageProvider, UploadResult } from "./types";

/**
 * 本地磁盘存储实现。
 * 物理路径：`<rootDir>/<key>`
 * 公开 URL：`<publicBaseUrl>/uploads/<key>`
 *
 * 注意：必须在 Express 中将 `<rootDir>` 通过 `express.static` 挂载到
 * `/uploads` 前缀，否则 URL 不可达。
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/uploads/${key}`;
  }

  async put(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const fullPath = path.join(this.rootDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.rootDir, key);
    await fs.rm(fullPath, { force: true });
  }
}
