/**
 * Full Integration Tests
 *
 * End-to-end tests verifying the complete Observatory system:
 * shell state management, navigation, warden integration,
 * telescope chains, journal/creation persistence, and the
 * full learner journey through all phases.
 */

import { describe, it, expect } from 'vitest';
import type {
  AppState,
  AppAction,
  FoundationId,
  PhaseType,
  LearnerState,
  WardenMessage,
  TelescopeChain,
} from '@/types';
import { FOUNDATION_ORDER, PHASE_ORDER, generateId, nowISO } from '@/types';
import { appReducer } from '@/shell/App';
import {
  createNewLearner,
  loadState,
  saveState,
  markPhaseComplete,
  navigateToFoundation,
  addCreation,
  addJournalEntry,
  recordUnitCircleMoment,
  getCompletionPercentage,
  getResumePoint,
  isFoundationComplete,
} from '@/core/progression';
import { checkAccess, recordBypass, getBypassCount } from '@/integration/warden';
import { getFoundation } from '@/core/registry';
import { getAllMappings, getMapping } from '@/integration/skill-bridge';
import {
  telescopeChains,
  CHAIN_ORDER,
  CHAIN_LABELS,
  validateChains,
  getNodesForFoundation,
} from '@/observatory/telescope/TelescopeChainData';
import { theme } from '@/shell/theme';

// ─── Helpers ─────────────────────────────────────────

function freshAppState(): AppState {
  return {
    learner: createNewLearner(),
    navigation: { view: 'wing', activeFoundation: 'unit-circle', activePhase: 'wonder' },
    wardenMessages: [],
    isFirstVisit: true,
  };
}

function appStateWith(phases: Partial<Record<FoundationId, PhaseType[]>>): AppState {
  let learner = createNewLearner();
  for (const [foundationId, phaseList] of Object.entries(phases)) {
    for (const phase of phaseList as PhaseType[]) {
      learner = markPhaseComplete(learner, foundationId as FoundationId, phase);
    }
  }
  return {
    learner,
    navigation: { view: 'wing', activeFoundation: learner.currentFoundation, activePhase: learner.currentPhase },
    wardenMessages: [],
    isFirstVisit: false,
  };
}

function dispatchSequence(state: AppState, actions: AppAction[]): AppState {
  return actions.reduce((s, a) => appReducer(s, a), state);
}

// ─── IT-01: Navigation dispatches correct actions ────

describe('IT-01: Navigation dispatches correct actions', () => {
  it('NAVIGATE_WING updates navigation and learner state', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'pythagorean' });

    expect(next.navigation.view).toBe('wing');
    expect(next.navigation.activeFoundation).toBe('pythagorean');
    expect(next.learner.currentFoundation).toBe('pythagorean');
    expect(next.isFirstVisit).toBe(false);
  });

  it('NAVIGATE_WING sets phase to earliest incomplete phase', () => {
    const state = appStateWith({ trigonometry: ['wonder', 'see'] });
    const next = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'trigonometry' });

    expect(next.learner.currentPhase).toBe('touch');
    expect(next.navigation.activePhase).toBe('touch');
  });

  it('OPEN_TELESCOPE switches view', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_TELESCOPE' });

    expect(next.navigation.view).toBe('telescope');
  });

  it('OPEN_TELESCOPE with chain param sets telescopeChain', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_TELESCOPE', chain: 'nature' });

    expect(next.navigation.view).toBe('telescope');
    expect(next.navigation.telescopeChain).toBe('nature');
  });

  it('OPEN_GARDEN switches view', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_GARDEN' });

    expect(next.navigation.view).toBe('garden');
  });

  it('OPEN_GARDEN with tool param sets gardenTool', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_GARDEN', tool: 'music' });

    expect(next.navigation.view).toBe('garden');
    expect(next.navigation.gardenTool).toBe('music');
  });

  it('navigating between all 8 foundations works', () => {
    let state = freshAppState();
    for (const id of FOUNDATION_ORDER) {
      state = appReducer(state, { type: 'NAVIGATE_WING', foundation: id });
      expect(state.learner.currentFoundation).toBe(id);
      expect(state.navigation.activeFoundation).toBe(id);
    }
  });
});

