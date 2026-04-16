import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";
import { storage } from "./storage";

/**
 * 单个分类的上传规则。
 */
interface CategoryRule {
  /** 允许的文件后缀（小写、不含点） */
  exts: string[];
  /** 单文件大小上限（字节） */
  maxSize: number;
}

/**
 * 各分类对应的允许后缀和大小上限。
 * 调整这里就能控制服务端允许哪些文件被上传。
 */
const CATEGORY_RULES: Record<string, CategoryRule> = {
  avatar: {
    exts: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024,
  },
  post: {
    exts: ["jpg", "jpeg", "png", "webp", "gif"],
    maxSize: 10 * 1024 * 1024,
  },
  document: {
    exts: ["pdf", "doc", "docx", "xls", "xlsx"],
    maxSize: 20 * 1024 * 1024,
  },
};

/**
 * 暴露给路由层的最大单文件字节数（取所有分类中的最大值）。
 * multer 在解析阶段先用这个做硬上限，业务层再按 category 精细判断。
 */
export const MAX_FILE_SIZE = Math.max(
  ...Object.values(CATEGORY_RULES).map((rule) => rule.maxSize),
);

/**
 * 校验 key 不包含路径穿越，且属于指定用户。
 */
const ensureKeyOwnedBy = (key: string, userId: number) => {
  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new HttpError(400, "key 含非法字符", 400);
  }

  if (!key.startsWith(`users/${userId}/`)) {
    throw new HttpError(403, "无权操作该文件", 403);
  }
};

/**
 * 上传一个用户文件。
 * - 校验 category 与文件后缀
 * - 用 UUID 重命名，落到 `users/<userId>/<category>/<uuid>.<ext>`
 * - 若 category=avatar，自动更新 user.avatar，并尝试删除旧头像
 */
export const uploadUserFile = async (params: {
  userId: number;
  category: string;
  file: Express.Multer.File;
}) => {
  const { userId, category, file } = params;

  const rule = CATEGORY_RULES[category];
  if (!rule) {
    throw new HttpError(
      400,
      `不支持的分类: ${category}，可选 ${Object.keys(CATEGORY_RULES).join(", ")}`,
      400,
    );
  }

  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (!ext || !rule.exts.includes(ext)) {
    throw new HttpError(
      400,
      `${category} 类别不允许 .${ext || "(空)"} 文件，仅支持 ${rule.exts.join(", ")}`,
      400,
    );
  }

  if (file.size > rule.maxSize) {
    const limitMb = Math.round(rule.maxSize / 1024 / 1024);
    throw new HttpError(400, `文件超过 ${limitMb}MB 上限`, 400);
  }

  const key = `users/${userId}/${category}/${randomUUID()}.${ext}`;
  const result = await storage.put(key, file.buffer, file.mimetype);

  // category=avatar 时同步写入 User.avatar，并尽力删除旧头像
  if (category === "avatar") {
    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: key },
    });

    if (previous?.avatar && previous.avatar.startsWith(`users/${userId}/avatar/`)) {
      // 旧头像清理失败不影响本次上传结果
      void storage.delete(previous.avatar).catch(() => undefined);
    }
  }

  return {
    ...result,
    originalName: file.originalname,
  };
};

/**
 * 删除一个用户文件。key 必须以 `users/<userId>/` 开头。
 */
export const deleteUserFile = async (params: { userId: number; key: string }) => {
  const { userId, key } = params;

  ensureKeyOwnedBy(key, userId);

  await storage.delete(key);

  // 如果删的是当前头像，把 User.avatar 清空
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  if (user?.avatar === key) {
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: "" },
    });
  }
};
