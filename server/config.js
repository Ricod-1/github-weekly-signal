/**
 * ============================================================
 * 配置管理模块
 * 功能：统一管理环境变量，提供配置校验和默认值
 * ============================================================
 */

/**
 * 应用配置对象
 * 所有环境变量在此集中管理，避免散落各处的 process.env 调用
 */
export const config = {
  // 服务配置
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // 定时任务配置
  cronExpression: process.env.CRON_EXPRESSION || '0 18 * * 0',
  timezone: process.env.TIMEZONE || 'Asia/Shanghai',

  // DeepSeek AI 配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions',
    temperature: Number(process.env.DEEPSEEK_TEMPERATURE || 0.35),
    maxReadmeLength: Number(process.env.DEEPSEEK_MAX_README_LENGTH || 24000)
  },

  // 管理接口配置
  admin: {
    token: process.env.ADMIN_TOKEN || ''
  },

  // 存储配置
  storage: {
    reportsDir: process.env.REPORTS_DIR || 'data/reports'
  },

  // 周报配置
  report: {
    maxProjects: Number(process.env.REPORT_MAX_PROJECTS || 10),
    trendingSince: process.env.TRENDING_SINCE || 'weekly'
  }
};

/**
 * 校验必要配置，返回警告信息列表（不阻断启动）
 * @returns {string[]} 配置警告列表
 */
export function validateConfig() {
  const warnings = [];

  if (!config.deepseek.apiKey) {
    warnings.push('未配置 DEEPSEEK_API_KEY，AI 导读将使用降级文本');
  }

  if (!config.admin.token && config.isProduction) {
    warnings.push('生产环境建议配置 ADMIN_TOKEN 以保护管理接口');
  }

  return warnings;
}

export default config;
