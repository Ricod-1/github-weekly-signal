/**
 * ============================================================
 * 统一错误处理中间件
 * 功能：捕获所有路由错误，返回统一格式的 JSON 响应
 * ============================================================
 */

import { logger } from '../utils/logger.js';

/**
 * 业务错误类，用于主动抛出可预期的业务异常
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP 状态码
   * @param {string} message - 错误消息
   * @param {*} [details] - 错误详情
   */
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 资源未找到错误
 * @param {string} message - 错误消息
 * @returns {AppError}
 */
export function notFound(message = '资源未找到') {
  return new AppError(404, message);
}

/**
 * 400 请求参数错误
 * @param {string} message - 错误消息
 * @param {*} [details] - 参数详情
 * @returns {AppError}
 */
export function badRequest(message = '请求参数错误', details) {
  return new AppError(400, message, details);
}

/**
 * 401 未授权错误
 * @param {string} message - 错误消息
 * @returns {AppError}
 */
export function unauthorized(message = '未授权访问') {
  return new AppError(401, message);
}

/**
 * 502 上游服务错误
 * @param {string} message - 错误消息
 * @returns {AppError}
 */
export function badGateway(message = '上游服务错误') {
  return new AppError(502, message);
}

/**
 * 统一错误处理中间件
 * 必须放在所有路由之后，作为 Express 的错误处理中间件
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} _next - 下一个中间件（未使用，以下划线开头）
 */
export function errorHandler(err, req, res, _next) {
  // 业务错误：直接返回状态码和消息
  if (err instanceof AppError) {
    logger.warn(`业务错误 [${err.statusCode}] ${req.method} ${req.path}: ${err.message}`);
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  // 语法错误（如 JSON 解析失败）
  if (err.type === 'entity.parse.failed') {
    logger.warn(`请求体解析失败 ${req.method} ${req.path}`);
    return res.status(400).json({ message: '请求体格式错误，请检查 JSON 语法' });
  }

  // 未知错误：记录完整堆栈，返回 500
  logger.error(`服务器错误 ${req.method} ${req.path}`, err);
  res.status(500).json({
    message: '服务器内部错误，请稍后重试',
    ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
  });
}

/**
 * 404 处理中间件（未匹配到任何路由时触发）
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `接口不存在：${req.method} ${req.path}`
  });
}

export default errorHandler;