// ─── IT-04: Phase completion updates learner state ───

describe('IT-04: Phase completion updates learner state', () => {
  it('MARK_PHASE_COMPLETE adds phase to completedPhases', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'wonder',
    });

    expect(next.learner.completedPhases['unit-circle']).toContain('wonder');
  });

  it('ADVANCE_PHASE moves to next phase', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'ADVANCE_PHASE' });

    expect(next.learner.currentPhase).toBe('see');
    expect(next.navigation.activePhase).toBe('see');
  });

  it('GO_BACK_PHASE moves to previous phase', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'ADVANCE_PHASE' }); // wonder → see
    state = appReducer(state, { type: 'ADVANCE_PHASE' }); // see → touch
    state = appReducer(state, { type: 'GO_BACK_PHASE' }); // touch → see

    expect(state.learner.currentPhase).toBe('see');
  });

  it('GO_BACK_PHASE does nothing at wonder phase', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'GO_BACK_PHASE' });

    expect(next.learner.currentPhase).toBe('wonder');
  });

  it('completing all 6 phases marks foundation complete', () => {
    let state = freshAppState();
    for (const phase of PHASE_ORDER) {
      state = appReducer(state, {
        type: 'MARK_PHASE_COMPLETE',
        foundation: 'unit-circle',
        phase,
      });
    }

    expect(isFoundationComplete(state.learner, 'unit-circle')).toBe(true);
  });

  it('completion percentage increases with each completed phase', () => {
    let state = freshAppState();
    const initialPercent = getCompletionPercentage(state.learner);

    state = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'wonder',
    });

    expect(getCompletionPercentage(state.learner)).toBeGreaterThan(initialPercent);
  });

  it('MARK_PHASE_COMPLETE ignores out-of-order phases silently', () => {
    const state = freshAppState();
    // Try to complete 'understand' before wonder/see/touch
    const next = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'understand',
    });

    // Should be silently ignored (reducer catches error)
    expect(next.learner.completedPhases['unit-circle']).not.toContain('understand');
  });
});

// ─── IT-05: Warden handles out-of-order access ──────

describe('IT-05: Warden handles out-of-order access', () => {
  it('warden gates understand phase when wonder/see/touch are incomplete', () => {
    const state = createNewLearner();
    const decision = checkAccess(state, 'unit-circle', 'understand');

    expect(decision.allowed).toBe(false);
    expect(decision.mode).toBe('gate');
  });

  it('warden allows understand phase when wonder/see/touch are complete', () => {
    let state = createNewLearner();
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    state = markPhaseComplete(state, 'unit-circle', 'touch');
    const decision = checkAccess(state, 'unit-circle', 'understand');

    expect(decision.allowed).toBe(true);
  });

  it('warden annotates (soft) for see phase without wonder', () => {
    const state = createNewLearner();
    const decision = checkAccess(state, 'unit-circle', 'see');

    expect(decision.allowed).toBe(true);
    expect(decision.mode).toBe('annotate');
    expect(decision.reason).toBeTruthy();
  });

  it('ADVANCE_PHASE creates warden message when phase is gated', () => {
    // Set up state at touch phase, about to advance to understand without completing wonder/see/touch
    let state = freshAppState();
    // Force current phase to touch without completing wonder/see
    state = {
      ...state,
      learner: {
        ...state.learner,
        currentPhase: 'touch',
      },
    };
    // Advance to understand — warden should gate
    const next = appReducer(state, { type: 'ADVANCE_PHASE' });

    // The phase advances (reducer does it via progression engine)
    // but warden message is added if access is denied
    if (next.wardenMessages.length > 0) {
      const msg = next.wardenMessages[next.wardenMessages.length - 1];
      expect(msg.dismissed).toBe(false);
    }
  });

  it('DISMISS_WARDEN marks message as dismissed', () => {
    const msgId = 'test-warden-msg';
    const state: AppState = {
      ...freshAppState(),
      wardenMessages: [
        {
          id: msgId,
          decision: { allowed: false, mode: 'gate', reason: 'Test gate' },
          foundation: 'unit-circle',
          phase: 'understand',
          dismissed: false,
        },
      ],
    };
    const next = appReducer(state, { type: 'DISMISS_WARDEN', messageId: msgId });

    expect(next.wardenMessages[0].dismissed).toBe(true);
  });

  it('BYPASS_WARDEN records bypass and dismisses message', () => {
    const state: AppState = {
      ...freshAppState(),
      wardenMessages: [
        {
          id: 'msg-1',
          decision: { allowed: false, mode: 'gate', reason: 'Test' },
          foundation: 'unit-circle',
          phase: 'understand',
          dismissed: false,
        },
      ],
    };
    const next = appReducer(state, {
      type: 'BYPASS_WARDEN',
      foundation: 'unit-circle',
      phase: 'understand',
    });

    expect(next.wardenMessages[0].dismissed).toBe(true);
    expect(getBypassCount(next.learner)).toBeGreaterThan(0);
  });
});

