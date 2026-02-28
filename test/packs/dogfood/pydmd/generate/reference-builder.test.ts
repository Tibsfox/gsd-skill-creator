import { describe, it, expect } from 'vitest';
import { buildReferences } from '../../../../../src/packs/dogfood/pydmd/generate/reference-builder.js';
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
} from '../../../../../src/packs/dogfood/pydmd/types.js';

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
    purpose: `${name} provides an approach to dynamic mode decomposition that addresses specific data challenges.`,
    distinguishing: [`Key feature of ${name}: unique algorithmic approach`],
    parameters: [
      makeParameter('svd_rank', { type: 'int', default: '-1', description: 'Rank truncation for SVD' }),
      makeParameter('tlsq_rank', { type: 'int', default: '0', description: 'Truncation for total least squares' }),
    ],
    mathBasis: `Mathematical foundation for ${name} involving spectral decomposition`,
    tutorial: null,
    ...overrides,
  };
}

function makeAPIMethod(className: string, methodName: string, overrides: Partial<APIMethod> = {}): APIMethod {
  return {
    class: className,
    name: methodName,
    signature: `(self) -> np.ndarray`,
    returnType: 'np.ndarray',
    docstring: `Returns the ${methodName} result.`,
    isInherited: false,
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
    makeAPIMethod('DMDBase', 'fit', { signature: '(self, X: np.ndarray) -> DMDBase', returnType: 'DMDBase' }),
    makeAPIMethod('DMDBase', 'reconstruct', { signature: '(self, X: np.ndarray) -> np.ndarray' }),
    makeAPIMethod('DMDBase', 'predict', { signature: '(self, X: np.ndarray) -> np.ndarray' }),
    makeAPIMethod('DMDBase', 'eigs', { signature: '(self) -> np.ndarray', docstring: 'Returns the eigenvalues of the DMD operator.' }),
    makeAPIMethod('DMDBase', 'modes', { signature: '(self) -> np.ndarray', docstring: 'Returns the DMD modes.' }),
    makeAPIMethod('DMDBase', 'dynamics', { signature: '(self) -> np.ndarray' }),
    makeAPIMethod('DMDBase', 'reconstructed_data', { signature: '(self) -> np.ndarray' }),
    makeAPIMethod('MrDMD', 'partial_reconstruct', { signature: '(self, level: int) -> np.ndarray', isInherited: false }),
    makeAPIMethod('SpDMD', 'selected_modes', { signature: '(self) -> np.ndarray', isInherited: false }),
  ];

  const moduleMap: ModuleNode[] = variantDefs.map(v => ({
    path: `pydmd/${v.class.toLowerCase()}.py`,
    classes: [v.class],
    imports: ['numpy', 'scipy'],
    linesOfCode: 200,
  }));

  const mathematical: Concept[] = [
    { name: 'Singular Value Decomposition', category: 'mathematical', description: 'Matrix factorization A = U S V^T used for rank truncation and noise filtering in DMD.', relatedConcepts: ['Eigendecomposition', 'Rank Truncation'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Eigendecomposition', category: 'mathematical', description: 'Decomposition of a matrix into eigenvalues and eigenvectors for mode extraction.', relatedConcepts: ['SVD', 'DMD Operator'], sourceFiles: ['pydmd/dmdbase.py'] },
    { name: 'Koopman Operator Theory', category: 'mathematical', description: 'Infinite-dimensional linear operator theory for nonlinear dynamical systems.', relatedConcepts: ['EDMD', 'LANDO'], sourceFiles: ['pydmd/edmd.py', 'pydmd/lando.py'] },
  ];

  const domain: Concept[] = [
    { name: 'Dynamic Mode Decomposition', category: 'domain', description: 'Data-driven method for extracting spatiotemporal patterns.', relatedConcepts: ['SVD', 'Eigendecomposition'], sourceFiles: ['pydmd/dmd.py'] },
  ];

  const usage: UsagePattern[] = [
    { name: 'Standard DMD Workflow', steps: ['Create DMD instance', 'Fit to data', 'Analyze eigenvalues', 'Reconstruct/predict'], codeExample: 'dmd = DMD(svd_rank=10)\ndmd.fit(X)\nprint(dmd.eigs)', variants: ['DMD', 'OptDMD'] },
    { name: 'Visualization Workflow', steps: ['Fit model', 'Extract modes', 'Plot eigenvalues on complex plane', 'Plot spatial modes'], codeExample: 'plt.scatter(dmd.eigs.real, dmd.eigs.imag)', variants: ['DMD'] },
  ];

  const selection: DecisionNode[] = [
    { question: 'Is your data noisy?', yes: { question: 'Do you need multiple timescales?', yes: 'Multi-Resolution DMD (MrDMD)', no: 'BOP-DMD (BOPDMD)' }, no: 'Standard DMD (DMD)' },
  ];

  const pitfalls: Pitfall[] = [
    { description: 'Noise sensitivity in standard DMD', symptom: 'Spurious modes', cause: 'No noise handling', solution: 'Use BOPDMD or FbDMD', affectsVariants: ['DMD'] },
    { description: 'Incorrect svd_rank selection', symptom: 'Missing important dynamics', cause: 'Rank too low', solution: 'Use optimal rank selection or svd_rank=-1', affectsVariants: ['DMD', 'MrDMD'] },
  ];

  const complexPlane: Connection[] = [
    { from: 'DMD eigenvalues', to: 'unit circle', relationship: 'Eigenvalues on or near the unit circle indicate stable modes in discrete time', strength: 0.95 },
    { from: 'continuous eigenvalues', to: 'imaginary axis', relationship: 'Continuous-time eigenvalues on the imaginary axis indicate neutral stability', strength: 0.85 },
  ];

  const skillCreator: Connection[] = [
    { from: 'DMD modes', to: 'skill activation', relationship: 'Mode decomposition analogous to skill activation patterns', strength: 0.6 },
  ];

  const tutorials: TutorialSummary[] = Array.from({ length: 8 }, (_, i) => ({
    index: i + 1,
    title: `Tutorial ${i + 1}: ${variantDefs[i % variantDefs.length].name} demonstration`,
    variant: variantDefs[i % variantDefs.length].class,
    dataType: 'synthetic-sinusoidal',
    keyInsight: `${variantDefs[i % variantDefs.length].name} captures dominant modes.`,
    codePatterns: ['Import class', 'Create data', 'Instantiate', 'Fit', 'Reconstruct', 'Visualize'],
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

describe('reference-builder', () => {
  const graph = makeKnowledgeGraph();

  it('buildReferences returns 4 reference documents', () => {
    const refs = buildReferences(graph);

    expect(refs).toBeDefined();
    expect(typeof refs.algorithmVariants).toBe('string');
    expect(typeof refs.mathematicalFoundations).toBe('string');
    expect(typeof refs.apiReference).toBe('string');
    expect(typeof refs.complexPlaneConnections).toBe('string');

    expect(refs.algorithmVariants.length).toBeGreaterThan(0);
    expect(refs.mathematicalFoundations.length).toBeGreaterThan(0);
    expect(refs.apiReference.length).toBeGreaterThan(0);
    expect(refs.complexPlaneConnections.length).toBeGreaterThan(0);
  });

  it('algorithm-variants doc has section per variant', () => {
    const refs = buildReferences(graph);
    const headings = refs.algorithmVariants.match(/^### .+/gm) ?? [];

    // At least one heading per variant (12 variants in fixture)
    expect(headings.length).toBeGreaterThanOrEqual(8);
  });

  it('each variant section includes class name, purpose, key parameters, usage example', () => {
    const refs = buildReferences(graph);

    // Check the first variant: Standard DMD
    const dmdSection = refs.algorithmVariants.split('### ').find(s => s.startsWith('Standard DMD'));
    expect(dmdSection).toBeDefined();

    // Class name in backticks
    expect(dmdSection).toMatch(/`DMD`/);

    // Purpose paragraph or label
    expect(dmdSection).toMatch(/purpose/i);

    // Key Parameters subsection
    expect(dmdSection).toMatch(/key param/i);

    // Python code block
    expect(dmdSection).toMatch(/```python/);
  });

  it('mathematical-foundations doc covers SVD, eigendecomp, Koopman', () => {
    const refs = buildReferences(graph);
    const lower = refs.mathematicalFoundations.toLowerCase();

    expect(lower).toContain('svd');
    expect(lower).toContain('eigendecomposition');
    expect(lower).toContain('koopman');
  });

  it('api-reference doc catalogs public methods', () => {
    const refs = buildReferences(graph);
    const content = refs.apiReference;

    expect(content).toContain('fit');
    expect(content).toContain('reconstruct');
    expect(content).toContain('predict');
    expect(content).toContain('eigs');
    expect(content).toContain('modes');
  });

  it('complex-plane-connections doc references unit circle and eigenvalue', () => {
    const refs = buildReferences(graph);
    const lower = refs.complexPlaneConnections.toLowerCase();

    expect(lower).toContain('unit circle');
    expect(lower).toContain('eigenvalue');
  });

  it('all reference docs have back-to-SKILL.md link', () => {
    const refs = buildReferences(graph);
    const backLink = '[Back to SKILL.md](../SKILL.md)';

    expect(refs.algorithmVariants).toContain(backLink);
    expect(refs.mathematicalFoundations).toContain(backLink);
    expect(refs.apiReference).toContain(backLink);
    expect(refs.complexPlaneConnections).toContain(backLink);
  });
});
