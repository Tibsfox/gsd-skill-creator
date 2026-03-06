// Navigation — Wing selector + Telescope/Garden access.
// Implements progressive disclosure: first visit shows only Wing 1 fully,
// returning learner reveals visited + next 1-2, veteran sees all 8.

import React, { useMemo, useCallback } from 'react';
import type { FoundationId, LearnerState, ObservatoryView } from '@/types/index';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types/index';
import { getFoundation } from '@/core/registry';
import {
  FOUNDATION_COLORS, SURFACE, TEXT, FONT, SPACING, TRANSITION, LAYOUT,
} from './theme';

// ─── Types ──────────────────────────────────────────────────

interface NavigationProps {
  learnerState: LearnerState;
  activeView: ObservatoryView;
  activeFoundation?: FoundationId;
  collapsed: boolean;
  onNavigateWing: (foundation: FoundationId) => void;
  onOpenTelescope: () => void;
  onOpenGarden: () => void;
  onToggleCollapse: () => void;
}

type WingVisibility = 'full' | 'preview' | 'placeholder' | 'hidden';

// ─── Disclosure Logic ───────────────────────────────────────

function getWingVisibility(
  learnerState: LearnerState,
): Map<FoundationId, WingVisibility> {
  const vis = new Map<FoundationId, WingVisibility>();

  // Count completed wings
  const completedWings: FoundationId[] = [];
  const visitedWings: FoundationId[] = [];

  for (const id of FOUNDATION_ORDER) {
    const completed = learnerState.completedPhases[id] ?? [];
    if (completed.length >= PHASE_ORDER.length) {
      completedWings.push(id);
    }
    if (completed.length > 0) {
      visitedWings.push(id);
    }
  }

  const completedCount = completedWings.length;

  // Veteran: >= 5 completed wings -> all visible
  if (completedCount >= 5) {
    for (const id of FOUNDATION_ORDER) {
      vis.set(id, 'full');
    }
    return vis;
  }

  // For each foundation, determine visibility
  for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
    const id = FOUNDATION_ORDER[i]!;
    const isCompleted = completedWings.includes(id);
    const isVisited = visitedWings.includes(id);

    if (isCompleted || isVisited) {
      vis.set(id, 'full');
      continue;
    }

    // First foundation is always fully visible
    if (i === 0) {
      vis.set(id, 'full');
      continue;
    }

    // Next 1-2 after the last visited: preview
    const lastVisitedIndex = findLastVisitedIndex(learnerState);
    if (i <= lastVisitedIndex + 2) {
      vis.set(id, completedCount >= 1 ? 'preview' : 'placeholder');
      continue;
    }

    // First visit with no completions: wings 2-3 placeholder, rest hidden
    if (completedCount === 0) {
      if (i <= 2) {
        vis.set(id, 'placeholder');
      } else {
        vis.set(id, 'hidden');
      }
      continue;
    }

    // Returning learner: beyond preview range -> placeholder (not hidden)
    vis.set(id, completedCount >= 3 ? 'placeholder' : 'hidden');
  }

  return vis;
}

function findLastVisitedIndex(learnerState: LearnerState): number {
  let lastIndex = 0;
  for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
    const id = FOUNDATION_ORDER[i]!;
    const completed = learnerState.completedPhases[id] ?? [];
    if (completed.length > 0) {
      lastIndex = i;
    }
  }
  return lastIndex;
}

// ─── Wing Button ────────────────────────────────────────────

