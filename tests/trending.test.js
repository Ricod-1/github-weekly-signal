import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrendingHtml } from '../server/services/trending.js';

test('解析 GitHub Trending 条目并保留排名、仓库名、语言和周增长', () => {
  const html = `
    <article class="Box-row">
      <h2 class="h3 lh-condensed"><a href="/octo/rocket">octo / rocket</a></h2>
      <p class="col-9 color-fg-muted my-1">A fast toolkit</p>
      <span itemprop="programmingLanguage">TypeScript</span>
      <span class="d-inline-block float-sm-right">1,234 stars this week</span>
      <a href="/octo/rocket/stargazers">12,000</a>
    </article>`;

  assert.deepEqual(parseTrendingHtml(html), [{
    rank: 1,
    fullName: 'octo/rocket',
    owner: 'octo',
    name: 'rocket',
    description: 'A fast toolkit',
    language: 'TypeScript',
    starsThisWeek: 1234,
    stars: 12000,
    url: 'https://github.com/octo/rocket'
  }]);
});
