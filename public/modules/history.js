/**
 * ============================================================
 * 历史周报模块
 * 功能：加载和切换历史周报
 * ============================================================
 */

/**
 * 获取所有可用的周报列表
 * @returns {Promise<Array<object>>} 周报列表（包含 weekKey, title 等元信息）
 */
export async function fetchReportList() {
  const response = await fetch('/api/reports');
  if (!response.ok) {
    throw new Error('获取周报列表失败');
  }
  const reports = await response.json();
  // 只返回元信息，不包含完整 projects 数据
  return reports.map((report) => ({
    weekKey: report.weekKey,
    title: report.title,
    generatedAt: report.generatedAt,
    projectCount: report.projects?.length || 0
  }));
}

/**
 * 获取指定周报的完整数据
 * @param {string} weekKey - 周报周标识
 * @returns {Promise<object>} 周报完整数据
 */
export async function fetchReport(weekKey) {
  const response = await fetch(`/api/report/${encodeURIComponent(weekKey)}`);
  if (!response.ok) {
    throw new Error(`获取周报失败: ${weekKey}`);
  }
  return response.json();
}

/**
 * 获取最新周报
 * @returns {Promise<object>} 最新周报数据
 */
export async function fetchLatestReport() {
  const response = await fetch('/api/report/latest');
  if (!response.ok) {
    throw new Error('暂无周报');
  }
  return response.json();
}

/**
 * 格式化日期为可读字符串
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 格式化周报标题（去掉前缀的日期，只保留描述）
 * @param {string} title - 原始标题
 * @returns {string} 格式化后的标题
 */
export function formatReportTitle(title) {
  // 标题格式通常是 "2026-08-09 周开源信号"
  const match = title.match(/^\d{4}-\d{2}-\d{2}\s+(.*)$/);
  return match ? match[1] : title;
}

export default {
  fetchReportList,
  fetchReport,
  fetchLatestReport,
  formatDate,
  formatReportTitle
};
