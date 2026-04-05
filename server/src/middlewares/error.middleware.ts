import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

import { Prisma } from "../generated/prisma/client";
import { HttpError, isHttpError } from "../utils/http-error";
import { logError } from "../utils/logger";
import { sendFail } from "../utils/response";

/**
 * 将 Prisma 已知错误转换为统一的 HttpError。
 */
const mapPrismaError = (error: Prisma.PrismaClientKnownRequestError): HttpError => {
  if (error.code === "P2025") {
    return new HttpError(404, "目标记录不存在", 404);
  }

  return new HttpError(500, "数据库请求失败", 500);
};

/**
 * 处理未命中的路由请求。
 */
export const notFoundMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  next(new HttpError(404, `路由 ${request.originalUrl} 不存在`, 404));
};

/**
 * 全局错误处理中间件，负责统一返回错误格式。
 */
export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  let normalizedError: unknown = error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    normalizedError = mapPrismaError(error);
  }

  const responseError = isHttpError(normalizedError)
    ? normalizedError
    : new HttpError(500, "服务器内部错误", 500);

  if (responseError.statusCode >= 500) {
    logError(responseError.message, error);
  }

  sendFail(
    response,
    responseError.message,
    responseError.code,
    responseError.statusCode,
  );
};
