import type { NextFunction, Request, Response } from "express";

import {
  getUserProfile,
  loginByPassword,
  loginByWxCode,
  registerByPassword,
  updateUserProfile,
} from "../../services/user.service";
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
 * 账号密码注册。
 */
export const register = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await registerByPassword({
      account: String(request.body.account ?? ""),
      password: String(request.body.password ?? ""),
    });
    sendSuccess(response, data, "注册成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 账号密码登录。
 */
export const login = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await loginByPassword({
      account: String(request.body.account ?? ""),
      password: String(request.body.password ?? ""),
    });
    sendSuccess(response, data, "登录成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 微信小程序登录。
 */
export const wxLogin = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await loginByWxCode(String(request.body.code ?? ""));
    sendSuccess(response, data, "登录成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户资料。
 */
export const getProfile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const data = await getUserProfile(userId);
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新当前用户资料。
 */
export const updateProfile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const data = await updateUserProfile(userId, {
      nickname: request.body.nickname,
      avatar: request.body.avatar,
      phone: request.body.phone,
    });
    sendSuccess(response, data, "更新成功");
  } catch (error) {
    next(error);
  }
};
