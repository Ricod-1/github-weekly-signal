/**
 * ============================================================
 * 本地收藏模块
 * 功能：使用 localStorage 管理用户收藏的项目
 * ============================================================
 */

// 本地存储 key
const STORAGE_KEY = 'github-weekly-signal-favorites';

/**
 * 获取所有收藏的项目 fullName 列表
 * @returns {Array<string>} 收藏的项目完整名称列表
 */
export function getFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 检查项目是否已收藏
 * @param {string} fullName - 项目完整名称 owner/name
 * @returns {boolean} 是否已收藏
 */
export function isFavorite(fullName) {
  return getFavorites().includes(fullName);
}

/**
 * 添加收藏
 * @param {string} fullName - 项目完整名称
 * @returns {Array<string>} 更新后的收藏列表
 */
export function addFavorite(fullName) {
  const favorites = getFavorites();
  if (!favorites.includes(fullName)) {
    favorites.push(fullName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
  return favorites;
}

/**
 * 移除收藏
 * @param {string} fullName - 项目完整名称
 * @returns {Array<string>} 更新后的收藏列表
 */
export function removeFavorite(fullName) {
  const favorites = getFavorites().filter((name) => name !== fullName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
}

/**
 * 切换收藏状态
 * @param {string} fullName - 项目完整名称
 * @returns {boolean} 切换后的收藏状态（true=已收藏）
 */
export function toggleFavorite(fullName) {
  if (isFavorite(fullName)) {
    removeFavorite(fullName);
    return false;
  }
  addFavorite(fullName);
  return true;
}

/**
 * 清空所有收藏
 */
export function clearFavorites() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 获取收藏数量
 * @returns {number} 收藏数量
 */
export function getFavoriteCount() {
  return getFavorites().length;
}

export default {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearFavorites,
  getFavoriteCount
};
