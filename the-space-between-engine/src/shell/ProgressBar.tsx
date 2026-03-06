// ProgressBar — Visual journey progress across all 8 foundations.
// Shows overall completion percentage and per-foundation completion dots.

import React from 'react';
import type { LearnerState, FoundationId } from '@/types/index';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types/index';
import { FOUNDATION_COLORS, SURFACE, TEXT, SPACING, TRANSITION } from './theme';

interface ProgressBarProps {
  learnerState: LearnerState;
  percentage: number;
}

export function ProgressBar({ learnerState, percentage }: ProgressBarProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderBottom: `1px solid ${SURFACE.border}`,
      }}
    >
      {/* Overall progress bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.xs,
        }}
      >
        <span style={{ color: TEXT.muted, fontSize: '0.75rem', minWidth: '3.5rem' }}>
          {Math.round(percentage)}%
        </span>
        <div
          style={{
            flex: 1,
            height: 4,
            backgroundColor: SURFACE.border,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: percentage >= 100 ? '#4ade80' : '#60a5fa',
              borderRadius: 2,
              transition: `width ${TRANSITION.slow}`,
            }}
          />
        </div>
      </div>

      {/* Per-foundation dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: '3.5rem',
        }}
      >
        {FOUNDATION_ORDER.map((id: FoundationId) => {
          const completed = learnerState.completedPhases[id] ?? [];
          const total = PHASE_ORDER.length;
          const isComplete = completed.length >= total;
          const hasStarted = completed.length > 0;

          return (
            <div
              key={id}
              title={`${id}: ${completed.length}/${total} phases`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isComplete
                  ? '#4ade80'
                  : hasStarted
                    ? FOUNDATION_COLORS[id]
                    : SURFACE.border,
                border: hasStarted ? 'none' : `1px solid ${SURFACE.cardHover}`,
                transition: `background-color ${TRANSITION.normal}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
