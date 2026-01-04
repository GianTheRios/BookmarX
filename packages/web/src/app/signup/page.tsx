'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/reader';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
            <CheckIcon />
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
          >
            Check your email
          </h1>
          <p className="text-[var(--text-secondary)]">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm"
          >
            Back to login
          </Link>
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
              Create your account
            </h1>
            <p className="text-[var(--text-secondary)]">
              Start your distraction-free reading journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
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
                minLength={6}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="Confirm your password"
              />
            </div>

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
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center text-xs text-[var(--text-muted)]">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Login link */}
          <p className="text-center text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link
              href={`/login${redirectTo !== '/reader' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function CheckIcon() {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
