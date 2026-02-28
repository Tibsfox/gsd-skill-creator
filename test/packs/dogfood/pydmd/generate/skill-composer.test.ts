import { describe, it, expect } from 'vitest';
import type {
  KnowledgeGraph,
  AlgorithmVariant,
  DecisionNode,
  Concept,
  ClassNode,
  ModuleNode,
  UsagePattern,
  Pitfall,
  TutorialSummary,
  Connection,
} from '../../../../../src/packs/dogfood/pydmd/types.js';
import type { GeneratedSkill } from '../../../../../src/packs/dogfood/pydmd/generate/types.js';
import { composeSkill } from '../../../../../src/packs/dogfood/pydmd/generate/skill-composer.js';
import { countWords } from '../../../../../src/packs/dogfood/pydmd/generate/word-counter.js';
import { formatDecisionTree } from '../../../../../src/packs/dogfood/pydmd/generate/decision-tree-formatter.js';

// --- Factory functions ---

function makeAlgorithmVariant(overrides: Partial<AlgorithmVariant> = {}): AlgorithmVariant {
  return {
    name: 'Standard DMD',
    class: 'DMD',
    purpose: 'Basic dynamic mode decomposition',
    distinguishing: ['Baseline SVD-based decomposition'],
    parameters: [
      { name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' },
    ],
    mathBasis: 'Singular Value Decomposition of snapshot matrices',
    tutorial: 1,
    ...overrides,
  };
}

function makeDecisionNode(overrides: Partial<DecisionNode> = {}): DecisionNode {
  return {
    question: 'Is your data noisy?',
    yes: 'Forward-Backward DMD (FbDMD)',
    no: 'Standard DMD',
    ...overrides,
  };
}

function makeKnowledgeGraph(): KnowledgeGraph {
  const variantDefs: { name: string; cls: string; purpose: string; mathBasis: string }[] = [
    { name: 'Standard DMD', cls: 'DMD', purpose: 'Basic dynamic mode decomposition', mathBasis: 'SVD of snapshot pairs' },
    { name: 'BOP-DMD', cls: 'BOPDMD', purpose: 'Bagging-optimized DMD for noisy data', mathBasis: 'Bagging + optimized DMD' },
    { name: 'Multi-Resolution DMD', cls: 'MrDMD', purpose: 'Multi-timescale decomposition', mathBasis: 'Recursive binary partition in time' },
    { name: 'DMD with Control', cls: 'DMDc', purpose: 'DMD with external control inputs', mathBasis: 'Augmented state-control snapshot matrix' },
    { name: 'Forward-Backward DMD', cls: 'FbDMD', purpose: 'Averaged forward-backward for noise reduction', mathBasis: 'Geometric mean of forward and backward operators' },
    { name: 'Extended DMD', cls: 'EDMD', purpose: 'Koopman operator approximation via lifted observables', mathBasis: 'Koopman operator theory with dictionary functions' },
    { name: 'Optimized DMD', cls: 'OptDMD', purpose: 'Optimal closed-form DMD solution', mathBasis: 'Variable projection for exponential fitting' },
    { name: 'Sparsity-Promoting DMD', cls: 'SpDMD', purpose: 'Sparse mode selection', mathBasis: 'L1 regularization on DMD amplitudes' },
    { name: 'Hankel DMD', cls: 'HankelDMD', purpose: 'Time-delay embedding DMD', mathBasis: 'Hankel matrix augmentation of snapshots' },
    { name: 'Compressed DMD', cls: 'CDMD', purpose: 'DMD with compressed measurements', mathBasis: 'Compressed sensing + DMD' },
    { name: 'Randomized DMD', cls: 'RDMD', purpose: 'Randomized SVD-based DMD', mathBasis: 'Randomized SVD for large-scale data' },
    { name: 'LANDO', cls: 'LANDO', purpose: 'Nonlinear dynamics via Koopman', mathBasis: 'Kernel-based Koopman with dictionary learning' },
  ];

  const algorithmVariants: AlgorithmVariant[] = variantDefs.map((v, i) => ({
    name: v.name,
    class: v.cls,
    purpose: v.purpose,
    distinguishing: [`Distinguishing feature of ${v.name}`],
    parameters: [
      { name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' },
    ],
    mathBasis: v.mathBasis,
    tutorial: i < 10 ? i + 1 : null,
  }));

  const classes: ClassNode[] = [
    { name: 'DMDBase', parent: null, module: 'pydmd.dmdbase', methods: ['fit', 'predict', 'reconstructed_data', 'eigs', 'modes', 'dynamics'], isAbstract: true },
    ...variantDefs.map(v => ({
      name: v.cls,
      parent: 'DMDBase',
      module: `pydmd.${v.cls.toLowerCase()}`,
      methods: ['fit', 'predict'],
      isAbstract: false,
    })),
  ];

  const modules: ModuleNode[] = classes.map(c => ({
    path: `pydmd/${c.name.toLowerCase()}.py`,
    classes: [c.name],
    imports: ['numpy', 'scipy'],
    linesOfCode: 200,
  }));

  const mathConcepts: Concept[] = [
    { name: 'Singular Value Decomposition', category: 'mathematical', description: 'Matrix factorization A = U S V^T used for rank truncation in DMD.', relatedConcepts: ['Eigendecomposition'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Eigendecomposition', category: 'mathematical', description: 'Decomposition of operator into eigenvalues and eigenvectors.', relatedConcepts: ['SVD'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Koopman Operator', category: 'mathematical', description: 'Infinite-dimensional linear operator governing nonlinear dynamics.', relatedConcepts: ['EDMD'], sourceFiles: ['pydmd/edmd.py'] },
  ];

  const domainConcepts: Concept[] = [
    { name: 'Dynamic Mode Decomposition', category: 'domain', description: 'Data-driven method for extracting spatiotemporal coherent structures from time-series data.', relatedConcepts: ['SVD', 'Eigendecomposition'], sourceFiles: ['pydmd/dmd.py'] },
    { name: 'Spatiotemporal Modes', category: 'domain', description: 'Spatial patterns paired with temporal dynamics.', relatedConcepts: ['DMD'], sourceFiles: ['pydmd/dmdbase.py'] },
  ];

  const decisionTree: DecisionNode = {
    question: 'Is your data noisy?',
    yes: {
      question: 'Is the noise level known or characterizable?',
      yes: 'Forward-Backward DMD (FbDMD)',
      no: 'BOP-DMD',
    },
    no: {
      question: 'Does your data have multiple timescales?',
      yes: 'Multi-Resolution DMD (MrDMD)',
      no: {
        question: 'Is the system nonlinear?',
        yes: {
          question: 'Is it weakly nonlinear?',
          yes: 'Extended DMD (EDMD)',
          no: 'LANDO',
        },
        no: {
          question: 'Do you have control inputs?',
          yes: 'DMD with Control (DMDc)',
          no: {
            question: 'Is the dataset very large?',
            yes: {
              question: 'Is compression preferred over randomization?',
              yes: 'Compressed DMD (CDMD)',
              no: 'Randomized DMD (RDMD)',
            },
            no: {
              question: 'Do you want sparse modes?',
              yes: 'Sparsity-Promoting DMD (SpDMD)',
              no: {
                question: 'Is time-delay embedding needed?',
                yes: 'Hankel DMD',
                no: {
                  question: 'Do you want the optimal closed-form solution?',
                  yes: 'Optimized DMD (OptDMD)',
                  no: 'Standard DMD',
                },
              },
            },
          },
        },
      },
    },
  };

  const usagePatterns: UsagePattern[] = [
    {
      name: 'standard-dmd-workflow',
      steps: ['Import DMD class', 'Create/load data', 'Instantiate DMD variant', 'Fit model', 'Analyze/reconstruct', 'Visualize'],
      codeExample: 'from pydmd import DMD\ndmd = DMD(svd_rank=2)\ndmd.fit(X)\nreconstructed = dmd.reconstructed_data',
      variants: ['DMD', 'FbDMD', 'OptDMD'],
    },
    {
      name: 'data-preparation',
      steps: ['Load raw data', 'Reshape to snapshot matrix', 'Preprocess'],
      codeExample: 'X = np.vstack([signal_1, signal_2])',
      variants: ['DMD'],
    },
    {
      name: 'visualization',
      steps: ['Plot modes', 'Plot eigenvalues', 'Plot dynamics'],
      codeExample: 'dmd.plot_eigs()\nfor mode in dmd.modes.T:\n    plt.plot(mode.real)',
      variants: ['DMD', 'MrDMD'],
    },
  ];

  const pitfalls: Pitfall[] = [
    { description: 'Applying standard DMD to noisy data', symptom: 'Eigenvalues scattered far from unit circle', cause: 'Standard DMD is sensitive to noise', solution: 'Use FbDMD or BOPDMD', affectsVariants: ['DMD'] },
    { description: 'Ignoring rank truncation on noisy datasets', symptom: 'Too many modes capturing noise', cause: 'Default svd_rank=-1 retains all', solution: 'Set svd_rank to expected number of modes', affectsVariants: ['DMD', 'MrDMD', 'HankelDMD'] },
    { description: 'Wrong time-delay parameter for HankelDMD', symptom: 'Modes do not correspond to physical dynamics', cause: 'Arbitrary delay parameter', solution: 'Set d based on system timescale', affectsVariants: ['HankelDMD', 'HODMD'] },
    { description: 'Applying single-scale DMD to multi-timescale data', symptom: 'Only dominant timescale captured', cause: 'Standard DMD assumes single timescale', solution: 'Use MrDMD for multi-resolution', affectsVariants: ['DMD', 'OptDMD'] },
    { description: 'Neglecting control inputs in controlled systems', symptom: 'Modes conflate autonomous and control dynamics', cause: 'Standard DMD ignores external forcing', solution: 'Use DMDc', affectsVariants: ['DMD', 'FbDMD'] },
    { description: 'Overfitting with too many dictionary functions in EDMD', symptom: 'Perfect training fit but poor generalization', cause: 'Excessive dictionary size', solution: 'Use cross-validation to select dictionary size', affectsVariants: ['EDMD'] },
  ];

  const tutorials: TutorialSummary[] = Array.from({ length: 10 }, (_, i) => ({
    index: i + 1,
    title: `Tutorial ${i + 1}: ${variantDefs[i % variantDefs.length].name}`,
    variant: variantDefs[i % variantDefs.length].cls,
    dataType: 'synthetic-sinusoidal',
    keyInsight: `${variantDefs[i % variantDefs.length].name} captures dominant modes.`,
    codePatterns: ['Import DMD class', 'Instantiate with parameters', 'Fit model', 'Reconstruct data', 'Visualize results'],
  }));

  const complexPlaneConnections: Connection[] = [
    { from: 'DMD eigenvalue analysis', to: 'Unit circle stability', relationship: 'Eigenvalues on the unit circle represent neutrally stable modes.', strength: 0.95 },
    { from: 'Mode decomposition', to: 'Spatial coordinate system', relationship: 'Spatial modes form a basis analogous to skill dimensions.', strength: 0.8 },
  ];

  const skillCreatorConnections: Connection[] = [
    { from: 'Algorithm selection', to: 'Skill activation', relationship: 'Decision tree maps to skill-creator activation model.', strength: 0.9 },
  ];

  return {
    project: { name: 'PyDMD', version: '1.0.0', description: 'Python Dynamic Mode Decomposition', license: 'MIT' },
    architecture: {
      classHierarchy: classes,
      apiSurface: classes.flatMap(c => c.methods.map(m => ({
        class: c.name,
        name: m,
        signature: `${m}()`,
        returnType: 'Any',
        docstring: `${m} method of ${c.name}`,
        isInherited: c.parent !== null,
      }))),
      moduleMap: modules,
    },
    concepts: {
      mathematical: mathConcepts,
      algorithmic: algorithmVariants,
      domain: domainConcepts,
    },
    patterns: {
      usage: usagePatterns,
      selection: [decisionTree],
      pitfalls,
    },
    tutorials,
    crossReferences: {
      complexPlane: complexPlaneConnections,
      skillCreator: skillCreatorConnections,
    },
  };
}

// --- Tests ---

describe('skill-composer', () => {
  const kg = makeKnowledgeGraph();

  describe('composeSkill', () => {
    it('produces valid markdown string', () => {
      const result: GeneratedSkill = composeSkill(kg);

      expect(typeof result.skillMd).toBe('string');
      expect(result.skillMd.length).toBeGreaterThan(0);
      expect(result.skillMd.startsWith('# PyDMD')).toBe(true);
    });

    it('generated skill is under 5000 words', () => {
      const result = composeSkill(kg);

      expect(result.wordCount).toBeLessThan(5000);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('skill contains all required sections', () => {
      const result = composeSkill(kg);
      const md = result.skillMd;

      const requiredSections = [
        '## Quick Reference',
        '## When to Use',
        '## The Core Pattern',
        '## Choosing Your Algorithm',
        '## Core Concepts',
        '## Common Patterns',
        '## Visualization',
        '## Common Pitfalls',
        '## References',
        '## Scripts',
      ];

      for (const section of requiredSections) {
        expect(md).toContain(section);
      }
    });

    it('decision tree is formatted as prose, not ASCII art', () => {
      const result = composeSkill(kg);
      const md = result.skillMd;

      // Extract the "Choosing Your Algorithm" section
      const sectionStart = md.indexOf('## Choosing Your Algorithm');
      const nextSection = md.indexOf('\n## ', sectionStart + 1);
      const algorithmSection = md.slice(sectionStart, nextSection > -1 ? nextSection : undefined);

      // Should not contain ASCII tree branch characters
      expect(algorithmSection).not.toMatch(/\|---/);
      expect(algorithmSection).not.toMatch(/\+---/);
      expect(algorithmSection).not.toMatch(/\\---/);

      // Should contain paragraph prose text
      expect(algorithmSection.length).toBeGreaterThan(100);
    });

    it('skill includes at least 6 code examples', () => {
      const result = composeSkill(kg);

      const pythonCodeBlocks = result.skillMd.match(/```python/g);
      expect(pythonCodeBlocks).not.toBeNull();
      expect(pythonCodeBlocks!.length).toBeGreaterThanOrEqual(6);
    });

    it('decision tree covers >= 8 algorithm variants', () => {
      const result = composeSkill(kg);
      const md = result.skillMd;

      // Extract the "Choosing Your Algorithm" section
      const sectionStart = md.indexOf('## Choosing Your Algorithm');
      const nextSection = md.indexOf('\n## ', sectionStart + 1);
      const algorithmSection = md.slice(sectionStart, nextSection > -1 ? nextSection : undefined);

      // Check that at least 8 variant class names from the knowledge graph appear
      const classNames = kg.concepts.algorithmic.map(v => v.class);
      const mentioned = classNames.filter(cn => algorithmSection.includes(cn));
      expect(mentioned.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('countWords', () => {
    it('handles markdown correctly', () => {
      const result = countWords('# Hello\n\nThis is **bold** and `code`.');

      // "Hello", "This", "is", "bold", "and", "code" = 6
      expect(result).toBe(6);
    });
  });

  describe('formatDecisionTree', () => {
    it('converts tree to prose without tree branch characters', () => {
      const treeNodes: DecisionNode[] = [
        {
          question: 'Is your data noisy?',
          yes: {
            question: 'Is the noise level known?',
            yes: 'Forward-Backward DMD (FbDMD)',
            no: 'BOP-DMD',
          },
          no: 'Standard DMD',
        },
      ];

      const result = formatDecisionTree(treeNodes);

      // Should not contain ASCII tree characters
      expect(result).not.toMatch(/\|---/);
      expect(result).not.toMatch(/\+---/);

      // Should contain the question text
      expect(result).toContain('Is your data noisy?');
      expect(result).toContain('Is the noise level known?');

      // Should be non-empty prose
      expect(result.length).toBeGreaterThan(50);
    });
  });
});
