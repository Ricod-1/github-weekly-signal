/**
 * ============================================================
 * 周报导出工具模块
 * 功能：将周报数据导出为 Markdown 格式
 * ============================================================
 */

/**
 * 将周报对象导出为 Markdown 字符串
 * @param {object} report - 周报对象
 * @returns {string} Markdown 格式的周报内容
 */
export function exportReportToMarkdown(report) {
  const lines = [];

  // 标题
  lines.push(`# ${report.title}`);
  lines.push('');
  lines.push(`> 生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push('');

  // 目录
  lines.push('## 目录');
  lines.push('');
  report.projects.forEach((project, index) => {
    lines.push(`${index + 1}. [${project.fullName}](#${index + 1}-${project.owner}${project.name})`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');

  // 每个项目详情
  report.projects.forEach((project, index) => {
    const explanation = project.explanation || {};

    // 项目标题
    lines.push(`## ${index + 1}. ${project.fullName}`);
    lines.push('');

    // 项目元信息
    lines.push(`- **GitHub**：[${project.url}](${project.url})`);
    lines.push(`- **语言**：${project.language}`);
    lines.push(`- **本周 Star**：+${formatNumber(project.starsThisWeek)}`);
    lines.push(`- **累计 Star**：${formatNumber(project.stars)}`);
    lines.push('');

    // 项目描述
    if (project.description) {
      lines.push(`> ${project.description}`);
      lines.push('');
    }

    // 一句话总结
    if (explanation.一句话总结) {
      lines.push(`### 一句话总结`);
      lines.push('');
      lines.push(explanation.一句话总结);
      lines.push('');
    }

    // 解决的问题
    if (explanation.解决的问题) {
      lines.push(`### 解决的问题`);
      lines.push('');
      lines.push(explanation.解决的问题);
      lines.push('');
    }

    // 核心能力
    if (explanation.核心能力 && explanation.核心能力.length > 0) {
      lines.push(`### 核心能力`);
      lines.push('');
      explanation.核心能力.forEach((ability) => {
        lines.push(`- ${ability}`);
      });
      lines.push('');
    }

    // 快速开始
    if (explanation.快速开始) {
      lines.push(`### 快速开始`);
      lines.push('');
      lines.push(explanation.快速开始);
      lines.push('');
    }

    // 适合谁
    if (explanation.适合谁) {
      lines.push(`### 适合谁`);
      lines.push('');
      lines.push(explanation.适合谁);
      lines.push('');
    }

    // 注意事项
    if (explanation.注意事项) {
      lines.push(`### 注意事项`);
      lines.push('');
      lines.push(explanation.注意事项);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  // 页脚
  lines.push('## 关于');
  lines.push('');
  lines.push('本周报由「开源信号」自动生成，每周日 18:00（上海时间）更新。');
  lines.push('');
  lines.push('数据来源：[GitHub Trending](https://github.com/trending?since=weekly)');

  return lines.join('\n');
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num = 0) {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export default exportReportToMarkdown;
