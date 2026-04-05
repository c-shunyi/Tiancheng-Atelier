import type { Request, Response } from "express";

import config from "../../config";
import { sendSuccess } from "../../utils/response";

/**
 * 返回服务健康状态，便于部署和联调时快速检查服务是否可用。
 */
export const getHealth = (_request: Request, response: Response): Response => {
  return sendSuccess(response, {
    status: "ok",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
};
