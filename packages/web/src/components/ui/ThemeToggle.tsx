'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Theme } from '@bookmarx/shared';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'sepia', label: 'Sepia', icon: '📖' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('bookmarx-theme') as Theme;
    if (saved && themes.some((t) => t.value === saved)) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const handleChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('bookmarx-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-light)]">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => handleChange(t.value)}
          className="relative px-3 py-1.5 rounded-full text-sm transition-colors"
          title={t.label}
        >
          {theme === t.value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-[var(--bg-page)] rounded-full shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{t.icon}</span>
        </button>
      ))}
    </div>
  );
}
