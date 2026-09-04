/**
 * ============================================================
 * ESLint 扁平化配置（Flat Config）
 * 适配 ESLint 9.x：将原 .eslintrc.json 的旧版配置迁移到新版格式
 * 说明：ESLint 9 起默认读取 eslint.config.js，不再读取 .eslintrc.*
 * ============================================================
 */

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // 全局忽略：与旧 ignorePatterns 保持一致
    ignores: ['node_modules/**', 'public/generated/**', 'data/**', '**/*.log', '**/*.err']
  },

  // 引入 ESLint 推荐规则集（对应旧配置的 extends: ["eslint:recommended"]）
  js.configs.recommended,

  // 服务端代码：Node.js 环境（server/scripts/tests）
  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },

  // 前端代码：浏览器环境
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  },

  // 自定义规则：从旧 .eslintrc.json 平移
  {
    rules: {
      // 未使用变量仅警告，允许以下划线开头的参数
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // 允许使用 console（项目为学习型小工具，保留日志输出）
      'no-console': 'off',
      // 强制使用 const（不允许重新赋值的变量用 let）
      'prefer-const': 'error',
      // 禁止使用 var
      'no-var': 'error',
      // 强制使用全等比较（=== / !==）
      eqeqeq: ['error', 'always'],
      // 多行代码块强制使用花括号
      curly: ['error', 'multi-line'],
      // 禁止抛出非 Error 字面量
      'no-throw-literal': 'error',
      // 避免在 async 函数中直接 return await（冗余）
      'no-return-await': 'warn'
    }
  }
];
