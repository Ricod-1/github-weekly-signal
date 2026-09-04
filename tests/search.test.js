/**
 * ============================================================
 * 搜索筛选模块测试
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProjects, getLanguages, highlightKeyword } from '../public/modules/search.js';

// 测试用项目数据
const mockProjects = [
  {
    fullName: 'octo/rocket',
    owner: 'octo',
    name: 'rocket',
    description: 'A fast build toolkit',
    language: 'TypeScript',
    explanation: {
      一句话总结: '快速构建工具',
      解决的问题: '提升构建速度',
      适合谁: '前端开发者',
      核心能力: ['构建', '打包']
    }
  },
  {
    fullName: 'foo/bar',
    owner: 'foo',
    name: 'bar',
    description: 'Python data processing library',
    language: 'Python',
    explanation: {
      一句话总结: '数据处理库',
      解决的问题: '数据清洗',
      适合谁: '数据科学家',
      核心能力: ['数据处理', 'ETL']
    }
  },
  {
    fullName: 'baz/qux',
    owner: 'baz',
    name: 'qux',
    description: 'Rust system utility',
    language: 'Rust',
    explanation: {}
  }
];

test('按关键词搜索项目名称', () => {
  const result = filterProjects(mockProjects, { keyword: 'rocket' });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'octo/rocket');
});

test('按关键词搜索项目描述', () => {
  const result = filterProjects(mockProjects, { keyword: 'data' });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'foo/bar');
});

test('按关键词搜索导读内容', () => {
  const result = filterProjects(mockProjects, { keyword: '构建' });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'octo/rocket');
});

test('关键词搜索不区分大小写', () => {
  const result = filterProjects(mockProjects, { keyword: 'ROCKET' });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'octo/rocket');
});

test('按编程语言筛选', () => {
  const result = filterProjects(mockProjects, { language: 'Python' });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'foo/bar');
});

test('语言筛选为 all 时返回所有项目', () => {
  const result = filterProjects(mockProjects, { language: 'all' });
  assert.equal(result.length, 3);
});

test('仅显示收藏项目', () => {
  const result = filterProjects(mockProjects, {
    favoritesOnly: true,
    favoriteList: ['foo/bar', 'baz/qux']
  });
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((p) => p.fullName),
    ['foo/bar', 'baz/qux']
  );
});

test('组合筛选：关键词 + 语言', () => {
  const result = filterProjects(mockProjects, {
    keyword: 'fast',
    language: 'TypeScript'
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, 'octo/rocket');
});

test('空关键词返回所有项目', () => {
  const result = filterProjects(mockProjects, { keyword: '' });
  assert.equal(result.length, 3);
});

test('无匹配时返回空数组', () => {
  const result = filterProjects(mockProjects, { keyword: 'nonexistent' });
  assert.equal(result.length, 0);
});

test('getLanguages 返回去重后的语言列表', () => {
  const languages = getLanguages(mockProjects);
  assert.deepEqual(languages, ['Python', 'Rust', 'TypeScript']);
});

test('getLanguages 排除未标注语言', () => {
  const projectsWithUnknown = [...mockProjects, { fullName: 'test/unknown', language: '未标注' }];
  const languages = getLanguages(projectsWithUnknown);
  assert.ok(!languages.includes('未标注'));
});

test('highlightKeyword 高亮匹配的文本', () => {
  const result = highlightKeyword('Hello World', 'world');
  assert.ok(result.includes('<mark'));
  assert.ok(result.includes('World'));
});

test('highlightKeyword 关键词为空时返回原文', () => {
  const result = highlightKeyword('Hello World', '');
  assert.equal(result, 'Hello World');
});

test('highlightKeyword 文本为空时返回空字符串', () => {
  const result = highlightKeyword('', 'test');
  assert.equal(result, '');
});
