import type { AddressModel as Address } from "../generated/prisma/models/Address";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";

const PHONE_PATTERN = /^1[3-9]\d{9}$/;

export interface AddressInput {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
  isDefault?: boolean;
}

const toAddressDto = (row: Address) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  province: row.province,
  city: row.city,
  district: row.district,
  detail: row.detail,
  isDefault: row.isDefault,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** 校验并归一化入参；create 模式要求字段必填，update 允许部分字段。 */
const normalizeInput = (input: AddressInput, mode: "create" | "update") => {
  const out: Partial<Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">> = {};

  const strField = (key: "name" | "province" | "city" | "district" | "detail", max: number, label: string) => {
    const raw = input[key];
    if (raw === undefined) {
      if (mode === "create") throw new HttpError(400, `${label}不能为空`, 400);
      return;
    }
    const value = String(raw).trim();
    if (!value) throw new HttpError(400, `${label}不能为空`, 400);
    if (value.length > max) throw new HttpError(400, `${label}过长`, 400);
    out[key] = value;
  };

  strField("name", 32, "收件人");
  if (input.phone !== undefined) {
    const phone = String(input.phone).trim();
    if (!PHONE_PATTERN.test(phone)) throw new HttpError(400, "手机号格式不正确", 400);
    out.phone = phone;
  } else if (mode === "create") {
    throw new HttpError(400, "手机号不能为空", 400);
  }
  strField("province", 32, "省");
  strField("city", 32, "市");
  strField("district", 32, "区/县");
  strField("detail", 255, "详细地址");

  if (input.isDefault !== undefined) out.isDefault = !!input.isDefault;

  return out;
};

/** 列出当前用户的地址，默认地址置顶，其次按创建时间倒序。 */
export const listMyAddresses = async (userId: number) => {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toAddressDto);
};

/** 单条详情（供编辑页预填）。 */
export const getAddress = async (params: { userId: number; id: number }) => {
  const row = await prisma.address.findUnique({ where: { id: params.id } });
  if (!row || row.userId !== params.userId) {
    throw new HttpError(404, "地址不存在", 404);
  }
  return toAddressDto(row);
};

/**
 * 新增地址。首条地址自动设为默认；显式 isDefault=true 时清除其它默认标记。
 */
export const createAddress = async (params: { userId: number } & AddressInput) => {
  const data = normalizeInput(params, "create");
  const existingCount = await prisma.address.count({ where: { userId: params.userId } });
  const shouldBeDefault = existingCount === 0 || data.isDefault === true;

  const created = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: params.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: params.userId,
        name: data.name!,
        phone: data.phone!,
        province: data.province!,
        city: data.city!,
        district: data.district!,
        detail: data.detail!,
        isDefault: shouldBeDefault,
      },
    });
  });

  return toAddressDto(created);
};

/**
 * 更新地址；若本次把该地址设为默认，同事务内清理其它默认标记。
 * 禁止把唯一的默认地址显式取消为非默认（避免无默认状态）。
 */
export const updateAddress = async (params: { userId: number; id: number } & AddressInput) => {
  const existing = await prisma.address.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== params.userId) {
    throw new HttpError(404, "地址不存在", 404);
  }
  const data = normalizeInput(params, "update");

  if (data.isDefault === false && existing.isDefault) {
    throw new HttpError(400, "请先选择其它地址作为默认", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault === true && !existing.isDefault) {
      await tx.address.updateMany({
        where: { userId: params.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.update({ where: { id: params.id }, data });
  });

  return toAddressDto(updated);
};

/** 删除地址。若被删的是默认，则自动把最近一条提升为默认。 */
export const deleteAddress = async (params: { userId: number; id: number }) => {
  const existing = await prisma.address.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== params.userId) {
    throw new HttpError(404, "地址不存在", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: params.id } });
    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: params.userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });
};
