/**
 * Layout — Main Layout
 *
 * Sidebar (240px) with Navigation component, main content area
 * rendering the active view (wing, telescope, garden, journal).
 * Dark mode by default.
 */

import React from 'react';
import type { AppState, AppAction } from '../types/index.js';
import { Navigation } from './Navigation.js';
import { ProgressBar } from './ProgressBar.js';
import { WelcomeBack } from './WelcomeBack.js';
import { WingContainer } from './WingContainer.js';
import { theme } from './theme.js';

export interface LayoutProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const Layout: React.FC<LayoutProps> = ({ state, dispatch }) => {
  const { learner, navigation, wardenMessages, isFirstVisit } = state;

  const renderContent = () => {
    // First visit shows welcome screen
    if (isFirstVisit && navigation.view === 'wing' && !navigation.activeFoundation) {
      return (
        <WelcomeBack
          isFirstVisit={true}
          learnerState={learner}
          dispatch={dispatch}
        />
      );
    }

    switch (navigation.view) {
      case 'wing':
        return (
          <WingContainer
            foundation={navigation.activeFoundation ?? learner.currentFoundation}
            learnerState={learner}
            wardenMessages={wardenMessages}
            dispatch={dispatch}
          />
        );

      case 'telescope':
        // Telescope is implemented in Task 3.2
        return (
          <div
            data-testid="telescope-view"
            style={{ padding: theme.spacing.xl, color: theme.colors.text }}
          >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Telescope</h1>
            <p style={{ color: theme.colors.textMuted }}>
              See all eight foundations as one unified progression.
            </p>
          </div>
        );

      case 'garden':
        return (
          <div
            data-testid="garden-view"
            style={{ padding: theme.spacing.xl, color: theme.colors.text }}
          >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Garden</h1>
            <p style={{ color: theme.colors.textMuted }}>
              Create, compose, grow.
            </p>
          </div>
        );

      case 'journal':
        return (
          <div
            data-testid="journal-view"
            style={{ padding: theme.spacing.xl, color: theme.colors.text }}
          >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Journal</h1>
            <p style={{ color: theme.colors.textMuted }}>
              Reflect on your journey.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="observatory-layout"
      data-testid="observatory-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: theme.sidebar.width,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navigation
          learnerState={learner}
          navigation={navigation}
          dispatch={dispatch}
        />
        <ProgressBar learnerState={learner} />
      </aside>

      {/* Main content */}
      <main
        className="observatory-main"
        data-testid="observatory-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
};

export default Layout;
