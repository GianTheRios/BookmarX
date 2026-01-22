-- Add article-specific fields to bookmarks table
-- These fields support X's native Articles feature (long-form content)

ALTER TABLE bookmarks 
  ADD COLUMN IF NOT EXISTS is_article BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS article_content TEXT,
  ADD COLUMN IF NOT EXISTS article_title TEXT,
  ADD COLUMN IF NOT EXISTS estimated_read_time INTEGER;

-- Add index for filtering articles
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_article ON bookmarks(user_id, is_article) WHERE is_article = TRUE;

-- Add comment explaining the fields
COMMENT ON COLUMN bookmarks.is_article IS 'Whether this bookmark is an X Article (long-form content)';
COMMENT ON COLUMN bookmarks.article_content IS 'Full article content for X Articles';
COMMENT ON COLUMN bookmarks.article_title IS 'Title of the article if present';
COMMENT ON COLUMN bookmarks.estimated_read_time IS 'Estimated reading time in minutes';

-- Update the get_bookmarks_with_state function to include article fields
CREATE OR REPLACE FUNCTION get_bookmarks_with_state(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_is_read BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  tweet_id TEXT,
  author_handle TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  content TEXT,
  media_urls TEXT[],
  external_urls TEXT[],
  tweet_created_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ,
  is_thread BOOLEAN,
  thread_id TEXT,
  thread_position INTEGER,
  category TEXT,
  has_video BOOLEAN,
  is_article BOOLEAN,
  article_content TEXT,
  article_title TEXT,
  estimated_read_time INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.tweet_id,
    b.author_handle,
    b.author_name,
    b.author_avatar_url,
    b.content,
    b.media_urls,
    b.external_urls,
    b.tweet_created_at,
    b.bookmarked_at,
    b.is_thread,
    b.thread_id,
    b.thread_position,
    b.category,
    b.has_video,
    b.is_article,
    b.article_content,
    b.article_title,
    b.estimated_read_time,
    b.created_at,
    b.updated_at,
    COALESCE(rs.is_read, FALSE) AS is_read,
    rs.read_at
  FROM bookmarks b
  LEFT JOIN reading_state rs ON b.id = rs.bookmark_id AND rs.user_id = p_user_id
  WHERE b.user_id = p_user_id
    AND (p_category IS NULL OR b.category = p_category)
    AND (p_is_read IS NULL OR COALESCE(rs.is_read, FALSE) = p_is_read)
  ORDER BY b.bookmarked_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
