/**
 * 后端 API 基础地址。
 * 通过 .env 中的 `VITE_API_BASE_URL` 覆盖；缺省指向本地 server 的 `/api` 前缀。
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

/**
 * 本地缓存 token 的 key。
 */
export const TOKEN_STORAGE_KEY = "tc_token";

/**
 * 本地缓存当前用户信息的 key。
 */
export const USER_STORAGE_KEY = "tc_user";
