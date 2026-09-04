/**
 * ============================================================
 * 数据存储模块
 * 功能：管理周报数据的读写，提供内存缓存提升性能
 * ============================================================
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { logger } from './utils/logger.js';

// 周报存储目录（绝对路径）
const reportsDir = path.resolve(config.storage.reportsDir);

// 内存缓存：避免每次请求都读文件
// key: weekKey, value: { report, mtime }
const reportCache = new Map();

// 缓存有效期（毫秒），5 分钟
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 确保存储目录存在
 * @returns {Promise<void>}
 */
export async function ensureStorage() {
  await fs.mkdir(reportsDir, { recursive: true });
  logger.debug(`存储目录已就绪: ${reportsDir}`);
}

/**
 * 保存周报数据到文件
 * @param {object} report - 周报对象
 * @returns {Promise<object>} 保存后的周报对象
 */
export async function saveReport(report) {
  await ensureStorage();
  const file = path.join(reportsDir, `${report.weekKey}.json`);
  await fs.writeFile(file, JSON.stringify(report, null, 2), 'utf8');

  // 更新缓存
  reportCache.set(report.weekKey, {
    report,
    mtime: Date.now()
  });

  logger.info(`周报已保存: ${report.weekKey}（${report.projects.length} 个项目）`);
  return report;
}

/**
 * 更新周报（等同于 saveReport，语义更清晰）
 * @param {object} report - 周报对象
 * @returns {Promise<object>}
 */
export async function updateReport(report) {
  return saveReport(report);
}

/**
 * 读取指定周报文件
 * @param {string} weekKey - 周报周标识
 * @returns {Promise<object|null>} 周报对象，不存在时返回 null
 */
export async function getReportByWeekKey(weekKey) {
  // 检查缓存
  const cached = reportCache.get(weekKey);
  if (cached && Date.now() - cached.mtime < CACHE_TTL) {
    return cached.report;
  }

  try {
    const file = path.join(reportsDir, `${weekKey}.json`);
    const content = await fs.readFile(file, 'utf8');
    const report = JSON.parse(content);

    // 写入缓存
    reportCache.set(weekKey, { report, mtime: Date.now() });
    return report;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    logger.error(`读取周报失败: ${weekKey}`, error);
    throw error;
  }
}

/**
 * 获取所有周报列表（按周标识倒序，最新的在前）
 * @returns {Promise<object[]>} 周报对象数组
 */
export async function listReports() {
  await ensureStorage();

  let files;
  try {
    files = await fs.readdir(reportsDir);
  } catch (error) {
    logger.error('读取周报目录失败', error);
    return [];
  }

  const jsonFiles = files
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse();

  // 并行读取所有周报（使用缓存优先）
  const reports = await Promise.all(
    jsonFiles.map(async (file) => {
      const weekKey = file.replace('.json', '');
      return getReportByWeekKey(weekKey);
    })
  );

  return reports.filter(Boolean);
}

/**
 * 获取最新一期周报
 * @returns {Promise<object|null>} 最新周报对象，没有时返回 null
 */
export async function getLatestReport() {
  const reports = await listReports();
  return reports[0] || null;
}

/**
 * 清除指定周报的缓存
 * @param {string} [weekKey] - 周报周标识，不传则清除所有缓存
 */
export function clearCache(weekKey) {
  if (weekKey) {
    reportCache.delete(weekKey);
  } else {
    reportCache.clear();
  }
}

export default {
  ensureStorage,
  saveReport,
  updateReport,
  getReportByWeekKey,
  listReports,
  getLatestReport,
  clearCache
};
