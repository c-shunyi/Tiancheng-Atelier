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
app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
