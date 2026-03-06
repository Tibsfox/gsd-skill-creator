/**
 * App — Root Component
 *
 * The Observatory's top-level component. Uses useReducer for state
 * management, persists learner state to localStorage, and renders
 * the Layout with all sub-components.
 */

import React, { useReducer, useEffect, useCallback } from 'react';
import type {
  AppState,
  AppAction,
  LearnerState,
  NavigationState,
  WardenMessage,
  FoundationId,
  PhaseType,
} from '../types/index.js';
import { PHASE_ORDER, generateId, nowISO } from '../types/index.js';
import {
  createNewLearner,
  loadState,
  saveState,
  navigateToFoundation,
  advancePhase,
  addCreation,
  addJournalEntry,
  recordUnitCircleMoment,
  markPhaseComplete,
  recordTimeSpent,
} from '../core/progression.js';
import { checkAccess, recordBypass } from '../integration/warden.js';
import { Layout } from './Layout.js';

// ─── Storage ──────────────────────────────────────────

const STORAGE_KEY = 'space-between-state';

function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Validate learner state structure
      loadState(JSON.stringify(parsed.learner));
      return { ...parsed, isFirstVisit: false };
    }
  } catch {
    // Corrupted or missing — start fresh
  }

  return {
    learner: createNewLearner(),
    navigation: { view: 'wing', activeFoundation: 'unit-circle', activePhase: 'wonder' },
    wardenMessages: [],
    isFirstVisit: true,
  };
}

function persistState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

// ─── Reducer ──────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE_WING': {
      const learner = navigateToFoundation(state.learner, action.foundation);
      return {
        ...state,
        learner,
        navigation: {
          ...state.navigation,
          view: 'wing',
          activeFoundation: action.foundation,
          activePhase: learner.currentPhase,
        },
        isFirstVisit: false,
      };
    }

    case 'ADVANCE_PHASE': {
      const learner = advancePhase(state.learner);
      // Check warden for the new phase
      const decision = checkAccess(learner, learner.currentFoundation, learner.currentPhase);
      const messages = [...state.wardenMessages];
      if (!decision.allowed) {
        messages.push({
          id: generateId(),
          decision,
          foundation: learner.currentFoundation,
          phase: learner.currentPhase,
          dismissed: false,
        });
      }
      return {
        ...state,
        learner,
        navigation: {
          ...state.navigation,
          activePhase: learner.currentPhase,
        },
        wardenMessages: messages,
      };
    }

    case 'GO_BACK_PHASE': {
      const currentIdx = PHASE_ORDER.indexOf(state.learner.currentPhase);
      if (currentIdx <= 0) return state;
      const prevPhase = PHASE_ORDER[currentIdx - 1];
      return {
        ...state,
        learner: {
          ...state.learner,
          currentPhase: prevPhase,
          lastVisit: nowISO(),
          stateVersion: state.learner.stateVersion + 1,
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
          ...state.navigation,
          view: 'telescope',
          telescopeChain: action.chain,
        },
      };
    }

    case 'OPEN_GARDEN': {
      return {
        ...state,
        navigation: {
          ...state.navigation,
          view: 'garden',
          gardenTool: action.tool,
        },
      };
    }

    case 'SAVE_CREATION': {
      const learner = addCreation(state.learner, action.creation);
      return { ...state, learner };
    }

    case 'SAVE_JOURNAL': {
      const learner = addJournalEntry(state.learner, action.entry);
      return { ...state, learner };
    }

    case 'RECORD_MOMENT': {
      const learner = recordUnitCircleMoment(
        state.learner,
        action.foundations,
        action.insight,
      );
      return { ...state, learner };
    }

    case 'DISMISS_WARDEN': {
      return {
        ...state,
        wardenMessages: state.wardenMessages.map((m) =>
          m.id === action.messageId ? { ...m, dismissed: true } : m,
        ),
      };
    }

    case 'BYPASS_WARDEN': {
      const learner = recordBypass(state.learner, action.foundation, action.phase);
      return {
        ...state,
        learner,
        wardenMessages: state.wardenMessages.map((m) =>
          m.foundation === action.foundation && m.phase === action.phase
            ? { ...m, dismissed: true }
            : m,
        ),
      };
    }

    case 'RECORD_TIME': {
      const learner = recordTimeSpent(state.learner, action.foundation, action.ms);
      return { ...state, learner };
    }

    case 'MARK_PHASE_COMPLETE': {
      try {
        const learner = markPhaseComplete(state.learner, action.foundation, action.phase);
        return { ...state, learner };
      } catch {
        // Phase ordering violation — ignore silently
        return state;
      }
    }

    default:
      return state;
  }
}

// ─── App Component ────────────────────────────────────

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, undefined, loadAppState);

  // Persist state on every change
  useEffect(() => {
    persistState(state);
  }, [state]);

  return (
    <Layout state={state} dispatch={dispatch} />
  );
};

export default App;
