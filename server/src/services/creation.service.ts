import path from "node:path";
import { randomUUID } from "node:crypto";

import config from "../config";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";
import { logError } from "../utils/logger";
import { getPromptPresetById } from "./prompt.service";
import { consumeFreeQuota } from "./quota.service";
import { storage } from "./storage";

/**
 * 图生图来源图片的允许扩展名与大小上限。
 * 文档标注 jpeg/png，实测 webp 亦可；单文件 ≤ 10MB。
 */
const SOURCE_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"] as const;
const SOURCE_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const PROMPT_MAX_LENGTH = 300;
const DEFAULT_SIZE = "2K";

interface DmxImageItem {
  url?: string;
  b64_json?: string;
}

interface DmxImageResponse {
  data?: DmxImageItem[];
  error?: { message?: string; code?: string | number };
}

/**
 * 将 DB 里的 Creation 行转为接口友好的对象，把 storage key 转成公网 URL。
 */
const toCreationDto = (row: {
  id: number;
  prompt: string;
  sourceImageKey: string;
  resultImageKey: string;
  status: "pending" | "success" | "failed";
  size: string;
  createdAt: Date;
}) => ({
  id: row.id,
  prompt: row.prompt,
  size: row.size,
  sourceUrl: row.sourceImageKey ? storage.getPublicUrl(row.sourceImageKey) : "",
  resultUrl: row.resultImageKey ? storage.getPublicUrl(row.resultImageKey) : "",
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

/**
 * 调用 DMX 图生图 API。成功时返回结果图 URL。
 *
 * 参考图以 base64 data URL 内联传入，这样开发环境无需把本地服务暴露到公网。
 * 生产环境若换成对象存储（COS/S3）可直接传公开 URL，性能更好。
 */
const callDmxImageApi = async (params: {
  prompt: string;
  sourceImage: { buffer: Buffer; mimeType: string };
}): Promise<string> => {
  if (!config.arkApiKey) {
    throw new HttpError(500, "服务端未配置 ARK_API_KEY", 500);
  }

  const dataUrl = `data:${params.sourceImage.mimeType};base64,${params.sourceImage.buffer.toString("base64")}`;

  let response: Response;
  try {
    response = await fetch(config.arkApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.arkApiKey,
      },
      body: JSON.stringify({
        model: config.arkModel,
        prompt: params.prompt,
        image: dataUrl,
        size: DEFAULT_SIZE,
        response_format: "url",
        watermark: false,
        stream: false,
      }),
    });
  } catch (error) {
    logError("DMX 请求网络异常", { error: (error as Error).message });
    throw new HttpError(502, "图像生成服务请求失败");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logError("DMX 返回非 2xx", { status: response.status, body: text.slice(0, 500) });
    throw new HttpError(502, `图像生成失败 (HTTP ${response.status})`);
  }

  const data = (await response.json().catch(() => ({}))) as DmxImageResponse;
  const firstUrl = data.data?.[0]?.url;

  if (!firstUrl) {
    logError("DMX 返回数据异常", { body: data });
    throw new HttpError(502, data.error?.message ?? "图像生成返回数据异常");
  }

  return firstUrl;
};

/**
 * 下载远程图片字节，用于转存到本地 storage。
 */
