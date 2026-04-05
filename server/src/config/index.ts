import dotenv from "dotenv";

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
};

export default config;
