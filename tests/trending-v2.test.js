/**
 * ============================================================
 * GitHub Trending 服务扩展测试
 * 覆盖：语言筛选 URL 构建、新增的 buildTrendingUrl 函数
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrendingHtml, buildTrendingUrl } from '../server/services/trending.js';

test('buildTrendingUrl 不指定语言时返回全语言 Trending 地址', () => {
  const url = buildTrendingUrl({ since: 'weekly' });
  assert.equal(url, 'https://github.com/trending?since=weekly');
});

test('buildTrendingUrl 指定语言时拼接语言路径', () => {
  const url = buildTrendingUrl({ language: 'javascript', since: 'weekly' });
  assert.equal(url, 'https://github.com/trending/javascript?since=weekly');
});

test('buildTrendingUrl 支持 daily 时间范围', () => {
  const url = buildTrendingUrl({ since: 'daily' });
  assert.equal(url, 'https://github.com/trending?since=daily');
});

test('buildTrendingUrl 支持 monthly 时间范围', () => {
  const url = buildTrendingUrl({ since: 'monthly' });
  assert.equal(url, 'https://github.com/trending?since=monthly');
});

test('buildTrendingUrl 语言名称会被 URL 编码', () => {
  const url = buildTrendingUrl({ language: 'c++', since: 'weekly' });
  assert.ok(url.includes('c%2B%2B'));
});

test('parseTrendingHtml 解析多个项目并保留正确排名', () => {
  const html = `
    <article class="Box-row">
      <h2><a href="/first/repo">first / repo</a></h2>
      <p>First project</p>
      <span itemprop="programmingLanguage">JavaScript</span>
      <span>100 stars this week</span>
      <a href="/first/repo/stargazers">1,000</a>
    </article>
    <article class="Box-row">
      <h2><a href="/second/repo">second / repo</a></h2>
      <p>Second project</p>
      <span itemprop="programmingLanguage">Python</span>
      <span>50 stars this week</span>
      <a href="/second/repo/stargazers">500</a>
    </article>`;

  const projects = parseTrendingHtml(html);
  assert.equal(projects.length, 2);
  assert.equal(projects[0].rank, 1);
  assert.equal(projects[0].fullName, 'first/repo');
  assert.equal(projects[1].rank, 2);
  assert.equal(projects[1].fullName, 'second/repo');
});

test('parseTrendingHtml 处理没有语言标注的项目', () => {
  const html = `
    <article class="Box-row">
      <h2><a href="/no/lang">no / lang</a></h2>
      <p>No language project</p>
      <span>10 stars this week</span>
      <a href="/no/lang/stargazers">100</a>
    </article>`;

  const projects = parseTrendingHtml(html);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].language, '未标注');
});
