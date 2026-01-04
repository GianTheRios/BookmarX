import type { BookmarkWithReadState, BookData, LibrarySection, BookmarkCategory } from '@bookmarx/shared';

const SECTION_TITLES: Record<BookmarkCategory, string> = {
  thread: 'Threads',
  article: 'Articles',
  quick_take: 'Quick Reads',
  media: 'Videos',
};

const SECTION_ORDER: BookmarkCategory[] = ['thread', 'article', 'quick_take', 'media'];

export function groupBookmarksIntoBooks(bookmarks: BookmarkWithReadState[]): BookData[] {
  const books: BookData[] = [];
  const threadMap = new Map<string, BookmarkWithReadState[]>();

  for (const bookmark of bookmarks) {
    if (bookmark.isThread && bookmark.threadId) {
      const existing = threadMap.get(bookmark.threadId) || [];
      threadMap.set(bookmark.threadId, [...existing, bookmark]);
    } else {
      books.push(createBookFromSingle(bookmark));
    }
  }

  for (const [threadId, threadBookmarks] of threadMap) {
    const sorted = threadBookmarks.sort((a, b) => a.threadPosition - b.threadPosition);
    books.push(createBookFromThread(threadId, sorted));
  }

  return books;
}

function createBookFromSingle(bookmark: BookmarkWithReadState): BookData {
  return {
    id: bookmark.id,
    title: bookmark.authorName || bookmark.authorHandle,
    authorHandle: bookmark.authorHandle,
    authorName: bookmark.authorName,
    authorAvatarUrl: bookmark.authorAvatarUrl,
    category: bookmark.category,
    bookmarks: [bookmark],
    pageCount: 1,
    coverImage: bookmark.mediaUrls[0] || bookmark.authorAvatarUrl || undefined,
    createdAt: bookmark.tweetCreatedAt || bookmark.bookmarkedAt,
    isRead: bookmark.isRead,
    readProgress: bookmark.isRead ? 100 : 0,
  };
}

function createBookFromThread(threadId: string, bookmarks: BookmarkWithReadState[]): BookData {
  const first = bookmarks[0];
  const readCount = bookmarks.filter(b => b.isRead).length;
  const allRead = readCount === bookmarks.length;
  const progress = Math.round((readCount / bookmarks.length) * 100);

  const coverImage = bookmarks.find(b => b.mediaUrls.length > 0)?.mediaUrls[0]
    || first.authorAvatarUrl
    || undefined;

  return {
    id: threadId,
    title: 'Thread by ' + (first.authorName || first.authorHandle),
    authorHandle: first.authorHandle,
    authorName: first.authorName,
    authorAvatarUrl: first.authorAvatarUrl,
    category: 'thread',
    bookmarks,
    pageCount: bookmarks.length,
    coverImage,
    createdAt: first.tweetCreatedAt || first.bookmarkedAt,
    isRead: allRead,
    readProgress: progress,
  };
}

export function organizeIntoSections(books: BookData[]): LibrarySection[] {
  const sections: LibrarySection[] = [];

  for (const category of SECTION_ORDER) {
    const categoryBooks = books.filter(b => b.category === category);
    if (categoryBooks.length > 0) {
      sections.push({
        id: category,
        title: SECTION_TITLES[category],
        books: categoryBooks.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
    }
  }

  return sections;
}
