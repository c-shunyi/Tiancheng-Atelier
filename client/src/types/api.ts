/**
 * 后端统一响应结构。
 * 与 server `utils/response.ts` 保持一致：成功 code === 0，否则视为业务错误。
 */
export interface ApiResponse<T> {
  /** 业务码：0 表示成功，非 0 表示业务异常 */
  code: number;
  /** 提示信息：成功时通常为 "success"，失败时为可展示给用户的文案 */
  message: string;
  /** 业务数据载荷，类型由调用方传入的泛型 T 决定 */
  data: T;
}

/**
 * 微信小程序用户信息。
 */
export interface WxUser {
  /** 数据库主键 ID */
  id: number;
  /** 微信 openid */
  openid: string;
  /** 用户昵称（可能为空） */
  nickname: string | null;
  /** 用户头像 URL（可能为空） */
  avatar: string | null;
  /** 注册时间 */
  createdAt: string;
  /** 最近一次更新时间 */
  updatedAt: string;
}

/**
 * 微信登录接口的返回数据。
 */
export interface WxLoginResult {
  /** 后端签发的 JWT，需放入 Authorization 头 */
  token: string;
  /** 当前登录用户的资料快照 */
  user: WxUser;
}
