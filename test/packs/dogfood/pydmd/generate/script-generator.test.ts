import { describe, it, expect } from 'vitest';
import { generateScripts } from '../../../../../src/dogfood/pydmd/generate/script-generator.js';
import { checkCrossReferences } from '../../../../../src/dogfood/pydmd/generate/cross-reference-checker.js';
import type {
  KnowledgeGraph,
  AlgorithmVariant,
  Parameter,
  Concept,
  Connection,
  UsagePattern,
  Pitfall,
  DecisionNode,
  ClassNode,
  ModuleNode,
  APIMethod,
  TutorialSummary,
} from '../../../../../src/dogfood/pydmd/types.js';
import type { ReferenceSet } from '../../../../../src/dogfood/pydmd/generate/reference-builder.js';
import type { ScriptSet } from '../../../../../src/dogfood/pydmd/generate/script-generator.js';

// --- Factories ---

function makeParameter(name: string, overrides: Partial<Parameter> = {}): Parameter {
  return {
    name,
    type: 'int',
    default: null,
    description: `The ${name} parameter`,
    ...overrides,
  };
}

function makeAlgorithmVariant(name: string, className: string, overrides: Partial<AlgorithmVariant> = {}): AlgorithmVariant {
  return {
    name,
    class: className,
    purpose: `${name} approach to dynamic mode decomposition.`,
    distinguishing: [`Key feature of ${name}`],
    parameters: [
      makeParameter('svd_rank', { type: 'int', default: '-1', description: 'Rank truncation' }),
    ],
    mathBasis: `Mathematical foundation for ${name}`,
    tutorial: null,
    ...overrides,
  };
}

