import { scrapeTweets } from './scraper';
import type { LocalBookmark } from '@bookmarx/shared';

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_BOOKMARKS') {
    handleScrape();
  }
});

async function handleScrape() {
  console.log('[BookmarX] Starting bookmark scrape...');

  try {
    const tweets = await scrapeTweets();
    console.log(`[BookmarX] Found ${tweets.length} tweets`);

    // Convert scraped tweets to LocalBookmark format
    const bookmarks: LocalBookmark[] = tweets.map((tweet, index) => ({
      localId: `local_${tweet.tweetId}`,
      tweetId: tweet.tweetId,
      authorHandle: tweet.authorHandle,
      authorName: tweet.authorName,
      authorAvatarUrl: tweet.authorAvatarUrl,
      content: tweet.content,
      mediaUrls: tweet.mediaUrls,
      externalUrls: tweet.externalUrls,
      tweetCreatedAt: tweet.tweetCreatedAt,
      bookmarkedAt: new Date().toISOString(),
      isThread: tweet.isReply,
      threadId: tweet.replyToTweetId,
      threadPosition: 0,
      category: categorizeBookmark(tweet),
      hasVideo: tweet.hasVideo,
      syncStatus: 'pending',
    }));

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'BOOKMARKS_SCRAPED',
      payload: bookmarks,
    });

  } catch (error) {
    console.error('[BookmarX] Scrape error:', error);
  }
}

function categorizeBookmark(tweet: Awaited<ReturnType<typeof scrapeTweets>>[0]): LocalBookmark['category'] {
  if (tweet.isReply) return 'thread';
  if (tweet.externalUrls.length > 0) return 'article';
  if (tweet.mediaUrls.length > 0) return 'media';
  return 'quick_take';
}

// Auto-scrape when page loads if on bookmarks page
if (window.location.pathname === '/i/bookmarks') {
  // Set up mutation observer to detect new tweets as user scrolls
  const observer = new MutationObserver((mutations) => {
    // Debounce the scrape
    clearTimeout((window as unknown as { bookmarxTimeout?: number }).bookmarxTimeout);
    (window as unknown as { bookmarxTimeout: number }).bookmarxTimeout = window.setTimeout(() => {
      handleScrape();
    }, 1000);
  });

  // Observe the timeline container for changes
  const startObserving = () => {
    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (timeline) {
      observer.observe(timeline, {
        childList: true,
        subtree: true,
      });
      console.log('[BookmarX] Observing timeline for changes');
    } else {
      // Retry if timeline not found yet
      setTimeout(startObserving, 1000);
    }
  };

  // Wait for page to load
  if (document.readyState === 'complete') {
    startObserving();
    handleScrape();
  } else {
    window.addEventListener('load', () => {
      startObserving();
      handleScrape();
    });
  }
}

console.log('[BookmarX] Content script loaded');
