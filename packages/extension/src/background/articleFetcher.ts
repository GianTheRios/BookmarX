import type { LocalBookmark } from '@bookmarx/shared';

/**
 * Fetches full article content for X Articles by navigating to the article page
 * and scraping the complete content.
 */

// Average reading speed in words per minute
const WORDS_PER_MINUTE = 200;

/**
 * Fetches the full content of an X Article by opening it in a background tab
 */
export async function fetchArticleContent(
  authorHandle: string,
  tweetId: string
): Promise<{
  content: string | null;
  title: string | null;
  estimatedReadTime: number | null;
  error: string | null;
}> {
  // Use the regular tweet URL - X Articles show full content when you click on them
  const articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'articleFetcher.ts:fetchArticleContent',message:'starting article fetch',data:{authorHandle,tweetId,articleUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run8',hypothesisId:'H11'})}).catch(()=>{});
  // #endregion
  
  try {
    // Open the article in a background tab
    const tab = await chrome.tabs.create({
      url: articleUrl,
      active: false, // Keep in background to not disrupt user
    });

    if (!tab.id) {
      throw new Error('Failed to create tab');
    }

    // Wait for the page to load
    await waitForTabLoad(tab.id);

    // Wait longer for dynamic content to render - X Articles need more time
    await delay(4000);

    // Execute content script to scrape the article
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeArticlePage,
    });

    // Close the tab
    await chrome.tabs.remove(tab.id);

    // #region agent log
    const resultData = results && results[0] && results[0].result;
    fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'articleFetcher.ts:fetchArticleContent',message:'scrape result',data:{hasResult:!!resultData,contentLength:resultData?.content?.length||0,title:resultData?.title,contentPreview:resultData?.content?.slice(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run8',hypothesisId:'H11'})}).catch(()=>{});
    // #endregion

    if (results && results[0] && results[0].result) {
      const { content, title } = results[0].result;
      const wordCount = content ? content.split(/\s+/).length : 0;
      const estimatedReadTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

      return {
        content,
        title,
        estimatedReadTime: estimatedReadTime > 0 ? estimatedReadTime : null,
        error: null,
      };
    }

    return {
      content: null,
      title: null,
      estimatedReadTime: null,
      error: 'Failed to scrape article content',
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'articleFetcher.ts:fetchArticleContent',message:'fetch error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run8',hypothesisId:'H11'})}).catch(()=>{});
    // #endregion
    console.error('[BookmarX] Article fetch error:', error);
    return {
      content: null,
      title: null,
      estimatedReadTime: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Scrapes the article content from the page (runs in content script context)
 * X Article detail pages show the article content as scrollable rich text
 * when you click on an article from the timeline.
 */
function scrapeArticlePage(): { content: string | null; title: string | null } {
  try {
    let content = '';
    let title: string | null = null;
    
    // For debugging - log what we find on the page
    const debugInfo: string[] = [];
    
    // Look for the main tweet article
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
    debugInfo.push(`Found ${tweetArticles.length} tweet articles`);
    
    // The first tweet article should be the main one (not replies)
    const mainTweet = tweetArticles[0];
    
    if (!mainTweet) {
      console.log('[BookmarX] No tweet article found');
      return { content: null, title: null };
    }
    
    // X Articles show as a card/preview on the tweet - find the article card
    const articleCard = mainTweet.querySelector('[data-testid="card.wrapper"]');
    const tweetText = mainTweet.querySelector('[data-testid="tweetText"]');
    
    debugInfo.push(`Has card wrapper: ${!!articleCard}`);
    debugInfo.push(`Has tweet text: ${!!tweetText}`);
    
    // Try to get the article title from the card
    if (articleCard) {
      const cardTitle = articleCard.querySelector('[data-testid^="card.layout"]');
      if (cardTitle) {
        title = cardTitle.textContent?.trim() || null;
      }
      // Also look for title in spans
      const titleSpan = articleCard.querySelector('span[dir="ltr"]');
      if (!title && titleSpan) {
        const spanText = titleSpan.textContent?.trim() || '';
        if (spanText.length > 10 && spanText.length < 200) {
          title = spanText;
        }
      }
    }
    
    // For X Articles, the full content might be:
    // 1. In a nested article view (if we clicked into it)
    // 2. Displayed below the card when expanded
    // 3. Need to scroll/click to see full content
    
    // Look for any long-form text content on the page
    const allTweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
    const textContents: string[] = [];
    
    allTweetTexts.forEach((el, idx) => {
      const text = el.textContent?.trim() || '';
      debugInfo.push(`Tweet text ${idx}: ${text.length} chars`);
      if (text.length > 0) {
        textContents.push(text);
      }
    });
    
    // Get the main content - the longest text block is likely the article
    if (textContents.length > 0) {
      content = textContents.sort((a, b) => b.length - a.length)[0];
    }
    
    // If no tweet text (which is the case for X Articles on bookmarks page),
    // try to find content in other elements
    if (!content || content.length < 50) {
      // Look for rich text content areas
      const richTextAreas = document.querySelectorAll('[dir="auto"] > span, p[dir="auto"]');
      const paragraphs: string[] = [];
      
      richTextAreas.forEach(el => {
        const text = el.textContent?.trim() || '';
        // Filter out UI text, short strings, and duplicates
        if (text.length > 50 && 
            !text.includes('keyboard shortcuts') &&
            !text.startsWith('@') &&
            !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      });
      
      if (paragraphs.length > 0) {
        content = paragraphs.join('\n\n');
      }
    }
    
    // Last resort: get all visible text from the main column
    if (!content || content.length < 100) {
      const mainColumn = document.querySelector('[data-testid="primaryColumn"]');
      if (mainColumn) {
        const allText = mainColumn.textContent || '';
        // Extract the substantive content (skip UI elements)
        const lines = allText.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 50 && !l.includes('keyboard') && !l.startsWith('©'));
        
        if (lines.length > 0) {
          content = lines.slice(0, 20).join('\n\n'); // Limit to avoid UI noise
        }
      }
    }
    
    console.log('[BookmarX] Scrape debug:', debugInfo.join(' | '));
    console.log('[BookmarX] Content found:', content?.length || 0, 'chars');
    
    // Clean up
    content = content?.replace(/\n{3,}/g, '\n\n').trim() || '';

    return { content: content || null, title };
  } catch (error) {
    console.error('[BookmarX] Scrape article page error:', error);
    return { content: null, title: null };
  }
}

/**
 * Wait for a tab to finish loading
 */
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, 30000);

    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Simple delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Expands articles in a batch of bookmarks by fetching their full content.
 * Similar to thread expansion, but for articles.
 */
