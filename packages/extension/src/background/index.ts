import type { SyncStatus, LocalBookmark } from '@bookmarx/shared';

// Initialize sync status
const defaultSyncStatus: SyncStatus = {
  lastSyncedAt: null,
  pendingCount: 0,
  totalCount: 0,
  isSyncing: false,
  error: null,
};

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TRIGGER_SYNC':
      triggerSync();
      break;

    case 'BOOKMARKS_SCRAPED':
      handleScrapedBookmarks(message.payload);
      break;

    case 'GET_SYNC_STATUS':
      chrome.storage.local.get(['syncStatus'], (result) => {
        sendResponse(result.syncStatus || defaultSyncStatus);
      });
      return true; // Keep channel open for async response
  }
});

async function triggerSync() {
  // Send message to active tab to scrape bookmarks
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id && tab.url?.includes('x.com/i/bookmarks')) {
    chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_BOOKMARKS' });
  } else {
    // Open bookmarks page if not already there
    chrome.tabs.create({ url: 'https://x.com/i/bookmarks' });
  }
}

async function handleScrapedBookmarks(bookmarks: LocalBookmark[]) {
  // Update sync status
  const syncStatus: SyncStatus = {
    lastSyncedAt: new Date().toISOString(),
    pendingCount: bookmarks.filter(b => !b.syncStatus || b.syncStatus === 'pending').length,
    totalCount: bookmarks.length,
    isSyncing: false,
    error: null,
  };

  // Store bookmarks and status
  await chrome.storage.local.set({
    bookmarks,
    syncStatus,
  });

  // Notify popup
  chrome.runtime.sendMessage({
    type: 'SYNC_STATUS_UPDATE',
    payload: syncStatus,
  });

  console.log(`[BookmarX] Synced ${bookmarks.length} bookmarks`);
}

// Listen for tab updates to auto-scrape when on bookmarks page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('x.com/i/bookmarks')) {
    // Wait a moment for page to fully render
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_BOOKMARKS' });
    }, 2000);
  }
});

console.log('[BookmarX] Background service worker initialized');
