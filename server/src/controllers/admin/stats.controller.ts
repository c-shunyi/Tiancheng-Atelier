import type { NextFunction, Request, Response } from "express";

import { prisma } from "../../prisma/client";
import { sendSuccess } from "../../utils/response";

/**
 * 获取仪表盘统计数据。
 */
export const getDashboardStats = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 今日零点（北京时间 UTC+8）
    const now = new Date();
    const bjOffset = 8 * 60 * 60 * 1000;
    const bjNow = new Date(now.getTime() + bjOffset);
    const bjToday = new Date(
      Date.UTC(bjNow.getUTCFullYear(), bjNow.getUTCMonth(), bjNow.getUTCDate()) - bjOffset,
    );

    const [userCount, creationCount, todayCreationCount, presetCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.creation.count(),
        prisma.creation.count({
          where: { createdAt: { gte: bjToday } },
        }),
        prisma.promptPreset.count({ where: { enabled: true } }),
      ]);

    sendSuccess(response, {
      userCount,
      creationCount,
      todayCreationCount,
      presetCount,
    });
  } catch (error) {
    next(error);
  }
};
