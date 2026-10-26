# CalmBar

A calm search bar in the middle of your screen. Jump between open tabs, search history and bookmarks, reopen closed tabs, and send queries to any site with bangs (`!yt`, `!a`, …).

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder.

After editing any file, click the reload icon on the extension's card. Tabs that were open before still get the bar on the first `⌥L`.

## Shortcuts

| Keys | Action |
| --- | --- |
| `⌥L` (Alt+L) | Open the bar over the current page (press again to close). Clicking the toolbar icon does the same. |
| `⌥T` (Alt+T) | New tab with a clock, the bar in the middle (ready to type) and your most visited sites, over calm waves. |

Change them at `chrome://extensions/shortcuts`. Chrome won't assign a shortcut another extension already uses, and it doesn't apply new defaults to an installed extension after an update, so set them there by hand in those cases.

Avoid `⌥Space`: the ChatGPT and Claude desktop apps use it for their own quick bar, so macOS hands it to them before Chrome sees it.

`⌘T` and `⌘L` keep their normal Chrome behavior. `⌘L` can't be taken over at all: Chrome handles it before any extension sees it.

### Inside the bar

| Keys | Action |
| --- | --- |
| `↑` `↓` (or `Ctrl+N` / `Ctrl+P`, `Tab` / `⇧Tab`) | Move the selection |
| `↵` | Open the selected item in the current tab (or switch to it, if it's an open tab) |
| `⌘↵` | Open in a new tab |
| `⌘⌫` | Close the selected tab |
| `Tab` on a bang | Complete it |
| `esc` | Close the bar (on the `⌥T` page, this closes the tab) |

## What it shows

- **Empty input:** over a page (`⌥L`), open tabs (most recently used first), recently closed tabs, and a "New tab" action. On the `⌥T` page, just the clock and your most visited sites until you start typing.
- **Typing:** a search row (or "Open" when the input looks like a URL), then matching open tabs, bookmarks and history.
- **Switching tabs from `⌥T`:** the empty tab you opened closes itself, so no blank tabs pile up.

## Bangs

Put a bang at the start or end of the query: `!yt lofi` or `lofi !yt`. A bang with no query (`!yt`) opens the site's home page. Type `!` on its own to list them all.

Built-in: `!g` Google, `!i` Google Images, `!m` Google Maps, `!tr` Google Translate, `!yt` YouTube, `!a` Amazon.it, `!e` eBay.it, `!w` Wikipedia (IT), `!wen` Wikipedia (EN), `!gh` GitHub, `!so` Stack Overflow, `!mdn` MDN, `!npm` npm, `!r` Reddit, `!x` X, `!sp` Spotify, `!c` Claude, `!ddg` DuckDuckGo, `!b` Bing.

Add your own in Settings, one per line, with `%s` where the query goes:

```
hn https://hn.algolia.com/?q=%s
```

A custom bang with the same key as a built-in one replaces it.

## Settings

Open them from the **Settings** link in the bar, or from the extension's **Details → Extension options**:

- **Default search engine** used when there's no bang (Google, DuckDuckGo, Bing, Ecosia, Brave, Startpage).
- **Theme:** automatic (follows Chrome/macOS light or dark mode), light, or dark.
- **Accent color:** Chrome doesn't let extensions read the installed theme, so pick its main color here to match it.
- **Custom bangs.**

## Limits

- The overlay can't open on pages where Chrome blocks extensions (`chrome://` pages, the Chrome Web Store, PDFs). There, `⌥L` opens the bar in a new tab instead.
- With the extension on, `⌥L` and `⌥T` no longer type their special characters in Chrome.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Permissions, shortcuts, options page |
| `background.js` | Handles `⌥L` and `⌥T`, answers the bar's tab/history/bookmark queries and performs tab actions |
| `ui.js` | The bar itself (markup, styles, keyboard), drawn in a closed shadow root |
| `content.js` | Loaded in every page: shows the bar over it and keeps your keystrokes away from the page's own shortcuts |
| `newtab.html`, `newtab.js` | The `⌥T` page |
| `common.js` | Settings defaults, search engines, bangs, query and URL parsing |
| `options.html`, `options.js` | Settings page |
| `icons/`, `tools/make_icons.py` | The icon, and the script that draws it (`python3 tools/make_icons.py`) |
| `common.test.js` | Self-check for bang parsing and URL detection: `node common.test.js` |

## Permissions

`tabs`, `history`, `bookmarks` and `sessions` feed the results; `topSites` fills the tiles on the `⌥T` page. The content script runs on every site so the bar opens instantly, which is why Chrome warns that the extension can "read and change all your data on all websites": it only draws the bar and never reads page content. `scripting` and `activeTab` load it into tabs that were already open before install. `favicon` shows site icons; `storage` keeps your settings. Nothing leaves your browser except the searches you run.