export async function expandArticlesInBookmarks(
  bookmarks: LocalBookmark[],
  onProgress?: (current: number, total: number) => void
): Promise<LocalBookmark[]> {
  // Find articles that need content fetching
  const articles = bookmarks.filter(
    (b) => b.isArticle && !b.articleContent
  );

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/749c0c6c-5c1d-4ec4-a8e0-a7c76aa5dbae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'articleFetcher.ts:expandArticlesInBookmarks',message:'checking articles to expand',data:{totalBookmarks:bookmarks.length,articlesToFetch:articles.length,articleIds:articles.map(a=>a.tweetId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run7',hypothesisId:'H10'})}).catch(()=>{});
  // #endregion

  if (articles.length === 0) {
    return bookmarks;
  }

  console.log(`[BookmarX] Found ${articles.length} articles to fetch content for`);

  const expandedBookmarks = [...bookmarks];
  let processed = 0;

  for (const article of articles) {
    processed++;
    onProgress?.(processed, articles.length);

    console.log(`[BookmarX] Fetching article ${article.tweetId}...`);

    const result = await fetchArticleContent(article.authorHandle, article.tweetId);

    if (result.content) {
      // Update the bookmark with full article content
      const index = expandedBookmarks.findIndex((b) => b.tweetId === article.tweetId);
      if (index !== -1) {
        expandedBookmarks[index] = {
          ...expandedBookmarks[index],
          articleContent: result.content,
          articleTitle: result.title || expandedBookmarks[index].articleTitle,
          estimatedReadTime: result.estimatedReadTime,
          articleFetchStatus: 'fetched',
        };
      }
    } else {
      // Mark as error but keep the bookmark
      const index = expandedBookmarks.findIndex((b) => b.tweetId === article.tweetId);
      if (index !== -1) {
        expandedBookmarks[index] = {
          ...expandedBookmarks[index],
          articleFetchStatus: 'error',
        };
      }
    }

    // Add delay between fetches to avoid rate limiting
    if (processed < articles.length) {
      await delay(1500);
    }
  }

  return expandedBookmarks;
}
