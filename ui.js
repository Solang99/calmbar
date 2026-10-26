// The bar UI, mounted in a closed shadow root: over a page (content.js) or as the new tab (newtab.js).
// Tab data and tab actions go through background.js.

const BAR_CSS = `
:host {
  all: initial !important;
  position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; display: block !important;
  font: 14px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif !important;
  color: var(--text) !important;
  --accent: #3f9b8f;
  --bg: #e3f1ec; --wave1: #c3e3d9; --wave2: #a3d2c5; --panel: #ffffff; --text: #1d1d1f; --muted: #6e6e73; --faint: #a1a1a6;
  --line: rgba(0, 0, 0, .08);
  --sel: color-mix(in srgb, var(--accent) 15%, transparent);
  --shadow: 0 24px 70px rgba(0, 0, 0, .22), 0 2px 8px rgba(0, 0, 0, .08);
}
:host([data-theme=dark]) {
  --bg: #16211f; --wave1: #1c2e2a; --wave2: #22403a; --panel: #26262b; --text: #f2f2f5; --muted: #a1a1aa; --faint: #6b6b74;
  --line: rgba(255, 255, 255, .08);
  --sel: color-mix(in srgb, var(--accent) 28%, transparent);
  --shadow: 0 24px 70px rgba(0, 0, 0, .55), 0 0 0 1px rgba(255, 255, 255, .04);
}
:host([data-mode=overlay]) { background: rgba(0, 0, 0, .32) !important; animation: fade .16s ease-out !important; }
:host([data-mode=overlay].closing) { opacity: 0 !important; transition: opacity .12s ease-in !important; }
:host([data-mode=tab]) { background: var(--bg) !important; }
@keyframes fade { from { opacity: 0; } }

* { box-sizing: border-box; }
#waves { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 28vh; display: none; }
#waves path:first-child { fill: var(--wave1); }
#waves path:last-child { fill: var(--wave2); }
:host([data-mode=tab]) #waves { display: block; }
#stage { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 14vh 16px 16px; }
:host([data-mode=tab]) #stage { padding-top: 20vh; }

#hero { text-align: center; margin-bottom: 28px; }
:host([data-mode=overlay]) #hero, :host([data-mode=overlay]) #tiles { display: none; }
/* While typing, hide clock and tiles so the result list fits on screen. */
:host(.typing) #hero, :host(.typing) #tiles { display: none; }
:host([data-mode=tab]:not(.typing)) #foot { display: none; }
#tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-top: 24px; }
#tiles a { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 64px; text-decoration: none; color: var(--muted); font-size: 11px; }
#tiles .t { width: 48px; height: 48px; border-radius: 14px; background: var(--panel); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0, 0, 0, .07); transition: transform .12s; }
#tiles a:hover .t, #tiles a:focus-visible .t { transform: translateY(-2px); }
#tiles img { width: 22px; height: 22px; }
#tiles .n { max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#clock { font-size: 64px; font-weight: 300; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
#date { color: var(--muted); font-size: 15px; }

#box {
  width: min(640px, 100%);
  background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
  box-shadow: var(--shadow); overflow: hidden;
  animation: pop .22s cubic-bezier(.2, .9, .3, 1.15);
  will-change: transform;
}
@keyframes pop { from { transform: translateY(-8px) scale(.96); opacity: 0; } }
:host(.closing) #box { transform: scale(.98); transition: transform .12s ease-in; }

#inrow { display: flex; align-items: center; gap: 10px; padding: 14px 18px; }
#q { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 19px; padding: 4px 0; }
#q::placeholder { color: var(--faint); }
kbd { font: 11px/1 inherit; padding: 3px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--muted); }

#chip {
  display: inline-flex; gap: 6px; align-items: center; flex-shrink: 0;
  padding: 4px 10px; border-radius: 999px; background: var(--sel); color: var(--accent);
  font-size: 13px; font-weight: 600; white-space: nowrap;
}
#chip[hidden] { display: none; }
#chip img { width: 14px; height: 14px; }

#list { max-height: min(440px, 56vh); overflow-y: auto; overscroll-behavior: contain; border-top: 1px solid var(--line); padding: 4px 0; }
#list:empty { display: none; }
.grp { font-size: 11px; color: var(--faint); padding: 10px 18px 4px; letter-spacing: .2px; }
.row { display: flex; align-items: center; gap: 12px; padding: 7px 18px; min-height: 40px; cursor: pointer; transition: background .08s; }
.row.on { background: var(--sel); }
.row img, .row .ic { width: 18px; height: 18px; flex-shrink: 0; border-radius: 4px; }
.ic { display: flex; align-items: center; justify-content: center; color: var(--muted); }
.ic svg { width: 18px; height: 18px; }
.tt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
.uu { color: var(--faint); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1 1 0; }
.hint { margin-left: auto; color: var(--muted); font-size: 12px; white-space: nowrap; padding-left: 8px; }
.row.on .hint { color: var(--accent); }
.keys { display: none; margin-left: auto; gap: 6px; align-items: center; color: var(--accent); font-size: 12px; white-space: nowrap; padding-left: 8px; }
.row.on .keys { display: flex; }
.row.on.link .hint { display: none; }
.x { border: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 3px 6px; border-radius: 5px; visibility: hidden; }
.row:hover .x, .row.on .x { visibility: visible; }
.x:hover { background: var(--line); color: var(--text); }

#foot { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; padding: 8px 18px; border-top: 1px solid var(--line); font-size: 11px; color: var(--faint); }
#opts { margin-left: auto; color: var(--faint); text-decoration: none; }
#opts:hover { color: var(--accent); }
@media (prefers-reduced-motion: reduce) { :host, #box { animation: none !important; transition: none !important; } }
`;

