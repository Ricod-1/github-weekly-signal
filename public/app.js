/**
 * ============================================================
 * 开源信号 · 前端主应用
 * 功能：整合主题、搜索、收藏、历史周报等模块，渲染项目列表
 * ============================================================
 */

import { initTheme, toggleTheme } from './modules/theme.js';
import { filterProjects, getLanguages } from './modules/search.js';
import { isFavorite, toggleFavorite, getFavorites } from './modules/favorites.js';
import { fetchReportList, fetchReport, fetchLatestReport, formatDate } from './modules/history.js';

// ============================================================
// 全局状态
// ============================================================
const state = {
  report: null, // 当前周报数据
  allProjects: [], // 当前周报的所有项目（未筛选）
  filteredProjects: [], // 筛选后的项目列表
  selected: 0, // 当前选中的项目索引（在 filteredProjects 中）
  filters: {
    // 当前筛选条件
    keyword: '',
    language: 'all',
    favoritesOnly: false
  }
};

// ============================================================
// 工具函数
// ============================================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * HTML 转义，防止 XSS
 * @param {string} value - 待转义字符串
 * @returns {string} 转义后的字符串
 */
const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[char]
  );

/**
 * 格式化数字（大于 9999 时使用紧凑格式）
 * @param {number} value - 数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (value = 0) =>
  new Intl.NumberFormat('zh-CN', {
    notation: value > 9999 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value);

/**
 * 显示 Toast 提示
 * @param {string} message - 提示消息
 * @param {number} [duration=2000] - 显示时长（毫秒）
 */
function showToast(message, duration = 2000) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

// ============================================================
// 精选项目卡片渲染
// ============================================================

/**
 * 渲染精选项目卡片
 * @param {object} project - 项目对象
 */
function renderFeature(project) {
  const explanation = project.explanation || {};
  const glanceProblem = explanation.解决的问题 || project.description || '暂无项目简介';
  const glanceAudience = explanation.适合谁 || '关注开源趋势的开发者';
  const favorited = isFavorite(project.fullName);

  // 核心能力标签
  const abilities = Array.isArray(explanation.核心能力)
    ? explanation.核心能力.map((item) => `<span class="ability-tag">${escapeHtml(item)}</span>`).join('')
    : '';

  // 注意事项（独有内容，默认显示）
  const caution = explanation.注意事项
    ? `<div class="feature-caution"><span class="caution-label">注意事项</span><p>${escapeHtml(explanation.注意事项)}</p></div>`
    : '';

  $('#feature-card').innerHTML = `
    <div class="feature-top">
      <span class="rank-tag">精选项目 / ${String(project.rank).padStart(2, '0')}</span>
      <div class="feature-actions">
        <button class="favorite-button ${favorited ? 'favorited' : ''}" type="button" data-fullname="${escapeHtml(project.fullName)}" aria-label="${favorited ? '取消收藏' : '收藏项目'}" title="${favorited ? '取消收藏' : '收藏项目'}">
          ${favorited ? '♥' : '♡'}
        </button>
        <a class="feature-link" href="${project.url}" target="_blank" rel="noreferrer">打开 GitHub ↗</a>
      </div>
    </div>
    <h2><span class="repo-name">${escapeHtml(project.owner)}</span> / ${escapeHtml(project.name)}</h2>
    <p class="feature-description">${escapeHtml(project.description || '暂无项目描述')}</p>
    <div class="feature-stats">
      <span>本周 <strong>+${formatNumber(project.starsThisWeek)} ★</strong></span>
      <span>累计 <strong>${formatNumber(project.stars)} ★</strong></span>
      <span>语言 <strong>${escapeHtml(project.language)}</strong></span>
    </div>
    ${abilities ? `<div class="feature-abilities"><span class="abilities-label">核心能力</span><div class="abilities-list">${abilities}</div></div>` : ''}
    <div class="feature-glance">
      <div><span>解决什么问题</span><p>${escapeHtml(glanceProblem)}</p></div>
      <div><span>适合谁</span><p>${escapeHtml(glanceAudience)}</p></div>
    </div>
    ${explanation.快速开始 ? `<div class="feature-quickstart"><span class="quickstart-label">快速开始</span><p>${escapeHtml(explanation.快速开始)}</p></div>` : ''}
    ${caution}
    <div class="feature-bottom">
      <div class="feature-note">${escapeHtml(explanation.一句话总结 || '正在准备中文导读…')}</div>
    </div>`;

  // 绑定收藏事件
  $('.favorite-button')?.addEventListener('click', (e) => handleFavoriteToggle(e, project));
}

