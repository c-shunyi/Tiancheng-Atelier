#!/usr/bin/env ts-node
// 初始化提示词预设。幂等：按 title 做 upsert。
// 用法：pnpm exec ts-node-dev --transpile-only scripts/seed-prompts.ts

import "dotenv/config";
import { prisma } from "../src/prisma/client";

const presets = [
  {
    title: "日式动漫风",
    content:
      "保持参考图的构图与主体姿态，将画面整体重绘为日式动漫风格，线条清晰、色彩明亮、眼神传神，背景做柔化处理",
    sortOrder: 10,
  },
  {
    title: "古典油画",
    content:
      "以参考图为蓝本，用古典油画笔触重绘，浓郁色调与明暗对比，背景替换为 19 世纪欧洲室内场景",
    sortOrder: 20,
  },
  {
    title: "赛博朋克",
    content:
      "保留参考图主体，将场景改造成霓虹灯闪烁的赛博朋克城市街道，雨夜、湿润地面反光、紫青色氛围光",
    sortOrder: 30,
  },
  {
    title: "水墨中国风",
    content:
      "将参考图重绘为中国水墨画风格：黑白灰为主、少量淡彩，写意笔触，保留主体轮廓，背景留白",
    sortOrder: 40,
  },
  {
    title: "3D 毛绒玩具",
    content:
      "将参考图中的主体转化为 3D 毛绒玩具质感：柔软毛线、圆润外形、摆在纯色背景前，摄影棚布光",
    sortOrder: 50,
  },
  {
    title: "黏土定格风",
    content:
      "把参考图重绘为黏土定格动画风格，角色由彩色黏土捏制，手工感明显，场景做同风格处理",
    sortOrder: 60,
  },
  {
    title: "写实电影感",
    content:
      "在不改变参考图主体特征的前提下，增强电影级氛围：冷暖对比打光、浅景深、颗粒质感",
    sortOrder: 70,
  },
  {
    title: "像素风 8-bit",
    content:
      "将参考图转为 8-bit 像素风，低分辨率马赛克像素块、有限调色板、轮廓清晰可辨",
    sortOrder: 80,
  },
];

async function main() {
  const keepTitles = new Set(presets.map((p) => p.title));

  // 将不在当前列表中的历史预设置为 disabled，避免旧文案继续出现在客户端
  const obsolete = await prisma.promptPreset.findMany({
    where: { enabled: true, NOT: { title: { in: [...keepTitles] } } },
  });
  for (const row of obsolete) {
    await prisma.promptPreset.update({ where: { id: row.id }, data: { enabled: false } });
    console.log(`- 下架旧预设: ${row.title}`);
  }

  for (const p of presets) {
    const existing = await prisma.promptPreset.findFirst({ where: { title: p.title } });
    if (existing) {
      await prisma.promptPreset.update({
        where: { id: existing.id },
        data: { content: p.content, sortOrder: p.sortOrder, enabled: true },
      });
      console.log(`✓ 更新预设: ${p.title}`);
    } else {
      await prisma.promptPreset.create({ data: p });
      console.log(`+ 新增预设: ${p.title}`);
    }
  }
  await prisma.$disconnect();
  console.log("完成");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
