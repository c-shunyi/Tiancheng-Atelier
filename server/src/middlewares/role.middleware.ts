import type { NextFunction, Request, Response } from "express";

import type { AdminRole } from "../types";
import { HttpError } from "../utils/http-error";

/**
 * 角色权限中间件，用于限制管理台接口的角色访问范围。
 */
export const requireRoles =
  (...roles: AdminRole[]) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (request.auth?.type !== "admin" || !request.auth.role) {
        throw new HttpError(403, "仅管理员可访问此资源", 403);
      }

      if (!roles.includes(request.auth.role)) {
        throw new HttpError(403, "当前角色无权访问此资源", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
