const contentEl = document.getElementById('content');
const pasteBtn = document.getElementById('pasteBtn');
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const toastEl = document.getElementById('toast');
const dotEl = document.getElementById('dot');
const statusText = document.getElementById('statusText');

// --- Status check ---

async function checkStatus() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) {
      dotEl.className = 'dot err';
      statusText.textContent = 'No active tab';
      return;
    }

    const tab = tabs[0];
    const isMedium = tab.url && tab.url.includes('medium.com');

    if (!isMedium) {
      dotEl.className = 'dot warn';
      statusText.textContent = 'Not on Medium';
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        dotEl.className = 'dot err';
        statusText.textContent = 'Extension not active';
        return;
      }
      if (res.bridgeConnected) {
        dotEl.className = 'dot ok';
        statusText.textContent = 'Bridge connected';
      } else {
        dotEl.className = 'dot warn';
        statusText.textContent = 'Bridge offline (manual OK)';
      }
    });
  } catch {
    dotEl.className = 'dot err';
    statusText.textContent = 'Error';
  }
}

// --- Toast ---

function toast(text, type) {
  toastEl.textContent = text;
  toastEl.className = `toast ${type}`;
  setTimeout(() => { toastEl.className = 'toast'; }, 3000);
}

// --- Push to Medium ---

pasteBtn.addEventListener('click', async () => {
  const content = contentEl.value.trim();
  if (!content) {
    toast('Enter some markdown content first', 'err');
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) {
      toast('No active tab found', 'err');
      return;
    }

    const tab = tabs[0];
    if (!tab.url || !tab.url.includes('medium.com')) {
      toast('Please open medium.com/new-story first', 'err');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'SET_MARKDOWN', content }, (res) => {
      if (chrome.runtime.lastError) {
        toast('Send failed: ' + chrome.runtime.lastError.message, 'err');
        return;
      }
      toast(
        res && res.success ? 'Pushed to Medium editor!' : 'Push failed — check console',
        res && res.success ? 'ok' : 'err'
      );
    });
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
});

// --- File picker ---

fileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    contentEl.value = ev.target.result;
    toast(`Loaded: ${file.name}`, 'ok');
  };
  reader.readAsText(file);
});

// --- Init ---
checkStatus();
