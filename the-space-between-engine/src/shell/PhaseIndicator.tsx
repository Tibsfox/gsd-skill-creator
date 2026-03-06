// PhaseIndicator — Shows 6-phase progress within the current wing.
// Horizontal step indicator: wonder -> see -> touch -> understand -> connect -> create.

import React from 'react';
import type { FoundationId, PhaseType } from '@/types/index';
import { PHASE_ORDER } from '@/types/index';
import { PHASE_COLORS, SURFACE, TEXT, SPACING, TRANSITION } from './theme';

const PHASE_LABELS: Record<PhaseType, string> = {
  wonder: 'Wonder',
  see: 'See',
  touch: 'Touch',
  understand: 'Understand',
  connect: 'Connect',
  create: 'Create',
};

interface PhaseIndicatorProps {
  foundation: FoundationId;
  currentPhase: PhaseType;
  completedPhases: PhaseType[];
}

export function PhaseIndicator({
  currentPhase,
  completedPhases,
}: PhaseIndicatorProps): React.JSX.Element {
  return (
    <nav
      className="phase-indicator"
      aria-label="Learning phase progress"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.xs,
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderBottom: `1px solid ${SURFACE.border}`,
        overflowX: 'auto',
      }}
    >
      {PHASE_ORDER.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isCompleted = completedPhases.includes(phase);
        const color = PHASE_COLORS[phase] ?? TEXT.muted;

        return (
          <React.Fragment key={phase}>
            {index > 0 && (
              <div
                style={{
                  flex: '0 0 auto',
                  width: 16,
                  height: 2,
                  backgroundColor: isCompleted ? color : SURFACE.border,
                  transition: `background-color ${TRANSITION.normal}`,
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                flex: '0 0 auto',
              }}
            >
              <div
                style={{
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  borderRadius: '50%',
                  backgroundColor: isCompleted || isActive ? color : 'transparent',
                  border: `2px solid ${isCompleted || isActive ? color : SURFACE.border}`,
                  transition: `all ${TRANSITION.normal}`,
                }}
              />
              <span
                style={{
                  fontSize: isActive ? '0.8rem' : '0.7rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? TEXT.primary : isCompleted ? TEXT.secondary : TEXT.muted,
                  transition: `all ${TRANSITION.normal}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
