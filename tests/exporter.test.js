/**
 * ============================================================
 * 周报导出模块测试
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { exportReportToMarkdown } from '../server/utils/exporter.js';

// 测试用周报数据
const mockReport = {
  weekKey: '2026-08-09',
  generatedAt: '2026-08-09T10:00:00.000Z',
  title: '2026-08-09 周开源信号',
  projects: [
    {
      rank: 1,
      fullName: 'octo/rocket',
      owner: 'octo',
      name: 'rocket',
      description: 'A fast toolkit',
      language: 'TypeScript',
      starsThisWeek: 1234,
      stars: 12000,
      url: 'https://github.com/octo/rocket',
      explanation: {
        一句话总结: '一个快速的工具包',
        解决的问题: '提升开发效率',
        核心能力: ['构建工具', '代码生成'],
        快速开始: 'npm install rocket',
        适合谁: '前端开发者',
        注意事项: '需要 Node.js 18+'
      }
    }
  ]
};

test('导出周报为 Markdown 格式，包含标题和项目信息', () => {
  const markdown = exportReportToMarkdown(mockReport);

  // 验证是字符串
  assert.equal(typeof markdown, 'string');
  assert.ok(markdown.length > 0);

  // 验证包含周报标题
  assert.ok(markdown.includes('# 2026-08-09 周开源信号'));

  // 验证包含项目名称
  assert.ok(markdown.includes('octo/rocket'));

  // 验证包含项目描述
  assert.ok(markdown.includes('A fast toolkit'));

  // 验证包含导读字段
  assert.ok(markdown.includes('一句话总结'));
  assert.ok(markdown.includes('解决的问题'));
  assert.ok(markdown.includes('核心能力'));
  assert.ok(markdown.includes('快速开始'));
  assert.ok(markdown.includes('适合谁'));
  assert.ok(markdown.includes('注意事项'));

  // 验证包含核心能力列表项
  assert.ok(markdown.includes('- 构建工具'));
  assert.ok(markdown.includes('- 代码生成'));
});

test('导出空项目列表的周报不抛出异常', () => {
  const emptyReport = {
    ...mockReport,
    projects: []
  };
  const markdown = exportReportToMarkdown(emptyReport);
  assert.equal(typeof markdown, 'string');
  assert.ok(markdown.includes('# 2026-08-09 周开源信号'));
});

test('导出缺少导读字段的项目时正常处理', () => {
  const reportWithoutExplanation = {
    ...mockReport,
    projects: [
      {
        ...mockReport.projects[0],
        explanation: undefined
      }
    ]
  };
  const markdown = exportReportToMarkdown(reportWithoutExplanation);
  assert.equal(typeof markdown, 'string');
  assert.ok(markdown.includes('octo/rocket'));
});