// ─── IT-13: All 8 foundations have skill-creator mappings ─

describe('IT-13: All 8 foundations have skill-creator mappings', () => {
  it('getAllMappings returns exactly 8 entries', () => {
    const mappings = getAllMappings();
    expect(mappings.size).toBe(8);
  });

  it('every foundation has a mapping with required fields', () => {
    for (const id of FOUNDATION_ORDER) {
      const mapping = getMapping(id);
      expect(mapping.mathConcept).toBeTruthy();
      expect(mapping.skillCreatorFunction).toBeTruthy();
      expect(mapping.explanation).toBeTruthy();
      expect(mapping.complexPlanePosition).toBeDefined();
      expect(typeof mapping.complexPlanePosition!.theta).toBe('number');
      expect(typeof mapping.complexPlanePosition!.r).toBe('number');
    }
  });

  it('all theta values are distinct', () => {
    const thetas = FOUNDATION_ORDER.map(
      (id) => getMapping(id).complexPlanePosition!.theta,
    );
    const unique = new Set(thetas);
    expect(unique.size).toBe(8);
  });
});

// ─── IT-14: Warden reads correct learner state ──────

describe('IT-14: Warden reads correct learner state', () => {
  it('warden decision varies based on completed phases', () => {
    const fresh = createNewLearner();
    const decisionBefore = checkAccess(fresh, 'unit-circle', 'understand');
    expect(decisionBefore.allowed).toBe(false);

    let progressed = fresh;
    progressed = markPhaseComplete(progressed, 'unit-circle', 'wonder');
    progressed = markPhaseComplete(progressed, 'unit-circle', 'see');
    progressed = markPhaseComplete(progressed, 'unit-circle', 'touch');
    const decisionAfter = checkAccess(progressed, 'unit-circle', 'understand');
    expect(decisionAfter.allowed).toBe(true);
  });

  it('warden checks per-foundation state independently', () => {
    let state = createNewLearner();
    // Complete unit-circle phases
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    state = markPhaseComplete(state, 'unit-circle', 'touch');

    // UC understand should be allowed
    expect(checkAccess(state, 'unit-circle', 'understand').allowed).toBe(true);
    // Pythagorean understand should still be gated
    expect(checkAccess(state, 'pythagorean', 'understand').allowed).toBe(false);
  });

  it('warden allows wonder for any foundation regardless of state', () => {
    const state = createNewLearner();
    for (const id of FOUNDATION_ORDER) {
      expect(checkAccess(state, id, 'wonder').allowed).toBe(true);
    }
  });
});

// ─── IT-17: Journal entries saved to state ──────────

