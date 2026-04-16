import type { NextFunction, Request, Response } from "express";

import { deleteUserFile, uploadUserFile } from "../../services/upload.service";
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
 * 单文件上传：multipart/form-data，字段 `file` + `category`。
 */
export const uploadFile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);

    if (!request.file) {
      throw new HttpError(400, "缺少上传文件", 400);
    }

    const category = String(request.body.category ?? "").trim();
    if (!category) {
      throw new HttpError(400, "缺少 category 参数", 400);
    }

    const data = await uploadUserFile({
      userId,
      category,
      file: request.file,
    });

    sendSuccess(response, data, "上传成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 删除单个文件：body `{ key: string }`。
 */
export const deleteFile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const key = String(request.body.key ?? "").trim();

    if (!key) {
      throw new HttpError(400, "缺少 key 参数", 400);
    }

    await deleteUserFile({ userId, key });
    sendSuccess(response, null, "删除成功");
  } catch (error) {
    next(error);
  }
};
