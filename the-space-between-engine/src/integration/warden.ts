/**
 * Wonder Warden
 *
 * Governs phase access within each wing. The Warden enforces
 * a gentle ordering: wonder before seeing, seeing before touching,
 * all three before formal understanding. But inter-wing navigation
 * is NEVER gated — the Warden only enforces phase ordering WITHIN
 * a single foundation wing.
 *
 * The Warden is warm and non-punitive. Soft gates annotate rather
 * than block. Hard gates on the "understand" phase protect learners
 * from formal notation before they have the experiential foundation.
 */

import type { FoundationId, PhaseType, LearnerState, WardenDecision, WardenMode } from '@/types';
import { PHASE_ORDER } from '@/types';

// ─── Warden Rules Matrix ─────────────────────────────

interface WardenRule {
  phase: PhaseType;
  requires: PhaseType[];
  requireAll: boolean;
  mode: WardenMode;
  message: string;
}

const WARDEN_RULES: WardenRule[] = [
  {
    phase: 'wonder',
    requires: [],
    requireAll: false,
    mode: 'annotate',
    message: '',
  },
  {
    phase: 'see',
    requires: ['wonder'],
    requireAll: false,
    mode: 'annotate',
    message: 'Have you explored the story? The wonder comes first.',
  },
  {
    phase: 'touch',
    requires: ['see'],
    requireAll: false,
    mode: 'annotate',
    message: 'The pattern is best understood visually first.',
  },
  {
    phase: 'understand',
    requires: ['wonder', 'see', 'touch'],
    requireAll: true,
    mode: 'gate',
    message: 'Formal notation builds on what your hands already know. Complete the earlier phases first.',
  },
  {
    phase: 'connect',
    requires: ['understand'],
    requireAll: false,
    mode: 'annotate',
    message: 'Connections are richer after understanding the mathematics.',
  },
  {
    phase: 'create',
    requires: ['touch'],
    requireAll: false,
    mode: 'annotate',
    message: 'Creating is most fun after you have explored.',
  },
];

function getRule(phase: PhaseType): WardenRule {
  const rule = WARDEN_RULES.find((r) => r.phase === phase);
  if (!rule) {
    throw new Error(`No warden rule for phase: ${phase}`);
  }
  return rule;
}

// ─── Public API ──────────────────────────────────────

/**
 * Check whether a learner can access a specific phase within a foundation.
 *
 * Returns a WardenDecision with:
 * - allowed: true if access is granted
 * - mode: 'annotate' (soft suggestion) or 'gate' (hard block)
 * - reason: human-readable, warm explanation
 * - suggestion: what to do instead (if blocked)
 */
export function checkAccess(
  state: LearnerState,
  foundation: FoundationId,
  phase: PhaseType,
): WardenDecision {
  const rule = getRule(phase);

  // Wonder is always allowed
  if (rule.requires.length === 0) {
    return { allowed: true, mode: 'annotate', reason: 'Welcome.' };
  }

  const completed = state.completedPhases[foundation] ?? [];
  const missingPrereqs = rule.requires.filter((req) => !completed.includes(req));

  // All prereqs met
  if (missingPrereqs.length === 0) {
    return { allowed: true, mode: rule.mode, reason: 'All prerequisites are met.' };
  }

  // Gate mode: block access
  if (rule.mode === 'gate') {
    const missingNames = missingPrereqs.join(', ');
    return {
      allowed: false,
      mode: 'gate',
      reason: rule.message,
      suggestion: `Try the ${missingNames} phase${missingPrereqs.length > 1 ? 's' : ''} first — they will make this phase much more meaningful.`,
    };
  }

  // Annotate mode: allow but suggest
  return {
    allowed: true,
    mode: 'annotate',
    reason: rule.message,
    suggestion: `Consider exploring the ${missingPrereqs[0]} phase first.`,
  };
}

/**
 * Get the Warden mode for a given phase type.
 */
export function getMode(foundation: FoundationId, phase: PhaseType): WardenMode {
  // foundation parameter is accepted for API consistency but
  // mode depends only on the phase type
  void foundation;
  return getRule(phase).mode;
}

/**
 * Check if a learner has completed the Wonder phase for a foundation.
 */
export function isWonderComplete(state: LearnerState, foundation: FoundationId): boolean {
  return (state.completedPhases[foundation] ?? []).includes('wonder');
}

/**
 * Check if a learner has completed the See phase for a foundation.
 */
export function isSeeComplete(state: LearnerState, foundation: FoundationId): boolean {
  return (state.completedPhases[foundation] ?? []).includes('see');
}

/**
 * Check if a learner has completed the Touch phase for a foundation.
 */
export function isTouchComplete(state: LearnerState, foundation: FoundationId): boolean {
  return (state.completedPhases[foundation] ?? []).includes('touch');
}

/**
 * Record that a learner bypassed the Warden's suggestion for a phase.
 *
 * Returns new state with the bypass recorded. Does NOT change
 * current position or completed phases.
 */
export function recordBypass(
  state: LearnerState,
  foundation: FoundationId,
  phase: PhaseType,
): LearnerState {
  const key = `${foundation}:${phase}`;
  const next: LearnerState = JSON.parse(JSON.stringify(state));
  next.bypasses = { ...next.bypasses };
  next.bypasses[key] = (next.bypasses[key] ?? 0) + 1;
  next.stateVersion += 1;
  return next;
}

/**
 * Get total number of bypasses a learner has recorded.
 */
export function getBypassCount(state: LearnerState): number {
  let total = 0;
  for (const key of Object.keys(state.bypasses)) {
    total += state.bypasses[key] ?? 0;
  }
  return total;
}
