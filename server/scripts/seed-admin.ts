#!/usr/bin/env ts-node
// 初始化默认管理员账号。幂等：已存在则跳过。
// 用法：pnpm exec ts-node-dev --transpile-only scripts/seed-admin.ts

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma/client";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

async function main() {
  const existing = await prisma.adminUser.findUnique({
    where: { username: DEFAULT_USERNAME },
  });

  if (existing) {
    console.log(`管理员 "${DEFAULT_USERNAME}" 已存在，跳过`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.adminUser.create({
    data: {
      username: DEFAULT_USERNAME,
      passwordHash,
      role: "super_admin",
      status: "active",
    },
  });

  console.log(`默认管理员已创建：用户名=${DEFAULT_USERNAME}  密码=${DEFAULT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("创建失败：", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
