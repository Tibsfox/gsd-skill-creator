import type { SkillMetadata } from '../types/skill.js';
import type { Section } from './content-analyzer.js';

export interface ReferenceFile {
  filename: string; // e.g., 'guidelines.md'
  content: string;
  wordCount: number;
}

export interface ScriptFile {
  filename: string; // e.g., 'setup.sh'
  content: string;
  executable: boolean;
}

export interface DecomposedSkill {
  decomposed: boolean;
  skillMd: string; // Compact SKILL.md content
  references: ReferenceFile[];
  scripts: ScriptFile[];
  warnings: string[];
}

export class ContentDecomposer {
  decompose(
    _name: string,
    _metadata: SkillMetadata,
    _body: string,
  ): DecomposedSkill {
    throw new Error('not implemented');
  }

  generateSkillMd(
    _name: string,
    _metadata: SkillMetadata,
    _sections: Section[],
    _references: ReferenceFile[],
    _scripts: ScriptFile[],
  ): string {
    throw new Error('not implemented');
  }
}
