/**
 * WelcomeBack — Resume Prompt
 *
 * First visit: "Welcome to the Observatory. Begin here."
 * Return visit: shows resume point with Continue/Explore options.
 */

import React from 'react';
import type { AppAction, LearnerState } from '../types/index.js';
import { getFoundation } from '../core/registry.js';
import { getResumePoint } from '../core/progression.js';
import { getCompletionPercentage } from '../core/progression.js';
import { theme } from './theme.js';

export interface WelcomeBackProps {
  isFirstVisit: boolean;
  learnerState: LearnerState;
  dispatch: React.Dispatch<AppAction>;
}

export const WelcomeBack: React.FC<WelcomeBackProps> = ({
  isFirstVisit,
  learnerState,
  dispatch,
}) => {
  const resume = getResumePoint(learnerState);
  const foundation = getFoundation(resume.foundation);
  const percent = getCompletionPercentage(learnerState);

  if (isFirstVisit) {
    return (
      <div
        className="welcome-screen"
        data-testid="welcome-screen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <h1
          style={{
            color: theme.colors.text,
            fontSize: '2rem',
            fontWeight: 300,
            letterSpacing: '0.05em',
            marginBottom: theme.spacing.lg,
          }}
        >
          Welcome to the Observatory
        </h1>
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: '1rem',
            maxWidth: 480,
            lineHeight: 1.6,
            marginBottom: theme.spacing.xl,
          }}
        >
          Eight wings. Eight ways of seeing. Begin with the circle.
        </p>
        <button
          data-testid="welcome-begin"
          onClick={() => dispatch({ type: 'NAVIGATE_WING', foundation: 'unit-circle' })}
          style={{
            padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
            backgroundColor: theme.colors.foundations['unit-circle'],
            color: theme.colors.text,
            border: 'none',
            borderRadius: 4,
            fontSize: '1rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Begin here
        </button>
      </div>
    );
  }

  return (
    <div
      className="welcome-back-screen"
      data-testid="welcome-back-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: theme.spacing.xl,
      }}
    >
      <h1
        style={{
          color: theme.colors.text,
          fontSize: '1.75rem',
          fontWeight: 300,
          letterSpacing: '0.05em',
          marginBottom: theme.spacing.md,
        }}
      >
        Welcome back.
      </h1>
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: '0.875rem',
          marginBottom: theme.spacing.lg,
        }}
      >
        {percent}% complete &middot; Last in {foundation.name} &middot; {resume.phase} phase
      </p>
      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <button
          data-testid="welcome-continue"
          onClick={() => dispatch({ type: 'NAVIGATE_WING', foundation: resume.foundation })}
          style={{
            padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
            backgroundColor: theme.colors.accent,
            color: theme.colors.text,
            border: 'none',
            borderRadius: 4,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
        <button
          data-testid="welcome-explore"
          onClick={() => dispatch({ type: 'OPEN_TELESCOPE' })}
          style={{
            padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
            backgroundColor: 'transparent',
            color: theme.colors.textMuted,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 4,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Explore freely
        </button>
      </div>
    </div>
  );
};

export default WelcomeBack;
