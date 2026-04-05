import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../generated/prisma/client";

import config from "../config";

declare global {
  var __prismaClient__: PrismaClient | undefined;
}

/**
 * 创建 Prisma 7 所需的数据库驱动适配器。
 */
const createPrismaAdapter = (): PrismaMariaDb => {
  return new PrismaMariaDb(config.databaseUrl);
};

/**
 * 创建 PrismaClient 实例。
 */
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    adapter: createPrismaAdapter(),
  });
};

/**
 * 复用 PrismaClient，避免开发环境热更新时创建过多连接。
 */
export const prisma = globalThis.__prismaClient__ ?? createPrismaClient();

if (config.env !== "production") {
  globalThis.__prismaClient__ = prisma;
}
