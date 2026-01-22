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

    // #region agent log - Capture DOM structure for debugging
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
    const domAnalysis = Array.from(tweetElements).slice(0, 5).map((article, idx) => {
      const allLinks = article.querySelectorAll('a[href]');
      const linkHrefs = Array.from(allLinks).map(a => a.getAttribute('href') || '').filter(h => h.length > 0);
      const cardWrapper = article.querySelector('[data-testid="card.wrapper"]');
      const hasCardLayoutLarge = !!article.querySelector('[data-testid="card.layoutLarge.detail"]');
      const hasCardLayoutSmall = !!article.querySelector('[data-testid="card.layoutSmall.detail"]');
      const cardSpans = cardWrapper ? Array.from(cardWrapper.querySelectorAll('span[dir="ltr"]')).map(s => s.textContent?.slice(0, 50)) : [];
      const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
      const contentPreview = tweetTextEl?.textContent?.slice(0, 100) || '';
      
      // Look for any data-testid attributes in card
      const cardTestIds = cardWrapper ? Array.from(cardWrapper.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')) : [];
      
      return {
        idx,
        linkCount: linkHrefs.length,
        sampleLinks: linkHrefs.slice(0, 8),
        hasCardWrapper: !!cardWrapper,
        hasCardLayoutLarge,
        hasCardLayoutSmall,
        cardTestIds,
        cardSpans: cardSpans.slice(0, 3),
        contentPreview,
      };
    });
    // Send to background for logging
    chrome.runtime.sendMessage({ type: 'DEBUG_DOM_ANALYSIS', payload: domAnalysis });
    // #endregion

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
      // Article fields
      isArticle: tweet.isArticle,
      articleContent: null, // Will be fetched by articleFetcher
      articleTitle: tweet.articleTitle,
      estimatedReadTime: null, // Will be calculated after content fetch
      articleFetchStatus: tweet.isArticle ? 'pending' : undefined,
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:categorizeBookmark',message:'categorizing',data:{tweetId:tweet.tweetId,isArticle:tweet.isArticle,isReply:tweet.isReply,mediaCount:tweet.mediaUrls.length,externalCount:tweet.externalUrls.length,contentLength:tweet.content.length,articleTitle:tweet.articleTitle},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // X Articles (long-form content) get categorized as articles
  if (tweet.isArticle) return 'article';
  // Thread replies
  if (tweet.isReply) return 'thread';
  // Media-heavy content
  if (tweet.mediaUrls.length > 0) return 'media';
  // Everything else (including tweets with external links) is a quick take
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
