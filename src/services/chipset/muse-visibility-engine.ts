/**
 * Visibility engine — determines when and how muses activate.
 *
 * Muses are invisible by default. Direct invocation ("ask Foxy")
 * routes explicitly. Multi-muse conflicts get named attribution.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { VisibilityRule, VisibilityContext, VisibilityDecision } from './muse-visibility.js';

export class VisibilityEngine {
  // Stub
  constructor(private rules: VisibilityRule[] = []) {}

  decide(_context: VisibilityContext): VisibilityDecision[] {
    throw new Error('Not implemented');
  }

  detectDirectInvocation(_input: string): MuseId | null {
    throw new Error('Not implemented');
  }

  static defaultRules(): VisibilityRule[] {
    throw new Error('Not implemented');
  }
}
