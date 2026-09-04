/**
 * ============================================================
 * 日志工具模块
 * 功能：提供统一的日志输出接口，支持不同级别和格式化
 * ============================================================
 */

/**
 * 日志级别枚举
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * 当前日志级别（生产环境默认 info，开发环境默认 debug）
 */
const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;

/**
 * 获取当前时间戳字符串
 * @returns {string} 格式化的时间戳
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * 获取调用栈信息（用于定位日志来源）
 * @returns {string} 调用位置信息
 */
function getCallerInfo() {
  const stack = new Error().stack;
  if (!stack) return '';
  const lines = stack.split('\n');
  // 第0行是 Error，第1行是 getCallerInfo，第2行是 log 方法，第3行是实际调用者
  const callerLine = lines[4] || lines[3] || '';
  const match = callerLine.match(/\(([^)]+)\)/);
  return match ? match[1] : callerLine.trim();
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {*} [meta] - 附加元数据
 * @returns {string} 格式化后的日志字符串
 */
function formatMessage(level, message, meta) {
  const timestamp = getTimestamp();
  const levelStr = level.toUpperCase().padEnd(5);
  let formatted = `[${timestamp}] [${levelStr}] ${message}`;

  if (meta !== undefined) {
    if (meta instanceof Error) {
      formatted += `\n${meta.stack || meta.message}`;
    } else if (typeof meta === 'object') {
      try {
        formatted += ` ${JSON.stringify(meta)}`;
      } catch {
        formatted += ` [object]`;
      }
    } else {
      formatted += ` ${meta}`;
    }
  }

  return formatted;
}

/**
 * 日志记录器对象
 */
export const logger = {
  /**
   * 调试级别日志（开发环境可见）
   * @param {string} message - 日志消息
   * @param {*} [meta] - 附加元数据
   */
  debug(message, meta) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  /**
   * 信息级别日志
   * @param {string} message - 日志消息
   * @param {*} [meta] - 附加元数据
   */
  info(message, meta) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message, meta));
    }
  },

  /**
   * 警告级别日志
   * @param {string} message - 日志消息
   * @param {*} [meta] - 附加元数据
   */
  warn(message, meta) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  /**
   * 错误级别日志
   * @param {string} message - 日志消息
   * @param {*} [meta] - 附加元数据（通常是 Error 对象）
   */
  error(message, meta) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  }
};

export default logger;
