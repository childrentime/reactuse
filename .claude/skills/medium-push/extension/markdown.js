/**
 * Lightweight Markdown to HTML converter for Medium.
 * Zero dependencies.
 *
 * Key insight: Medium treats blank lines as paragraph separators,
 * which splits code blocks. We insert zero-width spaces (U+200B)
 * on empty lines inside code blocks to prevent this.
 */

(function () {
  'use strict';

  function stripFrontmatter(md) {
    const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    return match ? md.slice(match[0].length) : md;
  }

  function extractTitle(md) {
    const lines = md.split('\n');
    let title = '';
    let bodyStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === '') continue;
      const m = trimmed.match(/^#\s+(.+)$/);
      if (m) {
        title = m[1];
        bodyStart = i + 1;
      }
      break;
    }

    if (!title) return { title: '', body: md };

    while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
      bodyStart++;
    }

    return { title, body: lines.slice(bodyStart).join('\n') };
  }

  function inlineToHtml(text) {
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    text = text.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
    text = text.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
    text = text.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/(^|[\s(])_(.+?)_([\s).,;:!?]|$)/g, '$1<em>$2</em>$3');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return text;
  }

  /**
   * Convert markdown string to HTML string.
   * Code blocks get zero-width spaces on empty lines to prevent
   * Medium from splitting them at blank lines.
   */
  function markdownToHtml(md) {
    const lines = md.split('\n');
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trimEnd();

      // Fenced code block
      if (trimmed.startsWith('```')) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trimEnd().startsWith('```')) {
          const codeLine = lines[i];
          // KEY FIX: replace empty lines with zero-width space
          // so Medium doesn't treat them as paragraph breaks
          if (codeLine.trim() === '') {
            codeLines.push('\u200B');
          } else {
            codeLines.push(escapeHtml(codeLine));
          }
          i++;
        }
        i++; // skip closing ```
        html.push(`<pre>${codeLines.join('\n')}</pre>`);
        continue;
      }

      // Heading
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        html.push(`<h${level}>${inlineToHtml(headingMatch[2])}</h${level}>`);
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        html.push('<hr>');
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ') || trimmed === '>') {
        const quoteLines = [];
        while (i < lines.length && (lines[i].trimEnd().startsWith('> ') || lines[i].trimEnd() === '>')) {
          quoteLines.push(lines[i].trimEnd().replace(/^>\s?/, ''));
          i++;
        }
        html.push(`<blockquote><p>${inlineToHtml(quoteLines.join(' '))}</p></blockquote>`);
        continue;
      }

      // Unordered list
      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(inlineToHtml(lines[i].replace(/^\s*[-*+]\s+/, '')));
          i++;
        }
        html.push('<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>');
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(inlineToHtml(lines[i].replace(/^\s*\d+\.\s+/, '')));
          i++;
        }
        html.push('<ol>' + items.map(item => `<li>${item}</li>`).join('') + '</ol>');
        continue;
      }

      // Empty line
      if (trimmed === '') {
        i++;
        continue;
      }

      // Paragraph
      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('> ') &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      if (paraLines.length > 0) {
        html.push(`<p>${inlineToHtml(paraLines.join(' '))}</p>`);
      }
    }

    return html.join('\n');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (typeof window !== 'undefined') {
    window.__mdToHtml = { markdownToHtml, stripFrontmatter, extractTitle };
  }
})();
