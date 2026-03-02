import { describe, it, expect } from 'vitest';
import { SkillGenerator } from './skill-generator.js';
import { SkillStore } from '../storage/skill-store.js';
import type { SkillCandidate } from '../types/detection.js';

// Minimal SkillStore for testing (only needs constructor path)
const store = new SkillStore('/tmp/test-skills');
const generator = new SkillGenerator(store);

// --- Test Fixtures ---

const richCommandCandidate: SkillCandidate = {
  id: 'cmd-git-commit',
  type: 'command',
  pattern: 'git commit',
  occurrences: 15,
  confidence: 0.85,
  suggestedName: 'git-commit-workflow',
  suggestedDescription: 'Automates git commit workflows with conventional commit messages',
  evidence: {
    firstSeen: Date.now() - 30 * 24 * 60 * 60 * 1000, // @justification Type 7: test fixture timestamp offset (30 days)
    lastSeen: Date.now(),
    sessionIds: ['s1', 's2', 's3', 's4', 's5'],
    coOccurringFiles: ['src/index.ts', 'package.json', 'tsconfig.json'],
    coOccurringTools: ['Bash', 'Read', 'Grep'],
  },
};

const sparseCandidate: SkillCandidate = {
  id: 'cmd-deploy',
  type: 'command',
  pattern: 'deploy',
  occurrences: 3,
  confidence: 0.5,
  suggestedName: 'deploy-workflow',
  suggestedDescription: 'Deploy workflow pattern',
  evidence: {
    firstSeen: Date.now() - 7 * 24 * 60 * 60 * 1000, // @justification Type 7: test fixture timestamp offset (7 days)
    lastSeen: Date.now(),
    sessionIds: ['s1'],
    coOccurringFiles: [],
    coOccurringTools: [],
  },
};

const fileCandidate: SkillCandidate = {
  id: 'file-tsconfig',
  type: 'file',
  pattern: 'tsconfig.json',
  occurrences: 10,
  confidence: 0.7,
  suggestedName: 'tsconfig-management',
  suggestedDescription: 'TypeScript configuration management',
  evidence: {
    firstSeen: Date.now() - 14 * 24 * 60 * 60 * 1000, // @justification Type 7: test fixture timestamp offset (14 days)
    lastSeen: Date.now(),
    sessionIds: ['s1', 's2', 's3'],
    coOccurringFiles: ['package.json', 'vite.config.ts'],
    coOccurringTools: ['Read', 'Edit'],
  },
};

const toolCandidate: SkillCandidate = {
  id: 'tool-grep',
  type: 'tool',
  pattern: 'Grep',
  occurrences: 20,
  confidence: 0.9,
  suggestedName: 'grep-patterns',
  suggestedDescription: 'Common grep usage patterns',
  evidence: {
    firstSeen: Date.now() - 60 * 24 * 60 * 60 * 1000, // @justification Type 7: test fixture timestamp offset (60 days)
    lastSeen: Date.now(),
    sessionIds: ['s1', 's2', 's3', 's4'],
    coOccurringFiles: ['src/utils.ts'],
    coOccurringTools: ['Read', 'Bash'],
  },
};

const workflowCandidate: SkillCandidate = {
  id: 'wf-test-debug',
  type: 'workflow',
  pattern: 'test-and-debug',
  occurrences: 12,
  confidence: 0.75,
  suggestedName: 'test-debug-workflow',
  suggestedDescription: 'Test and debug workflow combining multiple tools',
  evidence: {
    firstSeen: Date.now() - 21 * 24 * 60 * 60 * 1000, // @justification Type 7: test fixture timestamp offset (21 days)
    lastSeen: Date.now(),
    sessionIds: ['s1', 's2', 's3'],
    coOccurringFiles: ['src/main.ts', 'test/main.test.ts'],
    coOccurringTools: ['Bash', 'Grep', 'Read'],
  },
};

describe('SkillGenerator', () => {
  describe('generateBody - TODO-free output', () => {
    it('should not contain <!-- TODO: strings for command candidate with rich evidence', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).not.toContain('<!-- TODO:');
    });

    it('should not contain [Add step placeholder strings for command candidate', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).not.toContain('[Add step');
    });

    it('should include co-occurring tools from evidence when present', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).toContain('Bash');
    });

    it('should include co-occurring file names from evidence when present', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).toContain('index.ts');
    });

    it('should include session count from evidence', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).toContain('5');
    });

    it('should produce valid content with empty coOccurringFiles/Tools (no empty bullets)', () => {
      const scaffold = generator.generateScaffold(sparseCandidate);
      expect(scaffold.body).not.toContain('<!-- TODO:');
      expect(scaffold.body).not.toContain('[Add step');
      // Should not have empty bullet lines like "- Common files: " or "- Use  for"
      expect(scaffold.body).not.toMatch(/- (?:Common files|Use)\s*:\s*$/m);
    });

    it('should produce file-relevant guidelines for file type candidate', () => {
      const scaffold = generator.generateScaffold(fileCandidate);
      expect(scaffold.body).not.toContain('<!-- TODO:');
      expect(scaffold.body).not.toContain('[Add step');
      expect(scaffold.body).toContain('tsconfig.json');
    });

    it('should produce tool-relevant guidelines for tool type candidate', () => {
      const scaffold = generator.generateScaffold(toolCandidate);
      expect(scaffold.body).not.toContain('<!-- TODO:');
      expect(scaffold.body).not.toContain('[Add step');
      expect(scaffold.body).toContain('Grep');
    });

    it('should include both file and tool evidence for workflow type candidate', () => {
      const scaffold = generator.generateScaffold(workflowCandidate);
      expect(scaffold.body).not.toContain('<!-- TODO:');
      expect(scaffold.body).not.toContain('[Add step');
      // Should include both file and tool evidence
      expect(scaffold.body).toContain('main.ts');
      expect(scaffold.body).toContain('Bash');
    });

    it('should produce no TODO markers in generateScaffold() end-to-end output', () => {
      const scaffold = generator.generateScaffold(richCommandCandidate);
      expect(scaffold.body).not.toContain('TODO');
      expect(scaffold.body).not.toContain('[Add step');
      expect(scaffold.body).not.toContain('[Add ');
    });
  });

  describe('formatEvidence', () => {
    it('should format rich evidence with all fields', () => {
      const formatted = generator.formatEvidence(richCommandCandidate.evidence);
      expect(formatted).toContain('5 occurrences');
      expect(formatted).toContain('index.ts');
      expect(formatted).toContain('Bash');
    });

    it('should format sparse evidence without empty sections', () => {
      const formatted = generator.formatEvidence(sparseCandidate.evidence);
      expect(formatted).toContain('1 occurrences');
      expect(formatted).not.toContain('Common files:');
      expect(formatted).not.toContain('Common tools:');
    });
  });
});
