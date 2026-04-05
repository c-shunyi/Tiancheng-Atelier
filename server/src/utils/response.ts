import type { Response } from "express";

import type { ApiFailResponse, ApiSuccessResponse } from "../types";

/**
 * 发送统一成功响应。
 */
export const sendSuccess = <T>(
  response: Response,
  data: T,
  message = "success",
  statusCode = 200,
): Response<ApiSuccessResponse<T>> => {
  return response.status(statusCode).json({
    code: 0,
    message,
    data,
  });
};

/**
 * 发送统一失败响应。
 */
export const sendFail = (
  response: Response,
  message: string,
  code = 500,
  statusCode = 400,
): Response<ApiFailResponse> => {
  return response.status(statusCode).json({
    code,
    message,
    data: null,
  });
};
