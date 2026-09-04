/**
 * ============================================================
 * 管理路由模块
 * 功能：提供管理员操作接口（手动生成周报等）
 * ============================================================
 */

import { Router } from 'express';
import { generateWeeklyReport } from '../report.js';
import { withRetry } from '../services/retry.js';
import { requireAdmin } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 所有管理接口都需要管理员鉴权
router.use(requireAdmin);

/**
 * POST /api/admin/run-report
 * 手动触发生成周报
 * 立即返回 202 Accepted，后台异步执行生成任务
 */
router.post('/admin/run-report', async (_req, res, next) => {
  try {
    // 立即响应，避免长时间阻塞
    res.status(202).json({ message: '周报生成任务已启动，请稍后查看最新周报' });

    // 后台异步执行生成任务（带重试）
    withRetry(() => generateWeeklyReport(), { retries: 3, delayMs: 60000 })
      .then(() => logger.info('手动触发周报生成完成'))
      .catch((error) => logger.error('手动触发周报生成失败', error));
  } catch (error) {
    next(error);
  }
});

export default router;
