/**
 * Medium Push Main World Script
 *
 * Injects HTML content into Medium's editor via paste simulation.
 * Code blocks use zero-width spaces on empty lines to prevent
 * Medium from splitting them at blank lines.
 */

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (!event.data) return;

  if (event.data.type === 'MEDIUM_PUSH_INSPECT') {
    window.postMessage({ type: 'MEDIUM_PUSH_INSPECT_RESULT', result: inspectDOM() }, '*');
    return;
  }

  if (event.data.type !== 'MEDIUM_PUSH_SET_CONTENT') return;

  const { title, html } = event.data;
  console.log('[MediumPush] Received content, title:', title?.slice(0, 50), 'html length:', html?.length);

  try {
    const editor = findEditor();
    if (!editor) {
      reportResult(false, 'none', 'Could not find Medium editor');
      return;
    }

    editor.focus();
    await sleep(200);

    const fullHtml = title ? `<h3>${escapeHtml(title)}</h3>${html}` : html;

    // Try paste with proper clipboardData
    const success = await tryPaste(editor, fullHtml);
    if (success) {
      reportResult(true, 'paste', null);
      return;
    }

    // Fallback: insertHTML
    const insertOk = tryInsertHtml(editor, fullHtml);
    if (insertOk) {
      reportResult(true, 'insertHTML', null);
      return;
    }

    // Last resort: direct DOM
    editor.innerHTML = fullHtml;
    triggerInput(editor);
    reportResult(true, 'innerHTML', null);
  } catch (e) {
    reportResult(false, 'none', e.message);
  }
});

async function tryPaste(editor, html) {
  editor.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  sel.removeAllRanges();
  sel.addRange(range);
  await sleep(100);

  const plainText = htmlToPlainText(html);
  const dt = new DataTransfer();
  dt.setData('text/html', html);
  dt.setData('text/plain', plainText);

  const evt = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'clipboardData', { value: dt, writable: false });

  editor.dispatchEvent(evt);
  await sleep(500);

  const newText = editor.textContent || '';
  return newText.length > 30 && !newText.includes('Tell your story');
}

function tryInsertHtml(editor, html) {
  editor.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  sel.removeAllRanges();
  sel.addRange(range);

  document.execCommand('delete', false);
  const ok = document.execCommand('insertHTML', false, html);
  if (ok) triggerInput(editor);
  return ok;
}

function findEditor() {
  return (
    document.querySelector('.postArticle-content[role="textbox"][contenteditable="true"]') ||
    document.querySelector('[role="textbox"][contenteditable="true"]') ||
    document.querySelector('.editable[contenteditable="true"]') ||
    document.querySelector('article [contenteditable="true"]')
  );
}

function htmlToPlainText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function triggerInput(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function reportResult(success, method, error) {
  console.log('[MediumPush] Result:', { success, method, error });
  window.postMessage({ type: 'MEDIUM_PUSH_RESULT', success, method, error }, '*');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function inspectDOM() {
  function desc(el) {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(), id: el.id || null,
      className: (el.className || '').toString().slice(0, 120),
      role: el.getAttribute('role'), contentEditable: el.getAttribute('contenteditable'),
      dataTestId: el.getAttribute('data-testid'), dataPlaceholder: el.getAttribute('data-placeholder'),
      textContent: (el.textContent || '').slice(0, 60), childCount: el.children.length,
      rect: { w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top), l: Math.round(r.left) },
      parentTag: el.parentElement?.tagName.toLowerCase(), parentClass: (el.parentElement?.className || '').toString().slice(0, 80),
    };
  }
  return {
    url: window.location.href,
    editables: [...document.querySelectorAll('[contenteditable]')].map(desc),
    roles: [...document.querySelectorAll('[role="textbox"]')].map(desc),
  };
}

console.log('[MediumPush] Main world script loaded (paste + zero-width-space mode)');
