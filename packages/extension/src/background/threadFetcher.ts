import type { LocalBookmark, ScrapedTweet } from '@bookmarx/shared';

/**
 * Configuration for thread fetching
 */
const THREAD_FETCH_CONFIG = {
  // Delay between requests to avoid rate limiting (ms)
  REQUEST_DELAY: 1500,
  // Maximum retries per request
  MAX_RETRIES: 2,
  // Timeout for each request (ms)
  REQUEST_TIMEOUT: 10000,
  // Maximum tweets to fetch per thread (safety limit)
  MAX_THREAD_LENGTH: 50,
};

/**
 * Result of fetching a thread
 */
interface ThreadFetchResult {
  originalTweetId: string;
  tweets: ParsedThreadTweet[];
  error?: string;
}

/**
 * Parsed tweet from thread page
 */
interface ParsedThreadTweet {
  tweetId: string;
  authorHandle: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  mediaUrls: string[];
  externalUrls: string[];
  tweetCreatedAt: string | null;
  position: number;
}

/**
 * Detects if a bookmark might be the start of a thread that needs expansion.
 * We check for indicators that suggest this tweet has more content.
 */
export function isThreadCandidate(bookmark: LocalBookmark): boolean {
  const content = bookmark.content.toLowerCase();

  // Already marked as part of a thread (it's a reply)
  if (bookmark.isThread && bookmark.threadId) {
    return false;
  }

  // Check for common thread indicators
  const threadIndicators = [
    /\bthread\b/i,
    /\b1\/\d+\b/,  // "1/5", "1/10", etc.
    /\b\(1\/\d+\)\b/,  // "(1/5)"
    /\bpart 1\b/i,
    /^1\.\s/,  // Starts with "1. "
    /🧵/,  // Thread emoji
  ];

  for (const indicator of threadIndicators) {
    if (indicator.test(bookmark.content)) {
      return true;
    }
  }

  // Long tweets are often thread starters
  if (bookmark.content.length > 250) {
    return true;
  }

  return false;
}

/**
 * Fetches the full thread for a given tweet.
 * Uses the background script's fetch capability with credentials.
 */
export async function fetchThreadTweets(
  authorHandle: string,
  tweetId: string
): Promise<ThreadFetchResult> {
  const url = `https://x.com/${authorHandle}/status/${tweetId}`;

  try {
    const html = await fetchWithRetry(url);
    const tweets = parseThreadFromHtml(html, authorHandle, tweetId);

    return {
      originalTweetId: tweetId,
      tweets,
    };
  } catch (error) {
    console.error(`[BookmarX] Failed to fetch thread ${tweetId}:`, error);
    return {
      originalTweetId: tweetId,
      tweets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(url: string, retries = 0): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), THREAD_FETCH_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeout);

    if (retries < THREAD_FETCH_CONFIG.MAX_RETRIES) {
      await delay(THREAD_FETCH_CONFIG.REQUEST_DELAY);
      return fetchWithRetry(url, retries + 1);
    }

    throw error;
  }
}

/**
 * Parse thread tweets from HTML.
 * X embeds tweet data in script tags as JSON.
 */
function parseThreadFromHtml(
  html: string,
  authorHandle: string,
  originalTweetId: string
): ParsedThreadTweet[] {
  const tweets: ParsedThreadTweet[] = [];

  try {
    // X embeds data in script tags with type="application/json"
    // Look for the __NEXT_DATA__ script or similar data embeddings
    const scriptMatches = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);

    if (scriptMatches && scriptMatches[1]) {
      const data = JSON.parse(scriptMatches[1]);
      const extractedTweets = extractTweetsFromNextData(data, authorHandle, originalTweetId);
      tweets.push(...extractedTweets);
    }

    // If NEXT_DATA approach didn't work, try parsing from embedded tweet objects
    if (tweets.length === 0) {
      const tweetDataMatches = html.matchAll(/"tweet_results":\s*(\{[^}]+\})/g);
      for (const match of tweetDataMatches) {
        try {
          // This is a simplified approach - X's actual structure is more complex
          const tweetData = JSON.parse(match[1]);
          const parsed = parseTweetData(tweetData, authorHandle);
          if (parsed) {
            tweets.push(parsed);
          }
        } catch {
          // Continue parsing other matches
        }
      }
    }

    // Fallback: parse from HTML structure
    if (tweets.length === 0) {
      const htmlTweets = parseThreadFromHtmlDom(html, authorHandle, originalTweetId);
      tweets.push(...htmlTweets);
    }

  } catch (error) {
    console.warn('[BookmarX] Failed to parse thread HTML:', error);
  }

  // Assign positions and deduplicate
  const seen = new Set<string>();
  const uniqueTweets = tweets.filter(t => {
    if (seen.has(t.tweetId)) return false;
    seen.add(t.tweetId);
    return true;
  });

  // Sort by position and limit
  return uniqueTweets
    .slice(0, THREAD_FETCH_CONFIG.MAX_THREAD_LENGTH)
    .map((tweet, index) => ({
      ...tweet,
      position: index,
    }));
}

