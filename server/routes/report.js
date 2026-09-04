/**
 * ============================================================
 * 周报路由模块
 * 功能：提供周报查询相关的 REST API
 * ============================================================
 */

import { Router } from 'express';
import { getLatestReport, listReports, getReportByWeekKey } from '../storage.js';
import { notFound } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/report/latest
 * 获取最新一期周报
 */
router.get('/report/latest', async (_req, res, next) => {
  try {
    const report = await getLatestReport();
    if (!report) {
      return next(notFound('暂无周报，等待本周日自动生成'));
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports
 * 获取所有周报列表（按时间倒序）
 */
router.get('/reports', async (_req, res, next) => {
  try {
    const reports = await listReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/:weekKey
 * 获取指定周的周报
 * @param {string} weekKey - 周报周标识，如 2026-08-09
 */
router.get('/report/:weekKey', async (req, res, next) => {
  try {
    const { weekKey } = req.params;
    const report = await getReportByWeekKey(weekKey);
    if (!report) {
      return next(notFound(`未找到 ${weekKey} 的周报`));
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

export default router;
