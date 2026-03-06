/**
 * PhaseIndicator — 6-Phase Progress Within a Wing
 *
 * Shows 6 labeled dots: wonder, see, touch, understand, connect, create.
 * Current phase highlighted, completed phases filled, future dimmed.
 * Clicking a completed phase navigates back to it.
 */

import React from 'react';
import type { PhaseType, LearnerState, FoundationId } from '../types/index.js';
import { PHASE_ORDER } from '../types/index.js';
import { theme } from './theme.js';

export interface PhaseIndicatorProps {
  foundation: FoundationId;
  currentPhase: PhaseType;
  learnerState: LearnerState;
  onPhaseClick?: (phase: PhaseType) => void;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  foundation,
  currentPhase,
  learnerState,
  onPhaseClick,
}) => {
  const completed = learnerState.completedPhases[foundation] ?? [];
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div
      className="phase-indicator-bar"
      data-testid="phase-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.sm}px 0`,
      }}
    >
      {PHASE_ORDER.map((phase, i) => {
        const isCompleted = completed.includes(phase);
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx && !isCompleted;
        const isClickable = isCompleted && onPhaseClick;

        return (
          <button
            key={phase}
            className={`phase-dot ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isFuture ? 'future' : ''}`}
            data-testid={`phase-dot-${phase}`}
            onClick={() => isClickable && onPhaseClick(phase)}
            disabled={!isClickable}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: isClickable ? 'pointer' : 'default',
              padding: `${theme.spacing.xs}px`,
              opacity: isFuture ? 0.3 : 1,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isCompleted
                  ? theme.colors.success
                  : isCurrent
                    ? theme.colors.accent
                    : theme.colors.border,
                transition: `background-color ${theme.animation.fast}`,
                animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.625rem',
                color: isCurrent ? theme.colors.text : theme.colors.textMuted,
                fontWeight: isCurrent ? 600 : 400,
                textTransform: 'lowercase',
              }}
            >
              {phase}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PhaseIndicator;
