// ProgressOverlay — Shows aggregate learner progress across all 8 foundations.
// Positioned at the top of the Telescope view. Light touch: present but not dominant.

import React, { useMemo } from 'react';
import type { ProgressOverlayProps, FoundationProgress } from './types';
import { FOUNDATION_ORDER } from '@/types/index';

export function ProgressOverlay({
  progress,
  totalPercentage,
}: ProgressOverlayProps): React.JSX.Element {
  const completedCount = useMemo(() => {
    let count = 0;
    for (const id of FOUNDATION_ORDER) {
      const p = progress.get(id);
      if (p?.isComplete) count++;
    }
    return count;
  }, [progress]);

  return (
    <div
      className="telescope__progress-overlay"
      role="status"
      aria-label={`Overall progress: ${Math.round(totalPercentage)}% complete, ${completedCount} of 8 foundations finished`}
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 20px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#e2e8f0',
        fontSize: 13,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Foundation dots */}
      <div style={{ display: 'flex', gap: 4 }}>
        {FOUNDATION_ORDER.map((id) => {
          const p = progress.get(id);
          const isComplete = p?.isComplete ?? false;
          const hasProgress = (p?.percentage ?? 0) > 0;
          return (
            <div
              key={id}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isComplete
                  ? '#4ade80'
                  : hasProgress
                    ? '#fbbf24'
                    : 'rgba(148, 163, 184, 0.3)',
                transition: 'background 0.3s ease',
              }}
              title={`${p?.foundationId ?? id}: ${Math.round(p?.percentage ?? 0)}%`}
            />
          );
        })}
      </div>

      {/* Percentage */}
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(totalPercentage)}%
      </span>

      {/* Completion label */}
      {completedCount === 8 && (
        <span style={{ color: '#4ade80', fontWeight: 500, marginLeft: 4 }}>
          Journey complete
        </span>
      )}
    </div>
  );
}
