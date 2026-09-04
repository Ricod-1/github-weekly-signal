/**
 * ============================================================
 * 开源信号 · 应用入口
 * 功能：初始化 Express 应用，挂载中间件和路由，启动定时任务
 * ============================================================
 */

import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config, validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import { ensureStorage, getReportByWeekKey } from './storage.js';
import { generateWeeklyReport, weekKey } from './report.js';
import { withRetry } from './services/retry.js';

// 中间件
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// 路由模块
import reportRoutes from './routes/report.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/project.js';
import feedRoutes from './routes/feed.js';

// 获取当前目录（ESM 模式下需要手动计算）
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 创建并配置 Express 应用
 * @returns {import('express').Express} 配置好的 Express 应用
 */
function createApp() {
  const app = express();

  // ---------- 全局中间件 ----------
  // 解析 JSON 请求体
  app.use(express.json({ limit: '1mb' }));

  // 请求日志
  app.use(requestLogger);

  // 静态文件服务（前端页面）
  app.use(express.static(path.resolve(__dirname, '../public'), {
    maxAge: config.isProduction ? '1h' : 0,
    etag: true
  }));

  // ---------- API 路由 ----------
  app.use('/api', reportRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', feedRoutes);
  app.use('/', feedRoutes); // /health 等根路径接口

  // ---------- 前端路由兜底（SPA） ----------
  // 所有非 API、非静态文件的请求都返回 index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  // ---------- 错误处理 ----------
  // 404 处理（API 路由）
  app.use('/api', notFoundHandler);

  // 统一错误处理中间件（必须放在最后）
  app.use(errorHandler);

  return app;
}

/**
 * 启动定时任务（每周日 18:00 生成周报）
 */
function startCronJobs() {
  const task = cron.schedule(
    config.cronExpression,
    async () => {
      logger.info('定时任务触发：开始生成周报');
      try {
        await withRetry(() => generateWeeklyReport(), { retries: 3, delayMs: 60000 });
        logger.info('定时任务：周报生成完成');
      } catch (error) {
        logger.error('定时任务：周报生成失败', error);
      }
    },
    {
      timezone: config.timezone,
      scheduled: true
    }
  );

  logger.info(`定时任务已启动：${config.cronExpression} (${config.timezone})`);
  return task;
}

/**
 * 启动时检查本周是否已有周报，没有则自动生成
 * 解决本地开发时服务器不常驻、定时任务从未触发的问题
 */
async function ensureCurrentWeekReport() {
  const currentWeekKey = weekKey();
  logger.info(`检查本周周报：${currentWeekKey}`);

  try {
    const existing = await getReportByWeekKey(currentWeekKey);
    if (existing) {
      logger.info(`本周周报已存在：${currentWeekKey}（${existing.projects.length} 个项目），跳过自动生成`);
      return;
    }

    logger.info('本周周报不存在，启动后台自动生成…');
    // 后台异步生成，不阻塞服务器启动
    withRetry(() => generateWeeklyReport(), { retries: 3, delayMs: 60000 })
      .then(() => logger.info('启动自动生成：周报生成完成'))
      .catch((error) => logger.error('启动自动生成：周报生成失败', error));
  } catch (error) {
    logger.warn('检查本周周报失败，跳过自动生成', error);
  }
}

/**
 * 应用启动函数
 */
async function bootstrap() {
  logger.info('========================================');
  logger.info('  开源信号 · GitHub 周榜中文导读');
  logger.info(`  版本: 0.2.0 | 环境: ${config.nodeEnv}`);
  logger.info('========================================');

  // 1. 配置校验（输出警告，不阻断启动）
  const warnings = validateConfig();
  warnings.forEach((warning) => logger.warn(`配置警告: ${warning}`));

  // 2. 确保存储目录存在
  await ensureStorage();

  // 3. 创建 Express 应用
  const app = createApp();

  // 4. 启动定时任务
  startCronJobs();

  // 5. 启动 HTTP 服务
  const server = app.listen(config.port, () => {
    logger.info(`服务已启动: http://localhost:${config.port}`);
    logger.info(`健康检查: http://localhost:${config.port}/health`);
  });

  // 6. 启动后检查本周周报（后台异步，不阻塞）
  ensureCurrentWeekReport();

  // 7. 优雅关闭处理
  const gracefulShutdown = (signal) => {
    logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
    server.close(() => {
      logger.info('HTTP 服务已关闭');
      process.exit(0);
    });
    // 强制关闭超时
    setTimeout(() => {
      logger.error('优雅关闭超时，强制退出');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 未捕获异常处理
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', error);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝', reason);
  });

  return server;
}

// 启动应用
bootstrap().catch((error) => {
  logger.error('应用启动失败', error);
  process.exit(1);
});
