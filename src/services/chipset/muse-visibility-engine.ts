/**
 * Visibility engine — determines when and how muses activate.
 *
 * Muses are invisible by default. Direct invocation ("ask Foxy")
 * routes explicitly. Multi-muse conflicts get named attribution.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { VisibilityRule, VisibilityContext, VisibilityDecision, VisibilityLevel } from './muse-visibility.js';

const MUSE_NAMES: readonly string[] = ['foxy', 'lex', 'hemlock', 'sam', 'cedar', 'willow'];

const INVOCATION_PATTERNS = [
  /\bask\s+(foxy|lex|hemlock|sam|cedar|willow)\b/i,
  /\binvoke\s+(foxy|lex|hemlock|sam|cedar|willow)\b/i,
  /\bwhat\s+would\s+(foxy|lex|hemlock|sam|cedar|willow)\s+(say|think|suggest|recommend)\b/i,
];

export class VisibilityEngine {
  constructor(private rules: VisibilityRule[] = []) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  detectDirectInvocation(input: string): MuseId | null {
    for (const pattern of INVOCATION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const name = match[1].toLowerCase();
        if (MUSE_NAMES.includes(name)) return name as MuseId;
      }
    }
    return null;
  }

  decide(context: VisibilityContext): VisibilityDecision[] {
    if (context.activeMuses.length === 0) return [];

    const directMuse = this.detectDirectInvocation(context.userInput);
    const decisions: VisibilityDecision[] = [];

    for (const activation of context.activeMuses) {
      let level: VisibilityLevel = 'invisible';
      let reason = 'default invisible';

      if (directMuse === activation.museId) {
        level = 'direct-invocation';
        reason = `direct invocation: "${context.userInput}"`;
      } else {
        for (const rule of this.rules) {
          if (rule.condition(context)) {
            level = rule.level;
            reason = `rule priority ${rule.priority}`;
            break;
          }
        }
      }

      decisions.push({ museId: activation.museId, level, reason });
    }

    return decisions;
  }

  static defaultRules(): VisibilityRule[] {
    return [
      {
        priority: 100,
        level: 'direct-invocation' as const,
        condition: (ctx) => {
          const engine = new VisibilityEngine();
          return engine.detectDirectInvocation(ctx.userInput) !== null;
        },
      },
      {
        priority: 80,
        level: 'named' as const,
        condition: (ctx) => {
          const highScorers = ctx.activeMuses.filter(m => m.score > 0.7);
          return highScorers.length >= 2;
        },
      },
      {
        priority: 50,
        level: 'invisible' as const,
        condition: (ctx) => {
          if (ctx.activeMuses.length < 1) return false;
          const sorted = [...ctx.activeMuses].sort((a, b) => b.score - a.score);
          return sorted[0].score > 0.6 && (sorted.length < 2 || sorted[1].score < 0.4);
        },
      },
      {
        priority: 30,
        level: 'invisible' as const,
        condition: (ctx) => ctx.activeMuses.every(m => m.score < 0.3),
      },
      {
        priority: 10,
        level: 'invisible' as const,
        condition: () => true,
      },
    ];
  }
}
