const $ = id => document.getElementById(id);
const FIELDS = ['engine', 'theme', 'accent', 'customBangs'];

for (const [k, e] of Object.entries(ENGINES)) $('engine').add(new Option(e.n, k));

loadSettings().then(s => {
  for (const f of FIELDS) $(f).value = s[f];
  listBangs(s);
});

for (const f of FIELDS) {
  $(f).addEventListener('change', async () => {
    const s = Object.fromEntries(FIELDS.map(k => [k, $(k).value]));
    await chrome.storage.sync.set(s);
    listBangs(s);
    $('saved').textContent = 'Saved';
  });
}

function listBangs(s) {
  $('bangs').textContent = Object.entries(allBangs(s)).map(([k, b]) => `!${k} ${b.n}`).join(' · ');
}

$('shortcuts').addEventListener('click', e => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
