/**
 * LimitationRegistry -- per-capability-class known failure modes.
 *
 * Stores known limitations for each capability class and provides
 * keyword-based failure matching to detect when a test failure is
 * caused by a known model limitation rather than a genuine skill defect.
 *
 * CAL-04: Per-capability improvement hints via limitation matching.
 */

import type { CapabilityClass } from './capability-classifier.js';

// ============================================================================
// Keyword sets per limitation
// ============================================================================

interface LimitationDef {
  name: string;
  keywords: string[];
}

const LIMITATION_DEFS: Record<string, LimitationDef> = {
  'json-formatting': {
    name: 'json-formatting',
    keywords: ['json', 'parse', 'format', 'syntax error', 'invalid json'],
  },
  'context-overflow': {
    name: 'context-overflow',
    keywords: ['truncated', 'context', 'too long', 'exceeded', 'overflow'],
  },
  'multi-step-reasoning': {
    name: 'multi-step-reasoning',
    keywords: ['step', 'chain', 'reasoning', 'follow', 'sequence'],
  },
  'instruction-following': {
    name: 'instruction-following',
    keywords: ['instruction', 'directive', 'constraint', 'requirement'],
  },
  'code-generation': {
    name: 'code-generation',
    keywords: ['code', 'syntax', 'compile', 'function', 'generate'],
  },
  'complex-json': {
    name: 'complex-json',
    keywords: ['complex', 'json', 'nested', 'schema', 'structured'],
  },
  'long-context-recall': {
    name: 'long-context-recall',
    keywords: ['recall', 'long', 'context', 'remember', 'earlier'],
  },
  'multi-tool-orchestration': {
    name: 'multi-tool-orchestration',
    keywords: ['tool', 'orchestrat', 'multi', 'chain', 'parallel'],
  },
  'subtle-instruction-nuance': {
    name: 'subtle-instruction-nuance',
    keywords: ['subtle', 'nuance', 'implicit', 'ambiguous', 'infer'],
  },
  'cross-document-reasoning': {
    name: 'cross-document-reasoning',
    keywords: ['cross', 'document', 'reference', 'multi-source', 'combine'],
  },
};

// ============================================================================
// Default limitations per capability class
// ============================================================================

const DEFAULT_LIMITATIONS: Record<CapabilityClass, string[]> = {
  small: ['json-formatting', 'context-overflow', 'multi-step-reasoning', 'instruction-following', 'code-generation'],
  medium: ['complex-json', 'long-context-recall', 'multi-tool-orchestration'],
  large: ['subtle-instruction-nuance', 'cross-document-reasoning'],
  cloud: [],
};

// ============================================================================
// Match result
// ============================================================================

export interface LimitationMatchResult {
  matched: boolean;
  limitation?: string;
  confidence: number;
}

// ============================================================================
// LimitationRegistry
// ============================================================================

export class LimitationRegistry {
  private readonly registry: Map<CapabilityClass, string[]>;

  constructor() {
    this.registry = new Map();
    for (const [cls, lims] of Object.entries(DEFAULT_LIMITATIONS)) {
      this.registry.set(cls as CapabilityClass, [...lims]);
    }
  }

  /** Returns known limitations for a capability class. */
  getLimitations(capabilityClass: CapabilityClass): string[] {
    return this.registry.get(capabilityClass) ?? [];
  }

  /**
   * Match a failure description against known limitations for a capability class.
   * Uses case-insensitive keyword overlap.
   */
  matchFailure(
    failureDescription: string,
    capabilityClass: CapabilityClass,
  ): LimitationMatchResult {
    const limitations = this.getLimitations(capabilityClass);
    if (limitations.length === 0) {
      return { matched: false, confidence: 0 };
    }

    const lower = failureDescription.toLowerCase();
    let bestLimitation: string | undefined;
    let bestConfidence = 0;

    for (const limName of limitations) {
      const def = LIMITATION_DEFS[limName];
      if (!def) continue;

      const matchedCount = def.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
      const confidence = matchedCount / def.keywords.length;

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestLimitation = limName;
      }
    }

    if (bestConfidence > 0 && bestLimitation) {
      return { matched: true, limitation: bestLimitation, confidence: bestConfidence };
    }

    return { matched: false, confidence: 0 };
  }

  /** Add a limitation to a capability class. */
  addLimitation(capabilityClass: CapabilityClass, limitation: string): void {
    const lims = this.registry.get(capabilityClass);
    if (lims && !lims.includes(limitation)) {
      lims.push(limitation);
    }
  }

  /** Remove a limitation from a capability class. */
  removeLimitation(capabilityClass: CapabilityClass, limitation: string): void {
    const lims = this.registry.get(capabilityClass);
    if (lims) {
      const idx = lims.indexOf(limitation);
      if (idx >= 0) lims.splice(idx, 1);
    }
  }
}
