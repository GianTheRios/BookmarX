'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar track */}
      <div className="relative h-1.5 rounded-full bg-[var(--border-light)] overflow-hidden">
        {/* Animated fill */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-hover))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute top-0 bottom-0 w-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
          initial={{ left: '-20%' }}
          animate={{ left: `${progress - 10}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="tabular-nums">
          Page {current} of {total}
        </span>
        <span className="tabular-nums font-medium text-[var(--accent-primary)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
