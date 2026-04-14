import { validateTriggeringTestFile } from '../../validation/triggering-validation.js';
import type { CritiqueStage, CritiqueFinding, SkillDraft } from '../types.js';

export function triggeringStructureStage(): CritiqueStage {
  return {
    name: 'triggering-structure',
    async run(draft: SkillDraft): Promise<CritiqueFinding[]> {
      const content = draft.files.get('triggering.test.md');
      if (content === undefined) {
        return [{
          stage: 'triggering-structure',
          severity: 'warning',
          message: 'triggering.test.md is missing',
          fixHint: 'Create triggering.test.md with sections: Naive Prompt, Expected Baseline Failure, Expected Skill Activation, Rationalization Table (>=3 rows)',
        }];
      }
      const result = validateTriggeringTestFile(content);
      return result.errors.map(msg => ({
        stage: 'triggering-structure',
        severity: 'error' as const,
        message: msg,
        location: { file: 'triggering.test.md' },
      }));
    },
  };
}
