import bcrypt from "bcryptjs";

import config from "../config";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";
import { signAccessToken } from "../utils/jwt";
import { logError } from "../utils/logger";

/**
 * 微信 jscode2session 接口的响应结构。
 */
interface WxCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 注册 / 密码登录的入参（账号既可以是 username 也可以是手机号）。
 */
export interface PasswordCredentials {
  /** 用户名或手机号 */
  account: string;
  /** 明文密码 */
  password: string;
}

/**
 * 用户资料更新允许的字段。
 */
export interface UpdateUserInput {
  nickname?: string;
  avatar?: string;
  phone?: string;
}

/**
 * bcrypt 哈希轮数。
 */
const PASSWORD_SALT_ROUNDS = 10;

/**
 * 简单的中国大陆手机号识别（11 位数字、以 1 开头）。
 */
const PHONE_PATTERN = /^1\d{10}$/;

/**
 * 用户名规则：4~32 位，字母数字下划线开头。
 */
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;

/**
 * 移除用户敏感字段，避免密码哈希等暴露到响应中。
 */
const sanitizeUser = (user: {
  id: number;
  username: string | null;
  phone: string | null;
  openid: string | null;
  nickname: string;
  avatar: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    status: user.status,
    /** 是否已绑定微信，前端用于判断展示 */
    hasWx: Boolean(user.openid),
    /** 是否已设置密码，前端用于判断展示 */
    hasPassword: Boolean((user as { passwordHash?: string | null }).passwordHash),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * 判断 account 字符串属于手机号还是用户名，用于查询时拼 OR 条件。
 */
const buildAccountWhere = (account: string) => {
  const trimmed = account.trim();

  if (PHONE_PATTERN.test(trimmed)) {
    return { phone: trimmed };
  }

  return { username: trimmed };
};

/**
 * 校验注册参数：account 必须是合法 username 或手机号；password 至少 6 位。
 */
const validateRegisterInput = ({ account, password }: PasswordCredentials) => {
  const accountTrimmed = account.trim();
  const passwordTrimmed = password.trim();

  if (!accountTrimmed || !passwordTrimmed) {
    throw new HttpError(400, "账号和密码不能为空", 400);
  }

  if (passwordTrimmed.length < 6 || passwordTrimmed.length > 64) {
    throw new HttpError(400, "密码长度需在 6~64 位之间", 400);
  }

  const isPhone = PHONE_PATTERN.test(accountTrimmed);
  const isUsername = USERNAME_PATTERN.test(accountTrimmed);

  if (!isPhone && !isUsername) {
    throw new HttpError(
      400,
      "账号需为 4~32 位字母/数字/下划线的用户名，或 11 位手机号",
      400,
    );
  }

  return {
    account: accountTrimmed,
    password: passwordTrimmed,
    isPhone,
  };
};

/**
 * 通过用户 ID 查询用户，并签发新的访问令牌（登录/注册成功统一调用）。
 */
const buildSession = (user: { id: number }) => {
  return signAccessToken({
    sub: String(user.id),
    type: "user",
  });
};

/**
 * 调用微信 jscode2session 接口，将 code 换取为 openid。
 */
const code2session = async (code: string): Promise<WxCode2SessionResponse> => {
  const url =
    `https://api.weixin.qq.com/sns/jscode2session` +
    `?appid=${config.wxAppId}` +
    `&secret=${config.wxSecret}` +
    `&js_code=${code}` +
    `&grant_type=authorization_code`;

  const response = await fetch(url);

  if (!response.ok) {
    logError("微信 code2session 请求失败", { status: response.status });
    throw new HttpError(502, "微信服务请求失败");
  }

  const data = (await response.json()) as WxCode2SessionResponse;

  if (data.errcode && data.errcode !== 0) {
    logError("微信 code2session 返回错误", {
      errcode: data.errcode,
      errmsg: data.errmsg,
    });
    throw new HttpError(401, `微信登录失败: ${data.errmsg ?? "未知错误"}`);
  }

  if (!data.openid) {
    throw new HttpError(502, "微信返回数据异常，缺少 openid");
  }

  return data;
};

/**
 * 账号密码注册：account 自动识别为 username 或 phone。
 */
export const registerByPassword = async (input: PasswordCredentials) => {
  const { account, password, isPhone } = validateRegisterInput(input);

  // 唯一性校验
  const existing = await prisma.user.findFirst({
    where: buildAccountWhere(account),
  });

  if (existing) {
    throw new HttpError(409, isPhone ? "该手机号已被注册" : "该用户名已被注册", 409);
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: isPhone ? null : account,
      phone: isPhone ? account : null,
      passwordHash,
    },
  });

  return {
    token: buildSession(user),
    userInfo: sanitizeUser(user),
  };
};

/**
 * 账号密码登录：account 既可以是 username 也可以是手机号。
 */
export const loginByPassword = async (input: PasswordCredentials) => {
  const account = input.account?.trim() ?? "";
  const password = input.password?.trim() ?? "";

  if (!account || !password) {
    throw new HttpError(400, "账号和密码不能为空", 400);
  }

  const user = await prisma.user.findFirst({
    where: buildAccountWhere(account),
  });

  // 不论账号不存在还是密码错误都返回相同提示，避免账号枚举
  if (!user || !user.passwordHash) {
    throw new HttpError(401, "账号或密码错误", 401);
  }

  if (user.status !== "active") {
    throw new HttpError(403, "账号已被禁用", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, "账号或密码错误", 401);
  }

  return {
    token: buildSession(user),
    userInfo: sanitizeUser(user),
  };
};

/**
 * 微信小程序登录：用 code 换取 openid，找不到则自动创建用户。
 */
export const loginByWxCode = async (code: string) => {
  if (!code || code.trim().length === 0) {
    throw new HttpError(400, "缺少微信登录 code", 400);
  }

  if (!config.wxAppId || !config.wxSecret) {
    throw new HttpError(500, "服务端未配置微信小程序 AppID 或 AppSecret");
  }

  const wxSession = await code2session(code.trim());

  let user = await prisma.user.findUnique({
    where: { openid: wxSession.openid! },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        openid: wxSession.openid!,
        unionid: wxSession.unionid ?? null,
      },
    });
  }

  if (user.status !== "active") {
    throw new HttpError(403, "账号已被禁用", 403);
  }

  // 老用户首次绑定 unionid 时回填
  if (wxSession.unionid && !user.unionid) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { unionid: wxSession.unionid },
    });
  }

  return {
    token: buildSession(user),
    userInfo: sanitizeUser(user),
  };
};

/**
 * 查询用户资料。
 */
export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError(404, "用户不存在", 404);
  }

  return sanitizeUser(user);
};

/**
 * 更新用户资料（昵称/头像/手机号）。
 */
export const updateUserProfile = async (userId: number, data: UpdateUserInput) => {
  const updateData: UpdateUserInput = {};

  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  // 手机号绑定需要走唯一性校验
  if (data.phone !== undefined) {
    const phone = data.phone.trim();

    if (phone && !PHONE_PATTERN.test(phone)) {
      throw new HttpError(400, "手机号格式不正确", 400);
    }

    if (phone) {
      const occupied = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
      });

      if (occupied) {
        throw new HttpError(409, "该手机号已被其他账号使用", 409);
      }
    }

    updateData.phone = phone || undefined;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return sanitizeUser(user);
};
