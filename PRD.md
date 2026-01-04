# Product Requirements Document: BookmarX

## Overview

**Product Name:** BookmarX

**Vision:** Transform the "bookmark graveyard" into an enjoyable reading experience by converting X (Twitter) bookmarks into a Kindle-style book interface with page-turning animations.

**Problem Statement:** Users bookmark posts on X with the intention of reading them later, but rarely return to consume that content. The native bookmarks interface is an infinite scroll that doesn't encourage focused reading or provide any sense of progress.

**Solution:** A cross-platform reading experience that presents bookmarks as "books" with:
- Distraction-free, e-reader-style UI
- Physical page-turn animations
- Read/unread tracking
- Smart content categorization

---

## Target Users

**Primary:** Power X users who:
- Bookmark 10+ posts per week
- Use X for learning/research (tech, finance, self-improvement)
- Feel overwhelmed by their unread bookmarks
- Enjoy reading on Kindle/e-readers

**Secondary:**
- Content creators who save inspiration/references
- Researchers tracking industry discussions
- Professionals curating knowledge

---

## Business Model

### Hybrid Freemium Strategy

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Browser extension + web reader, local sync |
| Pro | $7-10/mo | API sync, mobile apps, cloud backup, advanced categorization |

**Rationale:** Extension-based scraping has zero API costs. Paid tier uses X API ($5k/mo Pro) subsidized by subscribers. Break-even at ~700-1000 paid users.

---

## Feature Requirements

### Phase 1: MVP (Validate Demand)

#### 1.1 Chrome Extension (Chrome Only for MVP)

**Core Functionality:**
- [ ] Scrape bookmarks from `x.com/i/bookmarks` page
- [ ] Detect new bookmarks on page scroll/refresh
- [ ] Extract tweet content: text, author, timestamp, media URLs, engagement metrics
- [ ] Detect threads (connected tweet chains)
- [ ] Detect article links (tweets containing URLs)
- [ ] Store bookmarks locally (IndexedDB)
- [ ] Sync to web app backend

**Extension UI:**
- [ ] Popup showing sync status and bookmark count
- [ ] "Open Reader" button to launch web app
- [ ] Last synced timestamp
- [ ] Manual sync trigger

**Technical Requirements:**
- TypeScript
- Manifest V3 (Chrome extension standard)
- Content script for DOM scraping
- Background service worker for sync

#### 1.2 Web Reader Application

**Reading Experience:**
- [ ] Kindle-style page layout (single bookmark per page)
- [ ] Page-turn animation (3D flip effect)
- [ ] Keyboard navigation (arrow keys, spacebar)
- [ ] Touch/swipe support for trackpads
- [ ] Progress bar showing position in "book"
- [ ] Reading themes: Light, Dark, Sepia

**Content Display:**
- [ ] Tweet text with proper formatting
- [ ] Author info (name, handle, avatar)
- [ ] Timestamp
- [ ] Embedded images (tap to expand)
- [ ] Threads displayed as "chapters" (multi-page, sequential reading)
- [ ] Chapter progress indicator (e.g., "Page 3 of 7")
- [ ] Link previews for articles

**Organization:**
- [ ] Unread / Read status (persisted)
- [ ] Filter by: All, Unread, Read
- [ ] Sort by: Date bookmarked, Date posted, Author
- [ ] Categories (auto-detected):
  - Threads
  - Articles (tweets with links)
  - Media (image/video posts)
  - Quick takes (single tweets)

**Technical Requirements:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- Responsive design (desktop-first, tablet-friendly)

#### 1.3 Backend (Supabase)

**Database Schema:**

