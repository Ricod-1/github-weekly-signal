/**
 * ============================================================
 * 周报生成模块
 * 功能：抓取 GitHub Trending，读取 README，调用 AI 生成导读，组装周报
 * 优化：项目级并发处理，大幅缩短生成时间
 * ============================================================
 */

import { fetchTrending } from './services/trending.js';
import { explainProject } from './services/deepseek.js';
import { withRetry } from './services/retry.js';
import { saveReport } from './storage.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

/**
 * 并发控制：限制同时运行的异步任务数量
 * 作用：避免同时发起过多 API 请求导致限流，同时提升整体处理速度
 * 原理：启动 N 个工作者，每个工作者不断从队列取任务执行，直到全部完成
 * @param {Array} items - 待处理的元素数组
 * @param {Function} mapper - 每个元素的处理函数 (item, index) => Promise
 * @param {number} concurrency - 最大并发数
 * @returns {Promise<Array>} 按原顺序返回的处理结果数组
 */
async function mapWithConcurrency(items, mapper, concurrency = 3) {
  const results = new Array(items.length);
  let currentIndex = 0;
  let completedCount = 0;

  /**
   * 工作者函数：不断从队列取任务执行，直到所有任务完成
   */
  async function worker(workerId) {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      logger.debug(`[Worker-${workerId}] 开始处理任务 [${index + 1}/${items.length}]: ${item.fullName || item}`);

      try {
        results[index] = await mapper(item, index);
      } catch (error) {
        // 单个任务失败不影响其他任务，记录错误并放入 null
        logger.warn(`[Worker-${workerId}] 任务失败 [${index + 1}/${items.length}]:`, error);
        results[index] = null;
      }

      completedCount++;
      logger.debug(
        `[Worker-${workerId}] 任务完成 [${index + 1}/${items.length}]，总进度: ${completedCount}/${items.length}`
      );
    }
  }

  // 启动指定数量的工作者（不超过任务总数）
  const workerCount = Math.min(concurrency, items.length);
  logger.info(`启动 ${workerCount} 个并发工作者处理 ${items.length} 个任务`);

  const workers = Array.from({ length: workerCount }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  return results;
}

/**
 * 计算指定日期所在周的周日日期（作为周报 key）
 * @param {Date} date - 日期对象
 * @returns {string} 周标识，格式 YYYY-MM-DD（周日日期）
 */
