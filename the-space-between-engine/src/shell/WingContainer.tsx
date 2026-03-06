// WingContainer — Wrapper that lazy-loads the appropriate wing component
// based on the active foundation. Shows Suspense fallback during load.

import React, { Suspense, useMemo } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation, WardenDecision, ShelterOption } from '@/types/index';
import { getFoundation } from '@/core/registry';
import { FOUNDATION_COLORS, SURFACE, TEXT, FONT, SPACING, TRANSITION, Z_INDEX } from './theme';
import { PhaseIndicator } from './PhaseIndicator';

// ─── Lazy-loaded wings ─────────────────────────────────────

const WING_COMPONENTS: Record<FoundationId, React.LazyExoticComponent<React.ComponentType<WingComponentProps>>> = {
  'unit-circle': React.lazy(() => import('@/observatory/wings/01-unit-circle')),
  'pythagorean': React.lazy(() => import('@/observatory/wings/02-pythagorean')),
  'trigonometry': React.lazy(() => import('@/observatory/wings/03-trigonometry')),
  'vector-calculus': React.lazy(() => import('@/observatory/wings/04-vector-calculus')),
  'set-theory': React.lazy(() => import('@/observatory/wings/05-set-theory')),
  'category-theory': React.lazy(() => import('@/observatory/wings/06-category-theory')),
  'information-theory': React.lazy(() => import('@/observatory/wings/07-information-theory')),
  'l-systems': React.lazy(() => import('@/observatory/wings/08-l-systems')),
};

// ─── Types ──────────────────────────────────────────────────

interface WingComponentProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onPhaseComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface WingContainerProps {
  foundation: FoundationId;
  phase: PhaseType;
  learnerState: LearnerState;
  wardenDecision: WardenDecision | null;
  shelterOptions: ShelterOption[] | null;
  onPhaseComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
  onBypass: (foundation: FoundationId, phase: PhaseType) => void;
  onDismissWarden: () => void;
  onAcceptShelter: (option: ShelterOption) => void;
  onDismissShelter: () => void;
}

// ─── Loading Fallback ───────────────────────────────────────

