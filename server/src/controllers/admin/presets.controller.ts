import { randomUUID } from "node:crypto";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";

import { prisma } from "../../prisma/client";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";
import { storage } from "../../services/storage";

const COVER_EXTS = ["jpg", "jpeg", "png", "webp"];
const COVER_MAX_SIZE = 5 * 1024 * 1024;

const toDto = (row: {
  id: number;
  title: string;
  description: string;
  content: string;
  cover: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  content: row.content,
  coverUrl: row.cover ? storage.getPublicUrl(row.cover) : "",
  sortOrder: row.sortOrder,
  enabled: row.enabled,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * 保存封面图并返回 storage key。
 */
const saveCoverFile = async (file: Express.Multer.File): Promise<string> => {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (!COVER_EXTS.includes(ext)) {
    throw new HttpError(400, `封面仅支持 ${COVER_EXTS.join(", ")} 格式`, 400);
  }
  if (file.size > COVER_MAX_SIZE) {
    throw new HttpError(400, "封面图超过 5MB 上限", 400);
  }
  const key = `presets/cover/${randomUUID()}.${ext}`;
  await storage.put(key, file.buffer, file.mimetype);
  return key;
};

/**
 * 列出所有预设（包括禁用的）。
 */
export const listPresets = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await prisma.promptPreset.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    sendSuccess(response, rows.map(toDto));
  } catch (error) {
    next(error);
  }
};

/**
 * 创建预设。
 */
export const createPreset = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, content, sortOrder } = request.body;

    if (!title?.trim()) throw new HttpError(400, "标题不能为空", 400);
    if (!content?.trim()) throw new HttpError(400, "提示词不能为空", 400);

    let cover = "";
    if (request.file) {
      cover = await saveCoverFile(request.file);
    }

    const row = await prisma.promptPreset.create({
      data: {
        title: title.trim(),
        description: (description ?? "").trim(),
        content: content.trim(),
        cover,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    sendSuccess(response, toDto(row), "创建成功", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新预设。
 */
export const updatePreset = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const existing = await prisma.promptPreset.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "预设不存在", 404);

    const { title, description, content, sortOrder } = request.body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description.trim();
    if (content !== undefined) data.content = content.trim();
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;

    if (request.file) {
      data.cover = await saveCoverFile(request.file);
      // 删除旧封面
      if (existing.cover) {
        void storage.delete(existing.cover).catch(() => undefined);
      }
    }

    const row = await prisma.promptPreset.update({ where: { id }, data });
    sendSuccess(response, toDto(row), "更新成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 删除预设。
 */
export const removePreset = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const existing = await prisma.promptPreset.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "预设不存在", 404);

    if (existing.cover) {
      void storage.delete(existing.cover).catch(() => undefined);
    }

    await prisma.promptPreset.delete({ where: { id } });
    sendSuccess(response, null, "删除成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 启用/禁用预设。
 */
export const togglePresetEnabled = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const enabled = Boolean(request.body.enabled);

    const existing = await prisma.promptPreset.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "预设不存在", 404);

    await prisma.promptPreset.update({ where: { id }, data: { enabled } });
    sendSuccess(response, null, "操作成功");
  } catch (error) {
    next(error);
  }
};
