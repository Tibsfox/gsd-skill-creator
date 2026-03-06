// Observatory Shell — Root component with useReducer state management.
// The ProgressionEngine is the single source of truth.
// localStorage persistence on every state change.

import React, { useReducer, useEffect, useMemo, useCallback, useState, useRef } from 'react';
import type {
  FoundationId,
  PhaseType,
  LearnerState,
  Creation,
  JournalEntry,
  NavigationState,
  WardenMessage,
  WardenDecision,
  ShelterOption,
  ObservatoryView,
} from '@/types/index';
import { PHASE_ORDER } from '@/types/index';
import { ProgressionEngine } from '@/core/progression';
import { createDefaultGraph, ConnectionGraph } from '@/core/connections';
import { WonderWarden } from '@/integration/warden';
import { Layout } from './Layout';
import { WingContainer } from './WingContainer';
import { WelcomeBack } from './WelcomeBack';
import { TransitionScreen } from './TransitionScreen';
import { SURFACE, TEXT, FONT, SPACING } from './theme';

// ─── Constants ──────────────────────────────────────────────

const STORAGE_KEY = 'space-between-state';

// ─── Singletons ─────────────────────────────────────────────

const engine = new ProgressionEngine();
const connectionGraph: ConnectionGraph = createDefaultGraph();
const warden = new WonderWarden(connectionGraph);

// ─── State ──────────────────────────────────────────────────

interface AppState {
  learner: LearnerState;
  navigation: NavigationState;
  wardenMessages: WardenMessage[];
  isFirstVisit: boolean;
}

type AppAction =
  | { type: 'NAVIGATE_WING'; foundation: FoundationId }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'GO_BACK_PHASE' }
  | { type: 'OPEN_TELESCOPE'; chain?: 'math' | 'nature' | 'skill-creator' | 'hundred-voices' }
  | { type: 'OPEN_GARDEN'; tool?: 'art' | 'music' | 'lsystem' | 'journal' }
  | { type: 'SAVE_CREATION'; creation: Creation }
  | { type: 'SAVE_JOURNAL'; entry: JournalEntry }
  | { type: 'RECORD_MOMENT'; foundations: FoundationId[]; insight: string }
  | { type: 'DISMISS_WARDEN'; messageId: string }
  | { type: 'BYPASS_WARDEN'; foundation: FoundationId; phase: PhaseType }
  | { type: 'SHOW_SHELTER'; foundation: FoundationId; phase: PhaseType; options: ShelterOption[] }
  | { type: 'ACCEPT_SHELTER'; option: ShelterOption }
  | { type: 'DISMISS_SHELTER' }
  | { type: 'MARK_PHASE_COMPLETE'; phase: PhaseType }
  | { type: 'DISMISS_FIRST_VISIT' };

