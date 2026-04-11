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

describe('PyDMD types', () => {
  describe('export completeness', () => {
    it('should create a conforming RepoManifest', () => {
      const manifest: RepoManifest = {
        url: 'https://github.com/PyDMD/PyDMD',
        localPath: '/tmp/pydmd',
        language: 'python',
        buildSystem: 'pyproject.toml',
        pythonVersion: '3.11',
        dependencies: { core: ['numpy'], test: ['pytest'], dev: ['black'] },
        testFramework: 'pytest',
        healthCheck: { passed: 100, failed: 0, skipped: 2, errors: [] },
        structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
        entryPoints: ['pydmd/__init__.py'],
        timestamp: new Date().toISOString(),
      };
      expect(manifest.language).toBe('python');
      expect(manifest.url).toContain('PyDMD');
    });

    it('should create a conforming KnowledgeGraph', () => {
      const kg: KnowledgeGraph = {
        project: { name: 'PyDMD', version: '1.0', description: 'DMD lib', license: 'MIT' },
        architecture: { classHierarchy: [], apiSurface: [], moduleMap: [] },
        concepts: { mathematical: [], algorithmic: [], domain: [] },
        patterns: { usage: [], selection: [], pitfalls: [] },
        tutorials: [],
        crossReferences: { complexPlane: [], skillCreator: [] },
      };
      expect(kg.project.name).toBe('PyDMD');
      expect(kg.concepts).toHaveProperty('mathematical');
      expect(kg.concepts).toHaveProperty('algorithmic');
      expect(kg.concepts).toHaveProperty('domain');
    });

    it('should create a conforming AlgorithmVariant', () => {
      const variant: AlgorithmVariant = {
        name: 'DMD',
        class: 'DMD',
        purpose: 'Standard decomposition',
        distinguishing: ['baseline'],
        parameters: [{ name: 'svd_rank', type: 'int', default: '-1', description: 'SVD truncation rank' }],
        mathBasis: 'SVD-based linear operator approximation',
        tutorial: 1,
      };
      expect(variant.name).toBe('DMD');
      expect(variant.tutorial).toBe(1);
    });

    it('should create a conforming GeneratedSkill', () => {
      const skill: GeneratedSkill = {
        skillMdPath: '.claude/skills/pydmd/SKILL.md',
        referencePaths: ['references/algorithms.md'],
        scriptPaths: ['scripts/install.py'],
        wordCount: 3500,
        decisionTree: { question: 'Is data noisy?', yes: 'BOP-DMD', no: 'DMD' },
        algorithmsCovered: ['DMD', 'BOP-DMD'],
        apiCoverage: 0.85,
        timestamp: new Date().toISOString(),
      };
      expect(skill.wordCount).toBeLessThan(5000);
      expect(skill.apiCoverage).toBeGreaterThanOrEqual(0);
      expect(skill.apiCoverage).toBeLessThanOrEqual(1);
    });

    it('should create a conforming ValidationReport', () => {
      const report: ValidationReport = {
        skillPath: '.claude/skills/pydmd/SKILL.md',
        accuracyScore: 0.92,
        apiCoveragePercent: 85,
        decisionTreeAccuracy: 0.9,
        tutorialReplayScores: [{
          tutorialIndex: 1,
          title: 'Getting started',
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
        timestamp: new Date().toISOString(),
      };
      expect(report.accuracyScore).toBeGreaterThan(0);
      expect(report.tutorialReplayScores).toHaveLength(1);
      expect(report.claimVerifications).toHaveLength(1);
    });
  });

  describe('RepoManifest field constraints', () => {
    it('should restrict language to "python"', () => {
      const manifest: RepoManifest = {
        url: '', localPath: '', language: 'python',
        buildSystem: 'pyproject.toml', pythonVersion: '3.11',
        dependencies: { core: [], test: [], dev: [] },
        testFramework: 'pytest',
        healthCheck: { passed: 0, failed: 0, skipped: 0, errors: [] },
        structure: { sourceDir: '', testDir: '', tutorialDir: '', docsDir: '' },
        entryPoints: [], timestamp: '',
      };
      expect(manifest.language).toBe('python');
    });

    it('should accept all three buildSystem values', () => {
      const systems: RepoManifest['buildSystem'][] = ['pyproject.toml', 'setup.py', 'setup.cfg'];
      expect(systems).toHaveLength(3);
      systems.forEach(s => expect(typeof s).toBe('string'));
    });

    it('should accept all three testFramework values', () => {
      const frameworks: RepoManifest['testFramework'][] = ['pytest', 'unittest', 'nose'];
      expect(frameworks).toHaveLength(3);
      frameworks.forEach(f => expect(typeof f).toBe('string'));
    });

    it('should have all four healthCheck fields', () => {
      const hc: RepoManifest['healthCheck'] = { passed: 10, failed: 2, skipped: 1, errors: ['timeout'] };
      expect(hc).toHaveProperty('passed');
      expect(hc).toHaveProperty('failed');
      expect(hc).toHaveProperty('skipped');
      expect(hc).toHaveProperty('errors');
      expect(Array.isArray(hc.errors)).toBe(true);
    });
  });

  describe('DecisionNode recursion', () => {
    it('should support leaf nodes with string branches', () => {
      const leaf: DecisionNode = { question: 'Is data noisy?', yes: 'BOP-DMD', no: 'DMD' };
      expect(typeof leaf.yes).toBe('string');
      expect(typeof leaf.no).toBe('string');
    });

    it('should support nested DecisionNode in yes branch', () => {
      const nested: DecisionNode = {
        question: 'Is data noisy?',
        yes: { question: 'High dimensional?', yes: 'CDMD', no: 'BOP-DMD' },
        no: 'DMD',
      };
      expect(typeof nested.yes).toBe('object');
      expect((nested.yes as DecisionNode).question).toBe('High dimensional?');
    });

    it('should support 3 levels of nesting', () => {
      const deep: DecisionNode = {
        question: 'L1?',
        yes: {
          question: 'L2?',
          yes: { question: 'L3?', yes: 'A', no: 'B' },
          no: 'C',
        },
        no: 'D',
      };
      const l2 = deep.yes as DecisionNode;
      const l3 = l2.yes as DecisionNode;
      expect(l3.question).toBe('L3?');
      expect(l3.yes).toBe('A');
      expect(l3.no).toBe('B');
    });
  });

  describe('KnowledgeGraph completeness', () => {
    it('should have all 6 top-level fields', () => {
      const kg: KnowledgeGraph = {
        project: { name: '', version: '', description: '', license: '' },
        architecture: { classHierarchy: [], apiSurface: [], moduleMap: [] },
        concepts: { mathematical: [], algorithmic: [], domain: [] },
        patterns: { usage: [], selection: [], pitfalls: [] },
        tutorials: [],
        crossReferences: { complexPlane: [], skillCreator: [] },
      };
      const keys = Object.keys(kg);
      expect(keys).toContain('project');
      expect(keys).toContain('architecture');
      expect(keys).toContain('concepts');
      expect(keys).toContain('patterns');
      expect(keys).toContain('tutorials');
      expect(keys).toContain('crossReferences');
    });

    it('should have all 3 concept sub-fields', () => {
      const concepts: KnowledgeGraph['concepts'] = { mathematical: [], algorithmic: [], domain: [] };
      expect(concepts).toHaveProperty('mathematical');
      expect(concepts).toHaveProperty('algorithmic');
      expect(concepts).toHaveProperty('domain');
    });

    it('should have all 3 pattern sub-fields', () => {
      const patterns: KnowledgeGraph['patterns'] = { usage: [], selection: [], pitfalls: [] };
      expect(patterns).toHaveProperty('usage');
      expect(patterns).toHaveProperty('selection');
      expect(patterns).toHaveProperty('pitfalls');
    });
  });

  describe('supporting types', () => {
    it('should create conforming ClassNode', () => {
      const node: ClassNode = { name: 'DMD', parent: null, module: 'pydmd.dmd', methods: ['fit', 'predict'], isAbstract: false };
      expect(node.parent).toBeNull();
    });

    it('should create conforming APIMethod', () => {
      const method: APIMethod = { class: 'DMD', name: 'fit', signature: 'fit(X)', returnType: 'DMD', docstring: 'Compute the DMD', isInherited: false };
      expect(method.class).toBe('DMD');
    });

    it('should create conforming ModuleNode', () => {
      const mod: ModuleNode = { path: 'pydmd/dmd.py', classes: ['DMD'], imports: ['numpy'], linesOfCode: 500 };
      expect(mod.linesOfCode).toBe(500);
    });

    it('should create conforming Concept', () => {
      const concept: Concept = { name: 'SVD', category: 'linear-algebra', description: 'Singular Value Decomposition', relatedConcepts: ['eigenvalue'], sourceFiles: ['pydmd/dmd.py'] };
      expect(concept.category).toBe('linear-algebra');
    });

    it('should create conforming UsagePattern', () => {
      const pattern: UsagePattern = { name: 'fit-reconstruct', steps: ['import', 'fit', 'reconstruct'], codeExample: 'dmd.fit(X)', variants: ['DMD'] };
      expect(pattern.steps).toHaveLength(3);
    });

    it('should create conforming Pitfall', () => {
      const pitfall: Pitfall = { description: 'Bad rank', symptom: 'noise', cause: 'overfitting', solution: 'reduce rank', affectsVariants: ['DMD'] };
      expect(pitfall.affectsVariants).toContain('DMD');
    });

    it('should create conforming TutorialSummary', () => {
      const tutorial: TutorialSummary = { index: 1, title: 'Getting Started', variant: 'DMD', dataType: 'time-series', keyInsight: 'SVD truncation', codePatterns: ['fit-predict'] };
      expect(tutorial.index).toBe(1);
    });

    it('should create conforming Connection', () => {
      const conn: Connection = { from: 'DMD', to: 'SVD', relationship: 'uses', strength: 0.9 };
      expect(conn.strength).toBeGreaterThan(0);
      expect(conn.strength).toBeLessThanOrEqual(1);
    });

    it('should create conforming Parameter', () => {
      const param: Parameter = { name: 'svd_rank', type: 'int', default: '-1', description: 'SVD rank' };
      expect(param.default).toBe('-1');
    });

    it('should create conforming TutorialReplayResult', () => {
      const result: TutorialReplayResult = { tutorialIndex: 1, title: 'Test', reproductionScore: 0.9, missedSteps: [], incorrectGuidance: [] };
      expect(result.reproductionScore).toBeLessThanOrEqual(1);
    });

    it('should create conforming ClaimVerification', () => {
      const cv: ClaimVerification = { claim: 'uses SVD', source: 'dmd.py:42', verified: true, notes: 'confirmed' };
      expect(cv.verified).toBe(true);
    });
  });
});
