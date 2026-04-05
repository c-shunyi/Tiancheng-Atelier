import type { NextFunction, Request, Response } from "express";

import {
  createExample,
  deleteExample,
  getExampleById,
  listExamples,
  updateExample,
} from "../../services/example.service";
import { HttpError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";

/**
 * 将路由参数值标准化为字符串。
 */
const normalizeRouteParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] ?? "" : value;
};

/**
 * 将路由参数中的示例 ID 解析为数字。
 */
const readExampleId = (value: string | string[]): number => {
  const exampleId = Number(normalizeRouteParam(value));

  if (!Number.isInteger(exampleId) || exampleId <= 0) {
    throw new HttpError(400, "示例 ID 非法", 400);
  }

  return exampleId;
};

/**
 * 查询管理台示例数据列表。
 */
export const listAdminExampleItems = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await listExamples();
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 查询管理台单条示例数据。
 */
export const getAdminExampleItem = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const exampleId = readExampleId(request.params.id);
    const data = await getExampleById(exampleId);
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建管理台示例数据。
 */
export const createAdminExampleItem = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await createExample({
      title: String(request.body.title ?? ""),
      content:
        typeof request.body.content === "string" ? request.body.content : undefined,
      published:
        typeof request.body.published === "boolean"
          ? request.body.published
          : undefined,
    });

    sendSuccess(response, data, "管理台示例创建成功", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新管理台示例数据。
 */
export const updateAdminExampleItem = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const exampleId = readExampleId(request.params.id);
    const data = await updateExample(exampleId, {
      title:
        typeof request.body.title === "string" ? request.body.title : undefined,
      content:
        typeof request.body.content === "string" || request.body.content === null
          ? request.body.content
          : undefined,
      published:
        typeof request.body.published === "boolean"
          ? request.body.published
          : undefined,
    });

    sendSuccess(response, data, "管理台示例更新成功");
  } catch (error) {
    next(error);
  }
};

/**
 * 删除管理台示例数据。
 */
export const removeAdminExampleItem = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const exampleId = readExampleId(request.params.id);
    const data = await deleteExample(exampleId);
    sendSuccess(response, data, "管理台示例删除成功");
  } catch (error) {
    next(error);
  }
};
