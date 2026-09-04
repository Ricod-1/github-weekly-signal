/**
 * ============================================================
 * 配置管理模块测试
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateConfig } from '../server/config.js';

test('validateConfig 返回警告数组且不抛出异常', () => {
  const warnings = validateConfig();
  assert.ok(Array.isArray(warnings));
  // 警告信息应为字符串
  warnings.forEach((warning) => {
    assert.equal(typeof warning, 'string');
    assert.ok(warning.length > 0);
  });
});