export function weekKey(date = new Date()) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: config.timezone }));
  const day = local.getDay();
  const sunday = new Date(local);
  sunday.setDate(local.getDate() - day);
  const yyyy = sunday.getFullYear();
  const mm = String(sunday.getMonth() + 1).padStart(2, '0');
  const dd = String(sunday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 读取指定 GitHub 仓库的 README 文件
 * @param {string} fullName - 仓库完整名称 owner/name
 * @param {Function} [fetchImpl] - 自定义 fetch 实现（用于测试）
 * @param {object} [retryOptions] - 重试配置
 * @returns {Promise<string>} README 内容，失败时返回空字符串
 */
export async function readProjectReadme(fullName, fetchImpl = fetch, retryOptions = { retries: 3, delayMs: 400 }) {
  return withRetry(async () => {
    const response = await fetchImpl(`https://raw.githubusercontent.com/${fullName}/HEAD/README.md`, {
      headers: { 'User-Agent': 'github-weekly-signal/0.2' }
    });
    if (!response.ok) {
      throw new Error(`README 获取失败: ${response.status}`);
    }
    return response.text();
  }, retryOptions);
}

/**
 * AI 导读失败时的降级内容
 * @param {object} project - 项目对象
 * @returns {object} 降级导读对象
 */
function fallbackExplanation(project) {
  return {
    一句话总结: project.description || '暂无中文导读',
    解决的问题: '模型服务暂时不可用，请稍后重试',
    核心能力: [],
    快速开始: '前往 GitHub 仓库查看 README',
    适合谁: '关注开源趋势的开发者',
    注意事项: '本条导读未完成自动生成'
  };
}

/**
 * 处理单个项目：读取 README + 生成 AI 导读
 * 抽成独立函数，方便并发调用
 * @param {object} project - 项目对象
 * @param {object} options - 处理选项
 * @param {Function} options.fetchImpl - 自定义 fetch 实现
 * @param {Function} options.explain - 自定义 AI 导读函数
 * @param {number} options.index - 项目索引（用于日志）
 * @param {number} options.total - 项目总数（用于日志）
 * @returns {Promise<object>} 处理后的项目对象（含 explanation）
 */
async function processSingleProject(project, { fetchImpl, explain, index, total }) {
  logger.info(`[${index + 1}/${total}] 开始处理: ${project.fullName}`);
  const startTime = Date.now();

  // 1. 读取 README（失败不阻断，返回空字符串）
  const readme = await withRetry(() =>
    readProjectReadme(project.fullName, fetchImpl, { retries: 2, delayMs: 300 })
  ).catch((error) => {
    logger.warn(`[${index + 1}/${total}] README 读取失败: ${project.fullName}`, error.message);
    return '';
  });

  // 2. 生成 AI 导读（失败使用降级内容）
  const explanation = await withRetry(() => explain(project, readme, { fetchImpl }), {
    retries: 2,
    delayMs: 500
  }).catch((error) => {
    logger.warn(`[${index + 1}/${total}] AI 导读失败: ${project.fullName}`, error.message);
    return fallbackExplanation(project);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`[${index + 1}/${total}] 处理完成: ${project.fullName}，耗时 ${duration}s`);

  return { ...project, explanation };
}

/**
 * 生成一期完整的周报
 * @param {object} [options] - 生成选项
 * @param {Function} [options.trendingFetcher] - 自定义 Trending 抓取函数
 * @param {Function} [options.fetchImpl] - 自定义 fetch 实现
 * @param {Function} [options.explain] - 自定义 AI 导读函数
 * @param {Date} [options.now] - 自定义当前时间（用于测试）
 * @param {string} [options.language] - 编程语言筛选（如 javascript, python）
 * @param {number} [options.limit] - 项目数量上限
 * @param {number} [options.concurrency] - 并发处理数，默认读取环境变量 REPORT_CONCURRENCY，否则 3
 * @returns {Promise<object>} 生成的周报对象
 */
export async function generateWeeklyReport({
  trendingFetcher = fetchTrending,
  fetchImpl = fetch,
  explain = explainProject,
  now = new Date(),
  language = '',
  limit = config.report.maxProjects,
  concurrency = Number(process.env.REPORT_CONCURRENCY) || 5
} = {}) {
  const totalStartTime = Date.now();
  logger.info(`开始生成周报，语言筛选: ${language || '全部'}，上限: ${limit}，并发数: ${concurrency}`);

  // 1. 抓取 Trending 列表
  const projects = await trendingFetcher({ fetchImpl, language });
  logger.info(`抓取到 ${projects.length} 个 Trending 项目`);

  // 2. 并发处理项目（读取 README + AI 导读）
  const targetProjects = projects.slice(0, limit);

  const explainedResults = await mapWithConcurrency(
    targetProjects,
    (project, index) =>
      processSingleProject(project, {
        fetchImpl,
        explain,
        index,
        total: targetProjects.length
      }),
    concurrency
  );

  // 过滤掉处理失败的项目（null），保持原有顺序
  const explained = explainedResults.filter(Boolean);
  logger.info(`项目处理完成，成功 ${explained.length}/${targetProjects.length} 个`);

  // 3. 组装并保存周报
  const key = weekKey(now);
  const report = {
    weekKey: key,
    generatedAt: now.toISOString(),
    title: `${key} 周开源信号`,
    language: language || 'all',
    projects: explained
  };

  await saveReport(report);

  const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(1);
  logger.info(`周报生成完成: ${key}，共 ${explained.length} 个项目，总耗时 ${totalDuration}s`);

  return report;
}

export default {
  weekKey,
  readProjectReadme,
  generateWeeklyReport
};
