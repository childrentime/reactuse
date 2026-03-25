/**
 * Medium Push Content Script (ISOLATED world)
 *
 * Connects to the bridge server via SSE and forwards
 * converted HTML content to main-world.js via window.postMessage.
 */

const BRIDGE_URL = 'http://localhost:18766';
let eventSource = null;
let reconnectTimer = null;
let reconnectDelay = 1000;

function connectBridge() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  try {
    eventSource = new EventSource(`${BRIDGE_URL}/events`);

    eventSource.onopen = () => {
      console.log('[MediumPush] Connected to bridge server');
      reconnectDelay = 1000;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SET_MARKDOWN' && data.content) {
          processAndSend(data.content);
        } else if (data.type === 'INSPECT_DOM') {
          window.postMessage({ type: 'MEDIUM_PUSH_INSPECT' }, '*');
        }
      } catch (e) {
        console.error('[MediumPush] Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSource = null;
      scheduleReconnect();
    };
  } catch (e) {
    console.error('[MediumPush] EventSource error:', e);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connectBridge();
    reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
  }, reconnectDelay);
}

/**
 * Process markdown: strip frontmatter, extract title, convert to HTML
 * (with zero-width spaces in code block empty lines), then forward.
 */
function processAndSend(markdown) {
  const { stripFrontmatter, extractTitle, markdownToHtml } = window.__mdToHtml;

  const cleaned = stripFrontmatter(markdown);
  const { title, body } = extractTitle(cleaned);
  const html = markdownToHtml(body);

  console.log('[MediumPush] Converted markdown to HTML', {
    titleLength: title.length,
    htmlLength: html.length,
  });

  window.postMessage({
    type: 'MEDIUM_PUSH_SET_CONTENT',
    title,
    html,
  }, '*');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_MARKDOWN' && msg.content) {
    processAndSend(msg.content);
    sendResponse({ success: true });
  } else if (msg.type === 'GET_STATUS') {
    sendResponse({
      bridgeConnected: eventSource !== null && eventSource.readyState === EventSource.OPEN,
      onMedium: window.location.hostname === 'medium.com',
    });
  }
  return true;
});

// Listen for results from main-world.js
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data && event.data.type === 'MEDIUM_PUSH_RESULT') {
    if (event.data.success) {
      console.log('[MediumPush] Content set successfully via', event.data.method);
    } else {
      console.error('[MediumPush] Failed to set content:', event.data.error);
    }
  }
  if (event.data && event.data.type === 'MEDIUM_PUSH_INSPECT_RESULT') {
    fetch(`${BRIDGE_URL}/inspect-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.data.result),
    }).catch(e => console.error('[MediumPush] Failed to send inspect result:', e));
  }
});

// Only connect on Medium
if (window.location.hostname === 'medium.com') {
  connectBridge();
  console.log('[MediumPush] Content script loaded on', window.location.href);
}
