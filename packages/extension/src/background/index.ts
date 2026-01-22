import type { SyncStatus, LocalBookmark } from '@bookmarx/shared';
import { getUser, syncBookmarksToSupabase } from '../lib/supabase';
import { expandThreadsInBookmarks } from './threadFetcher';
import { expandArticlesInBookmarks } from './articleFetcher';

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

    // #region agent log
    case 'DEBUG_DOM_ANALYSIS':
      fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background:DEBUG_DOM_ANALYSIS',message:'DOM structure of tweets',data:{tweets:message.payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run6',hypothesisId:'H6'})}).catch(()=>{});
      break;
    // #endregion
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

async function handleScrapedBookmarks(initialBookmarks: LocalBookmark[]) {
  // #region agent log
  const categoryCounts = initialBookmarks.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const articleBookmarks = initialBookmarks.filter(b => b.isArticle);
  fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:handleScrapedBookmarks',message:'received scraped bookmarks',data:{totalCount:initialBookmarks.length,categoryCounts,articleCount:articleBookmarks.length,articles:articleBookmarks.map(b=>({tweetId:b.tweetId,title:b.articleTitle,authorHandle:b.authorHandle}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  // Set syncing status - start with thread expansion phase
  let syncStatus: SyncStatus = {
    lastSyncedAt: null,
    pendingCount: initialBookmarks.length,
    totalCount: initialBookmarks.length,
    isSyncing: true,
    error: null,
  };

  await chrome.storage.local.set({ syncStatus });
  chrome.runtime.sendMessage({ type: 'SYNC_STATUS_UPDATE', payload: syncStatus });

  let bookmarks = initialBookmarks;

  try {
    // Expand threads to get full thread content
    console.log('[BookmarX] Checking for threads to expand...');
    bookmarks = await expandThreadsInBookmarks(initialBookmarks, (current, total) => {
      console.log(`[BookmarX] Expanding threads: ${current}/${total}`);
    });

    if (bookmarks.length > initialBookmarks.length) {
      console.log(`[BookmarX] Expanded ${initialBookmarks.length} bookmarks to ${bookmarks.length} (including thread tweets)`);
    }

    // Note: Article content fetching is disabled to avoid opening too many tabs
    // Articles will be fetched on-demand when the user opens them in the reader
    const articlesCount = bookmarks.filter(b => b.isArticle).length;
    if (articlesCount > 0) {
      console.log(`[BookmarX] Found ${articlesCount} articles - content will be fetched on-demand when opened`);
    }

    // Update status with new count
    syncStatus = {
      ...syncStatus,
      pendingCount: bookmarks.length,
      totalCount: bookmarks.length,
    };
    await chrome.storage.local.set({ syncStatus });
    chrome.runtime.sendMessage({ type: 'SYNC_STATUS_UPDATE', payload: syncStatus });

    // Check if user is authenticated
    const user = await getUser();

    if (!user) {
      // Store locally only - user needs to sign in to sync to cloud
      syncStatus = {
        lastSyncedAt: new Date().toISOString(),
        pendingCount: bookmarks.length,
        totalCount: bookmarks.length,
        isSyncing: false,
        error: 'Sign in to sync bookmarks to cloud',
      };

      await chrome.storage.local.set({ bookmarks, syncStatus });
      chrome.runtime.sendMessage({ type: 'SYNC_STATUS_UPDATE', payload: syncStatus });
      console.log(`[BookmarX] Stored ${bookmarks.length} bookmarks locally (not signed in)`);
      return;
    }

    // #region agent log
    const finalCategoryCounts = bookmarks.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const finalArticles = bookmarks.filter(b => b.isArticle);
    fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:beforeSync',message:'about to sync to Supabase',data:{totalCount:bookmarks.length,categoryCounts:finalCategoryCounts,articleCount:finalArticles.length,sampleBookmarks:bookmarks.slice(0,3).map(b=>({tweetId:b.tweetId,category:b.category,isArticle:b.isArticle,hasMedia:b.mediaUrls.length>0}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    // Sync to Supabase
    const { synced, errors } = await syncBookmarksToSupabase(bookmarks);

    // Update bookmarks with synced status
    const syncedBookmarks = bookmarks.map(b => ({
      ...b,
      syncStatus: errors.some(e => e.tweetId === b.tweetId) ? 'error' as const : 'synced' as const,
    }));

    syncStatus = {
      lastSyncedAt: new Date().toISOString(),
      pendingCount: errors.length,
      totalCount: bookmarks.length,
      isSyncing: false,
      error: errors.length > 0 ? `Failed to sync ${errors.length} bookmarks` : null,
    };

    await chrome.storage.local.set({ bookmarks: syncedBookmarks, syncStatus });
    chrome.runtime.sendMessage({ type: 'SYNC_STATUS_UPDATE', payload: syncStatus });
    console.log(`[BookmarX] Synced ${synced} bookmarks to Supabase`);

  } catch (error) {
    console.error('[BookmarX] Sync error:', error);

    syncStatus = {
      lastSyncedAt: new Date().toISOString(),
      pendingCount: bookmarks.length,
      totalCount: bookmarks.length,
      isSyncing: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };

    await chrome.storage.local.set({ bookmarks, syncStatus });
    chrome.runtime.sendMessage({ type: 'SYNC_STATUS_UPDATE', payload: syncStatus });
  }
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
