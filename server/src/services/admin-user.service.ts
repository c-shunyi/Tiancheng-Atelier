import bcrypt from "bcryptjs";

import { prisma } from "../prisma/client";
import type { AdminRole } from "../types";
import { HttpError } from "../utils/http-error";
import { signAccessToken } from "../utils/jwt";

/**
 * 管理员登录输入结构。
 */
export interface AdminLoginInput {
  username: string;
  password: string;
}

/**
 * 移除管理员敏感字段，避免密码哈希泄露到响应中。
 */
const sanitizeAdminUser = (adminUser: {
  id: number;
  username: string;
  role: AdminRole;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => {
  return {
    id: adminUser.id,
    username: adminUser.username,
    role: adminUser.role,
    status: adminUser.status,
    createdAt: adminUser.createdAt,
    updatedAt: adminUser.updatedAt,
  };
};

/**
 * 标准化管理员登录参数。
 */
const normalizeLoginInput = (input: AdminLoginInput): AdminLoginInput => {
  const username = input.username.trim();
  const password = input.password.trim();

  if (!username || !password) {
    throw new HttpError(400, "用户名和密码不能为空", 400);
  }

  return {
    username,
    password,
  };
};

/**
 * 校验明文密码与数据库中的密码哈希是否匹配。
 */
const verifyPassword = async (plainText: string, passwordHash: string): Promise<boolean> => {
  return bcrypt.compare(plainText, passwordHash);
};

/**
 * 执行管理员登录并返回访问令牌。
 */
export const loginAdmin = async (input: AdminLoginInput) => {
  const credentials = normalizeLoginInput(input);

  const adminUser = await prisma.adminUser.findUnique({
    where: {
      username: credentials.username,
    },
  });

  if (!adminUser) {
    throw new HttpError(401, "用户名或密码错误", 401);
  }

  if (adminUser.status !== "active") {
    throw new HttpError(403, "管理员账号已被禁用", 403);
  }

  const isPasswordValid = await verifyPassword(
    credentials.password,
    adminUser.passwordHash,
  );

  if (!isPasswordValid) {
    throw new HttpError(401, "用户名或密码错误", 401);
  }

  const token = signAccessToken({
    sub: String(adminUser.id),
    type: "admin",
    username: adminUser.username,
    role: adminUser.role,
  });

  return {
    token,
    adminUser: sanitizeAdminUser(adminUser),
  };
};

/**
 * 查询当前管理员资料。
 */
export const getAdminProfile = async (adminId: number) => {
  const adminUser = await prisma.adminUser.findUnique({
    where: {
      id: adminId,
    },
  });

  if (!adminUser) {
    throw new HttpError(404, "管理员不存在", 404);
  }

  return sanitizeAdminUser(adminUser);
};

/**
 * 查询管理员列表。
 */
export const listAdminUsers = async () => {
  const adminUsers = await prisma.adminUser.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return adminUsers.map((adminUser) => sanitizeAdminUser(adminUser));
};