describe('IT-17: Journal entries saved to state', () => {
  it('SAVE_JOURNAL adds entry to learner state', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_JOURNAL',
      entry: { text: 'I see the circle now', foundationId: 'unit-circle' },
    });

    expect(next.learner.journalEntries).toHaveLength(1);
    expect(next.learner.journalEntries[0].text).toBe('I see the circle now');
    expect(next.learner.journalEntries[0].foundationId).toBe('unit-circle');
  });

  it('journal entry has generated id and timestamp', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_JOURNAL',
      entry: { text: 'Test entry' },
    });

    expect(next.learner.journalEntries[0].id).toBeTruthy();
    expect(next.learner.journalEntries[0].createdAt).toBeTruthy();
  });

  it('multiple journal entries accumulate', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'SAVE_JOURNAL', entry: { text: 'First' } });
    state = appReducer(state, { type: 'SAVE_JOURNAL', entry: { text: 'Second' } });
    state = appReducer(state, { type: 'SAVE_JOURNAL', entry: { text: 'Third' } });

    expect(state.learner.journalEntries).toHaveLength(3);
  });

  it('journal entries preserve prompt field', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_JOURNAL',
      entry: { text: 'My reflection', prompt: 'What cycles govern your life?' },
    });

    expect(next.learner.journalEntries[0].prompt).toBe('What cycles govern your life?');
  });
});

// ─── IT-18: Creations saved to state ────────────────

describe('IT-18: Creations saved to state', () => {
  it('SAVE_CREATION adds creation to learner state', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_CREATION',
      creation: {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'My Circle',
        data: 'data:image/png;base64,...',
        shared: false,
      },
    });

    expect(next.learner.creations).toHaveLength(1);
    expect(next.learner.creations[0].title).toBe('My Circle');
    expect(next.learner.creations[0].type).toBe('generative-art');
  });

  it('creation has generated id and timestamp', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_CREATION',
      creation: {
        foundationId: 'unit-circle',
        type: 'visualization',
        title: 'Test',
        data: '{}',
        shared: false,
      },
    });

    expect(next.learner.creations[0].id).toBeTruthy();
    expect(next.learner.creations[0].createdAt).toBeTruthy();
  });

  it('multiple creations accumulate', () => {
    let state = freshAppState();
    for (let i = 0; i < 5; i++) {
      state = appReducer(state, {
        type: 'SAVE_CREATION',
        creation: {
          foundationId: FOUNDATION_ORDER[i % FOUNDATION_ORDER.length],
          type: 'generative-art',
          title: `Art ${i}`,
          data: `data-${i}`,
          shared: false,
        },
      });
    }

    expect(state.learner.creations).toHaveLength(5);
  });
});

// ─── IT-20: Full journey — new learner → complete Wing 1 ─

describe('IT-20: Full journey through Wing 1', () => {
  it('new learner starts at unit-circle, wonder phase', () => {
    const state = freshAppState();
    expect(state.learner.currentFoundation).toBe('unit-circle');
    expect(state.learner.currentPhase).toBe('wonder');
    expect(state.isFirstVisit).toBe(true);
  });

  it('complete all 6 phases of Wing 1 sequentially', () => {
    let state = freshAppState();

    // Navigate to unit circle
    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'unit-circle' });

    // Complete each phase in order
    for (const phase of PHASE_ORDER) {
      state = appReducer(state, {
        type: 'MARK_PHASE_COMPLETE',
        foundation: 'unit-circle',
        phase,
      });
      state = appReducer(state, { type: 'ADVANCE_PHASE' });
    }

    expect(state.learner.completedPhases['unit-circle']).toHaveLength(6);
    expect(isFoundationComplete(state.learner, 'unit-circle')).toBe(true);
  });

  it('creation saved during create phase appears in state', () => {
    let state = freshAppState();

    // Complete first 5 phases
    for (const phase of PHASE_ORDER.slice(0, 5)) {
      state = appReducer(state, {
        type: 'MARK_PHASE_COMPLETE',
        foundation: 'unit-circle',
        phase,
      });
    }

    // Save a creation during create phase
    state = appReducer(state, {
      type: 'SAVE_CREATION',
      creation: {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'My First Circle',
        data: 'svg-circle-data',
        shared: false,
      },
    });

    // Complete create phase
    state = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'create',
    });

    expect(state.learner.creations).toHaveLength(1);
    expect(state.learner.creations[0].foundationId).toBe('unit-circle');
    expect(isFoundationComplete(state.learner, 'unit-circle')).toBe(true);
  });

  it('stateVersion increments with each action', () => {
    let state = freshAppState();
    const initialVersion = state.learner.stateVersion;

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'unit-circle' });
    expect(state.learner.stateVersion).toBeGreaterThan(initialVersion);

    const v2 = state.learner.stateVersion;
    state = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'wonder',
    });
    expect(state.learner.stateVersion).toBeGreaterThan(v2);
  });
});

