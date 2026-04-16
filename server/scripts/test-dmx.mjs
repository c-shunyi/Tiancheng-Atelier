#!/usr/bin/env node
// 独立验证 DMX 图生图接口是否通。
// 用法：node scripts/test-dmx.mjs [图片URL]
// - 不传参数默认用文档里的公网示例图（一定可达）
// - 传 http://192.168.x.x/... 这种内网 URL 可用来验证"DMX 服务器无法访问内网"这一假设

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ARK_API_KEY;
const API_URL = process.env.ARK_API_URL || "https://www.dmxapi.cn/v1/images/generations";
const MODEL = process.env.ARK_MODEL || "doubao-seedream-4-5-251128";

if (!API_KEY) {
  console.error("❌ 未在 .env 中配置 ARK_API_KEY");
  process.exit(1);
}

const PUBLIC_SAMPLE =
  "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imageToimage.png";

// 参数支持：URL 或 "file:/绝对路径" 把本地文件转 base64 data URL 内联
const rawArg = process.argv[2];
const prompt = process.argv[3] || "生成狗狗趴在草地上的近景画面";

let imageField;
let imageLogLabel;

if (!rawArg) {
  imageField = PUBLIC_SAMPLE;
  imageLogLabel = PUBLIC_SAMPLE;
} else if (rawArg.startsWith("file:")) {
  const filePath = rawArg.slice("file:".length);
  const abs = path.resolve(filePath);
  const buf = await readFile(abs);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
        ? "image/webp"
        : "image/png";
  imageField = `data:${mime};base64,${buf.toString("base64")}`;
  imageLogLabel = `[base64 inline ${mime} ${buf.length}B] ${abs}`;
} else {
  imageField = rawArg;
  imageLogLabel = rawArg;
}

console.log("▶ 请求 DMX 图生图");
console.log("  endpoint:", API_URL);
console.log("  model   :", MODEL);
console.log("  image   :", imageLogLabel);
console.log("  prompt  :", prompt);
console.log();

const body = {
  model: MODEL,
  prompt,
  image: imageField,
  size: "2K",
  response_format: "url",
  watermark: false,
  stream: false,
};

const started = Date.now();
const res = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: API_KEY,
  },
  body: JSON.stringify(body),
});

const duration = Date.now() - started;
const text = await res.text();

console.log(`◀ 状态码: ${res.status} (${duration}ms)`);
console.log("响应体:");
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
