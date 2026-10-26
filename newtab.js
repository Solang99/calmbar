// ⌥T page.

const bar = mountBar(document.getElementById('bar'), {
  mode: 'tab',
  onClose: () => chrome.runtime.sendMessage({ type: 'closeSelf' }),
});
document.addEventListener('keydown', bar.onKeyDown);
// Not async: Chrome treats a returned Promise as a reply, which would answer the bar's queries
// with nothing before background.js can.
chrome.runtime.onMessage.addListener(msg => {
  if (msg?.type === 'focus') chrome.tabs.getCurrent(t => { if (t?.id === msg.tabId) bar.focus(); });
});
