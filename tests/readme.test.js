import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjectReadme } from '../server/report.js';

test('README 下载发生瞬时网络错误时自动重试', async () => {
  let calls = 0;
  const readme = await readProjectReadme(
    'vercel/ai',
    async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('fetch failed');
      return { ok: true, text: async () => '# AI SDK' };
    },
    { retries: 2, delayMs: 0 }
  );

  assert.equal(readme, '# AI SDK');
  assert.equal(calls, 2);
});
