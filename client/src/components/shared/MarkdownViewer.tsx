import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = '' }: Props) {
  // 简单的 Markdown 渲染（不引入 react-markdown 避免额外的构建依赖）
  const html = renderMarkdown(content);

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// 轻量 Markdown → HTML 渲染器
function renderMarkdown(md: string): string {
  let html = md
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 代码块（先处理，避免内部被其他规则干扰）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 粗体/斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 水平线
  html = html.replace(/^---$/gm, '<hr />');

  // 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // 合并连续引用
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br />');

  // 无序列表
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // 表格
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
    if (cells.every(c => /^[-:]+$/.test(c))) return '<!-- table-separator -->';
    const isHeader = match.includes('---');
    const cellTag = 'td';
    return '<tr>' + cells.map(c => `<${cellTag}>${c}</${cellTag}>`).join('') + '</tr>';
  });
  // 包装表格
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => {
    if (match.includes('<!-- table-separator -->')) {
      return '<table>' + match.replace('<!-- table-separator -->', '') + '</table>';
    }
    return match;
  });

  // 段落（连续的非空行）
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph) { result.push('</p>'); inParagraph = false; }
      continue;
    }
    // 跳过已经是 HTML 标签的行
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<table') ||
        trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') ||
        trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') || trimmed.startsWith('<tr') ||
        trimmed.startsWith('</')) {
      if (inParagraph) { result.push('</p>'); inParagraph = false; }
      result.push(trimmed);
      continue;
    }
    if (!inParagraph) { result.push('<p>'); inParagraph = true; }
    result.push(trimmed);
  }
  if (inParagraph) result.push('</p>');

  return result.join('\n');
}
