import React, { useEffect, useState } from 'react';
import type { SyncStatus } from '@bookmarx/shared';

const styles = {
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #38444d',
    paddingBottom: '16px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1d9bf0',
  },
  stats: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    background: '#192734',
    borderRadius: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1d9bf0',
  },
  statLabel: {
    fontSize: '12px',
    color: '#8b98a5',
    marginTop: '4px',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  primaryButton: {
    background: '#1d9bf0',
    color: 'white',
  },
  secondaryButton: {
    background: 'transparent',
    color: '#1d9bf0',
    border: '1px solid #1d9bf0',
  },
  syncInfo: {
    fontSize: '12px',
    color: '#8b98a5',
    textAlign: 'center' as const,
  },
  instructions: {
    fontSize: '13px',
    color: '#8b98a5',
    lineHeight: 1.5,
    padding: '12px',
    background: '#192734',
    borderRadius: '8px',
  },
};

export default function App() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    pendingCount: 0,
    totalCount: 0,
    isSyncing: false,
    error: null,
  });

  useEffect(() => {
    // Load sync status from storage
    chrome.storage.local.get(['syncStatus'], (result) => {
      if (result.syncStatus) {
        setSyncStatus(result.syncStatus);
      }
    });

    // Listen for updates from content script
    const listener = (message: { type: string; payload?: SyncStatus }) => {
      if (message.type === 'SYNC_STATUS_UPDATE' && message.payload) {
        setSyncStatus(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleSync = () => {
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
  };

  const handleOpenReader = () => {
    const readerUrl = 'http://localhost:3000/reader';
    chrome.tabs.create({ url: readerUrl });
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return `Last synced: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>BookmarX</span>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{syncStatus.totalCount}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{syncStatus.pendingCount}</span>
          <span style={styles.statLabel}>Unread</span>
        </div>
      </div>

      <button
        style={{ ...styles.button, ...styles.primaryButton }}
        onClick={handleOpenReader}
      >
        Open Reader
      </button>

      <button
        style={{ ...styles.button, ...styles.secondaryButton }}
        onClick={handleSync}
        disabled={syncStatus.isSyncing}
      >
        {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>

      <p style={styles.syncInfo}>
        {formatLastSynced(syncStatus.lastSyncedAt)}
      </p>

      {syncStatus.totalCount === 0 && (
        <div style={styles.instructions}>
          <strong>Getting started:</strong><br />
          1. Go to x.com/i/bookmarks<br />
          2. Scroll to load your bookmarks<br />
          3. Click "Sync Now" to import
        </div>
      )}

      {syncStatus.error && (
        <p style={{ ...styles.syncInfo, color: '#f4212e' }}>
          Error: {syncStatus.error}
        </p>
      )}
    </div>
  );
}
