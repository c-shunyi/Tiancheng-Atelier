import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ quiet: true });

/**
 * 读取字符串环境变量，并在缺失时回退到默认值。
 */
const readStringEnv = (key: string, fallback: string): string => {
  const value = process.env[key]?.trim();

  return value && value.length > 0 ? value : fallback;
};

/**
 * 读取数字环境变量，并在非法时回退到默认值。
 */
const readNumberEnv = (key: string, fallback: number): number => {
  const rawValue = process.env[key];
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const config = {
  env: readStringEnv("NODE_ENV", "development"),
  port: readNumberEnv("PORT", 3000),
  databaseUrl: readStringEnv(
    "DATABASE_URL",
    "mysql://root:password@127.0.0.1:3306/tiancheng_atelier",
  ),
  jwtSecret: readStringEnv("JWT_SECRET", "replace-with-a-strong-secret"),
  jwtExpiresIn: readStringEnv("JWT_EXPIRES_IN", "7d"),
  corsOrigin: readStringEnv("CORS_ORIGIN", "*"),
  wxAppId: readStringEnv("WX_APPID", ""),
  wxSecret: readStringEnv("WX_SECRET", ""),

  /**
   * 存储驱动：local（本地磁盘）/ cos（腾讯云对象存储，预留）。
   */
  storageDriver: readStringEnv("STORAGE_DRIVER", "local") as "local" | "cos",

  /**
   * 本地上传根目录（绝对路径）。默认为 server/uploads。
   */
  uploadDir: path.resolve(
    process.cwd(),
    readStringEnv("UPLOAD_DIR", "uploads"),
  ),

  /**
   * 对外可访问的基础 URL，用于拼接文件公开访问地址。
   */
  publicBaseUrl: readStringEnv("PUBLIC_BASE_URL", "http://localhost:3000"),

  /**
   * DMX 图生图 API 配置。
   */
  arkApiKey: readStringEnv("ARK_API_KEY", ""),
  arkApiUrl: readStringEnv(
    "ARK_API_URL",
    "https://www.dmxapi.cn/v1/images/generations",
  ),
  arkModel: readStringEnv("ARK_MODEL", "doubao-seedream-4-5-251128"),
};

export default config;