/**
 * Extract tweets from Next.js data structure
 */
function extractTweetsFromNextData(
  data: Record<string, unknown>,
  authorHandle: string,
  originalTweetId: string
): ParsedThreadTweet[] {
  const tweets: ParsedThreadTweet[] = [];

  // Navigate through the nested structure to find tweet entries
  function searchForTweets(obj: unknown, depth = 0): void {
    if (depth > 20 || !obj || typeof obj !== 'object') return;

    // Check if this object looks like a tweet
    if (isLikelyTweetObject(obj)) {
      const parsed = parseTweetObject(obj as Record<string, unknown>, authorHandle);
      if (parsed) {
        tweets.push(parsed);
      }
    }

    // Recursively search
    if (Array.isArray(obj)) {
      obj.forEach(item => searchForTweets(item, depth + 1));
    } else {
      Object.values(obj as Record<string, unknown>).forEach(val => searchForTweets(val, depth + 1));
    }
  }

  searchForTweets(data);
  return tweets;
}

/**
 * Check if an object looks like tweet data
 */
function isLikelyTweetObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    (typeof o.id_str === 'string' || typeof o.rest_id === 'string') &&
    (typeof o.full_text === 'string' || typeof o.text === 'string' || o.legacy !== undefined)
  );
}

/**
 * Safely access nested properties
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Parse a tweet object from X's data structure
 */
function parseTweetObject(
  obj: Record<string, unknown>,
  filterAuthor: string
): ParsedThreadTweet | null {
  try {
    // Handle nested legacy object structure
    const tweetData = (obj.legacy as Record<string, unknown>) || obj;

    // Try different paths for user data
    const userData: Record<string, unknown> =
      (getNestedValue(obj, 'core.user_results.result.legacy') as Record<string, unknown>) ||
      (getNestedValue(obj, 'user.legacy') as Record<string, unknown>) ||
      {};

    const tweetId = (tweetData.id_str as string) || (obj.rest_id as string) || '';
    const authorHandle = (userData.screen_name as string) || '';

    // Only include tweets from the thread author
    if (authorHandle.toLowerCase() !== filterAuthor.toLowerCase()) {
      return null;
    }

    const content = (tweetData.full_text as string) || (tweetData.text as string) || '';
    const authorName = (userData.name as string) || authorHandle;
    const authorAvatarUrl = (userData.profile_image_url_https as string) || '';
    const createdAt = (tweetData.created_at as string) || null;

    // Extract media
    const mediaUrls: string[] = [];
    const extendedEntities = tweetData.extended_entities as Record<string, unknown> | undefined;
    const entities = tweetData.entities as Record<string, unknown> | undefined;
    const extendedMedia = (extendedEntities?.media || entities?.media) as Array<{ media_url_https?: string }> | undefined;
    if (Array.isArray(extendedMedia)) {
      extendedMedia.forEach((m) => {
        if (m.media_url_https) {
          mediaUrls.push(m.media_url_https);
        }
      });
    }

    // Extract URLs
    const externalUrls: string[] = [];
    const urlEntities = entities?.urls as Array<{ expanded_url?: string }> | undefined;
    if (Array.isArray(urlEntities)) {
      urlEntities.forEach((u) => {
        if (u.expanded_url && !u.expanded_url.includes('twitter.com') && !u.expanded_url.includes('x.com')) {
          externalUrls.push(u.expanded_url);
        }
      });
    }

    return {
      tweetId,
      authorHandle,
      authorName,
      authorAvatarUrl,
      content,
      mediaUrls,
      externalUrls,
      tweetCreatedAt: createdAt,
      position: 0, // Will be set later
    };
  } catch {
    return null;
  }
}

/**
 * Parse tweet data from simpler structure
 */
function parseTweetData(
  data: Record<string, unknown>,
  filterAuthor: string
): ParsedThreadTweet | null {
  return parseTweetObject(data, filterAuthor);
}

/**
 * Fallback: Parse from HTML DOM-like structure
 * This is less reliable but works as a backup
 */
