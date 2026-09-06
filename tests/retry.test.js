import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../server/services/retry.js';

test('失败后按次数重试，成功时返回结果', async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('temporary');
      return 'ok';
    },
    { retries: 3, delayMs: 1 }
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});