function makeKnowledgeGraph(): KnowledgeGraph {
  const variantDefs: { name: string; class: string }[] = [
    { name: 'Standard DMD', class: 'DMD' },
    { name: 'BOP-DMD', class: 'BOPDMD' },
    { name: 'Multi-Resolution DMD', class: 'MrDMD' },
    { name: 'DMD with Control', class: 'DMDc' },
    { name: 'Forward-Backward DMD', class: 'FbDMD' },
    { name: 'Extended DMD', class: 'EDMD' },
    { name: 'Optimized DMD', class: 'OptDMD' },
    { name: 'Sparsity-Promoting DMD', class: 'SpDMD' },
    { name: 'Hankel DMD', class: 'HankelDMD' },
    { name: 'Compressed DMD', class: 'CDMD' },
    { name: 'Randomized DMD', class: 'RDMD' },
    { name: 'LANDO', class: 'LANDO' },
  ];

  const algorithmic: AlgorithmVariant[] = variantDefs.map((v, i) =>
    makeAlgorithmVariant(v.name, v.class, { tutorial: i < 10 ? i + 1 : null }),
  );

  const classHierarchy: ClassNode[] = [
    { name: 'DMDBase', parent: null, module: 'pydmd.dmdbase', methods: ['fit', 'predict', 'reconstructed_data', 'eigs', 'modes', 'dynamics'], isAbstract: true },
    ...variantDefs.map(v => ({
      name: v.class,
      parent: 'DMDBase',
      module: `pydmd.${v.class.toLowerCase()}`,
      methods: ['fit', 'predict'],
      isAbstract: false,
    })),
  ];

  const apiSurface: APIMethod[] = [
    { class: 'DMDBase', name: 'fit', signature: '(self, X: np.ndarray) -> DMDBase', returnType: 'DMDBase', docstring: 'Fit the DMD model.', isInherited: false },
    { class: 'DMDBase', name: 'reconstruct', signature: '(self, X: np.ndarray) -> np.ndarray', returnType: 'np.ndarray', docstring: 'Reconstruct data.', isInherited: false },
    { class: 'DMDBase', name: 'predict', signature: '(self, X: np.ndarray) -> np.ndarray', returnType: 'np.ndarray', docstring: 'Predict future.', isInherited: false },
    { class: 'DMDBase', name: 'eigs', signature: '(self) -> np.ndarray', returnType: 'np.ndarray', docstring: 'Return eigenvalues.', isInherited: false },
    { class: 'DMDBase', name: 'modes', signature: '(self) -> np.ndarray', returnType: 'np.ndarray', docstring: 'Return modes.', isInherited: false },
  ];

  const moduleMap: ModuleNode[] = variantDefs.map(v => ({
    path: `pydmd/${v.class.toLowerCase()}.py`,
    classes: [v.class],
    imports: ['numpy', 'scipy'],
    linesOfCode: 200,
  }));

  const mathematical: Concept[] = [
    { name: 'Singular Value Decomposition', category: 'mathematical', description: 'SVD for rank truncation.', relatedConcepts: ['Eigendecomposition'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Eigendecomposition', category: 'mathematical', description: 'Mode extraction via eigenvalues.', relatedConcepts: ['SVD'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Koopman Operator Theory', category: 'mathematical', description: 'Nonlinear dynamics linearization.', relatedConcepts: ['EDMD'], sourceFiles: ['pydmd/edmd.py'] },
  ];

  const domain: Concept[] = [
    { name: 'Dynamic Mode Decomposition', category: 'domain', description: 'Data-driven spatiotemporal decomposition.', relatedConcepts: [], sourceFiles: ['pydmd/dmd.py'] },
  ];

  const usage: UsagePattern[] = [
    { name: 'Standard DMD Workflow', steps: ['Create DMD', 'Fit data', 'Analyze', 'Reconstruct'], codeExample: 'dmd = DMD(svd_rank=10)\ndmd.fit(X)', variants: ['DMD'] },
    { name: 'Visualization', steps: ['Fit', 'Extract modes', 'Plot'], codeExample: 'plt.scatter(dmd.eigs.real, dmd.eigs.imag)', variants: ['DMD'] },
  ];

  const selection: DecisionNode[] = [
    { question: 'Noisy data?', yes: 'BOPDMD', no: 'DMD' },
  ];

  const pitfalls: Pitfall[] = [
    { description: 'Noise sensitivity', symptom: 'Spurious modes', cause: 'No noise handling', solution: 'Use BOPDMD', affectsVariants: ['DMD'] },
  ];

  const complexPlane: Connection[] = [
    { from: 'DMD eigenvalues', to: 'unit circle', relationship: 'Stability boundary', strength: 0.9 },
  ];

  const skillCreator: Connection[] = [
    { from: 'DMD modes', to: 'skill activation', relationship: 'Analogy', strength: 0.5 },
  ];

  const tutorials: TutorialSummary[] = Array.from({ length: 6 }, (_, i) => ({
    index: i + 1,
    title: `Tutorial ${i + 1}: ${variantDefs[i % variantDefs.length].name}`,
    variant: variantDefs[i % variantDefs.length].class,
    dataType: 'synthetic',
    keyInsight: `${variantDefs[i % variantDefs.length].name} captures modes.`,
    codePatterns: ['Import', 'Create', 'Fit', 'Analyze'],
  }));

  return {
    project: { name: 'PyDMD', version: '1.0.0', description: 'Python Dynamic Mode Decomposition', license: 'MIT' },
    architecture: { classHierarchy, apiSurface, moduleMap },
    concepts: { mathematical, algorithmic, domain },
    patterns: { usage, selection, pitfalls },
    tutorials,
    crossReferences: { complexPlane, skillCreator },
  };
}

// --- Tests ---

describe('script-generator', () => {
  const graph = makeKnowledgeGraph();

  it('generateScripts returns 3 scripts', () => {
    const scripts = generateScripts(graph);

    expect(scripts).toBeDefined();
    expect(typeof scripts.quickDmd).toBe('string');
    expect(typeof scripts.compareVariants).toBe('string');
    expect(typeof scripts.visualizeModes).toBe('string');

    expect(scripts.quickDmd.length).toBeGreaterThan(0);
    expect(scripts.compareVariants.length).toBeGreaterThan(0);
    expect(scripts.visualizeModes.length).toBeGreaterThan(0);
  });

  it('quick-dmd script is self-contained Python', () => {
    const scripts = generateScripts(graph);
    const script = scripts.quickDmd;

    // Has pydmd import
    expect(script).toMatch(/(?:import pydmd|from pydmd)/);

    // Has argparse
    expect(script).toContain('argparse');

    // Has __main__ guard
    expect(script).toContain('if __name__');
  });

  it('compare-variants script handles multiple DMD classes', () => {
    const scripts = generateScripts(graph);
    const script = scripts.compareVariants;

    // Should mention at least 3 DMD class names from the knowledge graph
    const classNames = graph.concepts.algorithmic.map(v => v.class);
    const mentioned = classNames.filter(cn => script.includes(cn));
    expect(mentioned.length).toBeGreaterThanOrEqual(3);
  });

  it('visualize-modes script includes matplotlib', () => {
    const scripts = generateScripts(graph);
    const script = scripts.visualizeModes;

    expect(script).toMatch(/(?:import matplotlib|from matplotlib)/);
  });

  it('all scripts have docstrings', () => {
    const scripts = generateScripts(graph);

    // Triple-quoted docstrings
    expect(scripts.quickDmd).toMatch(/"""/);
    expect(scripts.compareVariants).toMatch(/"""/);
    expect(scripts.visualizeModes).toMatch(/"""/);
  });
});

describe('cross-reference-checker', () => {
  it('checkCrossReferences reports no broken links for valid output', () => {
    const skillMd = [
      '# PyDMD Knowledge Skill',
      '',
      'See [algorithm variants](references/algorithm-variants.md) for details.',
      'See [math foundations](references/mathematical-foundations.md) for theory.',
      'See [API reference](references/api-reference.md) for full catalog.',
      'See [complex plane](references/complex-plane-connections.md) for connections.',
      'Run [quick-dmd](scripts/quick-dmd.py) to get started.',
      'Run [compare](scripts/compare-variants.py) to compare.',
      'Run [visualize](scripts/visualize-modes.py) to plot.',
    ].join('\n');

    const references: ReferenceSet = {
      algorithmVariants: 'Algorithm content',
      mathematicalFoundations: 'Math content',
      apiReference: 'API content',
      complexPlaneConnections: 'Complex plane content',
    };

    const scripts: ScriptSet = {
      quickDmd: '# quick script',
      compareVariants: '# compare script',
      visualizeModes: '# visualize script',
    };

    const result = checkCrossReferences(skillMd, references, scripts);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.validLinks.length).toBeGreaterThan(0);
  });

  it('checkCrossReferences catches broken reference', () => {
    const skillMd = [
      '# PyDMD Knowledge Skill',
      '',
      'See [nonexistent](references/nonexistent.md) for details.',
      'See [algorithm variants](references/algorithm-variants.md) for variants.',
    ].join('\n');

    const references: ReferenceSet = {
      algorithmVariants: 'Algorithm content',
      mathematicalFoundations: 'Math content',
      apiReference: 'API content',
      complexPlaneConnections: 'Complex plane content',
    };

    const scripts: ScriptSet = {
      quickDmd: '# quick script',
      compareVariants: '# compare script',
      visualizeModes: '# visualize script',
    };

    const result = checkCrossReferences(skillMd, references, scripts);

    expect(result.brokenLinks.length).toBeGreaterThan(0);
    expect(result.brokenLinks.some(link => link.includes('nonexistent'))).toBe(true);
  });
});
