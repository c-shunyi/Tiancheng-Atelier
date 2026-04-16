import { request } from "./request";
import type { WxLoginResult, WxUser } from "@/types/api";

/**
 * 使用微信 `uni.login` 拿到的 code 换取后端 token 与用户资料。
 */
export function wxLogin(code: string) {
  return request<WxLoginResult>({
    url: "/wx/login",
    method: "POST",
    data: { code },
    auth: false,
  });
}

/**
 * 拉取当前登录用户的资料。
 */
export function getProfile() {
  return request<WxUser>({ url: "/wx/profile", method: "GET" });
}

/**
 * 更新当前登录用户的昵称 / 头像。
 */
export function updateProfile(payload: { nickname?: string; avatar?: string }) {
  return request<WxUser>({ url: "/wx/profile", method: "PUT", data: payload });
}