// ============================================================
// 榜单列表渲染
// ============================================================

/**
 * 渲染榜单列表
 * @param {Array<object>} projects - 项目列表
 */
function renderRanking(projects) {
  if (projects.length === 0) {
    $('#ranking-list').innerHTML = '<div class="empty">没有匹配的项目。</div>';
    $('#ranking-count').textContent = '0 项';
    return;
  }

  $('#ranking-count').textContent = `${projects.length} 项`;
  $('#ranking-list').innerHTML = projects
    .map((project, index) => {
      const favorited = isFavorite(project.fullName);
      return `<div class="ranking-item ${index === state.selected ? 'selected' : ''}" data-index="${index}" role="button" tabindex="0">
        <span class="ranking-number">${String(project.rank).padStart(2, '0')}</span>
        <div class="ranking-info">
          <div class="ranking-name">${escapeHtml(project.fullName)}</div>
          <div class="ranking-language">${escapeHtml(project.language)}</div>
        </div>
        <span class="ranking-stars">+${formatNumber(project.starsThisWeek)} ★</span>
        <span class="ranking-favorite ${favorited ? 'favorited' : ''}" aria-hidden="true">${favorited ? '♥' : '♡'}</span>
      </div>`;
    })
    .join('');

  // 绑定点击和键盘事件
  const rankingList = $('#ranking-list');
  rankingList.onclick = (event) => {
    const item = event.target.closest('.ranking-item');
    if (item) selectProject(Number(item.dataset.index));
  };
  rankingList.onkeydown = (event) => {
    const item = event.target.closest('.ranking-item');
    if (item && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      selectProject(Number(item.dataset.index));
    }
  };
}

/**
 * 更新榜单选中状态
 */
function updateRankingSelection() {
  $$('.ranking-item').forEach((item) => {
    item.classList.toggle('selected', Number(item.dataset.index) === state.selected);
  });
}

/**
 * 选中指定项目
 * @param {number} index - 项目在 filteredProjects 中的索引
 */
function selectProject(index) {
  if (!state.filteredProjects[index] || index === state.selected) return;
  state.selected = index;
  renderFeature(state.filteredProjects[index]);
  updateRankingSelection();
}

// ============================================================
// 收藏功能
// ============================================================

/**
 * 处理收藏按钮点击
 * @param {Event} event - 点击事件
 * @param {object} project - 项目对象
 */
function handleFavoriteToggle(event, project) {
  event.stopPropagation();
  const favorited = toggleFavorite(project.fullName);
  showToast(favorited ? '已添加到收藏' : '已取消收藏');

  // 更新按钮状态
  const btn = event.currentTarget;
  btn.classList.toggle('favorited', favorited);
  btn.textContent = favorited ? '♥' : '♡';
  btn.setAttribute('aria-label', favorited ? '取消收藏' : '收藏项目');

  // 如果开启了"仅看收藏"，重新筛选
  if (state.filters.favoritesOnly) {
    applyFilters();
  } else {
    // 只更新榜单中的收藏图标
    renderRanking(state.filteredProjects);
  }
}

// ============================================================
// 搜索与筛选
// ============================================================

/**
 * 应用筛选条件并更新界面
 */
function applyFilters() {
  const favoriteList = getFavorites();
  state.filteredProjects = filterProjects(state.allProjects, {
    ...state.filters,
    favoriteList
  });

  // 重置选中索引
  state.selected = 0;

  // 更新界面
  renderRanking(state.filteredProjects);
  if (state.filteredProjects.length > 0) {
    renderFeature(state.filteredProjects[0]);
  } else {
    $('#feature-card').innerHTML = '<div class="empty">没有匹配的项目。试试调整搜索关键词或筛选条件。</div>';
  }

  // 更新搜索统计
  const hasActiveFilters = state.filters.keyword || state.filters.language !== 'all' || state.filters.favoritesOnly;
  $('#search-stats').hidden = !hasActiveFilters;
  $('#search-result-count').textContent = state.filteredProjects.length;
}

