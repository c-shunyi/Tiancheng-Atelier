import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";

/**
 * 创建示例数据时的输入结构。
 */
export interface CreateExampleInput {
  title: string;
  content?: string;
  published?: boolean;
}

/**
 * 更新示例数据时的输入结构。
 */
export interface UpdateExampleInput {
  title?: string;
  content?: string | null;
  published?: boolean;
}

/**
 * 校验并标准化标题内容。
 */
const normalizeTitle = (title: string): string => {
  const value = title.trim();

  if (!value) {
    throw new HttpError(400, "标题不能为空", 400);
  }

  return value;
};

/**
 * 组装更新参数，避免将未传字段写入数据库。
 */
const buildUpdateData = (input: UpdateExampleInput) => {
  const data: {
    title?: string;
    content?: string | null;
    published?: boolean;
  } = {};

  if (typeof input.title === "string") {
    data.title = normalizeTitle(input.title);
  }

  if (input.content !== undefined) {
    data.content = input.content?.trim() || null;
  }

  if (typeof input.published === "boolean") {
    data.published = input.published;
  }

  return data;
};

/**
 * 查询全部示例数据。
 */
export const listExamples = async () => {
  return prisma.exampleItem.findMany({
    orderBy: {
      id: "desc",
    },
  });
};

/**
 * 根据 ID 查询单条示例数据。
 */
export const getExampleById = async (id: number) => {
  const example = await prisma.exampleItem.findUnique({
    where: {
      id,
    },
  });

  if (!example) {
    throw new HttpError(404, "示例数据不存在", 404);
  }

  return example;
};

/**
 * 创建示例数据。
 */
export const createExample = async (input: CreateExampleInput) => {
  return prisma.exampleItem.create({
    data: {
      title: normalizeTitle(input.title),
      content: input.content?.trim() || null,
      published: input.published ?? false,
    },
  });
};

/**
 * 更新示例数据。
 */
export const updateExample = async (id: number, input: UpdateExampleInput) => {
  await getExampleById(id);

  const data = buildUpdateData(input);

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "至少提供一个可更新字段", 400);
  }

  return prisma.exampleItem.update({
    where: {
      id,
    },
    data,
  });
};

/**
 * 删除示例数据。
 */
export const deleteExample = async (id: number) => {
  await getExampleById(id);

  return prisma.exampleItem.delete({
    where: {
      id,
    },
  });
};
