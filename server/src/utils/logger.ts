/**
 * 将日志附加信息格式化为字符串。
 */
const formatMeta = (meta?: unknown): string => {
  if (meta === undefined) {
    return "";
  }

  if (typeof meta === "string") {
    return ` ${meta}`;
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
};

/**
 * 统一输出日志内容，便于后续替换为专业日志组件。
 */
const writeLog = (level: "INFO" | "WARN" | "ERROR", message: string, meta?: unknown): void => {
  const prefix = `[${new Date().toISOString()}] [${level}]`;
  const line = `${prefix} ${message}${formatMeta(meta)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
};

/**
 * 输出普通信息日志。
 */
export const logInfo = (message: string, meta?: unknown): void => {
  writeLog("INFO", message, meta);
};

/**
 * 输出告警日志。
 */
export const logWarn = (message: string, meta?: unknown): void => {
  writeLog("WARN", message, meta);
};

/**
 * 输出错误日志。
 */
export const logError = (message: string, meta?: unknown): void => {
  writeLog("ERROR", message, meta);
};