const BAR_HTML = `
<svg id="waves" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C60 10 110 50 170 30 S260 15 300 28 V80 H0Z"/><path d="M0 50 C70 35 120 65 190 48 S270 40 300 50 V80 H0Z"/></svg>
<div id="stage">
  <div id="hero"><div id="clock"></div><div id="date"></div></div>
  <div id="box" role="dialog" aria-label="Search">
    <div id="inrow">
      <span id="chip" hidden></span>
      <input id="q" autocomplete="off" spellcheck="false" placeholder="Search, enter a URL or jump to a tab" aria-controls="list">
      <kbd>esc</kbd>
    </div>
    <div id="list" role="listbox"></div>
    <div id="foot">
      <span><kbd>↑↓</kbd> select</span>
      <span><kbd>↵</kbd> open</span>
      <span><kbd>⌘↵</kbd> new tab</span>
      <span><kbd>⌘⌫</kbd> close tab</span>
      <span><kbd>!</kbd> bang</span>
      <a id="opts" href="#">Settings</a>
    </div>
  </div>
  <nav id="tiles" aria-label="Most visited"></nav>
</div>`;

const svg = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
};

const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u || ''; } };

// Returns { onKeyDown, focus }. The caller routes keydown events to onKeyDown.
function mountBar(host, { mode, onClose }) {
  host.dataset.mode = mode;
  applyTheme(DEFAULTS, host);   // right theme on the first frame; real settings follow
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>${BAR_CSS}</style>${BAR_HTML}`;
  const $ = id => root.getElementById(id);
  const q = $('q'), list = $('list'), chip = $('chip');

  let settings = DEFAULTS, bangs = BANGS, rows = [], sel = 0, seq = 0;
  const send = msg => chrome.runtime.sendMessage({ mode, ...msg }).catch(() => null);

  const tabRow = t => ({ g: 'Open tabs', kind: 'tab', tab: t, title: t.title || t.url, sub: hostOf(t.url), img: faviconUrl(t.url || ''), hint: 'Switch to tab' });
  const linkRow = (g, hint) => x => ({ g, kind: 'url', url: x.url, title: x.title || x.url, sub: hostOf(x.url), img: faviconUrl(x.url), hint });

  async function update() {
    const my = ++seq;
    const s = q.value.trim();
    const p = parseQuery(q.value, bangs);
    const out = [];
    showChip(p.bang);
    host.classList.toggle('typing', !!s);

    // "!" or "!y…": list the bangs
    if (/^!\S*$/.test(s) && !p.bang) {
      const k = s.slice(1).toLowerCase();
      Object.entries(bangs)
        .filter(([key, b]) => !k || key.startsWith(k) || b.n.toLowerCase().includes(k))
        .sort(([a], [b]) => (b.startsWith(k) - a.startsWith(k)) || a.length - b.length)
        .slice(0, 12)
        .forEach(([key, b]) => out.push({ g: 'Bang', kind: 'bang', key, title: b.n, sub: '!' + key, img: faviconUrl(b.u), hint: 'Tab to use' }));
      return commit(my, out);
    }

    if (p.bang) {
      const b = bangs[p.bang];
      out.push({ kind: 'url', url: bangUrl(b, p.term), title: p.term || `Open ${b.n}`, img: faviconUrl(b.u), hint: p.term ? `Search ${b.n}` : '' });
      return commit(my, out);
    }

    if (!s && mode === 'tab') return commit(my, []);   // the new tab shows tiles until you type

    if (s && looksLikeUrl(s)) out.push({ kind: 'url', url: normalizeUrl(s), title: s, icon: ICON.globe, hint: 'Open' });
    else if (s) {
      const e = ENGINES[settings.engine] || ENGINES.google;
      out.push({ kind: 'url', url: e.u.replace('%s', encodeURIComponent(s)), title: s, icon: ICON.search, hint: `Search ${e.n}` });
    }
    if (s) commit(my, out.slice(), true);   // show the search row at once, results follow

    const res = await send({ type: 'query', text: s });
    if (res) {
      out.push(...res.tabs.map(tabRow));
      out.push(...res.closed.map(c => ({ g: 'Recently closed', kind: 'restore', sessionId: c.sessionId, title: c.title || c.url, sub: hostOf(c.url), img: faviconUrl(c.url), hint: 'Reopen' })));
      out.push(...res.marks.map(linkRow('Bookmarks', 'Bookmark')));
      out.push(...res.hist.map(linkRow('History', '')));
    }
    if (!s && mode === 'overlay') out.push({ g: 'Actions', kind: 'newtab', title: 'New tab', icon: ICON.plus });
    commit(my, out, true);
  }

  function commit(my, out, keepSel = false) {
    if (my !== seq) return;   // a newer query has started
    rows = out;
    sel = keepSel ? Math.max(0, Math.min(sel, rows.length - 1)) : 0;
    render();
  }

  function showChip(key) {
    if (!key) { chip.hidden = true; return; }
    const b = bangs[key];
    chip.replaceChildren(Object.assign(document.createElement('img'), { src: faviconUrl(b.u), alt: '' }), b.n);
    chip.hidden = false;
  }

  function render() {
    const frag = document.createDocumentFragment();
    let group = null;
    rows.forEach((r, i) => {
      if (r.g && r.g !== group) {
        group = r.g;
        frag.append(Object.assign(document.createElement('div'), { className: 'grp', textContent: r.g }));
      }
      const el = document.createElement('div');
      el.className = 'row' + (r.kind === 'url' ? ' link' : '') + (i === sel ? ' on' : '');
      el.setAttribute('role', 'option');
      el.dataset.i = i;
      if (r.img) el.append(Object.assign(document.createElement('img'), { src: r.img, alt: '', loading: 'lazy', decoding: 'async' }));
      else el.append(Object.assign(document.createElement('span'), { className: 'ic', innerHTML: r.icon || ICON.globe }));
      el.append(Object.assign(document.createElement('span'), { className: 'tt', textContent: r.title }));
      el.append(Object.assign(document.createElement('span'), { className: 'uu', textContent: r.sub || '' }));
      if (r.hint) el.append(Object.assign(document.createElement('span'), { className: 'hint', textContent: r.hint }));
      if (r.kind === 'url') {
        const keys = Object.assign(document.createElement('span'), { className: 'keys' });
        keys.innerHTML = '<kbd>↵</kbd> here <kbd>⌘↵</kbd> new tab';
        el.append(keys);
      }
      if (r.kind === 'tab') {
        const x = Object.assign(document.createElement('button'), { className: 'x', textContent: '×', title: 'Close tab' });
        x.addEventListener('click', e => { e.stopPropagation(); closeTab(i); });
        el.append(x);
      }
      el.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
      el.addEventListener('click', e => activate(r, e.metaKey || e.ctrlKey));
      frag.append(el);
    });
    list.replaceChildren(frag);
    mark();
  }

  function mark() {
    list.querySelectorAll('.row').forEach(el => el.classList.toggle('on', +el.dataset.i === sel));
    list.querySelector('.row.on')?.scrollIntoView({ block: 'nearest' });
  }

  function move(d) {
    if (!rows.length) return;
    sel = (sel + d + rows.length) % rows.length;
    mark();
  }

  async function activate(r, newTab = false) {
    if (!r) return;
    if (r.kind === 'bang') { q.value = `!${r.key} `; return update(); }
    const row = { kind: r.kind, id: r.tab?.id, windowId: r.tab?.windowId, sessionId: r.sessionId, url: r.url };
    await send({ type: 'activate', row, newTab });
    if (mode === 'overlay') close();
  }

  async function closeTab(i) {
    const r = rows[i];
    if (r?.kind !== 'tab') return;
    await send({ type: 'closeTab', id: r.tab.id });
    rows.splice(i, 1);
    sel = Math.min(sel, rows.length - 1);
    render();
  }

  let closing = false;
  function close() {
    if (closing) return;
    closing = true;
    if (mode !== 'overlay') return onClose();
    host.classList.add('closing');
    setTimeout(onClose, 120);
  }

  function onKeyDown(e) {
    if (e.isComposing) return;
    if (root.activeElement !== q) q.focus();
    const r = rows[sel];
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); activate(r, e.metaKey || e.ctrlKey); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (r?.kind === 'bang') activate(r);
      else move(e.shiftKey ? -1 : 1);
    }
    else if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey) && r?.kind === 'tab') { e.preventDefault(); closeTab(sel); }
  }

  q.addEventListener('input', update);
  $('stage').addEventListener('mousedown', e => {
    if (e.target === e.currentTarget && mode === 'overlay') close();
    else if (e.target !== q && !e.target.closest('button')) setTimeout(() => q.focus());
  });
  // Keep wheel and mouse events from reaching the page underneath.
  $('stage').addEventListener('wheel', e => { if (!e.composedPath().includes(list)) e.preventDefault(); }, { passive: false });
  for (const t of ['mousedown', 'mouseup', 'click', 'dblclick', 'pointerdown', 'pointerup', 'contextmenu']) root.addEventListener(t, e => e.stopPropagation());
  $('opts').addEventListener('click', e => { e.preventDefault(); send({ type: 'options' }); close(); });

  if (mode === 'tab') {
    const tick = () => {
      const d = new Date();
      $('clock').textContent = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      $('date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    };
    tick();
    setInterval(tick, 10_000);
    chrome.topSites.get(sites => $('tiles').replaceChildren(...sites.slice(0, 6).map(site => {
      const a = Object.assign(document.createElement('a'), { href: site.url, title: site.title });
      const t = Object.assign(document.createElement('span'), { className: 't' });
      t.append(Object.assign(document.createElement('img'), { src: faviconUrl(site.url), alt: '' }));
      a.append(t, Object.assign(document.createElement('span'), { className: 'n', textContent: hostOf(site.url) }));
      return a;
    })));
  }

  q.focus();
  update();
  loadSettings().then(s => {
    settings = s;
    bangs = allBangs(s);
    applyTheme(s, host);
    if (q.value) update();
  });

  return { onKeyDown, focus() { q.focus(); q.select(); } };
}
