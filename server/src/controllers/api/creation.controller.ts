import type { NextFunction, Request, Response } from "express";

import {
  createCreation as createCreationService,
  deleteCreation as deleteCreationService,
  getCreation as getCreationService,
  listMyCreations,
} from "../../services/creation.service";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";

/**
 * 从鉴权上下文中读取当前用户 ID。
 */
const readCurrentUserId = (request: Request): number => {
  const userId = Number(request.auth?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(401, "用户身份无效，请重新登录", 401);
  }

  return userId;
};

/**
 * 发起一次图生图：multipart/form-data，字段 `file` + `prompt`。
 * 立即返回 pending 记录，后台异步调 DMX；前端自行轮询状态。
 */
export const createCreation = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);

    if (!request.file) {
      throw new HttpError(400, "缺少上传文件", 400);
    }

    const prompt = String(request.body.prompt ?? "");

    const data = await createCreationService({
      userId,
      file: request.file,
      prompt,
    });

    sendSuccess(response, data, "已提交");
  } catch (error) {
    next(error);
  }
};

/**
 * 查询单条创作记录（前端轮询用）。
 */
export const getCreation = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "id 参数无效", 400);
    }

    const data = await getCreationService({ userId, id });
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 我的创作列表：query `page` `pageSize`。
 */
export const listCreations = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const page = Number(request.query.page ?? 1);
    const pageSize = Number(request.query.pageSize ?? 20);

    const data = await listMyCreations({ userId, page, pageSize });
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除指定创作记录：path `:id`。
 */
export const deleteCreation = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "id 参数无效", 400);
    }

    await deleteCreationService({ userId, id });
    sendSuccess(response, null, "删除成功");
  } catch (error) {
    next(error);
  }
};
