# Blessed Tab Sorter

A browser extension for Chrome, Brave, and other Chromium-based browsers that automatically organizes your browser tabs by domain, decluttering your workspace by grouping related tabs into dedicated windows.

## What It Does

Blessed Tab Sorter analyzes all your open tabs across all browser windows and reorganizes them using a simple, effective strategy:

- **Multiple tabs from the same domain** → Moved into their own dedicated window
- **Single tabs from different domains** → Collected together in one shared window

This approach keeps duplicate tabs grouped together while avoiding unnecessary isolation of unique tabs.

## How It Works

1. **Domain Analysis**: The extension scans all open tabs and groups them by their domain (e.g., `github.com`, `stackoverflow.com`)

2. **Window Creation**: 
   - For each domain with 2 or more tabs, a new window is created containing only those tabs
   - All singleton tabs (domains with only 1 tab) are collected into a single shared window

3. **Automatic Sorting**: Within each window, tabs are automatically sorted by URL for easy navigation

4. **Smart URL Handling**: Special URLs like `chrome://`, `about:`, and extension pages are handled gracefully

## Usage

**Click the extension icon** in your browser toolbar, or press **`Ctrl+Shift+S`** (or **`Cmd+Shift+S`** on Mac) to instantly organize all your tabs.

The extension focuses the singleton window at the end, so you'll land on your collection of unique tabs after the sorting completes.

## Installation

1. Open your browser (Chrome, Brave, or other Chromium-based browser) and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`
   - **Other Chromium browsers**: `[browser-name]://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `blessed-tab-sorter` directory
5. The extension icon will appear in your toolbar

## Why Use It

When you have dozens of tabs open across multiple windows, it's easy to lose track of what you're working on. Blessed Tab Sorter provides a quick way to:

- **Reduce clutter** by grouping related tabs together
- **Improve focus** by isolating domains into separate windows
- **Save time** with one-click organization
- **Maintain context** by keeping unique tabs accessible in one place

Perfect for research sessions, multi-project workflows, or simply cleaning up after a busy browsing session.
