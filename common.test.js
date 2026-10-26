// node common.test.js — checks bang parsing and URL detection.
const assert = require('assert');
const vm = require('vm');
const ctx = { URL };
vm.runInNewContext(require('fs').readFileSync(__dirname + '/common.js', 'utf8') + ';this.api={BANGS,parseQuery,bangUrl,looksLikeUrl,normalizeUrl,parseCustomBangs}', ctx);
const { BANGS, parseQuery, bangUrl, looksLikeUrl, normalizeUrl, parseCustomBangs } = ctx.api;
const eq = (a, b) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b);

eq(parseQuery('!yt lofi beats', BANGS), { bang: 'yt', term: 'lofi beats' });
eq(parseQuery('lofi beats !YT', BANGS), { bang: 'yt', term: 'lofi beats' });
eq(parseQuery('!yt', BANGS), { bang: 'yt', term: '' });
eq(parseQuery('!zz ciao', BANGS), { bang: null, term: '!zz ciao' });
eq(parseQuery('ciao!', BANGS), { bang: null, term: 'ciao!' });

assert.strictEqual(bangUrl(BANGS.a, 'cuffie bt'), 'https://www.amazon.it/s?k=cuffie%20bt');
assert.strictEqual(bangUrl(BANGS.yt, ''), 'https://www.youtube.com');
assert.strictEqual(bangUrl(BANGS.m, ''), 'https://www.google.com');

for (const u of ['github.com', 'it.wikipedia.org/wiki/Browser', 'localhost:3000', '192.168.1.1', 'foo.com:8080/x', 'https://a.b', 'chrome://settings'])
  assert.ok(looksLikeUrl(u), u);
for (const u of ['come fare la carbonara', 'node.js tutorial', 'ciao', 'v1.2'])
  assert.ok(!looksLikeUrl(u), u);

assert.strictEqual(normalizeUrl('github.com'), 'https://github.com');
assert.strictEqual(normalizeUrl('localhost:3000'), 'http://localhost:3000');
assert.strictEqual(normalizeUrl('foo.com:8080'), 'https://foo.com:8080');
assert.strictEqual(normalizeUrl('chrome://settings'), 'chrome://settings');

eq(parseCustomBangs('r https://www.reddit.com/search/?q=%s\n!hn https://hn.algolia.com/?q=%s\nrotto'),
  { r: { n: 'reddit.com', u: 'https://www.reddit.com/search/?q=%s' }, hn: { n: 'hn.algolia.com', u: 'https://hn.algolia.com/?q=%s' } });

console.log('ok');
