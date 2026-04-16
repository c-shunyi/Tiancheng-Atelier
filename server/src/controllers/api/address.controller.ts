import type { NextFunction, Request, Response } from "express";

import {
  createAddress as createAddressService,
  deleteAddress as deleteAddressService,
  getAddress as getAddressService,
  listMyAddresses,
  updateAddress as updateAddressService,
} from "../../services/address.service";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";

const readCurrentUserId = (request: Request): number => {
  const userId = Number(request.auth?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(401, "用户身份无效，请重新登录", 401);
  }
  return userId;
};

const readId = (request: Request): number => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "id 参数无效", 400);
  }
  return id;
};

export const listAddresses = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const data = await listMyAddresses(userId);
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

export const getAddress = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const id = readId(request);
    const data = await getAddressService({ userId, id });
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const data = await createAddressService({ userId, ...request.body });
    sendSuccess(response, data, "已新增");
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const id = readId(request);
    const data = await updateAddressService({ userId, id, ...request.body });
    sendSuccess(response, data, "已更新");
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = readCurrentUserId(request);
    const id = readId(request);
    await deleteAddressService({ userId, id });
    sendSuccess(response, null, "已删除");
  } catch (error) {
    next(error);
  }
};
