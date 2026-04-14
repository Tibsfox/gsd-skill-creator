import { ANTI_CAPABILITY_PATTERNS, USE_WHEN_PATTERN } from '../../validation/description-quality.js';
import type { CritiqueStage, CritiqueFinding, SkillDraft } from '../types.js';

export function csoDescriptionStage(): CritiqueStage {
  return {
    name: 'cso-description',
    async run(draft: SkillDraft): Promise<CritiqueFinding[]> {
      const description = draft.metadata['description'];
      if (typeof description !== 'string' || description.length === 0) return [];

      const findings: CritiqueFinding[] = [];
      const matches: string[] = [];
      for (const pattern of ANTI_CAPABILITY_PATTERNS) {
        const globalPattern = new RegExp(pattern.source, 'gi');
        const m = description.match(globalPattern);
        if (m) matches.push(...m);
      }

      if (matches.length > 0) {
        const unique = [...new Set(matches.map(s => s.toLowerCase()))];
        findings.push({
          stage: 'cso-description',
          severity: 'warning',
          message: `Description uses ${matches.length} capability verb(s): ${unique.join(', ')}`,
          fixHint: `Rewrite description as "Use when [trigger context]..." — move capability statements to skill body`,
        });
      }

      return findings;
    },
  };
}
