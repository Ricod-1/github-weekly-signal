/**
 * ============================================================
 * 请求日志中间件
 * 功能：记录每个 HTTP 请求的方法、路径、状态码和耗时
 * ============================================================
 */

import { logger } from '../utils/logger.js';

/**
 * 请求日志中间件
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, path, ip } = req;

  // 响应完成时记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // 根据状态码选择日志级别
    if (statusCode >= 500) {
      logger.error(`${method} ${path} ${statusCode} ${duration}ms - ${ip}`);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${path} ${statusCode} ${duration}ms - ${ip}`);
    } else {
      logger.info(`${method} ${path} ${statusCode} ${duration}ms`);
    }
  });

  next();
}

export default requestLogger;
