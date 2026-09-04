/**
 * ============================================================
 * 订阅与导出路由模块
 * 功能：提供 RSS 订阅源和周报 Markdown 导出
 * ============================================================
 */

import { Router } from 'express';
import { getLatestReport, listReports, getReportByWeekKey } from '../storage.js';
import { exportReportToMarkdown } from '../utils/exporter.js';
import { notFound } from '../middleware/errorHandler.js';
import { config } from '../config.js';

const router = Router();

/**
 * GET /api/rss
 * RSS 2.0 订阅源，包含最近的周报列表
 */
router.get('/rss', async (_req, res, next) => {
  try {
    const reports = await listReports();
    const latest = reports[0];

    const items = reports.slice(0, 20).map((report) => {
      const projectList = report.projects
        .map((p) => `<li><strong>${p.fullName}</strong> - ${p.description || ''}</li>`)
        .join('');
      return `
    <item>
      <title>${escapeXml(report.title)}</title>
      <link>https://github.com/trending?since=weekly</link>
      <guid isPermaLink="false">${escapeXml(report.weekKey)}</guid>
      <pubDate>${new Date(report.generatedAt).toUTCString()}</pubDate>
      <description><![CDATA[
        <p>本周 GitHub Trending 周榜前 ${report.projects.length} 个项目：</p>
        <ol>${projectList}</ol>
      ]]></description>
    </item>`;
    }).join('');

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>开源信号 · GitHub 周榜中文导读</title>
    <link>https://github.com/trending?since=weekly</link>
    <description>每周日自动更新 GitHub Trending 周榜前十项目的中文导读</description>
    <language>zh-CN</language>
    <lastBuildDate>${latest ? new Date(latest.generatedAt).toUTCString() : new Date().toUTCString()}</lastBuildDate>
    <generator>github-weekly-signal</generator>
    ${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rssContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/:weekKey/export
 * 导出指定周报为 Markdown 文件
 */
router.get('/report/:weekKey/export', async (req, res, next) => {
  try {
    const { weekKey } = req.params;
    const report = await getReportByWeekKey(weekKey);

    if (!report) {
      return next(notFound(`未找到 ${weekKey} 的周报`));
    }

    const markdown = exportReportToMarkdown(report);
    const filename = `github-weekly-${weekKey}.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /health
 * 健康检查接口
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    uptime: process.uptime()
  });
});

/**
 * XML 转义工具函数
 * @param {string} str - 待转义字符串
 * @returns {string} 转义后的字符串
 */
function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
