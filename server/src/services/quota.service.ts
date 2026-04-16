import type { Prisma } from "../generated/prisma/client";

import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";

/** 每日免费创作次数上限。 */
export const DAILY_FREE_LIMIT = 10;

/** 北京时间相对 UTC 的偏移毫秒（UTC+8，固定，无夏令时）。 */
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 计算"下一次重置时间"：北京时间次日 00:00。
 * 不依赖服务器系统时区，在任何部署环境下都稳定。
 */
const nextResetAt = (from: Date): Date => {
  const shifted = new Date(from.getTime() + BEIJING_OFFSET_MS);
  const nextMidnightUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return new Date(nextMidnightUtcMs - BEIJING_OFFSET_MS);
};

/**
 * 从数据库行计算当前剩余免费次数（懒重置，不写 DB，仅用于展示）。
 */
export const calcFreeQuotaRemaining = (user: {
  freeQuotaUsed: number;
  freeQuotaResetAt: Date;
}): { remaining: number; resetAt: Date } => {
  const now = new Date();
  if (now >= user.freeQuotaResetAt) {
    return { remaining: DAILY_FREE_LIMIT, resetAt: nextResetAt(now) };
  }
  return {
    remaining: Math.max(0, DAILY_FREE_LIMIT - user.freeQuotaUsed),
    resetAt: user.freeQuotaResetAt,
  };
};

/**
 * 事务内消费 1 次免费次数：
 * - 若已过重置时间，先重置 used=0 并把 resetAt 顺延到次日 00:00
 * - 再判断是否超额；未超额则 used+1
 *
 * 调用方必须包在 prisma.$transaction 中，避免并发请求扣两次。
 */
export const consumeFreeQuota = async (
  tx: Prisma.TransactionClient,
  userId: number,
): Promise<{ remaining: number; resetAt: Date }> => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { freeQuotaUsed: true, freeQuotaResetAt: true },
  });

  if (!user) {
    throw new HttpError(404, "用户不存在", 404);
  }

  const now = new Date();
  let used = user.freeQuotaUsed;
  let resetAt = user.freeQuotaResetAt;

  if (now >= resetAt) {
    used = 0;
    resetAt = nextResetAt(now);
  }

  if (used >= DAILY_FREE_LIMIT) {
    throw new HttpError(
      429,
      `今日免费次数已用完，${resetAt.toLocaleString("zh-CN")} 后恢复`,
      429,
    );
  }

  used += 1;

  await tx.user.update({
    where: { id: userId },
    data: { freeQuotaUsed: used, freeQuotaResetAt: resetAt },
  });

  return { remaining: DAILY_FREE_LIMIT - used, resetAt };
};

/**
 * 读取当前用户剩余免费次数（懒重置，写回 DB 以便后续访问一致）。
 */
export const getFreeQuota = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeQuotaUsed: true, freeQuotaResetAt: true },
  });

  if (!user) {
    throw new HttpError(404, "用户不存在", 404);
  }

  const now = new Date();
  if (now >= user.freeQuotaResetAt) {
    const resetAt = nextResetAt(now);
    await prisma.user.update({
      where: { id: userId },
      data: { freeQuotaUsed: 0, freeQuotaResetAt: resetAt },
    });
    return { remaining: DAILY_FREE_LIMIT, resetAt, limit: DAILY_FREE_LIMIT };
  }

  return {
    remaining: Math.max(0, DAILY_FREE_LIMIT - user.freeQuotaUsed),
    resetAt: user.freeQuotaResetAt,
    limit: DAILY_FREE_LIMIT,
  };
};