```sql
-- Users table (managed by Supabase Auth)
users (
  id uuid primary key,
  email text,
  created_at timestamp,
  subscription_tier text default 'free'
)

-- Bookmarks table
bookmarks (
  id uuid primary key,
  user_id uuid references users(id),
  tweet_id text unique,
  author_handle text,
  author_name text,
  author_avatar_url text,
  content text,
  media_urls jsonb,
  external_urls jsonb,
  tweet_created_at timestamp,
  bookmarked_at timestamp,
  is_thread boolean default false,
  thread_id uuid references bookmarks(id),
  thread_position integer,
  created_at timestamp default now()
)

-- Reading state
reading_state (
  id uuid primary key,
  user_id uuid references users(id),
  bookmark_id uuid references bookmarks(id),
  is_read boolean default false,
  read_at timestamp,
  unique(user_id, bookmark_id)
)

-- Collections (future)
collections (
  id uuid primary key,
  user_id uuid references users(id),
  name text,
  created_at timestamp
)
```

**API Endpoints (Edge Functions):**
- [ ] `POST /bookmarks/sync` - Bulk upsert bookmarks from extension
- [ ] `GET /bookmarks` - Fetch user's bookmarks with filters
- [ ] `PATCH /bookmarks/:id/read` - Mark as read/unread
- [ ] `GET /stats` - Reading statistics

**Authentication:**
- [ ] Email/password signup
- [ ] Magic link login
- [ ] OAuth (Google) - optional for MVP

### Phase 2: Growth Features

#### 2.1 Enhanced Categorization
- [ ] AI-powered topic detection (tech, finance, health, etc.)
- [ ] Custom tags/labels
- [ ] Smart collections (auto-curated by topic)
- [ ] Search within bookmarks

#### 2.2 Mobile Apps (React Native)
- [ ] iOS app
- [ ] Android app
- [ ] X API integration for direct bookmark sync
- [ ] Offline reading with local cache
- [ ] Push notifications ("5 unread bookmarks waiting")

#### 2.3 Social Features
- [ ] Share collections publicly
- [ ] Export as PDF/ePub
- [ ] Reading streaks/gamification

#### 2.4 Advanced Reading
- [ ] Text-to-speech
- [ ] Highlighting & notes
- [ ] Spaced repetition for saved highlights

---

## User Flows

### Flow 1: New User Onboarding

```
1. User discovers extension (Chrome Web Store / landing page)
2. Installs extension
3. Extension prompts to create account (or continue without)
4. User navigates to x.com/i/bookmarks
5. Extension auto-scrapes visible bookmarks
6. Popup shows "47 bookmarks synced - Open Reader"
7. User clicks → Web app opens
8. Brief tutorial overlay explaining navigation
9. User begins reading
```

### Flow 2: Daily Reading Session

```
1. User clicks extension icon
2. Popup shows "12 unread bookmarks"
3. User clicks "Open Reader"
4. Web app opens to "Unread" filter
5. User reads through bookmarks with page-turns
6. Each page turn marks previous as read
7. User closes tab when done
8. Progress persisted for next session
```

### Flow 3: Bookmark Sync

```
1. User bookmarks new tweet on X
2. User visits bookmarks page (or extension triggers)
3. Extension detects new bookmark in DOM
4. Extracts content, detects if part of thread
5. Syncs to Supabase backend
6. Web app receives real-time update (if open)
```

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
├───────────────────┬─────────────────────┬───────────────────┤
│  Chrome Extension │     Web Reader      │   Mobile Apps     │
│   (TypeScript)    │  (React + Framer)   │  (React Native)   │
│                   │                     │                   │
│ • Content Script  │ • Page flip UI      │ • X API OAuth     │
│ • DOM Scraper     │ • Reading state     │ • Offline cache   │
│ • IndexedDB       │ • Theme system      │ • Push notifs     │
│ • Sync Service    │                     │                   │
└─────────┬─────────┴──────────┬──────────┴─────────┬─────────┘
          │                    │                    │
          │              HTTPS/WSS                  │
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │      Supabase       │
                    ├─────────────────────┤
                    │ • Auth              │
                    │ • PostgreSQL DB     │
                    │ • Edge Functions    │
                    │ • Realtime (WSS)    │
                    │ • Storage (media)   │
                    └─────────────────────┘
