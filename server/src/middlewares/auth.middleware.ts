import type { NextFunction, Request, Response } from "express";

import type { AuthSubjectType } from "../types";
import { HttpError } from "../utils/http-error";
import { verifyAccessToken } from "../utils/jwt";

/**
 * 从 Authorization 请求头中提取 Bearer Token。
 */
const readBearerToken = (authorization?: string): string => {
  if (!authorization) {
    throw new HttpError(401, "缺少 Authorization 请求头", 401);
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Authorization 格式应为 Bearer Token", 401);
  }

  return token;
};

/**
 * 鉴权中间件，用于校验 JWT 并将用户信息挂载到请求对象上。
 */
export const authMiddleware =
  (expectedType?: AuthSubjectType) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const token = readBearerToken(request.headers.authorization);
      const payload = verifyAccessToken(token);

      if (expectedType && payload.type !== expectedType) {
        throw new HttpError(403, "当前账号无权访问此资源", 403);
      }

      request.auth = {
        id: payload.sub,
        type: payload.type,
        username: payload.username,
        role: payload.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
