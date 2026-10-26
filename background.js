// Shortcut handling, plus the tab data and tab actions the bar asks for.

const NEWTAB = chrome.runtime.getURL('newtab.html');
const CONTENT = ['common.js', 'ui.js', 'content.js'];

chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd === 'toggle-bar') openOverlay(tab);
  if (cmd === 'open-newtab') openNewTab(tab);
});
chrome.action.onClicked.addListener(tab => openOverlay(tab));

// A tab the extension opens on its own page gets focus, unlike Chrome's new-tab page.
function openNewTab(tab) {
  return chrome.tabs.create({ url: NEWTAB, ...(tab ? { windowId: tab.windowId } : {}) });
}

async function openOverlay(tab) {
  tab ??= (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  if (!tab) return openNewTab();
  if (tab.url?.startsWith(NEWTAB)) return chrome.runtime.sendMessage({ type: 'focus', tabId: tab.id }).catch(() => {});

  const toggle = () => chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
  try {
    await toggle();
  } catch {
    try {
      // Tab was open before the extension was installed or reloaded.
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT });
      await toggle();
    } catch {
      // Pages where Chrome blocks extensions (chrome://, Web Store, PDFs…).
      openNewTab(tab);
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const handler = HANDLERS[msg?.type];
  if (!handler || !sender.tab) return;
  handler(msg, sender.tab).then(reply, () => reply(null));
  return true;
});

const HANDLERS = {
  query,
  activate,
  closeTab: async ({ id }) => { await chrome.tabs.remove(id); },
  closeSelf: async (msg, tab) => { await chrome.tabs.remove(tab.id); },
  options: async () => { await chrome.runtime.openOptionsPage(); },
};

const pick = x => ({ title: x.title, url: x.url });

async function query({ text }, self) {
  const s = (text || '').trim();
  const words = s.toLowerCase().split(/\s+/).filter(Boolean);
  const all = await chrome.tabs.query({});
  const tabs = all
    .filter(t => t.id !== self.id && words.every(w => `${t.title} ${t.url}`.toLowerCase().includes(w)))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
    .slice(0, s ? 6 : undefined)
    .map(t => ({ id: t.id, windowId: t.windowId, ...pick(t) }));

  if (!s) {
    const closed = await chrome.sessions.getRecentlyClosed({ maxResults: 10 });
    return {
      tabs, marks: [], hist: [],
      closed: closed.filter(c => c.tab && !c.tab.url?.startsWith(NEWTAB)).slice(0, 5).map(c => ({ sessionId: c.tab.sessionId, ...pick(c.tab) })),
    };
  }

  const seen = new Set(all.map(t => t.url));
  const fresh = x => x.url && !seen.has(x.url) && seen.add(x.url);
  const [marks, hist] = await Promise.all([
    chrome.bookmarks.search(s),
    chrome.history.search({ text: s, maxResults: 25, startTime: 0 }),
  ]);
  return {
    tabs, closed: [],
    marks: marks.filter(fresh).slice(0, 4).map(pick),
    hist: hist.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0)).filter(fresh).slice(0, 5).map(pick),
  };
}

async function activate({ row, newTab, mode }, self) {
  const switching = row.kind === 'tab' || row.kind === 'restore';
  if (row.kind === 'tab') {
    await chrome.tabs.update(row.id, { active: true });
    await chrome.windows.update(row.windowId, { focused: true });
  } else if (row.kind === 'restore') {
    await chrome.sessions.restore(row.sessionId);
  } else if (row.url && !newTab) {
    await chrome.tabs.update(self.id, { url: row.url });
  } else {
    await chrome.tabs.create({ url: row.url, index: self.index + 1, windowId: self.windowId, openerTabId: self.id });
  }
  // Leaving the new tab for another one: close it so blank tabs don't pile up.
  if (switching && mode === 'tab') await chrome.tabs.remove(self.id);
}
