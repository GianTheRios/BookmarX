'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/reader';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
            <MailIcon />
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
          >
            Check your email
          </h1>
          <p className="text-[var(--text-secondary)]">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-light)]">
        <Link
          href="/"
          className="text-xl font-bold text-[var(--accent-primary)]"
          style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
        >
          BookmarX
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h1
              className="text-3xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
            >
              Welcome back
            </h1>
            <p className="text-[var(--text-secondary)]">
              Sign in to continue to your bookmarks
            </p>
          </div>

          {/* Auth mode toggle */}
          <div className="flex rounded-full bg-[var(--bg-secondary)] p-1">
            <button
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                authMode === 'password'
                  ? 'bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setAuthMode('magic')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                authMode === 'magic'
                  ? 'bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={authMode === 'password' ? handlePasswordLogin : handleMagicLinkLogin}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {authMode === 'password' && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  placeholder="Your password"
                />
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 bg-red-500/10 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full font-semibold bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? 'Please wait...'
                : authMode === 'password'
                ? 'Sign in'
                : 'Send magic link'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link
              href={`/signup${redirectTo !== '/reader' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--accent-primary)]"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