/**
 * 初始化搜索和筛选事件
 */
function initSearchAndFilters() {
  const searchInput = $('#search-input');
  const searchClear = $('#search-clear');
  const languageFilter = $('#language-filter');
  const favoritesOnly = $('#favorites-only');
  const clearFilters = $('#clear-filters');

  // 搜索输入（防抖）
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    searchClear.hidden = !value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.keyword = value;
      applyFilters();
    }, 200);
  });

  // 清除搜索
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    state.filters.keyword = '';
    applyFilters();
    searchInput.focus();
  });

  // 语言筛选
  languageFilter.addEventListener('change', (e) => {
    state.filters.language = e.target.value;
    applyFilters();
  });

  // 仅看收藏
  favoritesOnly.addEventListener('change', (e) => {
    state.filters.favoritesOnly = e.target.checked;
    applyFilters();
  });

  // 清除所有筛选
  clearFilters.addEventListener('click', () => {
    state.filters = { keyword: '', language: 'all', favoritesOnly: false };
    searchInput.value = '';
    searchClear.hidden = true;
    languageFilter.value = 'all';
    favoritesOnly.checked = false;
    applyFilters();
  });
}

/**
 * 填充语言筛选下拉框
 */
function populateLanguageFilter() {
  const languages = getLanguages(state.allProjects);
  const select = $('#language-filter');
  select.innerHTML =
    '<option value="all">全部语言</option>' +
    languages.map((lang) => `<option value="${escapeHtml(lang)}">${escapeHtml(lang)}</option>`).join('');
}

// ============================================================
// 历史周报
// ============================================================

/**
 * 初始化历史周报功能
 */
async function initHistory() {
  try {
    const reports = await fetchReportList();
    const select = $('#history-select');

    // 清空现有选项（保留"最新周报"）
    select.innerHTML = '<option value="latest">最新周报</option>';

    // 填充下拉框（跳过最新的，因为最新的已经作为默认选项）
    reports.forEach((report) => {
      if (report.weekKey === state.report?.weekKey) return;
      const option = document.createElement('option');
      option.value = report.weekKey;
      option.textContent = `${formatDate(report.generatedAt)} · ${report.projectCount} 个项目`;
      select.appendChild(option);
    });

    // 切换周报
    select.addEventListener('change', async (e) => {
      const weekKey = e.target.value;
      if (weekKey === 'latest') {
        await loadReport(null);
      } else {
        await loadReport(weekKey);
      }
    });
  } catch (error) {
    console.warn('加载历史周报列表失败', error);
  }
}

/**
 * 加载指定周报
 * @param {string|null} weekKey - 周报周标识，null 表示加载最新
 */
async function loadReport(weekKey) {
  try {
    showLoadingState();
    const report = weekKey ? await fetchReport(weekKey) : await fetchLatestReport();
    setReport(report);
    updateExportLink(report.weekKey);
  } catch (error) {
    showErrorState(error.message);
  }
}

/**
 * 设置当前周报并刷新界面
 * @param {object} report - 周报对象
 */
function setReport(report) {
  state.report = report;
  state.allProjects = report.projects || [];
  state.selected = 0;

  // 更新 UI
  $('#report-week').textContent = report.title;
  $('#report-count').textContent =
    `${report.language === 'all' ? '全语言' : report.language} · ${report.projects.length} 项`;

  // 填充语言筛选
  populateLanguageFilter();

  // 统一应用筛选并渲染（确保搜索统计状态正确）
  applyFilters();
}

/**
 * 更新导出按钮链接
 * @param {string} weekKey - 周报周标识
 */
function updateExportLink(weekKey) {
  $('#export-button').href = `/api/report/${encodeURIComponent(weekKey)}/export`;
}

// ============================================================
// 加载状态
// ============================================================

/**
 * 显示加载状态（骨架屏）
 */