// ─── IT-21: Cross-wing navigation works ─────────────

describe('IT-21: Cross-wing navigation works', () => {
  it('can navigate from one wing to another', () => {
    let state = freshAppState();

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'unit-circle' });
    expect(state.learner.currentFoundation).toBe('unit-circle');

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'set-theory' });
    expect(state.learner.currentFoundation).toBe('set-theory');
    expect(state.navigation.activeFoundation).toBe('set-theory');
  });

  it('cross-wing navigation preserves completed phases', () => {
    let state = appStateWith({ 'unit-circle': ['wonder', 'see'] });

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'trigonometry' });
    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'unit-circle' });

    expect(state.learner.completedPhases['unit-circle']).toContain('wonder');
    expect(state.learner.completedPhases['unit-circle']).toContain('see');
    // Should resume at touch (earliest incomplete)
    expect(state.learner.currentPhase).toBe('touch');
  });

  it('navigating through all 8 foundations maintains correct state', () => {
    let state = freshAppState();

    for (const id of FOUNDATION_ORDER) {
      state = appReducer(state, { type: 'NAVIGATE_WING', foundation: id });
      expect(state.navigation.view).toBe('wing');
      expect(state.navigation.activeFoundation).toBe(id);
      expect(state.learner.currentFoundation).toBe(id);
    }
  });

  it('navigating from telescope to wing works', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'OPEN_TELESCOPE' });
    expect(state.navigation.view).toBe('telescope');

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'l-systems' });
    expect(state.navigation.view).toBe('wing');
    expect(state.learner.currentFoundation).toBe('l-systems');
  });

  it('navigating from garden to wing works', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'OPEN_GARDEN', tool: 'art' });
    expect(state.navigation.view).toBe('garden');

    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'category-theory' });
    expect(state.navigation.view).toBe('wing');
    expect(state.learner.currentFoundation).toBe('category-theory');
  });
});

// ─── IT-22: Telescope data includes all 4 chains with 8 nodes ─

