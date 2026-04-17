import type { NextFunction, Request, Response } from "express";

import { prisma } from "../../prisma/client";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";
import { storage } from "../../services/storage";

/**
 * 分页查询用户列表，可按用户名/手机号搜索。
 */
export const listUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, Math.floor(Number(request.query.page)) || 1);
    const pageSize = Math.min(50, Math.max(1, Math.floor(Number(request.query.pageSize)) || 20));
    const keyword = String(request.query.keyword ?? "").trim();

    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { phone: { contains: keyword } },
            { nickname: { contains: keyword } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const list = rows.map((u) => ({
      id: u.id,
      username: u.username,
      phone: u.phone,
      nickname: u.nickname,
      avatar: u.avatar ? storage.getPublicUrl(u.avatar) : "",
      openid: u.openid,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    sendSuccess(response, { page, pageSize, total, list });
  } catch (error) {
    next(error);
  }
};

/**
 * 查询用户详情。
 */
export const getUserDetail = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpError(404, "用户不存在", 404);
    }

    sendSuccess(response, {
      id: user.id,
      username: user.username,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar ? storage.getPublicUrl(user.avatar) : "",
      openid: user.openid,
      status: user.status,
      freeQuotaUsed: user.freeQuotaUsed,
      freeQuotaResetAt: user.freeQuotaResetAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 启用/禁用用户。
 */
export const toggleUserStatus = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const status = request.body.status;

    if (status !== "active" && status !== "disabled") {
      throw new HttpError(400, "status 必须为 active 或 disabled", 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpError(404, "用户不存在", 404);
    }

    await prisma.user.update({ where: { id }, data: { status } });
    sendSuccess(response, null, "操作成功");
  } catch (error) {
    next(error);
  }
};
