import type { ScrapedTweet } from '@bookmarx/shared';

/**
 * Scrapes tweet data from the X/Twitter bookmarks page.
 * Note: X's DOM structure may change. This scraper targets the current structure
 * as of early 2025 and may need updates if X changes their frontend.
 */
export function scrapeTweets(): ScrapedTweet[] {
  const tweets: ScrapedTweet[] = [];
  const seenIds = new Set<string>();

  // Find all tweet articles on the page
  const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');

  tweetElements.forEach((article) => {
    try {
      const tweet = parseTweetElement(article as HTMLElement);
      if (tweet && !seenIds.has(tweet.tweetId)) {
        seenIds.add(tweet.tweetId);
        tweets.push(tweet);
      }
    } catch (error) {
      console.warn('[BookmarX] Failed to parse tweet:', error);
    }
  });

  return tweets;
}

function parseTweetElement(article: HTMLElement): ScrapedTweet | null {
  // Extract tweet ID from the tweet link
  const tweetLink = article.querySelector('a[href*="/status/"]');
  if (!tweetLink) return null;

  const href = tweetLink.getAttribute('href') || '';
  const tweetIdMatch = href.match(/\/status\/(\d+)/);
  if (!tweetIdMatch) return null;

  const tweetId = tweetIdMatch[1];

  // Extract author info
  const authorInfo = extractAuthorInfo(article);
  if (!authorInfo) return null;

  // Extract tweet content
  const content = extractContent(article);

  // Extract media URLs
  const mediaUrls = extractMediaUrls(article);

  // Extract external URLs
  const externalUrls = extractExternalUrls(article);

  // Extract timestamp
  const tweetCreatedAt = extractTimestamp(article);

  // Check if this is a reply (part of a thread)
  const isReply = checkIfReply(article);
  const replyToTweetId = isReply ? extractReplyToId(article) : null;

  return {
    tweetId,
    authorHandle: authorInfo.handle,
    authorName: authorInfo.name,
    authorAvatarUrl: authorInfo.avatarUrl,
    content,
    mediaUrls,
    externalUrls,
    tweetCreatedAt,
    isReply,
    replyToTweetId,
  };
}

function extractAuthorInfo(article: HTMLElement): { handle: string; name: string; avatarUrl: string } | null {
  // Find the user avatar
  const avatar = article.querySelector('img[src*="profile_images"]') as HTMLImageElement;
  const avatarUrl = avatar?.src || '';

  // Find the username link (starts with @)
  const userLinks = article.querySelectorAll('a[href^="/"]');
  let handle = '';
  let name = '';

  for (const link of userLinks) {
    const href = link.getAttribute('href') || '';
    // Skip non-user links
    if (href.includes('/status/') || href.includes('/i/') || href === '/') continue;

    // The handle is in the href
    const potentialHandle = href.replace('/', '');
    if (potentialHandle && !potentialHandle.includes('/')) {
      handle = potentialHandle;

      // Try to get the display name from the link's text or nearby elements
      const nameSpan = link.querySelector('span');
      if (nameSpan) {
        name = nameSpan.textContent?.trim() || handle;
      }
      break;
    }
  }

  if (!handle) return null;

  return { handle, name: name || handle, avatarUrl };
}

function extractContent(article: HTMLElement): string {
  // Find the tweet text element
  const tweetText = article.querySelector('[data-testid="tweetText"]');
  if (!tweetText) return '';

  // Get all text content, preserving line breaks
  let content = '';
  tweetText.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      // Handle emojis (they're images with alt text)
      if (element.tagName === 'IMG' && element.getAttribute('alt')) {
        content += element.getAttribute('alt');
      }
      // Handle links
      else if (element.tagName === 'A') {
        content += element.textContent;
      }
      // Handle spans (including hashtags and mentions)
      else if (element.tagName === 'SPAN') {
        content += element.textContent;
      }
      // Handle line breaks
      else if (element.tagName === 'BR') {
        content += '\n';
      }
    }
  });

  return content.trim();
}

function extractMediaUrls(article: HTMLElement): string[] {
  const urls: string[] = [];

  // Find images
  const images = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
  images.forEach((img) => {
    const src = (img as HTMLImageElement).src;
    if (src) urls.push(src);
  });

  // Find video thumbnails (videos are loaded dynamically)
  const videos = article.querySelectorAll('video');
  videos.forEach((video) => {
    const poster = video.getAttribute('poster');
    if (poster) urls.push(poster);
  });

  return urls;
}

function extractExternalUrls(article: HTMLElement): string[] {
  const urls: string[] = [];

  // Find card links (link previews)
  const cardLinks = article.querySelectorAll('a[href*="t.co"]');
  cardLinks.forEach((link) => {
    // Try to get the expanded URL from the link text or title
    const expandedUrl = link.getAttribute('title') || link.textContent?.trim();
    if (expandedUrl && expandedUrl.startsWith('http')) {
      urls.push(expandedUrl);
    }
  });

  return [...new Set(urls)]; // Remove duplicates
}

function extractTimestamp(article: HTMLElement): string | null {
  // Find the time element
  const time = article.querySelector('time');
  if (time) {
    return time.getAttribute('datetime');
  }
  return null;
}

function checkIfReply(article: HTMLElement): boolean {
  // Check for "Replying to" indicator
  const replyIndicator = article.querySelector('[data-testid="socialContext"]');
  if (replyIndicator?.textContent?.includes('Replying to')) {
    return true;
  }

  // Check for the reply thread line (vertical line connecting tweets)
  const threadLine = article.querySelector('[data-testid="tweet"] > div > div > div:first-child');
  if (threadLine?.querySelector('div[style*="background-color"]')) {
    return true;
  }

  return false;
}

function extractReplyToId(article: HTMLElement): string | null {
  // Try to find the parent tweet link in reply context
  const replyContext = article.querySelector('[data-testid="socialContext"] a[href*="/status/"]');
  if (replyContext) {
    const href = replyContext.getAttribute('href') || '';
    const match = href.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  }
  return null;
}
