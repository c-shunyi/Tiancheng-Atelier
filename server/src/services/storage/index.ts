import config from "../../config";
import { LocalStorageProvider } from "./local.storage";
import type { StorageProvider } from "./types";

/**
 * 根据配置创建存储 provider 实例。
 */
const createStorage = (): StorageProvider => {
  switch (config.storageDriver) {
    case "local":
      return new LocalStorageProvider(config.uploadDir, config.publicBaseUrl);
    case "cos":
      throw new Error("COS 存储驱动尚未实现");
    default:
      throw new Error(`不支持的存储驱动: ${config.storageDriver}`);
  }
};

/**
 * 全局单例存储 provider。
 */
export const storage = createStorage();

export type { StorageProvider, UploadResult } from "./types";
