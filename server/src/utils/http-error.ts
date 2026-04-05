/**
 * 用于在业务层和中间件之间传递 HTTP 错误信息。
 */
export class HttpError extends Error {
  statusCode: number;
  code: number;

  constructor(statusCode: number, message: string, code = statusCode) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * 判断给定值是否为 HttpError 实例。
 */
export const isHttpError = (value: unknown): value is HttpError => {
  return value instanceof HttpError;
};
