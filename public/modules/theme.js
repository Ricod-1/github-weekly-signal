/**
 * ============================================================
 * 主题切换模块
 * 功能：管理深色/浅色主题切换，支持跟随系统偏好和本地存储
 * ============================================================
 */

// 本地存储 key
const STORAGE_KEY = 'github-weekly-signal-theme';

// 主题枚举
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

/**
 * 获取当前主题
 * @returns {string} 当前主题（dark / light）
 */
export function getCurrentTheme() {
  // 优先从本地存储读取
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
    return saved;
  }
  // 其次跟随系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK;
  }
  // 默认浅色主题（符合企业级产品设计规范）
  return THEMES.LIGHT;
}

/**
 * 应用主题到文档
 * @param {string} theme - 主题名称
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === THEMES.LIGHT) {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

/**
 * 保存主题到本地存储
 * @param {string} theme - 主题名称
 */
export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * 切换主题
 * @returns {string} 切换后的主题
 */
export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
  saveTheme(next);
  return next;
}

/**
 * 初始化主题（页面加载时调用）
 */
export function initTheme() {
  const theme = getCurrentTheme();
  applyTheme(theme);

  // 监听系统主题变化（仅当用户未手动设置时跟随）
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        applyTheme(event.matches ? THEMES.DARK : THEMES.LIGHT);
      }
    });
  }
}

export default {
  THEMES,
  getCurrentTheme,
  applyTheme,
  saveTheme,
  toggleTheme,
  initTheme
};