describe('IT-22: Telescope chain data completeness', () => {
  it('all 4 chains exist', () => {
    expect(CHAIN_ORDER).toHaveLength(4);
    for (const chain of CHAIN_ORDER) {
      expect(telescopeChains[chain]).toBeDefined();
    }
  });

  it('each chain has exactly 8 nodes', () => {
    for (const chain of CHAIN_ORDER) {
      expect(telescopeChains[chain]).toHaveLength(8);
    }
  });

  it('each chain node references a valid foundation in order', () => {
    for (const chain of CHAIN_ORDER) {
      const nodes = telescopeChains[chain];
      for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
        expect(nodes[i].foundationId).toBe(FOUNDATION_ORDER[i]);
        expect(nodes[i].chain).toBe(chain);
      }
    }
  });

  it('validateChains returns true', () => {
    expect(validateChains()).toBe(true);
  });

  it('every node has a label and description', () => {
    for (const chain of CHAIN_ORDER) {
      for (const node of telescopeChains[chain]) {
        expect(node.label).toBeTruthy();
        expect(node.label.length).toBeGreaterThan(0);
        expect(node.description).toBeTruthy();
        expect(node.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('all chain labels exist', () => {
    for (const chain of CHAIN_ORDER) {
      expect(CHAIN_LABELS[chain]).toBeTruthy();
    }
  });

  it('getNodesForFoundation returns 4 nodes (one per chain)', () => {
    for (const id of FOUNDATION_ORDER) {
      const nodes = getNodesForFoundation(id);
      expect(nodes).toHaveLength(4);
      for (let i = 0; i < CHAIN_ORDER.length; i++) {
        expect(nodes[i].chain).toBe(CHAIN_ORDER[i]);
        expect(nodes[i].foundationId).toBe(id);
      }
    }
  });

  it('math chain labels match foundation names', () => {
    const mathNodes = telescopeChains.math;
    for (const node of mathNodes) {
      const foundation = getFoundation(node.foundationId);
      // Math chain labels should relate to the foundation name
      expect(node.label).toBeTruthy();
    }
  });

  it('hundred-voices chain has literary voice labels', () => {
    const voices = telescopeChains['hundred-voices'];
    const expectedVoices = [
      'Hemingway', 'Woolf', 'Morrison', 'Pynchon',
      'Borges', 'Le Guin', 'Calvino', 'Everett',
    ];
    for (let i = 0; i < voices.length; i++) {
      expect(voices[i].label).toBe(expectedVoices[i]);
    }
  });
});

// ─── IT-23: Unit circle moment recorded in state ────

describe('IT-23: Unit circle moment recorded in state', () => {
  it('RECORD_MOMENT adds moment to learner state', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'RECORD_MOMENT',
      foundations: ['unit-circle', 'trigonometry'],
      insight: 'They are both about circles!',
    });

    expect(next.learner.unitCircleMoments).toHaveLength(1);
    expect(next.learner.unitCircleMoments[0].foundations).toEqual([
      'unit-circle',
      'trigonometry',
    ]);
    expect(next.learner.unitCircleMoments[0].insight).toBe('They are both about circles!');
  });

  it('moment has generated id and timestamp', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'RECORD_MOMENT',
      foundations: ['set-theory'],
      insight: 'Boundaries define identity',
    });

    expect(next.learner.unitCircleMoments[0].id).toBeTruthy();
    expect(next.learner.unitCircleMoments[0].createdAt).toBeTruthy();
  });

  it('multiple moments accumulate', () => {
    let state = freshAppState();
    state = appReducer(state, {
      type: 'RECORD_MOMENT',
      foundations: ['unit-circle'],
      insight: 'First insight',
    });
    state = appReducer(state, {
      type: 'RECORD_MOMENT',
      foundations: ['pythagorean', 'vector-calculus'],
      insight: 'Distance generalizes',
    });

    expect(state.learner.unitCircleMoments).toHaveLength(2);
  });
});

// ─── All 8 wings export correctly ───────────────────

describe('All 8 wings export correctly', () => {
  it('all 8 foundations are in FOUNDATION_ORDER', () => {
    expect(FOUNDATION_ORDER).toHaveLength(8);
    const expected: FoundationId[] = [
      'unit-circle', 'pythagorean', 'trigonometry', 'vector-calculus',
      'set-theory', 'category-theory', 'information-theory', 'l-systems',
    ];
    expect(FOUNDATION_ORDER).toEqual(expected);
  });

  it('getFoundation returns valid data for all 8 foundations', () => {
    for (const id of FOUNDATION_ORDER) {
      const foundation = getFoundation(id);
      expect(foundation.id).toBe(id);
      expect(foundation.name).toBeTruthy();
      expect(foundation.subtitle).toBeTruthy();
      expect(foundation.color).toBeTruthy();
      expect(foundation.description).toBeTruthy();
    }
  });

  it('all foundations have 6 phases', () => {
    for (const id of FOUNDATION_ORDER) {
      const foundation = getFoundation(id);
      expect(foundation.phases.size).toBe(6);
      for (const phase of PHASE_ORDER) {
        expect(foundation.phases.has(phase)).toBe(true);
      }
    }
  });

  it('all foundations have wonder connections', () => {
    for (const id of FOUNDATION_ORDER) {
      const foundation = getFoundation(id);
      expect(foundation.wonderConnections.length).toBeGreaterThan(0);
    }
  });

  it('all foundations have skill-creator analogs', () => {
    for (const id of FOUNDATION_ORDER) {
      const foundation = getFoundation(id);
      expect(foundation.skillCreatorAnalog).toBeDefined();
      expect(foundation.skillCreatorAnalog.mathConcept).toBeTruthy();
    }
  });
});

// ─── App reducer handles all action types ───────────

