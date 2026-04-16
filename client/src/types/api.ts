export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface WxUser {
  id: number;
  openid: string;
  nickname: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WxLoginResult {
  token: string;
  user: WxUser;
}
