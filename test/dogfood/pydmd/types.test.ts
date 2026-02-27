import { describe, it, expect } from 'vitest';
import type {
  RepoManifest,
  KnowledgeGraph,
  AlgorithmVariant,
  DecisionNode,
  GeneratedSkill,
  ValidationReport,
  ClassNode,
  APIMethod,
  ModuleNode,
  Concept,
  Parameter,
  UsagePattern,
  Pitfall,
  TutorialSummary,
  Connection,
  TutorialReplayResult,
  ClaimVerification,
} from '../../../src/dogfood/pydmd/types.js';

// Also verify barrel re-exports work
import type {
  RepoManifest as BarrelRepoManifest,
  KnowledgeGraph as BarrelKnowledgeGraph,
} from '../../../src/dogfood/pydmd/index.js';

describe('PyDMD types', () => {
  describe('export completeness', () => {
    it('creates a valid RepoManifest', () => {
      const manifest: RepoManifest = {
        url: 'https://github.com/PyDMD/PyDMD',
        localPath: '/tmp/pydmd',
        language: 'python',
        buildSystem: 'pyproject.toml',
        pythonVersion: '>=3.9',
        dependencies: { core: ['numpy'], test: ['pytest'], dev: ['black'] },
        testFramework: 'pytest',
        healthCheck: { passed: 100, failed: 0, skipped: 5, errors: [] },
        structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
        entryPoints: ['pydmd/__init__.py'],
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(manifest.url).toBe('https://github.com/PyDMD/PyDMD');
      expect(manifest.language).toBe('python');
    });

    it('creates a valid KnowledgeGraph', () => {
      const graph: KnowledgeGraph = {
        project: { name: 'PyDMD', version: '1.0.0', description: 'DMD library', license: 'MIT' },
        architecture: {
          classHierarchy: [{ name: 'DMDBase', parent: null, module: 'pydmd.dmdbase', methods: ['fit'], isAbstract: true }],
          apiSurface: [{ class: 'DMD', name: 'fit', signature: 'fit(X)', returnType: 'self', docstring: 'Fit the model', isInherited: false }],
          moduleMap: [{ path: 'pydmd/dmd.py', classes: ['DMD'], imports: ['numpy'], linesOfCode: 200 }],
        },
        concepts: {
          mathematical: [{ name: 'SVD', category: 'linear-algebra', description: 'Singular Value Decomposition', relatedConcepts: ['eigendecomposition'], sourceFiles: ['pydmd/dmd.py'] }],
          algorithmic: [{ name: 'DMD', class: 'DMD', purpose: 'Standard DMD', distinguishing: ['basic'], parameters: [], mathBasis: 'SVD', tutorial: 1 }],
          domain: [{ name: 'fluid dynamics', category: 'physics', description: 'Flow analysis', relatedConcepts: ['turbulence'], sourceFiles: ['tutorials/'] }],
        },
        patterns: {
          usage: [{ name: 'fit-reconstruct', steps: ['fit', 'reconstruct'], codeExample: 'dmd.fit(X)', variants: ['DMD'] }],
          selection: [{ question: 'Is data noisy?', yes: 'BOP-DMD', no: 'DMD' }],
          pitfalls: [{ description: 'Wrong rank', symptom: 'Bad reconstruction', cause: 'Overfitting', solution: 'Use SVD truncation', affectsVariants: ['DMD'] }],
        },
        tutorials: [{ index: 1, title: 'Basic DMD', variant: 'DMD', dataType: 'time-series', keyInsight: 'Fit and reconstruct', codePatterns: ['fit-reconstruct'] }],
        crossReferences: {
          complexPlane: [{ from: 'eigenvalues', to: 'stability', relationship: 'determines', strength: 0.9 }],
          skillCreator: [{ from: 'DMD', to: 'pattern-detection', relationship: 'uses', strength: 0.7 }],
        },
      };
      expect(graph.project.name).toBe('PyDMD');
      expect(graph.architecture.classHierarchy).toHaveLength(1);
      expect(graph.concepts.mathematical).toHaveLength(1);
      expect(graph.concepts.algorithmic).toHaveLength(1);
      expect(graph.concepts.domain).toHaveLength(1);
      expect(graph.patterns.usage).toHaveLength(1);
      expect(graph.patterns.selection).toHaveLength(1);
      expect(graph.patterns.pitfalls).toHaveLength(1);
    });

    it('creates a valid AlgorithmVariant', () => {
      const variant: AlgorithmVariant = {
        name: 'DMD',
        class: 'DMD',
        purpose: 'Standard Dynamic Mode Decomposition',
        distinguishing: ['basic', 'foundational'],
        parameters: [{ name: 'svd_rank', type: 'int', default: '-1', description: 'Rank for SVD truncation' }],
        mathBasis: 'Singular Value Decomposition of snapshot matrices',
        tutorial: 1,
      };
      expect(variant.name).toBe('DMD');
      expect(variant.tutorial).toBe(1);
    });

    it('creates a valid DecisionNode with string leaves', () => {
      const leaf: DecisionNode = {
        question: 'Is data noisy?',
        yes: 'BOP-DMD',
        no: 'DMD',
      };
      expect(leaf.question).toBe('Is data noisy?');
      expect(leaf.yes).toBe('BOP-DMD');
      expect(leaf.no).toBe('DMD');
    });

    it('creates a valid GeneratedSkill', () => {
      const skill: GeneratedSkill = {
        skillMdPath: 'skills/pydmd-knowledge/SKILL.md',
        referencePaths: ['skills/pydmd-knowledge/references/api.md'],
        scriptPaths: ['skills/pydmd-knowledge/scripts/validate.py'],
        wordCount: 4500,
        decisionTree: { question: 'Noisy?', yes: 'BOP-DMD', no: 'DMD' },
        algorithmsCovered: ['DMD', 'BOP-DMD'],
        apiCoverage: 0.85,
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(skill.wordCount).toBeLessThan(5000);
      expect(skill.apiCoverage).toBeGreaterThanOrEqual(0);
      expect(skill.apiCoverage).toBeLessThanOrEqual(1);
    });

    it('creates a valid ValidationReport', () => {
      const report: ValidationReport = {
        skillPath: 'skills/pydmd-knowledge/SKILL.md',
        accuracyScore: 0.92,
        apiCoveragePercent: 85,
        decisionTreeAccuracy: 0.9,
        tutorialReplayScores: [{
          tutorialIndex: 1,
          title: 'Basic DMD',
          reproductionScore: 0.95,
          missedSteps: [],
          incorrectGuidance: [],
        }],
        claimVerifications: [{
          claim: 'DMD uses SVD',
          source: 'pydmd/dmd.py:42',
          verified: true,
          notes: 'Confirmed in fit() method',
        }],
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(report.accuracyScore).toBeGreaterThanOrEqual(0);
      expect(report.accuracyScore).toBeLessThanOrEqual(1);
    });

    it('creates valid TutorialReplayResult and ClaimVerification', () => {
      const replay: TutorialReplayResult = {
        tutorialIndex: 3,
        title: 'BOPDMD Tutorial',
        reproductionScore: 0.88,
        missedSteps: ['normalize data'],
        incorrectGuidance: [],
      };
      expect(replay.tutorialIndex).toBe(3);
      expect(replay.missedSteps).toHaveLength(1);

      const claim: ClaimVerification = {
        claim: 'BOPDMD handles noise',
        source: 'pydmd/bopdmd.py:10',
        verified: true,
        notes: 'Uses bagging',
      };
      expect(claim.verified).toBe(true);
    });
  });

  describe('RepoManifest field constraints', () => {
    it('language field only accepts "python"', () => {
      const manifest: RepoManifest = {
        url: 'https://github.com/PyDMD/PyDMD',
        localPath: '/tmp/pydmd',
        language: 'python',
        buildSystem: 'pyproject.toml',
        pythonVersion: '>=3.9',
        dependencies: { core: [], test: [], dev: [] },
        testFramework: 'pytest',
        healthCheck: { passed: 0, failed: 0, skipped: 0, errors: [] },
        structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
        entryPoints: [],
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(manifest.language).toBe('python');
    });

    it('buildSystem accepts all three values', () => {
      const systems: RepoManifest['buildSystem'][] = ['pyproject.toml', 'setup.py', 'setup.cfg'];
      expect(systems).toHaveLength(3);
      systems.forEach(s => expect(typeof s).toBe('string'));
    });

    it('testFramework accepts all three values', () => {
      const frameworks: RepoManifest['testFramework'][] = ['pytest', 'unittest', 'nose'];
      expect(frameworks).toHaveLength(3);
      frameworks.forEach(f => expect(typeof f).toBe('string'));
    });

    it('healthCheck has all four fields', () => {
      const hc: RepoManifest['healthCheck'] = { passed: 100, failed: 2, skipped: 5, errors: ['timeout'] };
      expect(hc.passed).toBe(100);
      expect(hc.failed).toBe(2);
      expect(hc.skipped).toBe(5);
      expect(hc.errors).toHaveLength(1);
    });
  });

  describe('DecisionNode recursion', () => {
    it('supports leaf node with string branches', () => {
      const leaf: DecisionNode = { question: 'Simple data?', yes: 'DMD', no: 'BOP-DMD' };
      expect(typeof leaf.yes).toBe('string');
      expect(typeof leaf.no).toBe('string');
    });

    it('supports nested DecisionNode as yes branch', () => {
      const nested: DecisionNode = {
        question: 'Is data noisy?',
        yes: { question: 'Multi-scale?', yes: 'MrDMD', no: 'BOP-DMD' },
        no: 'DMD',
      };
      expect(typeof nested.yes).toBe('object');
      expect((nested.yes as DecisionNode).question).toBe('Multi-scale?');
    });

    it('supports deeply nested tree (3 levels)', () => {
      const deep: DecisionNode = {
        question: 'Level 1?',
        yes: {
          question: 'Level 2?',
          yes: { question: 'Level 3?', yes: 'A', no: 'B' },
          no: 'C',
        },
        no: 'D',
      };
      const level2 = deep.yes as DecisionNode;
      const level3 = level2.yes as DecisionNode;
      expect(level3.question).toBe('Level 3?');
      expect(level3.yes).toBe('A');
      expect(level3.no).toBe('B');
    });
  });

  describe('KnowledgeGraph completeness', () => {
    it('has all 6 top-level fields', () => {
      const keys: (keyof KnowledgeGraph)[] = ['project', 'architecture', 'concepts', 'patterns', 'tutorials', 'crossReferences'];
      expect(keys).toHaveLength(6);
    });

    it('concepts has all 3 sub-fields', () => {
      const keys: (keyof KnowledgeGraph['concepts'])[] = ['mathematical', 'algorithmic', 'domain'];
      expect(keys).toHaveLength(3);
    });

    it('patterns has all 3 sub-fields', () => {
      const keys: (keyof KnowledgeGraph['patterns'])[] = ['usage', 'selection', 'pitfalls'];
      expect(keys).toHaveLength(3);
    });
  });

  describe('GeneratedSkill constraints', () => {
    it('wordCount is a number and can be less than 5000', () => {
      const skill: GeneratedSkill = {
        skillMdPath: 'skills/pydmd-knowledge/SKILL.md',
        referencePaths: [],
        scriptPaths: [],
        wordCount: 3500,
        decisionTree: { question: 'Q?', yes: 'A', no: 'B' },
        algorithmsCovered: ['DMD'],
        apiCoverage: 0.5,
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(typeof skill.wordCount).toBe('number');
      expect(skill.wordCount).toBeLessThan(5000);
    });

    it('apiCoverage is a number between 0 and 1', () => {
      const skill: GeneratedSkill = {
        skillMdPath: 'skills/pydmd-knowledge/SKILL.md',
        referencePaths: [],
        scriptPaths: [],
        wordCount: 2000,
        decisionTree: { question: 'Q?', yes: 'A', no: 'B' },
        algorithmsCovered: ['DMD'],
        apiCoverage: 0.75,
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(skill.apiCoverage).toBeGreaterThanOrEqual(0);
      expect(skill.apiCoverage).toBeLessThanOrEqual(1);
    });
  });

  describe('barrel re-exports', () => {
    it('types are accessible via barrel index', () => {
      // This test verifies the barrel file re-exports types correctly.
      // If the barrel doesn't exist or doesn't export these types, the import above will fail.
      const manifest: BarrelRepoManifest = {
        url: 'https://github.com/PyDMD/PyDMD',
        localPath: '/tmp/pydmd',
        language: 'python',
        buildSystem: 'pyproject.toml',
        pythonVersion: '>=3.9',
        dependencies: { core: [], test: [], dev: [] },
        testFramework: 'pytest',
        healthCheck: { passed: 0, failed: 0, skipped: 0, errors: [] },
        structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
        entryPoints: [],
        timestamp: '2026-02-27T00:00:00Z',
      };
      expect(manifest.url).toBe('https://github.com/PyDMD/PyDMD');
    });
  });
});
