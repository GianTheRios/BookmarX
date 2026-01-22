import type { ScrapedTweet } from '@bookmarx/shared';

/**
 * Scrapes tweet data from the X/Twitter bookmarks page.
 * Note: X's DOM structure may change. This scraper targets the current structure
 * as of early 2025 and may need updates if X changes their frontend.
 */
export async function scrapeTweets(): Promise<ScrapedTweet[]> {
  // First, expand all truncated tweets
  await expandAllTruncatedTweets();

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

/**
 * Clicks all "Show more" buttons to expand truncated tweets
 */
async function expandAllTruncatedTweets(): Promise<void> {
  // Find "Show more" buttons/spans within tweet text
  const showMoreButtons = document.querySelectorAll('[data-testid="tweet-text-show-more-link"]');

  // Also look for the common "Show more" text pattern
  const allSpans = document.querySelectorAll('article[data-testid="tweet"] span');
  const showMoreSpans: HTMLElement[] = [];

  allSpans.forEach((span) => {
    if (span.textContent?.trim() === 'Show more' && span.closest('article')) {
      showMoreSpans.push(span as HTMLElement);
    }
  });

  const buttonsToClick = [...Array.from(showMoreButtons), ...showMoreSpans] as HTMLElement[];

  for (const button of buttonsToClick) {
    try {
      button.click();
      // Small delay to let content expand
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      console.warn('[BookmarX] Failed to expand tweet:', e);
    }
  }

  // Wait a bit for all content to load
  if (buttonsToClick.length > 0) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
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

  // Check if tweet contains video
  const hasVideo = detectVideoContent(article);

  // Check if this is an X Article (long-form content)
  const articleInfo = detectXArticle(article);

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
    hasVideo,
    isArticle: articleInfo.isArticle,
    articleTitle: articleInfo.title,
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

  // Find video elements and extract what we can
  const videos = article.querySelectorAll('video');
  videos.forEach((video) => {
    // Try to get video source
    const source = video.querySelector('source');
    if (source?.src && !source.src.startsWith('blob:')) {
      urls.push(source.src);
    }
    // Fallback to poster image for video thumbnail
    const poster = video.getAttribute('poster');
    if (poster) urls.push(poster);
  });

  // Find video containers with data attributes (X sometimes stores URLs here)
  const videoContainers = article.querySelectorAll('[data-testid="videoPlayer"]');
  videoContainers.forEach((container) => {
    // Look for video URL in nested elements
    const videoComponent = container.querySelector('[data-testid="videoComponent"]');
    if (videoComponent) {
      // Mark this tweet as having video
      const poster = container.querySelector('video')?.getAttribute('poster');
      if (poster && !urls.includes(poster)) {
        urls.push(poster);
      }
    }
  });

  // Find GIFs (they're often in video tags too)
  const gifs = article.querySelectorAll('video[aria-label*="GIF"], video[aria-label*="Animated"]');
  gifs.forEach((gif) => {
    const poster = gif.getAttribute('poster');
    if (poster && !urls.includes(poster)) {
      urls.push(poster);
    }
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

function detectVideoContent(article: HTMLElement): boolean {
  // Check for video player container (most reliable)
  const videoPlayer = article.querySelector('[data-testid="videoPlayer"]');
  if (videoPlayer) return true;

  // Check for actual video elements
  const videos = article.querySelectorAll('video');
  if (videos.length > 0) {
    // Make sure it's not just a GIF by checking for playback controls or duration
    for (const video of videos) {
      // Video players typically have these attributes or nested controls
      if (video.closest('[data-testid="videoPlayer"]')) return true;
      // Check if video has a significant poster (not a tiny preview)
      const poster = video.getAttribute('poster');
      if (poster && poster.includes('ext_tw_video')) return true;
    }
  }

  // Check for video component marker
  const videoComponent = article.querySelector('[data-testid="videoComponent"]');
  if (videoComponent) return true;

  // Check for play button overlay (indicates playable video)
  const playButton = article.querySelector('[data-testid="playButton"]');
  if (playButton) return true;

  // Check aria labels that indicate video content
  const videoAriaElements = article.querySelectorAll('[aria-label*="Video"], [aria-label*="Play video"]');
  if (videoAriaElements.length > 0) return true;

  return false;
}

/**
 * Detects if a tweet is an X Article (long-form content)
 * X Articles have distinctive characteristics:
 * - NO tweet text content (contentPreview is empty)
 * - Have media (the article preview image with title overlay)
 * - The article content is entirely visual, not textual
 */
function detectXArticle(article: HTMLElement): { isArticle: boolean; title: string | null } {
  // Check for tweet text - X Articles have NO tweet text on bookmarks page
  const tweetText = article.querySelector('[data-testid="tweetText"]');
  const hasText = tweetText && tweetText.textContent && tweetText.textContent.trim().length > 0;
  
  // Check for media (images/video) - X Articles show as an image with title overlay
  const hasMedia = article.querySelector('img[src*="pbs.twimg.com/media"]') !== null ||
                   article.querySelector('[data-testid="tweetPhoto"]') !== null ||
                   article.querySelector('video') !== null;
  
  // PRIMARY DETECTION: X Articles have media but NO text
  // This distinguishes them from regular tweets with images (which have both text AND images)
  if (!hasText && hasMedia) {
    console.log('[BookmarX] Found X Article: has media but no text content');
    
    // Try to extract title from image alt text or any overlay text
    const img = article.querySelector('img[src*="pbs.twimg.com/media"]') as HTMLImageElement;
    const altText = img?.alt || null;
    
    // Also look for any text that might be the article title (in spans near the image)
    const possibleTitleSpans = article.querySelectorAll('span[dir="ltr"]');
    let title: string | null = null;
    for (const span of possibleTitleSpans) {
      const text = span.textContent?.trim() || '';
      // Article titles are typically 10-200 chars and don't start with @ or http
      if (text.length > 10 && text.length < 200 && 
          !text.startsWith('@') && !text.startsWith('http') && 
          !text.includes('.com/') && !text.match(/^\d+[hmd]$/)) {
        title = text;
        break;
      }
    }
    
    return { isArticle: true, title: title || altText };
  }
  
  // FALLBACK: Check for explicit /article links (for when viewing article directly)
  const allLinks = article.querySelectorAll('a[href]');
  for (const link of allLinks) {
    const href = link.getAttribute('href') || '';
    if (href.endsWith('/article') || href.includes('/i/articles/') || href.includes('/i/notes/')) {
      console.log('[BookmarX] Found X Article via explicit /article link');
      return { isArticle: true, title: null };
    }
  }

  return { isArticle: false, title: null };
}
