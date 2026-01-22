# BookmarX Extension Testing Guide

## Production Build Status

✅ The extension has been built in production mode and is ready for testing.

## Loading the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select: `packages/extension/dist/` directory
   - The BookmarX extension should appear in your extensions list

4. **Reload After Changes**
   - If you rebuild the extension, click the reload icon (🔄) on the BookmarX extension card
   - Or remove and re-add the extension

## Testing Checklist

### 1. Extension Popup

- [ ] Click the BookmarX icon in Chrome toolbar
- [ ] Popup opens and displays the React app (not "Vite Dev Mode" error)
- [ ] BookmarX branding/logo is visible
- [ ] Sync status displays (total count, pending count)
- [ ] Sign in button is visible (if not authenticated)
- [ ] "Open Reader" button is visible
- [ ] Manual sync trigger button works

### 2. Content Script (Bookmark Scraping)

- [ ] Navigate to `https://x.com/i/bookmarks` (requires X/Twitter login)
- [ ] Open browser DevTools (F12 or Cmd+Option+I on Mac)
- [ ] Check Console tab for `[BookmarX]` log messages:
  - "Content script loaded"
  - "Starting bookmark scrape..."
  - "Found X tweets"
- [ ] Content script activates automatically on bookmarks page
- [ ] Bookmarks are detected and processed

### 3. Background Service Worker

- [ ] Go to `chrome://extensions/`
- [ ] Find BookmarX extension
- [ ] Click "Service worker" or "Inspect views: service worker" link
- [ ] Service worker console opens
- [ ] Verify console shows: `[BookmarX] Background service worker initialized`
- [ ] Trigger sync from popup and watch for sync logs in service worker console

### 4. Storage Verification

- [ ] In service worker or popup console (DevTools), run:
  ```javascript
  chrome.storage.local.get(null, (data) => console.log(data));
  ```
- [ ] Verify bookmarks are stored locally
- [ ] Verify sync status is updated
- [ ] Verify user authentication state (if signed in)

### 5. Sync Functionality (if Supabase configured)

If you have Supabase environment variables configured:

- [ ] Click "Sign in" in popup
- [ ] Enter credentials or use OAuth flow
- [ ] Verify authentication succeeds
- [ ] Trigger sync from popup
- [ ] Verify bookmarks sync to Supabase backend
- [ ] Check sync status updates in popup
- [ ] Verify error handling (test with invalid credentials)

## Troubleshooting

### Extension doesn't load
- Check for errors in `chrome://extensions/` page (red error messages)
- Verify you selected the `dist/` directory, not the `src/` directory
- Check browser console for detailed error messages

### Popup is blank or shows error
- Open popup DevTools: Right-click the popup → Inspect
- Check console for JavaScript errors
- Verify all assets are loading (check Network tab)

### Content script doesn't run
- Verify you're on `x.com/*` or `twitter.com/*` domain
- Check that the URL matches exactly (case-sensitive)
- Open page DevTools (F12) and check Console for `[BookmarX]` messages
- Try refreshing the page

### Scraping fails
- X/Twitter may have changed their DOM structure
- Check browser console for selector errors
- Verify you're logged into X/Twitter
- Check that the bookmarks page is fully loaded before scraping

### Sync fails
- Verify Supabase environment variables are configured:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Check service worker console for authentication errors
- Verify network connectivity
- Check Supabase project is running (if using local instance)

### Service worker errors
- Service worker may need to be restarted
- Go to `chrome://extensions/` and click "Service worker" link
- Check console for errors
- Try reloading the extension

## File Locations

- **Built extension:** `packages/extension/dist/`
- **Manifest:** `packages/extension/dist/manifest.json`
- **Popup entry:** `packages/extension/dist/src/popup/index.html`
- **Service worker:** `packages/extension/dist/service-worker-loader.js`
- **Content script:** `packages/extension/dist/src/content/index.ts-loader.js`

## Development vs Production Builds

- **Production build:** `npm run build:extension` (creates standalone files in `dist/`)
- **Development build:** `npm run dev:extension` (requires Vite dev server on port 5173)

For testing in Chrome, always use the **production build**.

## Quick Test Command

After rebuilding, you can quickly open Chrome extensions page:

**macOS:**
```bash
open "chrome://extensions"
```

**Linux:**
```bash
xdg-open "chrome://extensions"
```

**Windows:**
```bash
start chrome://extensions
```
