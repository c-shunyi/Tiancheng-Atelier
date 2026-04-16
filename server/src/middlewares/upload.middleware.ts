import multer from "multer";

import { MAX_FILE_SIZE } from "../services/upload.service";

/**
 * 单文件上传中间件。
 * 使用内存存储以便业务层做完校验再写入持久化存储。
 * 这里的 limits 是兜底硬上限，真正按 category 精细控制在 service 层。
 */
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single("file");
