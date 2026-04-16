import { request } from "./request";
import type { WxLoginResult, WxUser } from "@/types/api";

export function wxLogin(code: string) {
  return request<WxLoginResult>({
    url: "/wx/login",
    method: "POST",
    data: { code },
    auth: false,
  });
}

export function getProfile() {
  return request<WxUser>({ url: "/wx/profile", method: "GET" });
}

export function updateProfile(payload: { nickname?: string; avatar?: string }) {
  return request<WxUser>({ url: "/wx/profile", method: "PUT", data: payload });
}
