import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeepSeekRequest } from '../server/services/deepseek.js';

test('构造 DeepSeek OpenAI 兼容请求并要求 JSON 导读', () => {
  const request = buildDeepSeekRequest({
    model: 'deepseek-chat',
    project: { fullName: 'octo/rocket', description: 'A fast toolkit' },
    readme: '# Rocket\n\nInstall with npm install rocket'
  });

  assert.equal(request.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(request.options.method, 'POST');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'deepseek-chat');
  assert.equal(body.response_format.type, 'json_object');
  assert.match(body.messages[1].content, /octo\/rocket/);
});
