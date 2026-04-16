import { prisma } from "../prisma/client";
import { HttpError } from "../utils/http-error";
import { storage } from "./storage";

/**
 * 将 DB 行转为接口友好的 DTO，封面 key 拼成公网 URL。
 */
const toPresetDto = (row: {
  id: number;
  title: string;
  description: string;
  cover: string;
  sortOrder: number;
}) => ({
  id: row.id,
  title: row.title,
  /** 对外展示的风格介绍；content（真实提示词）不再下发给前端 */
  description: row.description,
  cover: row.cover ? storage.getPublicUrl(row.cover) : "",
  sortOrder: row.sortOrder,
});

/**
 * 列出启用的提示词预设，按 sortOrder 升序、id 升序。
 */
export const listPromptPresets = async () => {
  const rows = await prisma.promptPreset.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(toPresetDto);
};

/**
 * 根据 id 取单个预设，供创建任务时校验使用。
 */
export const getPromptPresetById = async (id: number) => {
  const row = await prisma.promptPreset.findUnique({ where: { id } });
  if (!row || !row.enabled) {
    throw new HttpError(404, "提示词不存在或已下架", 404);
  }
  return row;
};
