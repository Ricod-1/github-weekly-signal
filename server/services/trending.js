/**
 * ============================================================
 * GitHub Trending 抓取服务
 * 功能：抓取并解析 GitHub Trending 页面，支持按语言筛选
 * ============================================================
 */

import * as cheerio from 'cheerio';
import { withRetry } from './retry.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * 从文本中提取数字（处理千分位逗号和单位）
 * @param {string} value - 原始文本
 * @returns {number} 提取的数字
 */
function numberFromText(value = '') {
  const normalized = value.replace(/,/g, '').match(/[\d.]+/);
  return normalized ? Number(normalized[0]) : 0;
}

/**
 * 解析 GitHub Trending HTML 页面
 * @param {string} html - HTML 内容
 * @returns {Array<object>} 项目列表
 */
export function parseTrendingHtml(html) {
  const $ = cheerio.load(html);
  return $('article.Box-row')
    .map((index, element) => {
      const link = $(element).find('h2 a').first();
      const parts = link
        .text()
        .trim()
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length < 2) return null;

      const fullName = parts.slice(0, 2).join('/');

      // 提取本周 star 增长
      const weeklyText = $(element)
        .find('span')
        .filter((_, span) => /stars? this week/i.test($(span).text()))
        .first()
        .text();

      // 提取累计 star 数
      const totalStars = $(element).find('a[href$="/stargazers"]').first().text();

      return {
        rank: index + 1,
        fullName,
        owner: parts[0],
        name: parts[1],
        description: $(element).find('p').first().text().trim(),
        language: $(element).find('[itemprop="programmingLanguage"]').first().text().trim() || '未标注',
        starsThisWeek: numberFromText(weeklyText),
        stars: numberFromText(totalStars),
        url: `https://github.com/${fullName}`
      };
    })
    .get()
    .filter(Boolean);
}

/**
 * 构建 GitHub Trending URL
 * @param {object} options - 选项
 * @param {string} [options.language] - 编程语言筛选（小写，如 javascript, python）
 * @param {string} [options.since] - 时间范围：daily, weekly, monthly
 * @returns {string} Trending 页面 URL
 */
export function buildTrendingUrl({ language = '', since = config.report.trendingSince } = {}) {
  const baseUrl = 'https://github.com/trending';
  const params = new URLSearchParams();
  params.set('since', since);

  if (language) {
    return `${baseUrl}/${encodeURIComponent(language)}?${params.toString()}`;
  }
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 抓取 GitHub Trending 列表
 * @param {object} [options] - 选项
 * @param {Function} [options.fetchImpl] - 自定义 fetch 实现（用于测试）
 * @param {string} [options.language] - 编程语言筛选
 * @param {string} [options.since] - 时间范围
 * @param {number} [options.limit] - 返回数量上限
 * @returns {Promise<Array<object>>} 项目列表
 */
export async function fetchTrending({
  fetchImpl = fetch,
  language = '',
  since = config.report.trendingSince,
  limit = config.report.maxProjects
} = {}) {
  const url = buildTrendingUrl({ language, since });
  logger.debug(`抓取 GitHub Trending: ${url}`);

  const response = await withRetry(
    () =>
      fetchImpl(url, {
        headers: { 'User-Agent': 'github-weekly-signal/0.2' }
      }),
    { retries: 3, delayMs: 500 }
  );

  if (!response.ok) {
    throw new Error(`GitHub Trending 请求失败: ${response.status}`);
  }

  const html = await response.text();
  const projects = parseTrendingHtml(html);

  logger.info(`GitHub Trending 解析完成，共 ${projects.length} 个项目`);
  return projects.slice(0, limit);
}

export default {
  parseTrendingHtml,
  buildTrendingUrl,
  fetchTrending
};
