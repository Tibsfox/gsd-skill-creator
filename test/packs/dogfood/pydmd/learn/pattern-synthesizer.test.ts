import { describe, it, expect } from 'vitest';
import type {
  RepoManifest,
  TutorialSummary,
  KnowledgeGraph,
  DecisionNode,
  AlgorithmVariant,
  Concept,
  Connection,
  UsagePattern,
  Pitfall,
  ClassNode,
  ModuleNode,
  APIMethod,
} from '../../../../../src/dogfood/pydmd/types.js';
import type { ComplexPlaneMap } from '../../../../../src/dogfood/pydmd/learn/complex-plane-mapper.js';
import {
  synthesizePatterns,
  buildDecisionTree,
} from '../../../../../src/dogfood/pydmd/learn/pattern-synthesizer.js';

// --- Factories ---

function makeRepoManifest(overrides: Partial<RepoManifest> = {}): RepoManifest {
  return {
    url: 'https://github.com/PyDMD/PyDMD',
    localPath: '/tmp/pydmd',
    language: 'python',
    buildSystem: 'pyproject.toml',
    pythonVersion: '3.11',
    dependencies: { core: ['numpy', 'scipy'], test: ['pytest'], dev: ['black'] },
    testFramework: 'pytest',
    healthCheck: { passed: 100, failed: 0, skipped: 2, errors: [] },
    structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
    entryPoints: ['pydmd/__init__.py'],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeStructureOutput(classCount: number): { classes: ClassNode[]; modules: ModuleNode[] } {
  const classes: ClassNode[] = [];
  const variantNames = [
    'DMD', 'BOPDMD', 'MrDMD', 'DMDc', 'FbDMD', 'EDMD', 'OptDMD',
    'SpDMD', 'HankelDMD', 'CDMD', 'RDMD', 'LANDO', 'HODMD',
    'SubspaceDMD', 'HAVOK', 'PiDMD',
  ];

  // Base class first
  classes.push({
    name: 'DMDBase',
    parent: null,
    module: 'pydmd.dmdbase',
    methods: ['fit', 'predict', 'reconstructed_data', 'eigs', 'modes', 'dynamics'],
    isAbstract: true,
  });

  for (let i = 0; i < classCount && i < variantNames.length; i++) {
    classes.push({
      name: variantNames[i],
      parent: 'DMDBase',
      module: `pydmd.${variantNames[i].toLowerCase()}`,
      methods: ['fit', 'predict'],
      isAbstract: false,
    });
  }

  const modules: ModuleNode[] = classes.map(c => ({
    path: `pydmd/${c.name.toLowerCase()}.py`,
    classes: [c.name],
    imports: ['numpy', 'scipy'],
    linesOfCode: 150,
  }));

  return { classes, modules };
}

function makeConceptOutput(conceptNames: string[]): { concepts: Concept[]; variants: AlgorithmVariant[] } {
  const categories: Record<string, string> = {
    'Singular Value Decomposition': 'mathematical',
    'Eigendecomposition': 'mathematical',
    'Koopman Operator Theory': 'mathematical',
    'Rank Truncation': 'algorithmic',
    'Time-Delay Embedding': 'algorithmic',
    'Noise Sensitivity': 'domain',
    'Mode Selection': 'domain',
  };

  const concepts: Concept[] = conceptNames.map(name => ({
    name,
    category: categories[name] ?? 'mathematical',
    description: `Description of ${name}`,
    relatedConcepts: [],
    sourceFiles: ['pydmd/dmdbase.py'],
  }));

  const variantDefs: { name: string; class: string; purpose: string }[] = [
    { name: 'Standard DMD', class: 'DMD', purpose: 'Basic dynamic mode decomposition' },
    { name: 'BOP-DMD', class: 'BOPDMD', purpose: 'Bagging-optimized DMD for noisy data' },
    { name: 'Multi-Resolution DMD', class: 'MrDMD', purpose: 'Multi-timescale decomposition' },
    { name: 'DMD with Control', class: 'DMDc', purpose: 'DMD with external control inputs' },
    { name: 'Forward-Backward DMD', class: 'FbDMD', purpose: 'Averaged forward-backward for noise reduction' },
    { name: 'Extended DMD', class: 'EDMD', purpose: 'Koopman operator approximation' },
    { name: 'Optimized DMD', class: 'OptDMD', purpose: 'Optimal closed-form DMD' },
    { name: 'Sparsity-Promoting DMD', class: 'SpDMD', purpose: 'Sparse mode selection' },
    { name: 'Hankel DMD', class: 'HankelDMD', purpose: 'Time-delay embedding DMD' },
    { name: 'Compressed DMD', class: 'CDMD', purpose: 'DMD with compressed measurements' },
    { name: 'Randomized DMD', class: 'RDMD', purpose: 'Randomized SVD-based DMD' },
    { name: 'LANDO', class: 'LANDO', purpose: 'Nonlinear dynamics via Koopman' },
    { name: 'Higher-Order DMD', class: 'HODMD', purpose: 'Higher-order time-delay DMD' },
    { name: 'Subspace DMD', class: 'SubspaceDMD', purpose: 'Subspace-based DMD' },
    { name: 'HAVOK', class: 'HAVOK', purpose: 'Hankel alternative view of Koopman' },
    { name: 'Physics-Informed DMD', class: 'PiDMD', purpose: 'Physics-constrained DMD' },
  ];

  const variants: AlgorithmVariant[] = variantDefs.map((v, i) => ({
    name: v.name,
    class: v.class,
    purpose: v.purpose,
    distinguishing: [`Key feature of ${v.name}`],
    parameters: [{ name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' }],
    mathBasis: `Mathematical foundation for ${v.name}`,
    tutorial: i < 12 ? i + 1 : null,
  }));

  return { concepts, variants };
}

function makeTutorialOutput(count: number): TutorialSummary[] {
  const variants = [
    'DMD', 'BOPDMD', 'MrDMD', 'DMDc', 'FbDMD', 'EDMD', 'OptDMD',
    'SpDMD', 'HankelDMD', 'CDMD', 'RDMD', 'LANDO',
  ];
  const summaries: TutorialSummary[] = [];
  for (let i = 0; i < count; i++) {
    const variant = variants[i % variants.length];
    summaries.push({
      index: i + 1,
      title: `Tutorial ${i + 1}: ${variant} demonstration`,
      variant,
      dataType: 'synthetic-sinusoidal',
      keyInsight: `${variant} captures dominant modes in the data.`,
      codePatterns: [
        'Import DMD class',
        'Create synthetic data',
        `Instantiate ${variant} with parameters`,
        'Fit model to data',
        'Reconstruct data',
        'Visualize results',
      ],
    });
  }
  return summaries;
}

function makeComplexPlaneMap(): ComplexPlaneMap {
  return {
    eigenvalueInterpretation: {
      unitCircle: 'Stability boundary for DMD eigenvalues.',
      realAxis: 'Pure growth or decay.',
      imaginaryAxis: 'Oscillation frequency.',
      origin: 'Transient mode.',
    },
    modeInterpretation: {
      spatialModes: 'Spatial patterns for each mode.',
      temporalDynamics: 'Time evolution.',
      amplitudes: 'Mode weights.',
    },
    connectionToFramework: {
      sinCos: 'Oscillating components.',
      tangentLine: 'Instantaneous rate of change.',
      versine: 'Gap from real axis.',
      eulerFormula: 'Mode composition.',
    },
    pedagogicalNarrative: 'DMD eigenvalues on the unit circle.',
  };
}

/** Collect all leaf (string) values from a decision tree. */
function collectLeaves(node: DecisionNode | string): string[] {
  if (typeof node === 'string') return [node];
  return [...collectLeaves(node.yes), ...collectLeaves(node.no)];
}

/** Check that a decision node has no dead ends (all branches terminate). */
function hasNoDeadEnds(node: DecisionNode | string): boolean {
  if (typeof node === 'string') return node.length > 0;
  if (!node.question || node.question.length === 0) return false;
  return hasNoDeadEnds(node.yes) && hasNoDeadEnds(node.no);
}

/** Compute the maximum depth of a decision tree. */
function treeDepth(node: DecisionNode | string): number {
  if (typeof node === 'string') return 0;
  return 1 + Math.max(treeDepth(node.yes), treeDepth(node.no));
}

// --- Tests ---

describe('pattern-synthesizer', () => {
  const manifest = makeRepoManifest();

  describe('cross-referencing (LRN-06)', () => {
    it('synthesizePatterns returns a KnowledgeGraph from all three tracks', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition', 'Eigendecomposition',
      ]);
      const tutorials = makeTutorialOutput(5);
      const complexPlaneMap = makeComplexPlaneMap();

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials, complexPlaneMap, manifest,
      });

      expect(kg).toBeDefined();
      expect(kg.project).toBeDefined();
      expect(kg.architecture).toBeDefined();
      expect(kg.concepts).toBeDefined();
      expect(kg.patterns).toBeDefined();
      expect(kg.tutorials).toBeDefined();
      expect(kg.crossReferences).toBeDefined();
    });

    it('architecture.classHierarchy comes from structure analysis input', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(0);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.architecture.classHierarchy.length).toBe(classes.length);
    });

    it('concepts.mathematical includes mathematical concepts from extraction', () => {
      const { classes, modules } = makeStructureOutput(3);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition', 'Eigendecomposition',
      ]);
      const tutorials = makeTutorialOutput(2);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.concepts.mathematical.length).toBeGreaterThanOrEqual(1);
      expect(kg.concepts.mathematical.some(c => c.name === 'Singular Value Decomposition')).toBe(true);
    });

    it('tutorials section matches input TutorialSummary[]', () => {
      const { classes, modules } = makeStructureOutput(2);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.tutorials).toHaveLength(5);
    });

    it('project has non-empty name, version, description, license', () => {
      const { classes, modules } = makeStructureOutput(2);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(2);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.project.name.length).toBeGreaterThan(0);
      expect(kg.project.version.length).toBeGreaterThan(0);
      expect(kg.project.description.length).toBeGreaterThan(0);
      expect(kg.project.license.length).toBeGreaterThan(0);
    });
  });

  describe('usage pattern synthesis', () => {
    it('identifies standard-dmd-workflow from tutorials with common steps', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(6); // >5 tutorials with common patterns

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      const stdWorkflow = kg.patterns.usage.find(
        p => p.name.toLowerCase().includes('standard') || p.name.toLowerCase().includes('workflow'),
      );
      expect(stdWorkflow).toBeDefined();
      expect(stdWorkflow!.steps.length).toBeGreaterThanOrEqual(3);
      expect(stdWorkflow!.variants.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('decision tree construction', () => {
    it('buildDecisionTree returns DecisionNode[] array', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const tree = buildDecisionTree(variants, tutorials);

      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBeGreaterThanOrEqual(1);
    });

    it('tree root starts with a question about data characteristics', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const tree = buildDecisionTree(variants, tutorials);
      const root = tree[0];

      expect(root.question.length).toBeGreaterThan(0);
      expect(root.question).toContain('?');
    });

    it('every leaf node is a string naming a DMD variant', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = tree.flatMap(root => collectLeaves(root));

      for (const leaf of leaves) {
        expect(typeof leaf).toBe('string');
        expect(leaf.length).toBeGreaterThan(0);
      }
    });

    it('every DMD variant appears in at least one leaf', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(10);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = new Set(tree.flatMap(root => collectLeaves(root)));

      for (const v of variants) {
        const found = [...leaves].some(
          leaf => leaf === v.name || leaf === v.class || leaf.includes(v.class) || leaf.includes(v.name),
        );
        expect(found).toBe(true);
      }
    });

    it('no dead-end paths -- every DecisionNode has both yes and no', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const tree = buildDecisionTree(variants, tutorials);
      for (const root of tree) {
        expect(hasNoDeadEnds(root)).toBe(true);
      }
    });

    it('tree has sufficient depth for 15+ variants (at least 4 levels)', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(10);

      const tree = buildDecisionTree(variants, tutorials);
      const maxDepth = Math.max(...tree.map(root => treeDepth(root)));

      expect(maxDepth).toBeGreaterThanOrEqual(4);
    });

    it('tree questions reference data characteristics', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const tree = buildDecisionTree(variants, tutorials);

      // Collect all questions
      function collectQuestions(node: DecisionNode | string): string[] {
        if (typeof node === 'string') return [];
        return [node.question, ...collectQuestions(node.yes), ...collectQuestions(node.no)];
      }
      const questions = tree.flatMap(root => collectQuestions(root));
      const combined = questions.join(' ').toLowerCase();

      // Should reference at least some data characteristics
      const characteristics = ['nois', 'timescale', 'nonlinear', 'control', 'large', 'sparse'];
      const found = characteristics.filter(c => combined.includes(c));
      expect(found.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('decision tree validation against tutorials', () => {
    it('Tutorial 1 (DMD, clean synthetic) reaches DMD or OptDMD', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(10);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = new Set(tree.flatMap(root => collectLeaves(root)));

      // DMD or OptDMD must appear as leaves
      const hasDMD = [...leaves].some(l => l.includes('DMD') && !l.includes('Mr') && !l.includes('Control'));
      expect(hasDMD).toBe(true);
    });

    it('MrDMD variant is reachable in the tree', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(10);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = tree.flatMap(root => collectLeaves(root));
      const hasMr = leaves.some(l => l.includes('MrDMD') || l.includes('Multi-Resolution'));
      expect(hasMr).toBe(true);
    });

    it('DMDc variant is reachable via control-input path', () => {
      const { variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(10);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = tree.flatMap(root => collectLeaves(root));
      const hasDMDc = leaves.some(l => l.includes('DMDc') || l.includes('Control'));
      expect(hasDMDc).toBe(true);
    });
  });

  describe('pitfall detection', () => {
    it('generates at least 3 pitfalls from PyDMD domain', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition', 'Rank Truncation',
      ]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.patterns.pitfalls.length).toBeGreaterThanOrEqual(3);
    });

    it('pitfalls have required fields: description, symptom, cause, solution', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      for (const p of kg.patterns.pitfalls) {
        expect(p.description.length).toBeGreaterThan(0);
        expect(p.symptom.length).toBeGreaterThan(0);
        expect(p.cause.length).toBeGreaterThan(0);
        expect(p.solution.length).toBeGreaterThan(0);
        expect(Array.isArray(p.affectsVariants)).toBe(true);
        expect(p.affectsVariants.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('includes noise sensitivity pitfall affecting DMD', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition',
      ]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      const noisePitfall = kg.patterns.pitfalls.find(
        p => p.description.toLowerCase().includes('nois'),
      );
      expect(noisePitfall).toBeDefined();
    });
  });

  describe('cross-references', () => {
    it('complexPlane has at least 1 Connection', () => {
      const { classes, modules } = makeStructureOutput(3);
      const { concepts, variants } = makeConceptOutput([
        'Eigendecomposition',
      ]);
      const tutorials = makeTutorialOutput(2);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.crossReferences.complexPlane.length).toBeGreaterThanOrEqual(1);
    });

    it('complexPlane connections have from, to, relationship, strength', () => {
      const { classes, modules } = makeStructureOutput(3);
      const { concepts, variants } = makeConceptOutput(['Eigendecomposition']);
      const tutorials = makeTutorialOutput(2);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      for (const conn of kg.crossReferences.complexPlane) {
        expect(conn.from.length).toBeGreaterThan(0);
        expect(conn.to.length).toBeGreaterThan(0);
        expect(conn.relationship.length).toBeGreaterThan(0);
        expect(typeof conn.strength).toBe('number');
      }
    });

    it('skillCreator has at least 1 Connection', () => {
      const { classes, modules } = makeStructureOutput(3);
      const { concepts, variants } = makeConceptOutput([]);
      const tutorials = makeTutorialOutput(2);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.crossReferences.skillCreator.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('structured JSON output (LRN-07)', () => {
    it('KnowledgeGraph matches interface contract', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition', 'Eigendecomposition',
      ]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      // project
      expect(typeof kg.project.name).toBe('string');
      expect(typeof kg.project.version).toBe('string');
      expect(typeof kg.project.description).toBe('string');
      expect(typeof kg.project.license).toBe('string');

      // architecture
      expect(Array.isArray(kg.architecture.classHierarchy)).toBe(true);
      expect(Array.isArray(kg.architecture.apiSurface)).toBe(true);
      expect(Array.isArray(kg.architecture.moduleMap)).toBe(true);

      // concepts
      expect(Array.isArray(kg.concepts.mathematical)).toBe(true);
      expect(Array.isArray(kg.concepts.algorithmic)).toBe(true);
      expect(Array.isArray(kg.concepts.domain)).toBe(true);

      // patterns
      expect(Array.isArray(kg.patterns.usage)).toBe(true);
      expect(Array.isArray(kg.patterns.selection)).toBe(true);
      expect(Array.isArray(kg.patterns.pitfalls)).toBe(true);

      // tutorials
      expect(Array.isArray(kg.tutorials)).toBe(true);

      // crossReferences
      expect(Array.isArray(kg.crossReferences.complexPlane)).toBe(true);
      expect(Array.isArray(kg.crossReferences.skillCreator)).toBe(true);
    });

    it('all string fields are non-empty for valid input', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition',
      ]);
      const tutorials = makeTutorialOutput(5);

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.project.name.length).toBeGreaterThan(0);
      expect(kg.project.version.length).toBeGreaterThan(0);
      expect(kg.project.description.length).toBeGreaterThan(0);
      expect(kg.project.license.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty tutorial array with valid structure/concepts', () => {
      const { classes, modules } = makeStructureOutput(5);
      const { concepts, variants } = makeConceptOutput([
        'Singular Value Decomposition',
      ]);
      const tutorials: TutorialSummary[] = [];

      const kg = synthesizePatterns({
        classes, modules, concepts, variants, tutorials,
        complexPlaneMap: makeComplexPlaneMap(), manifest,
      });

      expect(kg.tutorials).toHaveLength(0);
      expect(kg.architecture.classHierarchy.length).toBeGreaterThan(0);
      expect(kg.concepts.mathematical.length).toBeGreaterThanOrEqual(1);
    });

    it('handles single variant producing a degenerate decision tree', () => {
      const variants: AlgorithmVariant[] = [{
        name: 'Standard DMD',
        class: 'DMD',
        purpose: 'Basic DMD',
        distinguishing: ['Standard approach'],
        parameters: [],
        mathBasis: 'SVD',
        tutorial: 1,
      }];
      const tutorials = makeTutorialOutput(1);

      const tree = buildDecisionTree(variants, tutorials);
      const leaves = tree.flatMap(root => collectLeaves(root));
      expect(leaves.some(l => l.includes('DMD'))).toBe(true);
    });
  });
});
