import bodyParser from "body-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";
import morgan from "morgan";

import config from "./config";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";
import routes from "./routes";

/**
 * 生成 CORS 配置，兼容单域名和多域名场景。
 */
const buildCorsOrigin = (): CorsOptions["origin"] => {
  if (config.corsOrigin === "*") {
    return true;
  }

  return config.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: buildCorsOrigin(),
    credentials: true,
  }),
);
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件目录：所有用户上传文件通过 /uploads/<key> 公开访问。
// 生产环境建议交由 nginx/CDN 直出，并在 nginx 层做限速、防盗链等防护。
app.use(
  "/uploads",
  express.static(config.uploadDir, {
    fallthrough: false,
    maxAge: "7d",
  }),
);

app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
