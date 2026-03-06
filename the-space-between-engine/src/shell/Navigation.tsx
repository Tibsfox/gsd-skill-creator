/**
 * Navigation — Wing Selector
 *
 * Vertical sidebar listing all 8 wings with foundation name,
 * subtitle, color indicator, and completion state. Below the
 * wings: Telescope, Garden, and Journal links.
 */

import React from 'react';
import type { AppAction, LearnerState, NavigationState, FoundationId } from '../types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index.js';
import { getFoundation } from '../core/registry.js';
import { theme } from './theme.js';

export interface NavigationProps {
  learnerState: LearnerState;
  navigation: NavigationState;
  dispatch: React.Dispatch<AppAction>;
}

type CompletionIcon = '\u25CB' | '\u25D0' | '\u25CF';

function getCompletionIcon(learner: LearnerState, id: FoundationId): CompletionIcon {
  const completed = learner.completedPhases[id] ?? [];
  if (completed.length === 0) return '\u25CB'; // empty circle
  if (completed.length >= PHASE_ORDER.length) return '\u25CF'; // filled circle
  return '\u25D0'; // half circle
}

export const Navigation: React.FC<NavigationProps> = ({
  learnerState,
  navigation,
  dispatch,
}) => {
  return (
    <nav
      className="observatory-navigation"
      data-testid="navigation"
      style={{
        width: theme.sidebar.width,
        minHeight: '100vh',
        backgroundColor: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: `${theme.spacing.md}px 0`,
      }}
    >
      <div className="nav-header" style={{ padding: `0 ${theme.spacing.md}px ${theme.spacing.lg}px` }}>
        <h2 style={{ color: theme.colors.text, fontSize: '1rem', margin: 0, letterSpacing: '0.05em' }}>
          Observatory
        </h2>
      </div>

      {/* Wing list */}
      <div className="nav-wings" data-testid="nav-wings">
        {FOUNDATION_ORDER.map((id) => {
          const foundation = getFoundation(id);
          const isActive = navigation.view === 'wing' && navigation.activeFoundation === id;
          const icon = getCompletionIcon(learnerState, id);
          const color = theme.colors.foundations[id] ?? theme.colors.accent;

          return (
            <button
              key={id}
              className={`nav-wing-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-wing-${id}`}
              onClick={() => dispatch({ type: 'NAVIGATE_WING', foundation: id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                width: '100%',
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                border: 'none',
                background: isActive ? theme.colors.surfaceHover : 'transparent',
                color: theme.colors.text,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                transition: `background ${theme.animation.fast}`,
              }}
            >
              <span
                className="nav-color-indicator"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <span className="nav-wing-label" style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: isActive ? 600 : 400 }}>
                  {foundation.name}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: theme.colors.textMuted }}>
                  {foundation.subtitle}
                </span>
              </span>
              <span className="nav-completion-icon" style={{ fontSize: '0.75rem', color: theme.colors.textMuted }}>
                {icon}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: theme.colors.border, margin: `${theme.spacing.md}px ${theme.spacing.md}px` }} />

      {/* Secondary links */}
      <div className="nav-secondary" data-testid="nav-secondary">
        <button
          className={`nav-link ${navigation.view === 'telescope' ? 'active' : ''}`}
          data-testid="nav-telescope"
          onClick={() => dispatch({ type: 'OPEN_TELESCOPE' })}
          style={{
            display: 'block',
            width: '100%',
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            border: 'none',
            background: navigation.view === 'telescope' ? theme.colors.surfaceHover : 'transparent',
            color: navigation.view === 'telescope' ? theme.colors.text : theme.colors.textMuted,
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          Telescope
        </button>
        <button
          className={`nav-link ${navigation.view === 'garden' ? 'active' : ''}`}
          data-testid="nav-garden"
          onClick={() => dispatch({ type: 'OPEN_GARDEN' })}
          style={{
            display: 'block',
            width: '100%',
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            border: 'none',
            background: navigation.view === 'garden' ? theme.colors.surfaceHover : 'transparent',
            color: navigation.view === 'garden' ? theme.colors.text : theme.colors.textMuted,
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          Garden
        </button>
        <button
          className={`nav-link ${navigation.view === 'journal' ? 'active' : ''}`}
          data-testid="nav-journal"
          onClick={() => dispatch({ type: 'OPEN_GARDEN', tool: 'journal' })}
          style={{
            display: 'block',
            width: '100%',
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            border: 'none',
            background: navigation.view === 'journal' ? theme.colors.surfaceHover : 'transparent',
            color: navigation.view === 'journal' ? theme.colors.text : theme.colors.textMuted,
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          Journal
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
