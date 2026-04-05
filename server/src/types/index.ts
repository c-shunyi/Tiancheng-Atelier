/**
 * 管理员角色枚举值，用于管理台权限控制。
 */
export const ADMIN_ROLES = ["admin", "super_admin"] as const;

/**
 * 管理员角色类型。
 */
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * JWT 主体类型。
 */
export type AuthSubjectType = "user" | "admin";

/**
 * JWT 载荷结构。
 */
export interface AuthTokenPayload {
  sub: string;
  type: AuthSubjectType;
  username?: string;
  role?: AdminRole;
}

/**
 * 挂载到请求对象上的鉴权上下文。
 */
export interface AuthContext {
  id: string;
  type: AuthSubjectType;
  username?: string;
  role?: AdminRole;
}

/**
 * 成功响应结构。
 */
export interface ApiSuccessResponse<T> {
  code: 0;
  message: string;
  data: T;
}

/**
 * 失败响应结构。
 */
export interface ApiFailResponse {
  code: number;
  message: string;
  data: null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
