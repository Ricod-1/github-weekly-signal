/**
 * ============================================================
 * 搜索筛选模块
 * 功能：对项目列表进行关键词搜索和语言筛选
 * ============================================================
 */

/**
 * 筛选项目列表
 * @param {Array<object>} projects - 项目列表
 * @param {object} filters - 筛选条件
 * @param {string} [filters.keyword] - 搜索关键词（匹配项目名、描述、导读）
 * @param {string} [filters.language] - 编程语言筛选
 * @param {boolean} [filters.favoritesOnly] - 仅显示收藏
 * @param {Array<string>} [filters.favoriteList] - 收藏的项目 fullName 列表
 * @returns {Array<object>} 筛选后的项目列表
 */
export function filterProjects(projects, filters = {}) {
  let result = [...projects];

  // 关键词搜索
  if (filters.keyword && filters.keyword.trim()) {
    const keyword = filters.keyword.trim().toLowerCase();
    result = result.filter((project) => {
      const explanation = project.explanation || {};
      const searchableText = [
        project.fullName,
        project.owner,
        project.name,
        project.description,
        project.language,
        explanation.一句话总结,
        explanation.解决的问题,
        explanation.适合谁,
        ...(explanation.核心能力 || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }

  // 语言筛选
  if (filters.language && filters.language !== 'all') {
    result = result.filter((project) => project.language === filters.language);
  }

  // 仅显示收藏
  if (filters.favoritesOnly && filters.favoriteList) {
    result = result.filter((project) => filters.favoriteList.includes(project.fullName));
  }

  return result;
}

/**
 * 获取项目列表中所有不重复的编程语言
 * @param {Array<object>} projects - 项目列表
 * @returns {Array<string>} 语言列表（按字母排序）
 */
export function getLanguages(projects) {
  const languages = new Set();
  projects.forEach((project) => {
    if (project.language && project.language !== '未标注') {
      languages.add(project.language);
    }
  });
  return Array.from(languages).sort();
}

/**
 * 高亮文本中的关键词
 * @param {string} text - 原始文本
 * @param {string} keyword - 关键词
 * @returns {string} 带高亮标记的 HTML 字符串
 */
export function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

export default {
  filterProjects,
  getLanguages,
  highlightKeyword
};
