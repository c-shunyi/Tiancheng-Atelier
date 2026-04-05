import app from "./app";
import config from "./config";
import { logError, logInfo } from "./utils/logger";

/**
 * 为进程级异常注册统一处理逻辑。
 */
const createProcessErrorHandler = (label: string) => {
  return (error: unknown): void => {
    logError(`${label}`, error);
    process.exit(1);
  };
};

/**
 * 启动 HTTP 服务。
 */
const startServer = (): void => {
  app.listen(config.port, () => {
    logInfo(`Server is running at http://localhost:${config.port}`);
  });
};

process.on("uncaughtException", createProcessErrorHandler("Uncaught exception"));
process.on("unhandledRejection", createProcessErrorHandler("Unhandled rejection"));

startServer();