function WingButton({
  id,
  visibility,
  isActive,
  completedCount,
  totalPhases,
  collapsed,
  onClick,
}: {
  id: FoundationId;
  visibility: WingVisibility;
  isActive: boolean;
  completedCount: number;
  totalPhases: number;
  collapsed: boolean;
  onClick: () => void;
}): React.JSX.Element | null {
  if (visibility === 'hidden') return null;

  const data = getFoundation(id);
  const color = FOUNDATION_COLORS[id];
  const isComplete = completedCount >= totalPhases;

  return (
    <button
      onClick={onClick}
      title={visibility === 'placeholder' ? 'Continue exploring to discover this wing' : data.name}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        width: '100%',
        padding: collapsed ? SPACING.sm : `${SPACING.sm} ${SPACING.md}`,
        justifyContent: collapsed ? 'center' : 'flex-start',
        backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
        borderRadius: 0,
        cursor: 'pointer',
        transition: `all ${TRANSITION.fast}`,
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Color dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          border: isComplete ? '2px solid #4ade80' : 'none',
        }}
      />

      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {visibility === 'placeholder' ? (
            <span style={{ color: TEXT.muted, fontSize: '0.85rem', fontFamily: FONT.sans }}>
              ...
            </span>
          ) : (
            <>
              <div
                style={{
                  color: isActive ? TEXT.primary : TEXT.secondary,
                  fontSize: '0.85rem',
                  fontFamily: FONT.sans,
                  fontWeight: isActive ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {data.name}
              </div>
              {visibility === 'full' && (
                <div
                  style={{
                    color: TEXT.muted,
                    fontSize: '0.7rem',
                    fontFamily: FONT.sans,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {data.subtitle}
                  {completedCount > 0 && ` · ${completedCount}/${totalPhases}`}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Navigation ─────────────────────────────────────────────

export function Navigation({
  learnerState,
  activeView,
  activeFoundation,
  collapsed,
  onNavigateWing,
  onOpenTelescope,
  onOpenGarden,
  onToggleCollapse,
}: NavigationProps): React.JSX.Element {
  const visibility = useMemo(() => getWingVisibility(learnerState), [learnerState]);

  const handleWingClick = useCallback(
    (id: FoundationId) => {
      const vis = visibility.get(id);
      // Placeholders still navigate — they just gently suggest continuing
      onNavigateWing(id);
    },
    [visibility, onNavigateWing],
  );

  const sidebarWidth = collapsed ? LAYOUT.sidebarCollapsedWidth : LAYOUT.sidebarWidth;

  return (
    <nav
      className="observatory-nav"
      aria-label="Observatory navigation"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100%',
        backgroundColor: SURFACE.sidebar,
        borderRight: `1px solid ${SURFACE.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: `width ${TRANSITION.normal}, min-width ${TRANSITION.normal}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? SPACING.sm : SPACING.md,
          borderBottom: `1px solid ${SURFACE.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: LAYOUT.headerHeight,
        }}
      >
        {!collapsed && (
          <span
            style={{
              color: TEXT.primary,
              fontFamily: FONT.serif,
              fontSize: '1rem',
              fontWeight: 400,
              letterSpacing: '0.02em',
            }}
          >
            Observatory
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: TEXT.muted,
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: SPACING.xs,
            lineHeight: 1,
          }}
        >
          {collapsed ? '\u25B6' : '\u25C0'}
        </button>
      </div>

      {/* Wing list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: SPACING.sm }}>
        {!collapsed && (
          <div
            style={{
              padding: `${SPACING.xs} ${SPACING.md}`,
              color: TEXT.muted,
              fontSize: '0.65rem',
              fontFamily: FONT.sans,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Wings
          </div>
        )}

        {FOUNDATION_ORDER.map((id) => {
          const vis = visibility.get(id) ?? 'hidden';
          const completed = learnerState.completedPhases[id] ?? [];
          return (
            <WingButton
              key={id}
              id={id}
              visibility={vis}
              isActive={activeView === 'wing' && activeFoundation === id}
              completedCount={completed.length}
              totalPhases={PHASE_ORDER.length}
              collapsed={collapsed}
              onClick={() => handleWingClick(id)}
            />
          );
        })}
      </div>

      {/* Bottom: Telescope + Garden */}
      <div
        style={{
          borderTop: `1px solid ${SURFACE.border}`,
          padding: SPACING.sm,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        <button
          onClick={onOpenTelescope}
          aria-current={activeView === 'telescope' ? 'page' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
            padding: `${SPACING.sm} ${collapsed ? SPACING.sm : SPACING.md}`,
            backgroundColor: activeView === 'telescope' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            color: activeView === 'telescope' ? TEXT.primary : TEXT.secondary,
            fontSize: '0.85rem',
            fontFamily: FONT.sans,
            transition: `all ${TRANSITION.fast}`,
          }}
        >
          <span style={{ fontSize: '1rem' }}>*</span>
          {!collapsed && 'Telescope'}
        </button>

        <button
          onClick={onOpenGarden}
          aria-current={activeView === 'garden' ? 'page' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
            padding: `${SPACING.sm} ${collapsed ? SPACING.sm : SPACING.md}`,
            backgroundColor: activeView === 'garden' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            color: activeView === 'garden' ? TEXT.primary : TEXT.secondary,
            fontSize: '0.85rem',
            fontFamily: FONT.sans,
            transition: `all ${TRANSITION.fast}`,
          }}
        >
          <span style={{ fontSize: '1rem' }}>#</span>
          {!collapsed && 'Garden'}
        </button>
      </div>
    </nav>
  );
}

// ─── Mobile Bottom Navigation ───────────────────────────────

interface MobileNavProps {
  activeView: ObservatoryView;
  activeFoundation?: FoundationId;
  onNavigateWing: (foundation: FoundationId) => void;
  onOpenTelescope: () => void;
  onOpenGarden: () => void;
  learnerState: LearnerState;
}

export function MobileNavigation({
  activeView,
  activeFoundation,
  onNavigateWing,
  onOpenTelescope,
  onOpenGarden,
  learnerState,
}: MobileNavProps): React.JSX.Element {
  return (
    <nav
      className="observatory-mobile-nav"
      aria-label="Observatory navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: LAYOUT.bottomNavHeight,
        backgroundColor: SURFACE.sidebar,
        borderTop: `1px solid ${SURFACE.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}
    >
      {/* Current wing shortcut */}
      <button
        onClick={() => onNavigateWing(activeFoundation ?? learnerState.currentFoundation)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: SPACING.xs,
          color: activeView === 'wing' ? TEXT.primary : TEXT.muted,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: FOUNDATION_COLORS[activeFoundation ?? learnerState.currentFoundation],
          }}
        />
        <span style={{ fontSize: '0.65rem', fontFamily: FONT.sans }}>Wing</span>
      </button>

      {/* Telescope */}
      <button
        onClick={onOpenTelescope}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: SPACING.xs,
          color: activeView === 'telescope' ? TEXT.primary : TEXT.muted,
        }}
      >
        <span style={{ fontSize: '1rem' }}>*</span>
        <span style={{ fontSize: '0.65rem', fontFamily: FONT.sans }}>Telescope</span>
      </button>

      {/* Garden */}
      <button
        onClick={onOpenGarden}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: SPACING.xs,
          color: activeView === 'garden' ? TEXT.primary : TEXT.muted,
        }}
      >
        <span style={{ fontSize: '1rem' }}>#</span>
        <span style={{ fontSize: '0.65rem', fontFamily: FONT.sans }}>Garden</span>
      </button>
    </nav>
  );
}