const downloadImageBuffer = async (url: string): Promise<{ buffer: Buffer; mimeType: string }> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    logError("结果图下载失败", { error: (error as Error).message });
    throw new HttpError(502, "结果图下载失败");
  }

  if (!response.ok) {
    throw new HttpError(502, `结果图下载失败 (HTTP ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "image/png";
  return { buffer: Buffer.from(arrayBuffer), mimeType };
};

/**
 * 从 mime / URL 推断文件扩展名，仅用于本地保存。
 */
const guessResultExt = (mimeType: string, url: string): string => {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("png")) return "png";

  const urlExt = path.extname(url.split("?")[0] ?? "").slice(1).toLowerCase();
  if (urlExt && ["jpg", "jpeg", "png", "webp"].includes(urlExt)) {
    return urlExt === "jpeg" ? "jpg" : urlExt;
  }
  return "png";
};

const ensureKeyOwnedBy = (key: string, userId: number) => {
  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new HttpError(400, "key 含非法字符", 400);
  }
  if (!key.startsWith(`users/${userId}/`)) {
    throw new HttpError(403, "无权操作该文件", 403);
  }
};

/**
 * 后台任务：调 DMX → 下载结果 → 更新 DB。
 *
 * 不要对返回值 await（fire-and-forget）。所有异常在内部兜底写入 DB 的 failed 状态，
 * 不会把错误冒泡到调用方。
 */
const processCreationJob = async (params: {
  creationId: number;
  userId: number;
  prompt: string;
  sourceBuffer: Buffer;
  sourceMimeType: string;
}): Promise<void> => {
  const { creationId, userId, prompt, sourceBuffer, sourceMimeType } = params;

  try {
    const resultImageUrl = await callDmxImageApi({
      prompt,
      sourceImage: { buffer: sourceBuffer, mimeType: sourceMimeType },
    });

    const { buffer, mimeType } = await downloadImageBuffer(resultImageUrl);
    const resultExt = guessResultExt(mimeType, resultImageUrl);
    const resultKey = `users/${userId}/creation/result/${randomUUID()}.${resultExt}`;
    await storage.put(resultKey, buffer, mimeType);

    await prisma.creation.update({
      where: { id: creationId },
      data: {
        resultImageKey: resultKey,
        status: "success",
        errorMessage: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    logError("创作任务失败", { creationId, message });
    await prisma.creation
      .update({
        where: { id: creationId },
        data: { status: "failed", errorMessage: message.slice(0, 500) },
      })
      .catch(() => undefined);
  }
};

/**
 * 创建一次图生图任务（异步）：
 * - 同步部分：校验 → 保存原图 → 插入 pending 记录
 * - 异步部分：后台调 DMX，完成后更新记录
 *
 * 立即返回 pending 记录，前端通过轮询 `getCreation` 拿最终状态。
 */
export const createCreation = async (params: {
  userId: number;
  file: Express.Multer.File;
  promptId: number;
}) => {
  const { userId, file, promptId } = params;

  const preset = await getPromptPresetById(promptId);
  const trimmedPrompt = preset.content.trim();
  if (!trimmedPrompt) {
    throw new HttpError(500, "提示词预设内容为空", 500);
  }
  if (trimmedPrompt.length > PROMPT_MAX_LENGTH) {
    throw new HttpError(500, `提示词预设过长（> ${PROMPT_MAX_LENGTH}）`, 500);
  }

  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (!ext || !SOURCE_IMAGE_EXTS.includes(ext as (typeof SOURCE_IMAGE_EXTS)[number])) {
    throw new HttpError(
      400,
      `参考图仅支持 ${SOURCE_IMAGE_EXTS.join(", ")} 格式`,
      400,
    );
  }
  if (file.size > SOURCE_IMAGE_MAX_SIZE) {
    throw new HttpError(400, "参考图超过 10MB 上限", 400);
  }

  const sourceKey = `users/${userId}/creation/source/${randomUUID()}.${ext}`;
  await storage.put(sourceKey, file.buffer, file.mimetype);

  // 事务内扣减今日免费次数 + 插入 pending 记录，避免并发下超扣/超发
  const { record, quota } = await prisma.$transaction(async (tx) => {
    const quota = await consumeFreeQuota(tx, userId);
    const record = await tx.creation.create({
      data: {
        userId,
        prompt: trimmedPrompt,
        sourceImageKey: sourceKey,
        model: config.arkModel,
        size: DEFAULT_SIZE,
      },
    });
    return { record, quota };
  });

  // 触发后台处理，调用方不等待
  void processCreationJob({
    creationId: record.id,
    userId,
    prompt: trimmedPrompt,
    sourceBuffer: file.buffer,
    sourceMimeType: file.mimetype,
  });

  return { ...toCreationDto(record), quota };
};

/**
 * 获取单条创作记录（用于前端轮询状态）。
 */
export const getCreation = async (params: { userId: number; id: number }) => {
  const record = await prisma.creation.findUnique({ where: { id: params.id } });
  if (!record || record.userId !== params.userId) {
    throw new HttpError(404, "记录不存在", 404);
  }
  return toCreationDto(record);
};

/**
 * 分页获取当前用户的创作历史（按时间倒序）。
 */
export const listMyCreations = async (params: {
  userId: number;
  page: number;
  pageSize: number;
}) => {
  const page = Math.max(1, Math.floor(params.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Math.floor(params.pageSize) || 20));

  const [total, rows] = await Promise.all([
    prisma.creation.count({ where: { userId: params.userId } }),
    prisma.creation.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    page,
    pageSize,
    total,
    list: rows.map(toCreationDto),
  };
};

/**
 * 失败记录重试：不上传新图，复用原 sourceImageKey + prompt，重新扣一次免费次数后
 * 把记录状态置回 pending 并重新触发后台任务。
 */
export const retryCreation = async (params: { userId: number; id: number }) => {
  const record = await prisma.creation.findUnique({ where: { id: params.id } });
  if (!record || record.userId !== params.userId) {
    throw new HttpError(404, "记录不存在", 404);
  }
  if (record.status !== "failed") {
    throw new HttpError(400, "仅失败的创作可以重试", 400);
  }
  if (!record.sourceImageKey) {
    throw new HttpError(400, "原始参考图已丢失，无法重试", 400);
  }

  ensureKeyOwnedBy(record.sourceImageKey, params.userId);
  const { buffer, mimeType } = await storage.get(record.sourceImageKey);

  // 事务内扣减免费次数并重置状态，避免并发重试超扣
  const { updated, quota } = await prisma.$transaction(async (tx) => {
    const quota = await consumeFreeQuota(tx, params.userId);
    const updated = await tx.creation.update({
      where: { id: record.id },
      data: {
        status: "pending",
        errorMessage: null,
        resultImageKey: "",
      },
    });
    return { updated, quota };
  });

  // 旧结果图若存在，异步清理掉
  if (record.resultImageKey) {
    void storage.delete(record.resultImageKey).catch(() => undefined);
  }

  void processCreationJob({
    creationId: updated.id,
    userId: params.userId,
    prompt: updated.prompt,
    sourceBuffer: buffer,
    sourceMimeType: mimeType,
  });

  return { ...toCreationDto(updated), quota };
};

/**
 * 删除一条创作记录及其两张图片。
 */
export const deleteCreation = async (params: { userId: number; id: number }) => {
  const record = await prisma.creation.findUnique({ where: { id: params.id } });
  if (!record || record.userId !== params.userId) {
    throw new HttpError(404, "记录不存在", 404);
  }

  if (record.sourceImageKey) {
    ensureKeyOwnedBy(record.sourceImageKey, params.userId);
    await storage.delete(record.sourceImageKey).catch(() => undefined);
  }
  if (record.resultImageKey) {
    ensureKeyOwnedBy(record.resultImageKey, params.userId);
    await storage.delete(record.resultImageKey).catch(() => undefined);
  }

  await prisma.creation.delete({ where: { id: record.id } });
};
