import type { NextFunction, Request, Response } from "express";

import { listPromptPresets } from "../../services/prompt.service";
import { sendSuccess } from "../../utils/response";

/**
 * 获取所有启用的提示词预设（客户端选图时展示用）。
 */
export const listPresets = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await listPromptPresets();
    sendSuccess(response, data);
  } catch (error) {
    next(error);
  }
};
