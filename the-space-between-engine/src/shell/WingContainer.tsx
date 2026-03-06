/**
 * WingContainer — Wing Phase Wrapper
 *
 * Receives foundation ID and learner state, loads the correct wing
 * component, shows PhaseIndicator, handles phase navigation, and
 * integrates Wonder Warden checks before phase transitions.
 */

import React, { useCallback } from 'react';
import type {
  AppAction,
  LearnerState,
  FoundationId,
  PhaseType,
  WardenMessage,
} from '../types/index.js';
import { PHASE_ORDER } from '../types/index.js';
import { getFoundation } from '../core/registry.js';
import { checkAccess } from '../integration/warden.js';
import { PhaseIndicator } from './PhaseIndicator.js';
import { TransitionScreen } from './TransitionScreen.js';
import { theme } from './theme.js';

export interface WingContainerProps {
  foundation: FoundationId;
  learnerState: LearnerState;
  wardenMessages: WardenMessage[];
  dispatch: React.Dispatch<AppAction>;
}

export const WingContainer: React.FC<WingContainerProps> = ({
  foundation,
  learnerState,
  wardenMessages,
  dispatch,
}) => {
  const foundationData = getFoundation(foundation);
  const currentPhase = learnerState.currentPhase;
  const color = theme.colors.foundations[foundation] ?? theme.colors.accent;

  // Active warden messages for this foundation
  const activeWardenMsg = wardenMessages.find(
    (m) => m.foundation === foundation && !m.dismissed && !m.decision.allowed,
  );

  const handlePhaseComplete = useCallback(() => {
    dispatch({ type: 'MARK_PHASE_COMPLETE', foundation, phase: currentPhase });
    dispatch({ type: 'ADVANCE_PHASE' });
  }, [dispatch, foundation, currentPhase]);

  const handleGoBack = useCallback(() => {
    dispatch({ type: 'GO_BACK_PHASE' });
  }, [dispatch]);

  const handlePhaseClick = useCallback(
    (phase: PhaseType) => {
      // Navigate to a completed phase — go back
      const targetIdx = PHASE_ORDER.indexOf(phase);
      const currentIdx = PHASE_ORDER.indexOf(currentPhase);
      if (targetIdx < currentIdx) {
        // Go back to that phase
        for (let i = 0; i < currentIdx - targetIdx; i++) {
          dispatch({ type: 'GO_BACK_PHASE' });
        }
      }
    },
    [dispatch, currentPhase],
  );

  const handleNavigate = useCallback(
    (id: FoundationId) => {
      dispatch({ type: 'NAVIGATE_WING', foundation: id });
    },
    [dispatch],
  );

  const handleSaveCreation = useCallback(
    (creation: { title: string; data: string }) => {
      dispatch({
        type: 'SAVE_CREATION',
        creation: {
          foundationId: foundation,
          type: 'visualization',
          title: creation.title,
          data: creation.data,
          shared: false,
        },
      });
    },
    [dispatch, foundation],
  );

  return (
    <div className="wing-container" data-testid="wing-container" style={{ flex: 1 }}>
      {/* Wing header */}
      <header
        style={{
          padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: color,
            }}
          />
          <div>
            <h1 style={{ color: theme.colors.text, fontSize: '1.25rem', margin: 0, fontWeight: 400 }}>
              {foundationData.name}
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: '0.8125rem', margin: 0 }}>
              {foundationData.subtitle}
            </p>
          </div>
        </div>
        <PhaseIndicator
          foundation={foundation}
          currentPhase={currentPhase}
          learnerState={learnerState}
          onPhaseClick={handlePhaseClick}
        />
      </header>

      {/* Warden gate message */}
      {activeWardenMsg && (
        <div
          className="warden-gate"
          data-testid="warden-gate"
          style={{
            padding: theme.spacing.md,
            margin: theme.spacing.md,
            backgroundColor: `${theme.colors.warning}22`,
            border: `1px solid ${theme.colors.warning}44`,
            borderRadius: 4,
          }}
        >
          <p style={{ color: theme.colors.warning, margin: 0, fontSize: '0.875rem' }}>
            {activeWardenMsg.decision.reason}
          </p>
          {activeWardenMsg.decision.suggestion && (
            <p style={{ color: theme.colors.textMuted, margin: `${theme.spacing.xs}px 0 0`, fontSize: '0.8125rem' }}>
              {activeWardenMsg.decision.suggestion}
            </p>
          )}
          <div style={{ marginTop: theme.spacing.sm, display: 'flex', gap: theme.spacing.sm }}>
            <button
              data-testid="warden-dismiss"
              onClick={() => dispatch({ type: 'DISMISS_WARDEN', messageId: activeWardenMsg.id })}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 4,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Go back
            </button>
            <button
              data-testid="warden-bypass"
              onClick={() => dispatch({
                type: 'BYPASS_WARDEN',
                foundation: activeWardenMsg.foundation,
                phase: activeWardenMsg.phase,
              })}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                border: 'none',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Continue anyway
            </button>
          </div>
        </div>
      )}

      {/* Wing content */}
      <TransitionScreen
        transitionKey={`${foundation}-${currentPhase}`}
        color={color}
      >
        <main
          className="wing-main"
          data-testid="wing-main"
          style={{
            padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
            color: theme.colors.text,
          }}
        >
          <div className="wing-phase-content" data-testid={`phase-${currentPhase}`}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 400, marginBottom: theme.spacing.md }}>
              {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
            </h2>
            <p style={{ color: theme.colors.textMuted, lineHeight: 1.6 }}>
              {foundationData.description}
            </p>
          </div>
        </main>
      </TransitionScreen>

      {/* Phase navigation footer */}
      <footer
        style={{
          padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
          borderTop: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button
          data-testid="phase-back"
          onClick={handleGoBack}
          disabled={PHASE_ORDER.indexOf(currentPhase) === 0}
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            backgroundColor: 'transparent',
            color: PHASE_ORDER.indexOf(currentPhase) === 0 ? theme.colors.border : theme.colors.textMuted,
            border: `1px solid ${PHASE_ORDER.indexOf(currentPhase) === 0 ? theme.colors.border : theme.colors.textMuted}`,
            borderRadius: 4,
            fontSize: '0.8125rem',
            cursor: PHASE_ORDER.indexOf(currentPhase) === 0 ? 'default' : 'pointer',
          }}
        >
          Back
        </button>
        <button
          data-testid="phase-next"
          onClick={handlePhaseComplete}
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            backgroundColor: color,
            color: theme.colors.text,
            border: 'none',
            borderRadius: 4,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          {PHASE_ORDER.indexOf(currentPhase) === PHASE_ORDER.length - 1 ? 'Complete' : 'Next'}
        </button>
      </footer>
    </div>
  );
};

export default WingContainer;