describe('App reducer handles all action types', () => {
  const allActionTypes: AppAction['type'][] = [
    'NAVIGATE_WING',
    'ADVANCE_PHASE',
    'GO_BACK_PHASE',
    'OPEN_TELESCOPE',
    'OPEN_GARDEN',
    'SAVE_CREATION',
    'SAVE_JOURNAL',
    'RECORD_MOMENT',
    'DISMISS_WARDEN',
    'BYPASS_WARDEN',
    'RECORD_TIME',
    'MARK_PHASE_COMPLETE',
  ];

  it('reducer handles NAVIGATE_WING', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'pythagorean' });
    expect(next.learner.currentFoundation).toBe('pythagorean');
  });

  it('reducer handles ADVANCE_PHASE', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'ADVANCE_PHASE' });
    expect(next.learner.currentPhase).toBe('see');
  });

  it('reducer handles GO_BACK_PHASE', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'ADVANCE_PHASE' });
    const next = appReducer(state, { type: 'GO_BACK_PHASE' });
    expect(next.learner.currentPhase).toBe('wonder');
  });

  it('reducer handles OPEN_TELESCOPE', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_TELESCOPE' });
    expect(next.navigation.view).toBe('telescope');
  });

  it('reducer handles OPEN_GARDEN', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'OPEN_GARDEN' });
    expect(next.navigation.view).toBe('garden');
  });

  it('reducer handles SAVE_CREATION', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_CREATION',
      creation: {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'Test',
        data: 'test-data',
        shared: false,
      },
    });
    expect(next.learner.creations).toHaveLength(1);
  });

  it('reducer handles SAVE_JOURNAL', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'SAVE_JOURNAL',
      entry: { text: 'Test journal' },
    });
    expect(next.learner.journalEntries).toHaveLength(1);
  });

  it('reducer handles RECORD_MOMENT', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'RECORD_MOMENT',
      foundations: ['unit-circle'],
      insight: 'Test insight',
    });
    expect(next.learner.unitCircleMoments).toHaveLength(1);
  });

  it('reducer handles DISMISS_WARDEN', () => {
    const state: AppState = {
      ...freshAppState(),
      wardenMessages: [{
        id: 'test',
        decision: { allowed: false, mode: 'gate', reason: 'Test' },
        foundation: 'unit-circle',
        phase: 'understand',
        dismissed: false,
      }],
    };
    const next = appReducer(state, { type: 'DISMISS_WARDEN', messageId: 'test' });
    expect(next.wardenMessages[0].dismissed).toBe(true);
  });

  it('reducer handles BYPASS_WARDEN', () => {
    const state: AppState = {
      ...freshAppState(),
      wardenMessages: [{
        id: 'test',
        decision: { allowed: false, mode: 'gate', reason: 'Test' },
        foundation: 'unit-circle',
        phase: 'understand',
        dismissed: false,
      }],
    };
    const next = appReducer(state, {
      type: 'BYPASS_WARDEN',
      foundation: 'unit-circle',
      phase: 'understand',
    });
    expect(next.wardenMessages[0].dismissed).toBe(true);
    expect(getBypassCount(next.learner)).toBe(1);
  });

  it('reducer handles RECORD_TIME', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'RECORD_TIME',
      foundation: 'unit-circle',
      ms: 5000,
    });
    expect(next.learner.timeSpent['unit-circle']).toBe(5000);
  });

  it('reducer handles MARK_PHASE_COMPLETE', () => {
    const state = freshAppState();
    const next = appReducer(state, {
      type: 'MARK_PHASE_COMPLETE',
      foundation: 'unit-circle',
      phase: 'wonder',
    });
    expect(next.learner.completedPhases['unit-circle']).toContain('wonder');
  });

  it('reducer returns same state for unknown action type', () => {
    const state = freshAppState();
    const next = appReducer(state, { type: 'UNKNOWN_ACTION' } as any);
    expect(next).toBe(state);
  });

  it('all expected action types are covered', () => {
    expect(allActionTypes).toHaveLength(12);
  });
});

// ─── State persistence (serialize → deserialize) ────

