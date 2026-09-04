const DEFAULT_URL = 'https://api.deepseek.com/chat/completions';

export function buildDeepSeekRequest({ model = 'deepseek-chat', project, readme }) {
  const prompt = [
    '请用简洁、自然的中文解释下面这个 GitHub 项目，避免营销腔和空泛形容词。',
    '只返回 JSON，不要 Markdown 代码围栏。字段必须包含：一句话总结、解决的问题、核心能力、快速开始、适合谁、注意事项。',
    `项目：${project.fullName}`,
    `项目描述：${project.description || '暂无描述'}`,
    `README：\n${readme.slice(0, 24000)}`
  ].join('\n\n');

  return {
    url: process.env.DEEPSEEK_BASE_URL || DEFAULT_URL,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是一名严谨的开源项目编辑。' },
          { role: 'user', content: prompt }
        ]
      })
    }
  };
}

export async function explainProject(project, readme, { fetchImpl = fetch, model = process.env.DEEPSEEK_MODEL || 'deepseek-chat' } = {}) {
  const request = buildDeepSeekRequest({ model, project, readme });
  if (!process.env.DEEPSEEK_API_KEY) {
    return {
      一句话总结: project.description || '这个项目值得进一步了解。',
      解决的问题: '尚未配置 DeepSeek API，当前展示项目原始描述。',
      核心能力: [],
      快速开始: '打开 GitHub 仓库查看 README。',
      适合谁: '希望了解本周开源趋势的开发者。',
      注意事项: '配置 DEEPSEEK_API_KEY 后可生成完整导读。'
    };
  }
  const response = await fetchImpl(request.url, request.options);
  if (!response.ok) throw new Error(`DeepSeek 请求失败: ${response.status}`);
  const payload = await response.json();
  return JSON.parse(payload.choices?.[0]?.message?.content || '{}');
}