function parseThreadFromHtmlDom(
  html: string,
  authorHandle: string,
  originalTweetId: string
): ParsedThreadTweet[] {
  const tweets: ParsedThreadTweet[] = [];

  // Look for tweet IDs in the HTML
  const tweetIdMatches = html.matchAll(/\/status\/(\d{15,})/g);
  const seenIds = new Set<string>();

  for (const match of tweetIdMatches) {
    const tweetId = match[1];
    if (seenIds.has(tweetId)) continue;
    seenIds.add(tweetId);

    // Look for associated content nearby in the HTML
    // This is a best-effort approach
    const contentMatch = html.match(new RegExp(`"text"\\s*:\\s*"([^"]*)"[^}]*${tweetId}`, 'i'));
    const content = contentMatch ? decodeUnicodeEscapes(contentMatch[1]) : '';

    if (content) {
      tweets.push({
        tweetId,
        authorHandle,
        authorName: authorHandle,
        authorAvatarUrl: '',
        content,
        mediaUrls: [],
        externalUrls: [],
        tweetCreatedAt: null,
        position: 0,
      });
    }
  }

  return tweets;
}

/**
 * Decode unicode escapes in strings
 */
function decodeUnicodeEscapes(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}

/**
 * Delay utility for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Expand threads in a batch of bookmarks.
 * Returns the expanded bookmarks with thread data merged in.
 */
export async function expandThreadsInBookmarks(
  bookmarks: LocalBookmark[],
  onProgress?: (current: number, total: number) => void
): Promise<LocalBookmark[]> {
  // Find thread candidates
  const candidates = bookmarks.filter(isThreadCandidate);

  if (candidates.length === 0) {
    return bookmarks;
  }

  console.log(`[BookmarX] Found ${candidates.length} potential threads to expand`);

  const expandedBookmarks = [...bookmarks];
  const bookmarkMap = new Map(bookmarks.map(b => [b.tweetId, b]));

  let processed = 0;

  for (const candidate of candidates) {
    processed++;
    onProgress?.(processed, candidates.length);

    // Fetch the thread
    const result = await fetchThreadTweets(candidate.authorHandle, candidate.tweetId);

    if (result.error || result.tweets.length <= 1) {
      // No additional tweets found or error occurred
      continue;
    }

    console.log(`[BookmarX] Found ${result.tweets.length} tweets in thread ${candidate.tweetId}`);

    // Update the original bookmark to be marked as thread start
    const originalIndex = expandedBookmarks.findIndex(b => b.tweetId === candidate.tweetId);
    if (originalIndex !== -1) {
      expandedBookmarks[originalIndex] = {
        ...expandedBookmarks[originalIndex],
        isThread: true,
        threadId: candidate.tweetId, // Thread ID is the first tweet's ID
        threadPosition: 0,
        category: 'thread',
      };
    }

    // Add the additional thread tweets
    for (let i = 1; i < result.tweets.length; i++) {
      const tweet = result.tweets[i];

      // Skip if we already have this tweet
      if (bookmarkMap.has(tweet.tweetId)) {
        // Update existing bookmark with thread info
        const existingIndex = expandedBookmarks.findIndex(b => b.tweetId === tweet.tweetId);
        if (existingIndex !== -1) {
          expandedBookmarks[existingIndex] = {
            ...expandedBookmarks[existingIndex],
            isThread: true,
            threadId: candidate.tweetId,
            threadPosition: i,
            category: 'thread',
          };
        }
        continue;
      }

      // Create new bookmark for thread tweet
      const newBookmark: LocalBookmark = {
        localId: `local_${tweet.tweetId}`,
        tweetId: tweet.tweetId,
        authorHandle: tweet.authorHandle,
        authorName: tweet.authorName,
        authorAvatarUrl: tweet.authorAvatarUrl,
        content: tweet.content,
        mediaUrls: tweet.mediaUrls,
        externalUrls: tweet.externalUrls,
        tweetCreatedAt: tweet.tweetCreatedAt,
        bookmarkedAt: candidate.bookmarkedAt, // Use original bookmark time
        isThread: true,
        threadId: candidate.tweetId,
        threadPosition: i,
        category: 'thread',
        syncStatus: 'pending',
      };

      expandedBookmarks.push(newBookmark);
      bookmarkMap.set(tweet.tweetId, newBookmark);
    }

    // Rate limiting delay between requests
    if (processed < candidates.length) {
      await delay(THREAD_FETCH_CONFIG.REQUEST_DELAY);
    }
  }

  return expandedBookmarks;
}
