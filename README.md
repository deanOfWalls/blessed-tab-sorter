Your desired behavior is a domain-based tab organization with this logic:

For any domain with 2 or more open tabs → move all those tabs into their own dedicated window.
For domains with only 1 tab → collect all those singleton tabs and put them together in one shared window (or possibly more if there are too many, but one is fine).

This is a common way to declutter: group duplicates strictly per window, and keep uniques together without isolating them unnecessarily.
Is this easily doable?
Yes, very doable, and actually easier than modifying the existing Simple Tab Sorter extension in most cases.
Why?

The current Simple Tab Sorter (based on its README and description) focuses on sorting tabs within the current window(s) by domain or title, while respecting Chrome's built-in tab groups and allowing some custom ordering. It does not appear to move tabs across windows or create new windows — it reorders tabs in place.
Your feature requires creating multiple new windows and moving tabs between windows, which is outside the scope of what that extension currently does.

So, rather than heavily modifying that extension (which would involve rewriting large parts of its sorting logic), it's simpler and cleaner to write a small new Chrome extension from scratch tailored exactly to your needs.
How hard is it really?

If you're comfortable with basic JavaScript: easy, ~100-200 lines of code.
Required permissions: just "tabs" and "windows" (very standard).
No UI needed if you trigger it with a browser action or keyboard shortcut.
Manifest v3 compatible.

Rough code outline (background script)
Here's a complete working concept you can use as a starting point:
JavaScript// background.js (Manifest V3 service worker)

chrome.action.onClicked.addListener(() => {
  sortTabsByDomainIntoWindows();
});

async function sortTabsByDomainIntoWindows() {
  const tabs = await chrome.tabs.query({}); // all tabs in all windows

  // Group tabs by domain
  const groups = {};
  for (const tab of tabs) {
    let domain;
    try {
      domain = new URL(tab.url).hostname;
    } catch (e) {
      domain = 'invalid-url-' + tab.id; // handle chrome:// etc.
    }
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(tab);
  }

  // Separate multi-tab domains and singletons
  const multiDomains = [];
  const singletonTabs = [];

  for (const [domain, tabList] of Object.entries(groups)) {
    if (tabList.length > 1) {
      multiDomains.push({ domain, tabs: tabList });
    } else {
      singletonTabs.push(tabList[0]);
    }
  }

  // Create windows for multi-tab domains
  for (const { tabs } of multiDomains) {
    if (tabs.length === 0) continue;
    const firstTab = tabs[0];
    const window = await chrome.windows.create({ tabId: firstTab.id });
    const tabIds = tabs.slice(1).map(t => t.id);
    if (tabIds.length > 0) {
      await chrome.tabs.move(tabIds, { windowId: window.id, index: -1 });
    }
  }

  // Create one window for all singletons
  if (singletonTabs.length > 0) {
    const firstTab = singletonTabs[0];
    const window = await chrome.windows.create({ tabId: firstTab.id });
    const tabIds = singletonTabs.slice(1).map(t => t.id);
    if (tabIds.length > 0) {
      await chrome.tabs.move(tabIds, { windowId: window.id, index: -1 });
    }
  }
}
manifest.json (minimal)
JSON{
  "name": "Domain Window Sorter",
  "version": "1.0",
  "manifest_version": 3,
  "description": "Groups duplicate domain tabs into their own windows, singletons together.",
  "background": {
    "service_worker": "background.js"
  },
  "action": {},
  "permissions": ["tabs", "windows"]
}
Load this as an unpacked extension in chrome://extensions, click the icon → it runs.
Enhancements you could add easily

Optional sorting within each new window (by URL or title).
Focus the singleton window at the end.
Keyboard shortcut via "commands" in manifest.
Handle special URLs (chrome://, about:, etc.) more gracefully.
Option to run only on current window instead of all tabs.

If you want, I can refine this code further (e.g., add sorting inside windows, handle incognito, etc.).
Bottom line: Yes, totally feasible and straightforward — probably 30-60 minutes to get a working version if you copy-paste and tweak. Let me know if you'd like help polishing it!2.2s
