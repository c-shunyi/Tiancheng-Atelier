import type { NextFunction, Request, Response } from "express";

import {
  getAdminProfile,
  listAdminUsers,
  loginAdmin,
} from "../../services/admin-user.service";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";

/**
 * 从鉴权上下文中读取当前管理员 ID。
 */
const readCurrentAdminId = (request: Request): number => {
  const adminId = Number(request.auth?.id);

  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw new HttpError(401, "管理员身份无效，请重新登录", 401);
  }

  return adminId;
};

/**
 * 执行管理员登录。
 */
export const loginAdminUser = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await loginAdmin({
      username: String(request.body.username ?? ""),
      password: String(request.body.password ?? ""),
    });

    sendSuccess(response, data, "登录成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 返回当前管理员资料。
 */
export const getCurrentAdminProfile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminId = readCurrentAdminId(request);
    const data = await getAdminProfile(adminId);
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 返回管理员列表。
 */
export const getAdminUserList = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await listAdminUsers();
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};