// ─── Reducer ────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE_WING': {
      const learner = engine.navigateToFoundation(state.learner, action.foundation);
      return {
        ...state,
        learner,
        navigation: {
          view: 'wing',
          activeFoundation: action.foundation,
          activePhase: learner.currentPhase,
          telescopeChain: undefined,
          gardenTool: undefined,
        },
        // Clear shelter when navigating away
        wardenMessages: state.wardenMessages.filter(m =>
          m.foundation !== action.foundation || m.dismissed
        ),
      };
    }

    case 'ADVANCE_PHASE': {
      const learner = engine.advancePhase(state.learner);
      return {
        ...state,
        learner,
        navigation: {
          ...state.navigation,
          activePhase: learner.currentPhase,
        },
      };
    }

    case 'GO_BACK_PHASE': {
      const currentIndex = PHASE_ORDER.indexOf(state.learner.currentPhase);
      if (currentIndex <= 0) return state;
      const prevPhase = PHASE_ORDER[currentIndex - 1]!;
      return {
        ...state,
        learner: {
          ...state.learner,
          currentPhase: prevPhase,
        },
        navigation: {
          ...state.navigation,
          activePhase: prevPhase,
        },
      };
    }

    case 'OPEN_TELESCOPE': {
      return {
        ...state,
        navigation: {
          view: 'telescope',
          activeFoundation: state.navigation.activeFoundation,
          activePhase: state.navigation.activePhase,
          telescopeChain: action.chain,
          gardenTool: undefined,
        },
      };
    }

    case 'OPEN_GARDEN': {
      return {
        ...state,
        navigation: {
          view: 'garden',
          activeFoundation: state.navigation.activeFoundation,
          activePhase: state.navigation.activePhase,
          telescopeChain: undefined,
          gardenTool: action.tool,
        },
      };
    }

    case 'SAVE_CREATION': {
      const learner = engine.addCreation(state.learner, action.creation);
      return { ...state, learner };
    }

    case 'SAVE_JOURNAL': {
      const learner = engine.addJournalEntry(state.learner, action.entry);
      return { ...state, learner };
    }

    case 'RECORD_MOMENT': {
      const learner = engine.recordUnitCircleMoment(
        state.learner,
        action.foundations,
        action.insight,
      );
      return { ...state, learner };
    }

    case 'DISMISS_WARDEN': {
      return {
        ...state,
        wardenMessages: state.wardenMessages.map(m =>
          m.id === action.messageId ? { ...m, dismissed: true } : m
        ),
      };
    }

    case 'BYPASS_WARDEN': {
      const learner = warden.recordBypass(state.learner, action.foundation, action.phase);
      return {
        ...state,
        learner,
        wardenMessages: state.wardenMessages.map(m =>
          m.foundation === action.foundation && m.phase === action.phase
            ? { ...m, dismissed: true }
            : m
        ),
      };
    }

    case 'SHOW_SHELTER': {
      // Shelter options are handled in the WingContainer;
      // this action is a no-op at the top level since shelter
      // state is managed locally in App rendering logic.
      return state;
    }

    case 'ACCEPT_SHELTER': {
      // If the shelter option has a target foundation, navigate there
      if (action.option.targetFoundation) {
        const learner = engine.navigateToFoundation(state.learner, action.option.targetFoundation);
        return {
          ...state,
          learner,
          navigation: {
            view: 'wing',
            activeFoundation: action.option.targetFoundation,
            activePhase: learner.currentPhase,
            telescopeChain: undefined,
            gardenTool: undefined,
          },
        };
      }
      // For journal-prompt, open garden journal
      if (action.option.type === 'journal-prompt') {
        return {
          ...state,
          navigation: {
            ...state.navigation,
            view: 'garden',
            gardenTool: 'journal',
            telescopeChain: undefined,
          },
        };
      }
      return state;
    }

    case 'DISMISS_SHELTER':
      return state;

    case 'MARK_PHASE_COMPLETE': {
      const foundation = state.learner.currentFoundation;
      const learner = engine.markPhaseComplete(state.learner, foundation, action.phase);
      return {
        ...state,
        learner,
      };
    }

    case 'DISMISS_FIRST_VISIT': {
      return {
        ...state,
        isFirstVisit: false,
      };
    }

    default:
      return state;
  }
}

// ─── Initialization ─────────────────────────────────────────

function loadInitialState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  let learner: LearnerState;
  let isFirstVisit = true;

  if (saved) {
    try {
      learner = engine.deserialize(saved);
      isFirstVisit = false;
    } catch {
      learner = engine.createNewLearner();
    }
  } else {
    learner = engine.createNewLearner();
  }

  return {
    learner,
    navigation: {
      view: 'wing',
      activeFoundation: learner.currentFoundation,
      activePhase: learner.currentPhase,
    },
    wardenMessages: [],
    isFirstVisit,
  };
}

// ─── First Visit Intro ──────────────────────────────────────