function WingLoadingFallback({ foundation }: { foundation: FoundationId }): React.JSX.Element {
  const data = getFoundation(foundation);
  const color = FOUNDATION_COLORS[foundation];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: SPACING.lg,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${SURFACE.border}`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'wing-spin 1s linear infinite',
        }}
      />
      <p style={{ color: TEXT.secondary, fontFamily: FONT.sans }}>
        Opening {data.name}...
      </p>
      <style>{`@keyframes wing-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Warden Message Banner ──────────────────────────────────

function WardenBanner({
  decision,
  foundation,
  phase,
  onDismiss,
  onBypass,
}: {
  decision: WardenDecision;
  foundation: FoundationId;
  phase: PhaseType;
  onDismiss: () => void;
  onBypass: () => void;
}): React.JSX.Element {
  const isGate = decision.mode === 'gate';

  return (
    <div
      role="alert"
      style={{
        padding: SPACING.md,
        margin: `0 ${SPACING.md} ${SPACING.md}`,
        backgroundColor: isGate ? 'rgba(251, 191, 36, 0.1)' : 'rgba(96, 165, 250, 0.08)',
        border: `1px solid ${isGate ? 'rgba(251, 191, 36, 0.3)' : 'rgba(96, 165, 250, 0.2)'}`,
        borderRadius: 8,
        zIndex: Z_INDEX.warden,
      }}
    >
      <p
        style={{
          color: TEXT.primary,
          fontFamily: FONT.sans,
          fontSize: '0.9rem',
          lineHeight: 1.6,
          margin: 0,
          marginBottom: SPACING.sm,
        }}
      >
        {decision.reason}
      </p>
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        <button
          onClick={onDismiss}
          style={{
            padding: `${SPACING.xs} ${SPACING.md}`,
            backgroundColor: 'transparent',
            color: TEXT.secondary,
            border: `1px solid ${SURFACE.border}`,
            borderRadius: 6,
            fontSize: '0.8rem',
            fontFamily: FONT.sans,
            cursor: 'pointer',
          }}
        >
          Understood
        </button>
        {isGate && (
          <button
            onClick={onBypass}
            style={{
              padding: `${SPACING.xs} ${SPACING.md}`,
              backgroundColor: 'transparent',
              color: TEXT.muted,
              border: `1px solid ${SURFACE.borderSubtle}`,
              borderRadius: 6,
              fontSize: '0.8rem',
              fontFamily: FONT.sans,
              cursor: 'pointer',
            }}
          >
            Continue anyway
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shelter Panel ──────────────────────────────────────────

function ShelterPanel({
  options,
  onAccept,
  onDismiss,
}: {
  options: ShelterOption[];
  onAccept: (option: ShelterOption) => void;
  onDismiss: () => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        padding: SPACING.lg,
        margin: `0 ${SPACING.md} ${SPACING.md}`,
        backgroundColor: 'rgba(46, 139, 87, 0.08)',
        border: '1px solid rgba(46, 139, 87, 0.2)',
        borderRadius: 8,
      }}
    >
      <p
        style={{
          color: TEXT.primary,
          fontFamily: FONT.serif,
          fontSize: '1rem',
          margin: 0,
          marginBottom: SPACING.md,
        }}
      >
        This is a hard room. Here are some other ways in.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onAccept(option)}
            style={{
              padding: SPACING.md,
              backgroundColor: SURFACE.card,
              color: TEXT.secondary,
              border: `1px solid ${SURFACE.border}`,
              borderRadius: 6,
              fontSize: '0.85rem',
              fontFamily: FONT.sans,
              textAlign: 'left',
              cursor: 'pointer',
              lineHeight: 1.5,
              transition: `border-color ${TRANSITION.fast}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TEXT.muted; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = SURFACE.border; }}
          >
            {option.description}
          </button>
        ))}
      </div>

      <button
        onClick={onDismiss}
        style={{
          marginTop: SPACING.sm,
          padding: `${SPACING.xs} ${SPACING.md}`,
          backgroundColor: 'transparent',
          color: TEXT.muted,
          border: 'none',
          fontSize: '0.8rem',
          fontFamily: FONT.sans,
          cursor: 'pointer',
        }}
      >
        I want to keep trying
      </button>
    </div>
  );
}

// ─── WingContainer ──────────────────────────────────────────

export function WingContainer({
  foundation,
  phase,
  learnerState,
  wardenDecision,
  shelterOptions,
  onPhaseComplete,
  onCreationSave,
  onNavigateFoundation,
  onBypass,
  onDismissWarden,
  onAcceptShelter,
  onDismissShelter,
}: WingContainerProps): React.JSX.Element {
  const WingComponent = useMemo(() => WING_COMPONENTS[foundation], [foundation]);
  const completedPhases = learnerState.completedPhases[foundation] ?? [];

  // Gate mode blocks content display
  const isBlocked = wardenDecision !== null && wardenDecision.mode === 'gate' && !wardenDecision.allowed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PhaseIndicator
        foundation={foundation}
        currentPhase={phase}
        completedPhases={completedPhases}
      />

      {/* Warden message */}
      {wardenDecision && !wardenDecision.allowed && (
        <WardenBanner
          decision={wardenDecision}
          foundation={foundation}
          phase={phase}
          onDismiss={onDismissWarden}
          onBypass={() => onBypass(foundation, phase)}
        />
      )}
      {wardenDecision && wardenDecision.allowed && wardenDecision.mode === 'annotate' && wardenDecision.suggestion && (
        <WardenBanner
          decision={wardenDecision}
          foundation={foundation}
          phase={phase}
          onDismiss={onDismissWarden}
          onBypass={() => onBypass(foundation, phase)}
        />
      )}

      {/* Shelter options */}
      {shelterOptions && shelterOptions.length > 0 && (
        <ShelterPanel
          options={shelterOptions}
          onAccept={onAcceptShelter}
          onDismiss={onDismissShelter}
        />
      )}

      {/* Wing content */}
      {!isBlocked && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Suspense fallback={<WingLoadingFallback foundation={foundation} />}>
            <WingComponent
              foundationId={foundation}
              learnerState={learnerState}
              onPhaseComplete={onPhaseComplete}
              onCreationSave={onCreationSave}
              onNavigateFoundation={onNavigateFoundation}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
