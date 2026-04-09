import config from "../config";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";
import { logError } from "../utils/logger";
import { signAccessToken } from "../utils/jwt";

/**
 * 微信 code2session 响应结构。
 */
interface WxCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 调用微信 jscode2session 接口，用 code 换取 openid。
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
    logError("微信 code2session 返回错误", { errcode: data.errcode, errmsg: data.errmsg });
    throw new HttpError(401, `微信登录失败: ${data.errmsg ?? "未知错误"}`);
  }

  if (!data.openid) {
    throw new HttpError(502, "微信返回数据异常，缺少 openid");
  }

  return data;
};

/**
 * 移除微信用户敏感字段。
 */
const sanitizeWxUser = (wxUser: {
  id: number;
  openid: string;
  nickname: string;
  avatar: string;
  phone: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  return {
    id: wxUser.id,
    nickname: wxUser.nickname,
    avatar: wxUser.avatar,
    phone: wxUser.phone,
    status: wxUser.status,
    createdAt: wxUser.createdAt,
    updatedAt: wxUser.updatedAt,
  };
};

/**
 * 微信小程序登录：用 code 换取用户信息和 JWT。
 */
export const loginByWxCode = async (code: string) => {
  if (!code || code.trim().length === 0) {
    throw new HttpError(400, "缺少微信登录 code");
  }

  if (!config.wxAppId || !config.wxSecret) {
    throw new HttpError(500, "服务端未配置微信小程序 AppID 或 AppSecret");
  }

  const wxSession = await code2session(code.trim());

  // 查找或创建用户
  let wxUser = await prisma.wxUser.findUnique({
    where: { openid: wxSession.openid! },
  });

  if (!wxUser) {
    wxUser = await prisma.wxUser.create({
      data: {
        openid: wxSession.openid!,
        unionid: wxSession.unionid ?? null,
      },
    });
  }

  if (wxUser.status !== "active") {
    throw new HttpError(403, "账号已被禁用");
  }

  // 如果有新的 unionid，更新
  if (wxSession.unionid && !wxUser.unionid) {
    wxUser = await prisma.wxUser.update({
      where: { id: wxUser.id },
      data: { unionid: wxSession.unionid },
    });
  }

  const token = signAccessToken({
    sub: String(wxUser.id),
    type: "user",
  });

  return {
    token,
    userInfo: sanitizeWxUser(wxUser),
  };
};

/**
 * 查询微信用户资料。
 */
export const getWxUserProfile = async (userId: number) => {
  const wxUser = await prisma.wxUser.findUnique({
    where: { id: userId },
  });

  if (!wxUser) {
    throw new HttpError(404, "用户不存在");
  }

  return sanitizeWxUser(wxUser);
};

/**
 * 更新微信用户资料。
 */
export const updateWxUserProfile = async (
  userId: number,
  data: { nickname?: string; avatar?: string },
) => {
  const wxUser = await prisma.wxUser.update({
    where: { id: userId },
    data,
  });

  return sanitizeWxUser(wxUser);
};