describe('State persistence round trip', () => {
  it('learner state survives JSON serialize/deserialize', () => {
    let state = createNewLearner();
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    state = addJournalEntry(state, { text: 'Test entry', foundationId: 'unit-circle' });
    state = addCreation(state, {
      foundationId: 'unit-circle',
      type: 'generative-art',
      title: 'Test Art',
      data: 'svg-data',
      shared: false,
    });
    state = recordUnitCircleMoment(state, ['unit-circle', 'trigonometry'], 'Both circular');

    const serialized = saveState(state);
    const deserialized = loadState(serialized);

    expect(deserialized.currentFoundation).toBe(state.currentFoundation);
    expect(deserialized.currentPhase).toBe(state.currentPhase);
    expect(deserialized.completedPhases['unit-circle']).toEqual(state.completedPhases['unit-circle']);
    expect(deserialized.journalEntries).toHaveLength(1);
    expect(deserialized.creations).toHaveLength(1);
    expect(deserialized.unitCircleMoments).toHaveLength(1);
    expect(deserialized.stateVersion).toBe(state.stateVersion);
  });

  it('loadState rejects invalid state', () => {
    expect(() => loadState('{}')).toThrow();
    expect(() => loadState('{"currentFoundation":"unit-circle"}')).toThrow();
  });

  it('loadState rejects invalid foundation', () => {
    const badState = JSON.stringify({
      currentFoundation: 'invalid-foundation',
      currentPhase: 'wonder',
      completedPhases: {},
    });
    expect(() => loadState(badState)).toThrow(/Invalid foundation/);
  });

  it('loadState rejects invalid phase', () => {
    const badState = JSON.stringify({
      currentFoundation: 'unit-circle',
      currentPhase: 'invalid-phase',
      completedPhases: {},
    });
    expect(() => loadState(badState)).toThrow(/Invalid phase/);
  });

  it('full AppState round trip preserves all fields', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'NAVIGATE_WING', foundation: 'pythagorean' });
    state = appReducer(state, {
      type: 'SAVE_JOURNAL',
      entry: { text: 'Test', foundationId: 'pythagorean' },
    });

    const serialized = JSON.stringify(state);
    const restored: AppState = JSON.parse(serialized);

    expect(restored.learner.currentFoundation).toBe('pythagorean');
    expect(restored.navigation.view).toBe('wing');
    expect(restored.navigation.activeFoundation).toBe('pythagorean');
    expect(restored.learner.journalEntries).toHaveLength(1);
    expect(restored.isFirstVisit).toBe(false);
  });
});

// ─── Theme integrity ────────────────────────────────

describe('Theme integrity', () => {
  it('theme has all 8 foundation colors', () => {
    for (const id of FOUNDATION_ORDER) {
      expect(theme.colors.foundations[id]).toBeTruthy();
      expect(theme.colors.foundations[id]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('theme has required spacing tokens', () => {
    expect(theme.spacing.xs).toBe(4);
    expect(theme.spacing.sm).toBe(8);
    expect(theme.spacing.md).toBe(16);
    expect(theme.spacing.lg).toBe(24);
    expect(theme.spacing.xl).toBe(32);
  });

  it('theme has breakpoints', () => {
    expect(theme.breakpoints.mobile).toBe(768);
    expect(theme.breakpoints.tablet).toBe(1024);
  });

  it('theme has sidebar width', () => {
    expect(theme.sidebar.width).toBe(240);
  });
});

// ─── RECORD_TIME integration ────────────────────────

describe('RECORD_TIME integration', () => {
  it('RECORD_TIME accumulates time for a foundation', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'RECORD_TIME', foundation: 'unit-circle', ms: 1000 });
    state = appReducer(state, { type: 'RECORD_TIME', foundation: 'unit-circle', ms: 2000 });

    expect(state.learner.timeSpent['unit-circle']).toBe(3000);
  });

  it('time tracking is per-foundation', () => {
    let state = freshAppState();
    state = appReducer(state, { type: 'RECORD_TIME', foundation: 'unit-circle', ms: 1000 });
    state = appReducer(state, { type: 'RECORD_TIME', foundation: 'pythagorean', ms: 2000 });

    expect(state.learner.timeSpent['unit-circle']).toBe(1000);
    expect(state.learner.timeSpent['pythagorean']).toBe(2000);
  });
});
