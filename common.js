// Shared by the bar and the options page.

const DEFAULTS = {
  engine: 'google',
  theme: 'auto',        // auto | light | dark
  accent: '#3f9b8f',
  customBangs: '',      // one per line: "key https://site/search?q=%s"
};

const ENGINES = {
  google:     { n: 'Google',     u: 'https://www.google.com/search?q=%s' },
  duckduckgo: { n: 'DuckDuckGo', u: 'https://duckduckgo.com/?q=%s' },
  bing:       { n: 'Bing',       u: 'https://www.bing.com/search?q=%s' },
  ecosia:     { n: 'Ecosia',     u: 'https://www.ecosia.org/search?q=%s' },
  brave:      { n: 'Brave',      u: 'https://search.brave.com/search?q=%s' },
  startpage:  { n: 'Startpage',  u: 'https://www.startpage.com/do/search?q=%s' },
};

const BANGS = {
  g:    { n: 'Google',          u: 'https://www.google.com/search?q=%s' },
  i:    { n: 'Google Images', u: 'https://www.google.com/search?tbm=isch&q=%s' },
  m:    { n: 'Google Maps',     u: 'https://www.google.com/maps/search/%s' },
  tr:   { n: 'Google Translate', u: 'https://translate.google.com/?sl=auto&tl=it&text=%s' },
  yt:   { n: 'YouTube',         u: 'https://www.youtube.com/results?search_query=%s' },
  a:    { n: 'Amazon',          u: 'https://www.amazon.it/s?k=%s' },
  e:    { n: 'eBay',            u: 'https://www.ebay.it/sch/i.html?_nkw=%s' },
  w:    { n: 'Wikipedia',       u: 'https://it.wikipedia.org/w/index.php?search=%s' },
  wen:  { n: 'Wikipedia (EN)',  u: 'https://en.wikipedia.org/w/index.php?search=%s' },
  gh:   { n: 'GitHub',          u: 'https://github.com/search?q=%s' },
  so:   { n: 'Stack Overflow',  u: 'https://stackoverflow.com/search?q=%s' },
  mdn:  { n: 'MDN',             u: 'https://developer.mozilla.org/it/search?q=%s' },
  npm:  { n: 'npm',             u: 'https://www.npmjs.com/search?q=%s' },
  r:    { n: 'Reddit',          u: 'https://www.reddit.com/search/?q=%s' },
  x:    { n: 'X',               u: 'https://x.com/search?q=%s' },
  sp:   { n: 'Spotify',         u: 'https://open.spotify.com/search/%s' },
  c:    { n: 'Claude',          u: 'https://claude.ai/new?q=%s' },
  ddg:  { n: 'DuckDuckGo',      u: 'https://duckduckgo.com/?q=%s' },
  b:    { n: 'Bing',            u: 'https://www.bing.com/search?q=%s' },
};

async function loadSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

function parseCustomBangs(text) {
  const out = {};
  for (const line of (text || '').split('\n')) {
    const m = line.trim().match(/^!?(\S+)\s+(https?:\/\/\S+)$/);
    if (m) out[m[1].toLowerCase()] = { n: new URL(m[2].replace('%s', '')).hostname.replace(/^www\./, ''), u: m[2] };
  }
  return out;
}

function allBangs(settings) {
  return { ...BANGS, ...parseCustomBangs(settings.customBangs) };
}

function applyTheme(settings, root = document.documentElement) {
  root.style.setProperty('--accent', settings.accent || DEFAULTS.accent);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const set = () => { root.dataset.theme = settings.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : settings.theme; };
  set();
  mq.onchange = set;
}

// "!yt lofi", "lofi !yt", "!yt" → { bang, term }
function parseQuery(raw, bangs) {
  const s = raw.trim();
  let m = s.match(/^!(\S+)(?:\s+([\s\S]*))?$/);
  if (m && bangs[m[1].toLowerCase()]) return { bang: m[1].toLowerCase(), term: (m[2] || '').trim() };
  m = s.match(/^([\s\S]*?)\s+!(\S+)$/);
  if (m && bangs[m[2].toLowerCase()]) return { bang: m[2].toLowerCase(), term: m[1].trim() };
  return { bang: null, term: s };
}

function bangUrl(bang, term) {
  return term ? bang.u.replace('%s', encodeURIComponent(term)) : new URL(bang.u.replace('%s', '')).origin;
}

function looksLikeUrl(s) {
  if (!s || /\s/.test(s)) return false;
  if (/^[a-z][\w+.-]*:\/\//i.test(s) || /^(about|chrome|file|data|mailto):/i.test(s)) return true;
  if (/^localhost(:\d+)?(\/|$)/i.test(s)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(s)) return true;
  return /^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i.test(s);
}

function normalizeUrl(s) {
  if (/^[a-z][\w+.-]*:\/\//i.test(s) || /^(about|chrome|file|data|mailto):/i.test(s)) return s;
  return (/^(localhost|\d)/i.test(s) ? 'http://' : 'https://') + s;
}

function faviconUrl(pageUrl) {
  const u = new URL(chrome.runtime.getURL('/_favicon/'));
  u.searchParams.set('pageUrl', pageUrl);
  u.searchParams.set('size', '32');
  return u.href;
}
