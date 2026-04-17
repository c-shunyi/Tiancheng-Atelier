import type { NextFunction, Request, Response } from "express";

import { prisma } from "../../prisma/client";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";
import { storage } from "../../services/storage";

const toDto = (row: {
  id: number;
  userId: number;
  prompt: string;
  sourceImageKey: string;
  resultImageKey: string;
  model: string;
  size: string;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}) => ({
  id: row.id,
  userId: row.userId,
  prompt: row.prompt,
  sourceUrl: row.sourceImageKey ? storage.getPublicUrl(row.sourceImageKey) : "",
  resultUrl: row.resultImageKey ? storage.getPublicUrl(row.resultImageKey) : "",
  model: row.model,
  size: row.size,
  status: row.status,
  errorMessage: row.errorMessage,
  createdAt: row.createdAt.toISOString(),
});

/**
 * 分页查询所有创作记录，可按状态和用户 ID 筛选。
 */
export const listCreations = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, Math.floor(Number(request.query.page)) || 1);
    const pageSize = Math.min(50, Math.max(1, Math.floor(Number(request.query.pageSize)) || 20));
    const status = String(request.query.status ?? "").trim() || undefined;
    const userId = Number(request.query.userId) || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [total, rows] = await Promise.all([
      prisma.creation.count({ where }),
      prisma.creation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    sendSuccess(response, { page, pageSize, total, list: rows.map(toDto) });
  } catch (error) {
    next(error);
  }
};

/**
 * 查询创作详情。
 */
export const getCreationDetail = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const record = await prisma.creation.findUnique({ where: { id } });

    if (!record) {
      throw new HttpError(404, "记录不存在", 404);
    }

    sendSuccess(response, toDto(record));
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员删除创作记录及关联图片。
 */
export const removeCreation = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const record = await prisma.creation.findUnique({ where: { id } });

    if (!record) {
      throw new HttpError(404, "记录不存在", 404);
    }

    if (record.sourceImageKey) {
      await storage.delete(record.sourceImageKey).catch(() => undefined);
    }
    if (record.resultImageKey) {
      await storage.delete(record.resultImageKey).catch(() => undefined);
    }

    await prisma.creation.delete({ where: { id } });
    sendSuccess(response, null, "删除成功");
  } catch (error) {
    next(error);
  }
};
