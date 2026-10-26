// Shows the bar over the page when background.js asks. Runs at document_start so its key
// listeners come before the page's own, keeping page shortcuts from reacting to what you type.

if (!globalThis.calmBarLoaded) {
  globalThis.calmBarLoaded = true;
  let bar = null, host = null, prevFocus = null;

  const close = () => {
    host?.remove();
    host = bar = null;
    prevFocus?.focus?.();
  };

  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type !== 'toggle') return;
    if (bar) return close();
    prevFocus = document.activeElement;
    host = document.createElement('calm-bar');
    document.documentElement.append(host);
    bar = mountBar(host, { mode: 'overlay', onClose: close });
  });

  // Stopping propagation doesn't cancel the default action, so typing still reaches our input.
  for (const type of ['keydown', 'keypress', 'keyup']) {
    addEventListener(type, e => {
      if (!bar) return;
      e.stopImmediatePropagation();
      if (type === 'keydown') bar.onKeyDown(e);
    }, true);
  }
}
