/**
 * ============================================================
 * 管理员鉴权中间件
 * 功能：验证管理接口的 Bearer Token
 * ============================================================
 */

import { config } from '../config.js';
import { unauthorized } from './errorHandler.js';

/**
 * 管理员鉴权中间件
 * 如果配置了 ADMIN_TOKEN，则要求请求头携带正确的 Bearer Token
 * 如果未配置 ADMIN_TOKEN（开发环境），则直接放行
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} _res - 响应对象（未使用）
 * @param {import('express').NextFunction} next - 下一个中间件
 */
export function requireAdmin(req, _res, next) {
  // 未配置管理员令牌时直接放行（仅建议开发环境使用）
  if (!config.admin.token) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(unauthorized('缺少有效的 Authorization 请求头'));
  }

  const token = authHeader.slice(7);
  if (token !== config.admin.token) {
    return next(unauthorized('管理员令牌无效'));
  }

  next();
}

export default requireAdmin;
