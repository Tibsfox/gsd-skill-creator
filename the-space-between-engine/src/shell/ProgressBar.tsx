/**
 * ProgressBar — Journey Progress Visualization
 *
 * Horizontal bar showing overall completion percentage with
 * 8 segments colored per-foundation. Completed segments filled,
 * current pulsing, future dimmed.
 */

import React from 'react';
import type { LearnerState, FoundationId } from '../types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index.js';
import { theme } from './theme.js';

export interface ProgressBarProps {
  learnerState: LearnerState;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ learnerState }) => {
  const totalPhases = FOUNDATION_ORDER.length * PHASE_ORDER.length;
  let completedTotal = 0;

  const segments = FOUNDATION_ORDER.map((id) => {
    const completed = (learnerState.completedPhases[id] ?? []).length;
    completedTotal += completed;
    const fraction = completed / PHASE_ORDER.length;
    const isCurrent = learnerState.currentFoundation === id;
    const isComplete = completed >= PHASE_ORDER.length;
    return { id, fraction, isCurrent, isComplete };
  });

  const overallPercent = Math.round((completedTotal / totalPhases) * 100);

  return (
    <div
      className="progress-bar"
      data-testid="progress-bar"
      style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.xs,
        }}
      >
        <span>Journey Progress</span>
        <span data-testid="progress-percent">{overallPercent}%</span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.colors.border,
          gap: 1,
        }}
      >
        {segments.map(({ id, fraction, isCurrent, isComplete }) => {
          const color = theme.colors.foundations[id] ?? theme.colors.accent;
          const opacity = isComplete ? 1 : isCurrent ? 0.8 : 0.3;
          return (
            <div
              key={id}
              data-testid={`progress-segment-${id}`}
              style={{
                flex: 1,
                backgroundColor: color,
                opacity,
                transition: `opacity ${theme.animation.normal}`,
                animation: isCurrent && !isComplete ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
