import React, { useEffect, useState } from 'react';
import type { SyncStatus } from '@bookmarx/shared';
import { getUser, signOut, signInWithEmail } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    pendingCount: 0,
    totalCount: 0,
    isSyncing: false,
    error: null,
  });

  useEffect(() => {
    // Load user and sync status
    const init = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to get user:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };
    init();

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;

      const currentUser = await getUser();
      setUser(currentUser);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return `Last synced: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  if (isLoadingUser) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.logo}>BookmarX</span>
        </div>
        <p style={styles.syncInfo}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>BookmarX</span>
      </div>

      {/* Auth status */}
      {user ? (
        <div style={{ ...styles.instructions, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px' }}>{user.email}</span>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', color: '#8b98a5', fontSize: '12px', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      ) : showLogin ? (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #38444d',
              background: '#192734',
              color: 'white',
              fontSize: '14px',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #38444d',
              background: '#192734',
              color: 'white',
              fontSize: '14px',
            }}
          />
          {loginError && (
            <p style={{ color: '#f4212e', fontSize: '12px', margin: 0 }}>{loginError}</p>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/signup' })}
            style={{ background: 'none', border: 'none', color: '#8b98a5', fontSize: '12px', cursor: 'pointer' }}
          >
            Need an account? Sign up
          </button>
        </form>
      ) : (
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={() => setShowLogin(true)}
        >
          Sign in to sync
        </button>
      )}

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{syncStatus.totalCount}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{syncStatus.pendingCount}</span>
          <span style={styles.statLabel}>Pending</span>
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
          {syncStatus.error}
        </p>
      )}
    </div>
  );
}
