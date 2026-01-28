// background.js (Manifest V3 service worker)

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  sortTabsByDomainIntoWindows();
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "sort-tabs") {
    sortTabsByDomainIntoWindows();
  }
});

/**
 * Extracts domain from a URL, handling special cases like chrome://, about:, etc.
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    // Handle special protocols
    if (urlObj.protocol === 'chrome:' || urlObj.protocol === 'chrome-extension:' || urlObj.protocol === 'about:') {
      return `special://${urlObj.protocol}${urlObj.hostname || urlObj.pathname.split('/')[0]}`;
    }
    return urlObj.hostname;
  } catch (e) {
    // Invalid URL or special case
    if (url.startsWith('about:')) {
      return `special://about:${url.split(':')[1] || 'unknown'}`;
    }
    return `invalid-url-${url.substring(0, 50)}`;
  }
}

/**
 * Sorts tabs within a window by URL
 */
async function sortTabsInWindow(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const sortedTabs = tabs.sort((a, b) => {
    const urlA = a.url || '';
    const urlB = b.url || '';
    return urlA.localeCompare(urlB);
  });

  // Move tabs to their sorted positions
  for (let i = 0; i < sortedTabs.length; i++) {
    if (sortedTabs[i].index !== i) {
      await chrome.tabs.move(sortedTabs[i].id, { index: i });
    }
  }
}

/**
 * Processes tabs for a given incognito state (separate incognito and non-incognito)
 */
async function processTabsByIncognitoState(tabs, isIncognito) {
  const createdWindows = [];
  let singletonWindowId = null;

  // Group tabs by domain
  const groups = {};
  for (const tab of tabs) {
    const domain = getDomain(tab.url);
    if (!groups[domain]) {
      groups[domain] = [];
    }
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
  for (const { domain, tabs } of multiDomains) {
    if (tabs.length === 0) continue;

    try {
      // Create new window with first tab (window will inherit incognito state from tab)
      const firstTab = tabs[0];
      const window = await chrome.windows.create({ 
        tabId: firstTab.id,
        focused: false // Don't focus each window as we create it
      });
      createdWindows.push(window.id);

      // Move remaining tabs to the new window
      const tabIds = tabs.slice(1).map(t => t.id);
      if (tabIds.length > 0) {
        await chrome.tabs.move(tabIds, { windowId: window.id, index: -1 });
      }

      // Sort tabs within this window by URL
      await sortTabsInWindow(window.id);
    } catch (error) {
      console.error(`Error processing domain ${domain} for ${isIncognito ? 'incognito' : 'normal'} tabs:`, error);
    }
  }

  // Create one window for all singletons
  if (singletonTabs.length > 0) {
    try {
      const firstTab = singletonTabs[0];
      const window = await chrome.windows.create({ 
        tabId: firstTab.id,
        focused: false
      });
      singletonWindowId = window.id;
      createdWindows.push(window.id);

      // Move remaining singleton tabs to the new window
      const tabIds = singletonTabs.slice(1).map(t => t.id);
      if (tabIds.length > 0) {
        await chrome.tabs.move(tabIds, { windowId: window.id, index: -1 });
      }

      // Sort tabs within singleton window by URL
      await sortTabsInWindow(window.id);
    } catch (error) {
      console.error(`Error processing singletons for ${isIncognito ? 'incognito' : 'normal'} tabs:`, error);
    }
  }

  return { createdWindows, singletonWindowId };
}

/**
 * Main function: sorts tabs by domain into windows
 * Handles incognito and non-incognito tabs separately
 */
async function sortTabsByDomainIntoWindows() {
  try {
    // Get all tabs across all windows (includes incognito if extension is allowed)
    const allTabs = await chrome.tabs.query({});

    // Separate incognito and non-incognito tabs
    const normalTabs = allTabs.filter(tab => !tab.incognito);
    const incognitoTabs = allTabs.filter(tab => tab.incognito);

    // Process normal tabs and incognito tabs separately
    const normalResult = await processTabsByIncognitoState(normalTabs, false);
    const incognitoResult = await processTabsByIncognitoState(incognitoTabs, true);

    // Focus the singleton window at the end (prefer normal over incognito)
    if (normalResult.singletonWindowId) {
      await chrome.windows.update(normalResult.singletonWindowId, { focused: true });
    } else if (incognitoResult.singletonWindowId) {
      await chrome.windows.update(incognitoResult.singletonWindowId, { focused: true });
    } else {
      // If no singleton window, focus the last created window
      const allCreatedWindows = [...normalResult.createdWindows, ...incognitoResult.createdWindows];
      if (allCreatedWindows.length > 0) {
        await chrome.windows.update(allCreatedWindows[allCreatedWindows.length - 1], { focused: true });
      }
    }

  } catch (error) {
    console.error('Error sorting tabs:', error);
  }
}
