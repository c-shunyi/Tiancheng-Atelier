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
 * 用户账号状态。
 */
export type UserStatus = "active" | "disabled";

/**
 * 用户信息（已脱敏，不含 passwordHash / openid）。
 */
export interface User {
  /** 数据库主键 ID */
  id: number;
  /** 用户名，账号密码注册的用户会有；微信登录用户为 null */
  username: string | null;
  /** 手机号，注册或绑定后才会有 */
  phone: string | null;
  /** 用户昵称，未设置时为空字符串 */
  nickname: string;
  /** 用户头像 URL，未设置时为空字符串 */
  avatar: string;
  /** 账号状态 */
  status: UserStatus;
  /** 是否已绑定微信 */
  hasWx: boolean;
  /** 是否已设置密码 */
  hasPassword: boolean;
  /** 今日剩余免费创作次数 */
  freeQuotaRemaining: number;
  /** 每日免费创作次数上限 */
  freeQuotaLimit: number;
  /** 下一次免费次数重置时间（ISO 字符串） */
  freeQuotaResetAt: string;
  /** 注册时间 */
  createdAt: string;
  /** 最近一次更新时间 */
  updatedAt: string;
}

/**
 * 登录 / 注册接口的统一返回结构。
 */
export interface AuthResult {
  /** 后端签发的 JWT，需放入 Authorization 头 */
  token: string;
  /** 当前登录用户的资料快照 */
  userInfo: User;
}

/**
 * 图生图任务状态。
 */
export type CreationStatus = "pending" | "success" | "failed";

/**
 * 图生图创作记录（返回给前端的视图模型）。
 */
export interface Creation {
  id: number;
  prompt: string;
  size: string;
  sourceUrl: string;
  resultUrl: string;
  status: CreationStatus;
  createdAt: string;
  /** 提交成功后后端返回的最新剩余次数（仅在 createCreation 响应中有值） */
  quota?: {
    remaining: number;
    resetAt: string;
  };
}

/**
 * 创作历史分页响应。
 */
export interface CreationList {
  page: number;
  pageSize: number;
  total: number;
  list: Creation[];
}

/**
 * 提示词预设（用户从中选择）。
 */
export interface PromptPreset {
  id: number;
  title: string;
  content: string;
  cover: string;
  sortOrder: number;
}

/**
 * 收货地址。
 */
export interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 新增/更新地址的请求体。
 */
export interface AddressInput {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault?: boolean;
}