function showLoadingState() {
  $('#feature-card').innerHTML = `
    <div class="skeleton-loader">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
    </div>`;
  $('#ranking-list').innerHTML = `
    <div class="skeleton-loader">
      <div class="skeleton skeleton-ranking"></div>
      <div class="skeleton skeleton-ranking"></div>
      <div class="skeleton skeleton-ranking"></div>
    </div>`;
}

/**
 * 显示错误状态
 * @param {string} message - 错误消息
 */
function showErrorState(message) {
  $('#feature-card').innerHTML =
    `<div class="empty">加载失败：${escapeHtml(message)}<br /><br />服务启动后，系统会在每周日 18:00 自动抓取 GitHub 周榜并生成中文导读。</div>`;
  $('#ranking-list').innerHTML = '<div class="empty">暂无榜单数据。</div>';
  $('#report-week').textContent = '加载失败';
}

// ============================================================
// 主题切换
// ============================================================

/**
 * 初始化主题切换
 */
function initThemeToggle() {
  initTheme();
  const btn = $('#theme-toggle');
  btn.addEventListener('click', () => {
    const theme = toggleTheme();
    showToast(theme === 'dark' ? '已切换到深色主题' : '已切换到浅色主题');
  });
}

// ============================================================
// 立即更新周报
// ============================================================

/**
 * 初始化「立即更新」按钮
 * 点击后触发后端抓取最新 GitHub Trending 并生成新一期周报
 */
function initRefreshButton() {
  const btn = $('#refresh-button');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;

    // 进入加载状态
    btn.disabled = true;
    btn.classList.add('loading');
    const textEl = btn.querySelector('.refresh-text');
    const originalText = textEl.textContent;
    textEl.textContent = '生成中…';

    try {
      // 触发生成任务（后端异步执行）
      const response = await fetch('/api/admin/run-report', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`触发失败: ${response.status}`);
      }

      showToast('已开始生成新周报，预计 1-2 分钟完成…');

      // 记录当前周报的生成时间戳，用于判断新周报是否生成完成
      // 注意：不能用 weekKey 判断，因为同一天内重新生成 weekKey 不变
      const oldGeneratedAt = state.report?.generatedAt;
      const oldWeekKey = state.report?.weekKey;
      const maxAttempts = 36; // 36 * 10秒 = 6分钟
      let attempts = 0;

      // 轮询等待新周报生成
      const poll = setInterval(async () => {
        attempts++;
        try {
          const latest = await fetchLatestReport();
          // 判断新周报是否生成完成：
          // 1. generatedAt 变了（同一天内重新生成）
          // 2. 或者 weekKey 变了（跨周生成）
          // 3. 或者超时
          const isGenerated = latest.generatedAt !== oldGeneratedAt || latest.weekKey !== oldWeekKey;
          if (isGenerated || attempts >= maxAttempts) {
            clearInterval(poll);
            await loadReport(null); // 重新加载最新周报
            await initHistory(); // 刷新历史下拉框
            if (isGenerated) {
              showToast('新周报已生成！');
            } else {
              showToast('生成超时，请稍后手动刷新页面查看');
            }
            // 恢复按钮状态
            btn.disabled = false;
            btn.classList.remove('loading');
            textEl.textContent = originalText;
          }
        } catch {
          // 轮询出错不阻断，继续等
        }
      }, 10000); // 每 10 秒检查一次
    } catch (error) {
      showToast(`更新失败：${error.message}`);
      btn.disabled = false;
      btn.classList.remove('loading');
      textEl.textContent = originalText;
    }
  });
}

// ============================================================
// 应用启动
// ============================================================

/**
 * 应用初始化入口
 */
async function boot() {
  // 初始化主题
  initThemeToggle();

  // 初始化搜索和筛选
  initSearchAndFilters();

  // 初始化立即更新按钮
  initRefreshButton();

  // 加载最新周报
  try {
    const report = await fetchLatestReport();
    setReport(report);
    updateExportLink(report.weekKey);

    // 加载历史周报列表
    initHistory();
  } catch {
    showErrorState('暂无周报，等待本周日自动生成');
  }
}

// 启动应用
boot();
