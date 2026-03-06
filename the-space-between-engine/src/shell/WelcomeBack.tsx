// WelcomeBack — Resume prompt shown when a returning learner arrives.
// Personalizes the greeting based on their history: creations, journal entries,
// unit circle moments, or last position.

import React from 'react';
import type { LearnerState, FoundationId, PhaseType } from '@/types/index';
import { getFoundation } from '@/core/registry';
import { SURFACE, TEXT, FONT, SPACING, TRANSITION, FOUNDATION_COLORS } from './theme';

interface WelcomeBackProps {
  learnerState: LearnerState;
  resumePoint: { foundation: FoundationId; phase: PhaseType };
  onResume: () => void;
  onExplore: () => void;
}

function buildGreetingLines(state: LearnerState): string[] {
  const lines: string[] = [];

  // Creations
  if (state.creations.length > 0) {
    const last = state.creations[state.creations.length - 1]!;
    const wingName = getFoundation(last.foundationId).name;
    lines.push(`Your ${last.type.replace(/-/g, ' ')} from ${wingName} is waiting.`);
  }

  // Journal entries
  if (state.journalEntries.length > 0) {
    lines.push(`You wrote ${state.journalEntries.length} reflection${state.journalEntries.length === 1 ? '' : 's'} last time.`);
  }

  // Unit circle moments
  if (state.unitCircleMoments.length > 0) {
    const last = state.unitCircleMoments[state.unitCircleMoments.length - 1]!;
    if (last.foundations.length > 0) {
      const name = getFoundation(last.foundations[0]!).name;
      lines.push(`You noticed something about ${name}.`);
    }
  }

  // Fallback: current position
  if (lines.length === 0) {
    const wingName = getFoundation(state.currentFoundation).name;
    lines.push(`You were exploring ${wingName}, ${state.currentPhase}.`);
  }

  return lines;
}

export function WelcomeBack({
  learnerState,
  resumePoint,
  onResume,
  onExplore,
}: WelcomeBackProps): React.JSX.Element {
  const greetingLines = buildGreetingLines(learnerState);
  const resumeWing = getFoundation(resumePoint.foundation);
  const color = FOUNDATION_COLORS[resumePoint.foundation];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SURFACE.overlay,
        zIndex: 400,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: SPACING['2xl'],
          backgroundColor: SURFACE.card,
          borderRadius: 12,
          border: `1px solid ${SURFACE.border}`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: TEXT.primary,
            fontFamily: FONT.serif,
            fontSize: '1.75rem',
            fontWeight: 300,
            margin: 0,
            marginBottom: SPACING.lg,
          }}
        >
          Welcome back.
        </h2>

        <div style={{ marginBottom: SPACING.xl }}>
          {greetingLines.map((line, i) => (
            <p
              key={i}
              style={{
                color: TEXT.secondary,
                fontFamily: FONT.sans,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: `${SPACING.xs} 0`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          <button
            onClick={onResume}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              backgroundColor: color,
              color: TEXT.primary,
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              fontFamily: FONT.sans,
              cursor: 'pointer',
              transition: `opacity ${TRANSITION.fast}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Resume: {resumeWing.name} / {resumePoint.phase}
          </button>

          <button
            onClick={onExplore}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              backgroundColor: 'transparent',
              color: TEXT.secondary,
              border: `1px solid ${SURFACE.border}`,
              borderRadius: 8,
              fontSize: '0.9rem',
              fontFamily: FONT.sans,
              cursor: 'pointer',
              transition: `all ${TRANSITION.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = TEXT.muted;
              e.currentTarget.style.color = TEXT.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = SURFACE.border;
              e.currentTarget.style.color = TEXT.secondary;
            }}
          >
            Explore freely
          </button>
        </div>
      </div>
    </div>
  );
}