function FirstVisitIntro({ onBegin }: { onBegin: () => void }): React.JSX.Element {
  const [step, setStep] = useState(0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SURFACE.background,
        zIndex: 600,
        cursor: 'pointer',
      }}
      onClick={() => {
        if (step < 2) {
          setStep(step + 1);
        } else {
          onBegin();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (step < 2) {
            setStep(step + 1);
          } else {
            onBegin();
          }
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div style={{ textAlign: 'center', maxWidth: 600, padding: SPACING['2xl'] }}>
        {step === 0 && (
          <>
            <h1
              style={{
                color: TEXT.primary,
                fontFamily: FONT.serif,
                fontSize: '2rem',
                fontWeight: 300,
                margin: 0,
                marginBottom: SPACING.lg,
              }}
            >
              The Space Between
            </h1>
            <p
              style={{
                color: TEXT.secondary,
                fontFamily: FONT.sans,
                fontSize: '0.9rem',
                lineHeight: 1.8,
              }}
            >
              An observatory for mathematics. Eight wings, each revealing a different
              foundation. Explore at your own pace.
            </p>
            <p
              style={{
                color: TEXT.muted,
                fontFamily: FONT.sans,
                fontSize: '0.75rem',
                marginTop: SPACING.xl,
              }}
            >
              Click anywhere to continue
            </p>
          </>
        )}

        {step === 1 && (
          <p
            style={{
              color: TEXT.secondary,
              fontFamily: FONT.serif,
              fontSize: '1.3rem',
              fontWeight: 300,
              lineHeight: 1.8,
              fontStyle: 'italic',
            }}
          >
            In the beginning there was nothing and then there was something.
          </p>
        )}

        {step === 2 && (
          <>
            <p
              style={{
                color: TEXT.secondary,
                fontFamily: FONT.sans,
                fontSize: '1rem',
                lineHeight: 1.8,
                marginBottom: SPACING.xl,
              }}
            >
              The Observatory opens. Wing 1 is waiting.
            </p>
            <p
              style={{
                color: TEXT.accent,
                fontFamily: FONT.serif,
                fontSize: '1.1rem',
                fontWeight: 400,
              }}
            >
              Begin here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Telescope Placeholder ──────────────────────────────────

function TelescopeView({
  learnerState,
  chain,
  onNavigateFoundation,
  onClose,
}: {
  learnerState: LearnerState;
  chain?: 'math' | 'nature' | 'skill-creator' | 'hundred-voices';
  onNavigateFoundation: (id: FoundationId) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        padding: SPACING['2xl'],
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          color: TEXT.primary,
          fontFamily: FONT.serif,
          fontSize: '1.5rem',
          fontWeight: 300,
          marginBottom: SPACING.md,
        }}
      >
        Telescope
      </h2>
      <p style={{ color: TEXT.secondary, fontFamily: FONT.sans, fontSize: '0.9rem' }}>
        {chain
          ? `Viewing the ${chain} chain.`
          : 'See how all eight foundations connect.'}
      </p>
      <button
        onClick={onClose}
        style={{
          marginTop: SPACING.lg,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          backgroundColor: 'transparent',
          color: TEXT.secondary,
          border: `1px solid ${SURFACE.border}`,
          borderRadius: 6,
          fontSize: '0.85rem',
          fontFamily: FONT.sans,
          cursor: 'pointer',
        }}
      >
        Return to wing
      </button>
    </div>
  );
}

// ─── Garden Placeholder ─────────────────────────────────────

function GardenView({
  learnerState,
  tool,
  onClose,
}: {
  learnerState: LearnerState;
  tool?: 'art' | 'music' | 'lsystem' | 'journal';
  onClose: () => void;
}): React.JSX.Element {
  const toolLabels: Record<string, string> = {
    art: 'Art Canvas',
    music: 'Music Studio',
    lsystem: 'L-System Editor',
    journal: 'Reflection Journal',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        padding: SPACING['2xl'],
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          color: TEXT.primary,
          fontFamily: FONT.serif,
          fontSize: '1.5rem',
          fontWeight: 300,
          marginBottom: SPACING.md,
        }}
      >
        Garden
      </h2>
      <p style={{ color: TEXT.secondary, fontFamily: FONT.sans, fontSize: '0.9rem' }}>
        {tool
          ? `Opening ${toolLabels[tool] ?? tool}.`
          : 'Creative tools: art, music, L-systems, and your reflection journal.'}
      </p>
      <button
        onClick={onClose}
        style={{
          marginTop: SPACING.lg,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          backgroundColor: 'transparent',
          color: TEXT.secondary,
          border: `1px solid ${SURFACE.border}`,
          borderRadius: 6,
          fontSize: '0.85rem',
          fontFamily: FONT.sans,
          cursor: 'pointer',
        }}
      >
        Return to wing
      </button>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  // UI-local state
  const [showWelcome, setShowWelcome] = useState(!state.isFirstVisit);
  const [transitionFoundation, setTransitionFoundation] = useState<FoundationId | null>(null);
  const [currentWardenDecision, setCurrentWardenDecision] = useState<WardenDecision | null>(null);
  const [shelterOptions, setShelterOptions] = useState<ShelterOption[] | null>(null);

  const prevFoundationRef = useRef<FoundationId | undefined>(state.navigation.activeFoundation);

  // ── Persist state to localStorage ──────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, engine.serialize(state.learner));
  }, [state.learner]);

  // ── Completion percentage ──────────────────────────────────
  const percentage = useMemo(
    () => engine.getCompletionPercentage(state.learner),
    [state.learner],
  );

  // ── Resume point ───────────────────────────────────────────
  const resumePoint = useMemo(
    () => engine.getResumePoint(state.learner),
    [state.learner],
  );

  // ── Warden check on navigation ────────────────────────────
  const checkWarden = useCallback(
    (foundation: FoundationId, phase: PhaseType) => {
      const decision = warden.checkAccess(state.learner, foundation, phase);
      if (decision.mode === 'gate' && !decision.allowed) {
        setCurrentWardenDecision(decision);
      } else if (decision.mode === 'annotate' && decision.suggestion) {
        setCurrentWardenDecision(decision);
      } else {
        setCurrentWardenDecision(null);
      }
    },
    [state.learner],
  );

  // ── Navigation handlers ───────────────────────────────────

  const handleNavigateWing = useCallback(
    (foundation: FoundationId) => {
      // Show transition if changing foundation
      if (foundation !== prevFoundationRef.current) {
        setTransitionFoundation(foundation);
        prevFoundationRef.current = foundation;
      }
      dispatch({ type: 'NAVIGATE_WING', foundation });
      // Check warden for the target phase
      const completed = state.learner.completedPhases[foundation] ?? [];
      let targetPhase: PhaseType = 'wonder';
      for (const phase of PHASE_ORDER) {
        if (!completed.includes(phase)) {
          targetPhase = phase;
          break;
        }
      }
      checkWarden(foundation, targetPhase);
      setShelterOptions(null);
    },
    [state.learner, checkWarden],
  );

  const handleOpenTelescope = useCallback(() => {
    dispatch({ type: 'OPEN_TELESCOPE' });
    setCurrentWardenDecision(null);
    setShelterOptions(null);
  }, []);

  const handleOpenGarden = useCallback(() => {
    dispatch({ type: 'OPEN_GARDEN' });
    setCurrentWardenDecision(null);
    setShelterOptions(null);
  }, []);

  const handlePhaseComplete = useCallback(
    (phase: PhaseType) => {
      dispatch({ type: 'MARK_PHASE_COMPLETE', phase });
      dispatch({ type: 'ADVANCE_PHASE' });
      setCurrentWardenDecision(null);
    },
    [],
  );

  const handleCreationSave = useCallback((creation: Creation) => {
    dispatch({ type: 'SAVE_CREATION', creation });
  }, []);

  const handleNavigateFoundation = useCallback(
    (id: FoundationId) => {
      handleNavigateWing(id);
    },
    [handleNavigateWing],
  );

  const handleBypass = useCallback(
    (foundation: FoundationId, phase: PhaseType) => {
      dispatch({ type: 'BYPASS_WARDEN', foundation, phase });
      setCurrentWardenDecision(null);
    },
    [],
  );

  const handleDismissWarden = useCallback(() => {
    setCurrentWardenDecision(null);
  }, []);

  const handleAcceptShelter = useCallback(
    (option: ShelterOption) => {
      dispatch({ type: 'ACCEPT_SHELTER', option });
      setShelterOptions(null);
    },
    [],
  );

  const handleDismissShelter = useCallback(() => {
    setShelterOptions(null);
  }, []);

  // ── First visit / welcome back ────────────────────────────

  const handleFirstVisitBegin = useCallback(() => {
    dispatch({ type: 'DISMISS_FIRST_VISIT' });
  }, []);

  const handleResume = useCallback(() => {
    setShowWelcome(false);
    dispatch({ type: 'NAVIGATE_WING', foundation: resumePoint.foundation });
    checkWarden(resumePoint.foundation, resumePoint.phase);
  }, [resumePoint, checkWarden]);

  const handleExploreFreely = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setTransitionFoundation(null);
  }, []);

  const handleReturnToWing = useCallback(() => {
    const foundation = state.navigation.activeFoundation ?? state.learner.currentFoundation;
    dispatch({ type: 'NAVIGATE_WING', foundation });
  }, [state.navigation.activeFoundation, state.learner.currentFoundation]);

  // ── Render ─────────────────────────────────────────────────

  // First visit intro
  if (state.isFirstVisit) {
    return <FirstVisitIntro onBegin={handleFirstVisitBegin} />;
  }

  // Welcome back (returning visitor, first render)
  if (showWelcome) {
    return (
      <>
        <Layout
          learnerState={state.learner}
          activeView={state.navigation.view}
          activeFoundation={state.navigation.activeFoundation}
          percentage={percentage}
          onNavigateWing={handleNavigateWing}
          onOpenTelescope={handleOpenTelescope}
          onOpenGarden={handleOpenGarden}
        >
          <div />
        </Layout>
        <WelcomeBack
          learnerState={state.learner}
          resumePoint={resumePoint}
          onResume={handleResume}
          onExplore={handleExploreFreely}
        />
      </>
    );
  }

  // Main view
  const activeFoundation = state.navigation.activeFoundation ?? state.learner.currentFoundation;
  const activePhase = state.navigation.activePhase ?? state.learner.currentPhase;

  return (
    <>
      <Layout
        learnerState={state.learner}
        activeView={state.navigation.view}
        activeFoundation={activeFoundation}
        percentage={percentage}
        onNavigateWing={handleNavigateWing}
        onOpenTelescope={handleOpenTelescope}
        onOpenGarden={handleOpenGarden}
      >
        {state.navigation.view === 'wing' && (
          <WingContainer
            foundation={activeFoundation}
            phase={activePhase}
            learnerState={state.learner}
            wardenDecision={currentWardenDecision}
            shelterOptions={shelterOptions}
            onPhaseComplete={handlePhaseComplete}
            onCreationSave={handleCreationSave}
            onNavigateFoundation={handleNavigateFoundation}
            onBypass={handleBypass}
            onDismissWarden={handleDismissWarden}
            onAcceptShelter={handleAcceptShelter}
            onDismissShelter={handleDismissShelter}
          />
        )}

        {state.navigation.view === 'telescope' && (
          <TelescopeView
            learnerState={state.learner}
            chain={state.navigation.telescopeChain}
            onNavigateFoundation={handleNavigateFoundation}
            onClose={handleReturnToWing}
          />
        )}

        {state.navigation.view === 'garden' && (
          <GardenView
            learnerState={state.learner}
            tool={state.navigation.gardenTool}
            onClose={handleReturnToWing}
          />
        )}
      </Layout>

      {/* Wing transition overlay */}
      {transitionFoundation && (
        <TransitionScreen
          foundation={transitionFoundation}
          onComplete={handleTransitionComplete}
        />
      )}
    </>
  );
}
