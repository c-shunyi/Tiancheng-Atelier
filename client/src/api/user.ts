import { request } from "./request";
import type { AuthResult, User } from "@/types/api";

/**
 * 账号密码注册（account 可以是用户名或手机号）。
 */
export function register(payload: { account: string; password: string }) {
  return request<AuthResult>({
    url: "/users/register",
    method: "POST",
    data: payload,
    auth: false,
  });
}

/**
 * 账号密码登录（account 可以是用户名或手机号）。
 */
export function login(payload: { account: string; password: string }) {
  return request<AuthResult>({
    url: "/users/login",
    method: "POST",
    data: payload,
    auth: false,
  });
}

/**
 * 微信小程序登录：使用 uni.login 拿到的 code 换取 token。
 */
export function wxLogin(code: string) {
  return request<AuthResult>({
    url: "/users/wx-login",
    method: "POST",
    data: { code },
    auth: false,
  });
}

/**
 * 拉取当前登录用户的资料。
 */
export function getProfile() {
  return request<User>({ url: "/users/profile", method: "GET" });
}

/**
 * 更新当前登录用户的昵称 / 头像 / 手机号。
 */
export function updateProfile(payload: {
  nickname?: string;
  avatar?: string;
  phone?: string;
}) {
  return request<User>({ url: "/users/profile", method: "PUT", data: payload });
}
