/**
 * ============================================================
 * 项目路由模块
 * 功能：提供单个项目的导读生成接口
 * ============================================================
 */

import { Router } from 'express';
import { getLatestReport, updateReport } from '../storage.js';
import { readProjectReadme } from '../report.js';
import { explainProject } from '../services/deepseek.js';
import { notFound, badGateway } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * 从最新周报中查找指定项目
 * @param {string} fullName - 项目完整名称 owner/name
 * @returns {Promise<{report: object, project: object}|null>}
 */
async function findProjectInLatestReport(fullName) {
  const report = await getLatestReport();
  if (!report) return null;
  const project = report.projects.find((item) => item.fullName === fullName);
  return project ? { report, project } : null;
}

/**
 * POST /api/project/:owner/:name/explanation
 * 为指定项目生成（或重新生成）中文导读
 */
router.post('/project/:owner/:name/explanation', async (req, res, next) => {
  try {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const found = await findProjectInLatestReport(fullName);

    if (!found) {
      return next(notFound('项目不在当前周报中'));
    }

    const { report, project } = found;

    // 如果已有导读且非强制刷新，直接返回
    if (project.explanation?.一句话总结 && !req.query.force) {
      return res.json(project.explanation);
    }

    try {
      const readme = await readProjectReadme(fullName);
      const explanation = await explainProject(project, readme);
      project.explanation = explanation;
      await updateReport(report);
      res.json(explanation);
    } catch (error) {
      logger.error(`项目导读生成失败: ${fullName}`, error);
      next(badGateway('导读生成失败，请稍后再试'));
    }
  } catch (error) {
    next(error);
  }
});

export default router;
