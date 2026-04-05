import jwt from "jsonwebtoken";

import config from "../config";
import type { AdminRole, AuthTokenPayload } from "../types";
import { HttpError } from "./http-error";

/**
 * 校验并标准化管理员角色值。
 */
const parseAdminRole = (value: unknown): AdminRole | undefined => {
  if (value === "admin" || value === "super_admin") {
    return value;
  }

  return undefined;
};

/**
 * 签发访问令牌。
 */
export const signAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

/**
 * 验证访问令牌并返回标准化后的载荷。
 */
export const verifyAccessToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (typeof decoded === "string") {
      throw new HttpError(401, "Token 载荷格式无效", 401);
    }

    if (typeof decoded.sub !== "string" || decoded.sub.length === 0) {
      throw new HttpError(401, "Token 缺少主体信息", 401);
    }

    if (decoded.type !== "user" && decoded.type !== "admin") {
      throw new HttpError(401, "Token 主体类型无效", 401);
    }

    return {
      sub: decoded.sub,
      type: decoded.type,
      username: typeof decoded.username === "string" ? decoded.username : undefined,
      role: parseAdminRole(decoded.role),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "登录状态已失效，请重新登录", 401);
  }
};