```

### Extension Architecture

```
extension/
├── manifest.json          # V3 manifest
├── src/
│   ├── background/        # Service worker
│   │   └── index.ts       # Sync orchestration
│   ├── content/           # Content scripts
│   │   ├── scraper.ts     # DOM parsing
│   │   └── observer.ts    # Mutation observer for new bookmarks
│   ├── popup/             # Extension popup UI
│   │   ├── Popup.tsx
│   │   └── index.html
│   ├── lib/
│   │   ├── storage.ts     # IndexedDB wrapper
│   │   ├── api.ts         # Supabase client
│   │   └── parser.ts      # Tweet content parser
│   └── types/
│       └── bookmark.ts
├── package.json
└── tsconfig.json
```

### Web Reader Architecture (Next.js)

```
web-reader/
├── src/
│   ├── app/               # Next.js 14 App Router
│   ├── components/
│   │   ├── Book/
│   │   │   ├── Book.tsx           # Main container
│   │   │   ├── Page.tsx           # Single page component
│   │   │   ├── PageFlip.tsx       # Flip animation logic
│   │   │   └── ProgressBar.tsx
│   │   ├── Tweet/
│   │   │   ├── TweetCard.tsx      # Tweet display
│   │   │   ├── ThreadIndicator.tsx
│   │   │   └── MediaGallery.tsx
│   │   └── Navigation/
│   │       ├── Sidebar.tsx        # Filters, categories
│   │       └── Header.tsx
│   ├── hooks/
│   │   ├── useBookmarks.ts
│   │   ├── useReadingState.ts
│   │   └── usePageFlip.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── animations.ts
│   └── styles/
│       └── themes.css
├── package.json
└── tailwind.config.js
```

---

## Success Metrics

### MVP Success Criteria

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Extension installs | 500 | 30 days post-launch |
| Weekly active readers | 100 | 30 days post-launch |
| Bookmarks synced | 10,000 | 30 days post-launch |
| Read completion rate | 30% | Ongoing |

### Business Metrics (Phase 2)

| Metric | Target |
|--------|--------|
| Free → Paid conversion | 5% |
| Monthly recurring revenue | $5,000 |
| Churn rate | <10% |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| X changes DOM structure | Extension breaks | High | Modular scraper, quick patch process |
| X blocks extension | Product unusable | Medium | Diversify: API tier, manual import |
| X API price increases | Paid tier uneconomical | Medium | Adjust pricing, negotiate enterprise |
| Low demand | Product fails | Medium | Validate with MVP before mobile investment |
| Chrome Web Store rejection | Can't distribute | Low | Follow policies strictly, have sideload option |

---

## Timeline & Milestones

### MVP Development

| Milestone | Deliverables |
|-----------|--------------|
| M1 | Extension scaffolding, basic DOM scraper |
| M2 | Extension popup UI, IndexedDB storage |
| M3 | Supabase schema, auth, sync endpoint |
| M4 | Web reader: basic layout, page display |
| M5 | Web reader: page-flip animations |
| M6 | Web reader: read/unread, filters |
| M7 | Thread detection, categories |
| M8 | Polish, testing, Chrome Web Store submission |

---

## Open Questions

1. ~~**Naming:**~~ → **BookmarX** (X as ode to the platform)
2. **Pricing:** $7/mo or $10/mo for Pro tier?
3. ~~**Thread handling:**~~ → **Threads as chapters** (multi-page reading experience)
4. **Article fetching:** Should we fetch full article content from links? (Legal/complexity concerns)
5. ~~**Firefox support:**~~ → **Chrome only for MVP**, Firefox in Phase 2

---

## Appendix

### Competitive Landscape

| Product | Approach | Gap |
|---------|----------|-----|
| X native bookmarks | Infinite scroll | No reading UX, no progress |
| Notion web clipper | Manual save | Doesn't integrate with X |
| Readwise | API-based | $8/mo, no page-turn UX |
| Matter | Read-later app | Focused on articles, not tweets |

**BookmarX differentiation:** Purpose-built for X bookmarks with a delightful, book-like reading experience. The "X" in the name signals native X integration.

---

*Document Version: 1.0*
*Last Updated: January 2025*
