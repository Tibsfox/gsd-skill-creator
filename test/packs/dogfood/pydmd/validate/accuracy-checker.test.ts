import { describe, it, expect } from 'vitest';
import type {
  KnowledgeGraph,
  AlgorithmVariant,
  DecisionNode,
  Concept,
  ClassNode,
  ModuleNode,
  APIMethod,
  UsagePattern,
  Pitfall,
  TutorialSummary,
  Connection,
} from '../../../../../src/packs/dogfood/pydmd/types.js';
import type { GeneratedSkill } from '../../../../../src/packs/dogfood/pydmd/generate/types.js';
import type { ReferenceSet } from '../../../../../src/packs/dogfood/pydmd/generate/reference-builder.js';
import type { AccuracyReport, DMDScenario } from '../../../../../src/packs/dogfood/pydmd/validate/types.js';
import { checkAccuracy } from '../../../../../src/packs/dogfood/pydmd/validate/accuracy-checker.js';

// --- Factory functions ---

function makeAPIMethod(overrides: Partial<APIMethod> = {}): APIMethod {
  return {
    class: 'DMD',
    name: 'fit',
    signature: '(X)',
    returnType: 'None',
    docstring: 'Fit the DMD model to snapshot data.',
    isInherited: false,
    ...overrides,
  };
}

function makeAlgorithmVariant(overrides: Partial<AlgorithmVariant> = {}): AlgorithmVariant {
  return {
    name: 'Standard DMD',
    class: 'DMD',
    purpose: 'Basic dynamic mode decomposition for clean data',
    distinguishing: ['Baseline SVD-based decomposition'],
    parameters: [
      { name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' },
    ],
    mathBasis: 'Singular Value Decomposition of snapshot matrices',
    tutorial: 1,
    ...overrides,
  };
}

function makeDecisionNode(): DecisionNode {
  return {
    question: 'Is your data noisy?',
    yes: {
      question: 'Is the noise level known or characterizable?',
      yes: 'Forward-Backward DMD (FbDMD)',
      no: 'BOP-DMD (BOPDMD)',
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
            question: 'Is the dataset very large or high-dimensional?',
            yes: 'Compressed DMD (CDMD)',
            no: {
              question: 'Do you want sparse mode selection?',
              yes: 'Sparsity-Promoting DMD (SpDMD)',
              no: {
                question: 'Is time-delay embedding needed?',
                yes: 'Hankel DMD (HankelDMD)',
                no: {
                  question: 'Are system parameters varying?',
                  yes: 'Parametric DMD (ParametricDMD)',
                  no: {
                    question: 'Do you need physics-informed constraints?',
                    yes: 'Physics-Informed DMD (PiDMD)',
                    no: 'Standard DMD (DMD)',
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

const variantDefs = [
  { name: 'Standard DMD', cls: 'DMD', purpose: 'Basic dynamic mode decomposition' },
  { name: 'BOP-DMD', cls: 'BOPDMD', purpose: 'Bagging-optimized DMD for noisy data' },
  { name: 'Multi-Resolution DMD', cls: 'MrDMD', purpose: 'Multi-timescale decomposition' },
  { name: 'DMD with Control', cls: 'DMDc', purpose: 'DMD with external control inputs' },
  { name: 'Forward-Backward DMD', cls: 'FbDMD', purpose: 'Noise-robust DMD via averaging' },
  { name: 'Extended DMD', cls: 'EDMD', purpose: 'Koopman operator approximation' },
  { name: 'Compressed DMD', cls: 'CDMD', purpose: 'DMD with compressed measurements' },
  { name: 'Hankel DMD', cls: 'HankelDMD', purpose: 'Time-delay embedding DMD' },
  { name: 'Sparsity-Promoting DMD', cls: 'SpDMD', purpose: 'Sparse mode selection' },
  { name: 'Parametric DMD', cls: 'ParametricDMD', purpose: 'Parametric interpolation of DMD models' },
  { name: 'Physics-Informed DMD', cls: 'PiDMD', purpose: 'DMD with physics constraints' },
  { name: 'LANDO', cls: 'LANDO', purpose: 'Nonlinear dynamics via Koopman' },
];

function makeKnowledgeGraph(): KnowledgeGraph {
  const algorithmVariants: AlgorithmVariant[] = variantDefs.map((v, i) => ({
    name: v.name,
    class: v.cls,
    purpose: v.purpose,
    distinguishing: [`Distinguishing feature of ${v.name}`],
    parameters: [
      { name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' },
    ],
    mathBasis: `Mathematical basis for ${v.name}`,
    tutorial: i < 10 ? i + 1 : null,
  }));

  const apiMethods: APIMethod[] = [
    makeAPIMethod({ class: 'DMDBase', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit the model' }),
    makeAPIMethod({ class: 'DMDBase', name: 'predict', signature: '(X)', returnType: 'ndarray', docstring: 'Predict future states' }),
    makeAPIMethod({ class: 'DMDBase', name: 'eigs', signature: '', returnType: 'ndarray', docstring: 'Eigenvalues property' }),
    makeAPIMethod({ class: 'DMDBase', name: 'modes', signature: '', returnType: 'ndarray', docstring: 'DMD modes property' }),
    makeAPIMethod({ class: 'DMDBase', name: 'dynamics', signature: '', returnType: 'ndarray', docstring: 'Temporal dynamics' }),
    makeAPIMethod({ class: 'DMDBase', name: 'reconstructed_data', signature: '', returnType: 'ndarray', docstring: 'Reconstructed data' }),
    makeAPIMethod({ class: 'DMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit standard DMD', isInherited: true }),
    makeAPIMethod({ class: 'DMD', name: 'predict', signature: '(X)', returnType: 'ndarray', docstring: 'Predict', isInherited: true }),
    makeAPIMethod({ class: 'BOPDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit BOP-DMD', isInherited: true }),
    makeAPIMethod({ class: 'BOPDMD', name: 'trial_size', signature: '', returnType: 'int', docstring: 'Number of trials' }),
    makeAPIMethod({ class: 'MrDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit multi-resolution DMD', isInherited: true }),
    makeAPIMethod({ class: 'MrDMD', name: 'partial_eigs', signature: '(level)', returnType: 'ndarray', docstring: 'Eigenvalues at given level' }),
    makeAPIMethod({ class: 'DMDc', name: 'fit', signature: '(X, I)', returnType: 'None', docstring: 'Fit DMDc with control input' }),
    makeAPIMethod({ class: 'FbDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit forward-backward DMD', isInherited: true }),
    makeAPIMethod({ class: 'EDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit extended DMD', isInherited: true }),
    makeAPIMethod({ class: 'CDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit compressed DMD', isInherited: true }),
    makeAPIMethod({ class: 'HankelDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit Hankel DMD', isInherited: true }),
    makeAPIMethod({ class: 'SpDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit sparse DMD', isInherited: true }),
    makeAPIMethod({ class: 'ParametricDMD', name: 'fit', signature: '(X, params)', returnType: 'None', docstring: 'Fit parametric DMD' }),
    makeAPIMethod({ class: 'PiDMD', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit physics-informed DMD', isInherited: true }),
  ];

  const tutorials: TutorialSummary[] = Array.from({ length: 10 }, (_, i) => ({
    index: i + 1,
    title: `Tutorial ${i + 1}: ${variantDefs[i % variantDefs.length].name}`,
    variant: variantDefs[i % variantDefs.length].cls,
    dataType: 'synthetic-sinusoidal',
    keyInsight: `${variantDefs[i % variantDefs.length].name} captures dominant modes.`,
    codePatterns: ['Import DMD class', 'Instantiate with parameters', 'Fit model', 'Reconstruct data', 'Visualize results'],
  }));

  return {
    project: { name: 'PyDMD', version: '1.0.0', description: 'Python Dynamic Mode Decomposition', license: 'MIT' },
    architecture: {
      classHierarchy: [
        { name: 'DMDBase', parent: null, module: 'pydmd.dmdbase', methods: ['fit', 'predict', 'eigs', 'modes', 'dynamics', 'reconstructed_data'], isAbstract: true },
        ...variantDefs.map(v => ({
          name: v.cls,
          parent: 'DMDBase',
          module: `pydmd.${v.cls.toLowerCase()}`,
          methods: ['fit', 'predict'],
          isAbstract: false,
        })),
      ],
      apiSurface: apiMethods,
      moduleMap: variantDefs.map(v => ({
        path: `pydmd/${v.cls.toLowerCase()}.py`,
        classes: [v.cls],
        imports: ['numpy', 'scipy'],
        linesOfCode: 200,
      })),
    },
    concepts: {
      mathematical: [
        { name: 'Singular Value Decomposition', category: 'mathematical', description: 'Matrix factorization for rank truncation.', relatedConcepts: ['Eigendecomposition'], sourceFiles: ['pydmd/dmdbase.py'] },
        { name: 'Eigendecomposition', category: 'mathematical', description: 'Eigenvalue and eigenvector decomposition.', relatedConcepts: ['SVD'], sourceFiles: ['pydmd/dmdbase.py'] },
      ],
      algorithmic: algorithmVariants,
      domain: [
        { name: 'Dynamic Mode Decomposition', category: 'domain', description: 'Data-driven spatiotemporal decomposition.', relatedConcepts: ['SVD'], sourceFiles: ['pydmd/dmd.py'] },
      ],
    },
    patterns: {
      usage: [
        {
          name: 'standard-dmd-workflow',
          steps: ['Import', 'Create data', 'Instantiate', 'Fit', 'Analyze'],
          codeExample: 'from pydmd import DMD\ndmd = DMD(svd_rank=2)\ndmd.fit(X)',
          variants: ['DMD'],
        },
      ],
      selection: [makeDecisionNode()],
      pitfalls: [
        { description: 'Noise sensitivity', symptom: 'Scattered eigenvalues', cause: 'Standard DMD noise', solution: 'Use FbDMD', affectsVariants: ['DMD'] },
      ],
    },
    tutorials,
    crossReferences: {
      complexPlane: [
        { from: 'DMD eigenvalues', to: 'Unit circle', relationship: 'Eigenvalues on unit circle are neutrally stable.', strength: 0.95 },
      ],
      skillCreator: [
        { from: 'Algorithm selection', to: 'Skill activation', relationship: 'Decision tree maps to skill activation.', strength: 0.9 },
      ],
    },
  };
}

function makeGeneratedSkill(graph: KnowledgeGraph): GeneratedSkill {
  // Build a skill markdown that mentions specific methods, variants, and tutorials
  const methodNames = graph.architecture.apiSurface.map(m => m.name);
  const uniqueMethods = [...new Set(methodNames)];
  const variantClasses = graph.concepts.algorithmic.map(v => v.class);

  let skillMd = `# PyDMD Knowledge Skill\n\n`;
  skillMd += `## Quick Reference\n\n`;
  skillMd += `The PyDMD library provides ${variantClasses.length} algorithm variants.\n\n`;
  skillMd += `## API Methods\n\n`;
  for (const m of uniqueMethods) {
    skillMd += `- \`${m}\` -- core API method\n`;
  }
  skillMd += `\n## Algorithm Variants\n\n`;
  for (const v of graph.concepts.algorithmic) {
    skillMd += `### ${v.name} (\`${v.class}\`)\n`;
    skillMd += `**Purpose:** ${v.purpose}\n`;
    skillMd += `**Parameters:** ${v.parameters.map(p => p.name).join(', ')}\n\n`;
  }
  skillMd += `## Choosing Your Algorithm\n\n`;
  skillMd += `### Is your data noisy?\n`;
  skillMd += `**Yes:** Is the noise level known? **Yes:** Use FbDMD. **No:** Use BOPDMD.\n`;
  skillMd += `**No:** Does your data have multiple timescales? **Yes:** Use MrDMD.\n`;
  skillMd += `**No:** Is the system nonlinear? **Yes:** Is it weakly nonlinear? **Yes:** Use EDMD. **No:** Use LANDO.\n`;
  skillMd += `**No:** Do you have control inputs? **Yes:** Use DMDc.\n`;
  skillMd += `**No:** Is the dataset very large? **Yes:** Use CDMD.\n`;
  skillMd += `**No:** Do you want sparse mode selection? **Yes:** Use SpDMD.\n`;
  skillMd += `**No:** Is time-delay embedding needed? **Yes:** Use HankelDMD.\n`;
  skillMd += `**No:** Are system parameters varying? **Yes:** Use ParametricDMD.\n`;
  skillMd += `**No:** Do you need physics-informed constraints? **Yes:** Use PiDMD. **No:** Use DMD.\n\n`;
  skillMd += `## Tutorials\n\n`;
  for (const t of graph.tutorials) {
    skillMd += `- Tutorial ${t.index}: ${t.title} (variant: ${t.variant})\n`;
  }
  skillMd += `\n## Core Pattern\n\n`;
  skillMd += `\`\`\`python\nfrom pydmd import DMD\ndmd = DMD(svd_rank=2)\ndmd.fit(X)\nresult = dmd.reconstructed_data\n\`\`\`\n`;

  return {
    skillMd,
    wordCount: skillMd.split(/\s+/).length,
    sections: [
      { heading: 'Quick Reference', content: '', order: 1 },
      { heading: 'Algorithm Variants', content: '', order: 2 },
      { heading: 'Choosing Your Algorithm', content: '', order: 3 },
    ],
    warnings: [],
  };
}

function makeReferenceSet(graph: KnowledgeGraph): ReferenceSet {
  let algorithmVariants = '# Algorithm Variants\n\n';
  for (const v of graph.concepts.algorithmic) {
    algorithmVariants += `## ${v.name} (\`${v.class}\`)\n${v.purpose}\n\n`;
  }

  let apiReference = '# API Reference\n\n';
  for (const m of graph.architecture.apiSurface) {
    apiReference += `### \`${m.class}.${m.name}${m.signature}\`\n${m.docstring}\n\n`;
  }

  return {
    algorithmVariants,
    mathematicalFoundations: '# Mathematical Foundations\n\nSVD, Eigendecomposition, Koopman\n',
    apiReference,
    complexPlaneConnections: '# Complex Plane Connections\n\nEigenvalues on unit circle.\n',
  };
}

function makeDMDScenarios(): DMDScenario[] {
  return [
    { id: 'noisy-fluid-sim', description: 'Noisy fluid simulation data', characteristics: { noisy: true, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'BOPDMD', reasoning: 'Noisy data with unknown noise level => BOP-DMD' },
    { id: 'clean-oscillating', description: 'Clean oscillating time series', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'DMD', reasoning: 'Clean data => standard DMD' },
    { id: 'video-frames', description: 'High-dimensional video frame data', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: true, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'CDMD', reasoning: 'High-dimensional => compressed DMD' },
    { id: 'transient-event', description: 'Multi-scale transient phenomena', characteristics: { noisy: false, multiScale: true, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'MrDMD', reasoning: 'Multiple timescales => MrDMD' },
    { id: 'controlled-system', description: 'System with external forcing', characteristics: { noisy: false, multiScale: false, hasControl: true, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'DMDc', reasoning: 'Control inputs => DMDc' },
    { id: 'weakly-nonlinear', description: 'Weakly nonlinear oscillator', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: true, weaklyNonlinear: true }, expected_variant: 'EDMD', reasoning: 'Weakly nonlinear => EDMD' },
    { id: 'strongly-nonlinear', description: 'Chaotic nonlinear dynamics', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: true, weaklyNonlinear: false }, expected_variant: 'LANDO', reasoning: 'Strongly nonlinear => LANDO' },
    { id: 'noisy-known-level', description: 'Noisy data with characterizable noise', characteristics: { noisy: true, noiseLevelKnown: true, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'FbDMD', reasoning: 'Known noise => FbDMD' },
    { id: 'sparse-modes-wanted', description: 'Extract only dominant modes from rich spectrum', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: false, needsSparse: true, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'SpDMD', reasoning: 'Sparse modes => SpDMD' },
    { id: 'parametric-sweep', description: 'Parameter study varying Reynolds number', characteristics: { noisy: false, multiScale: false, hasControl: false, highDimensional: false, timeDelayed: false, parameterVarying: true, needsSparse: false, physicsKnown: false, streaming: false, nonlinear: false }, expected_variant: 'ParametricDMD', reasoning: 'Parameter varying => ParametricDMD' },
  ];
}

// --- Tests ---

describe('accuracy-checker', () => {
  const kg = makeKnowledgeGraph();
  const skill = makeGeneratedSkill(kg);
  const refs = makeReferenceSet(kg);
  const scenarios = makeDMDScenarios();

  describe('checkAccuracy', () => {
    it('returns AccuracyReport with all required fields', () => {
      const result: AccuracyReport = checkAccuracy(skill, refs, kg, scenarios);

      expect(result).toHaveProperty('apiAccuracy');
      expect(result).toHaveProperty('algorithmAccuracy');
      expect(result).toHaveProperty('decisionTreeAccuracy');
      expect(result).toHaveProperty('codeExampleAccuracy');
      expect(result).toHaveProperty('coverageMetrics');
      expect(result).toHaveProperty('overallScore');

      expect(result.apiAccuracy).toHaveProperty('methodsClaimed');
      expect(result.apiAccuracy).toHaveProperty('methodsVerified');
      expect(result.apiAccuracy).toHaveProperty('methodsMissing');
      expect(result.apiAccuracy).toHaveProperty('signatureMatches');
      expect(result.apiAccuracy).toHaveProperty('signatureMismatches');
    });

    it('counts API methods mentioned in the skill', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      // The skill mentions fit, predict, eigs, modes, dynamics, reconstructed_data, trial_size, partial_eigs
      expect(result.apiAccuracy.methodsClaimed).toBeGreaterThanOrEqual(5);
    });

    it('verifies algorithm variant descriptions', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      // All 12 variants are in the knowledge graph and mentioned in the skill
      expect(result.algorithmAccuracy.variantsVerified).toBeGreaterThanOrEqual(8);
    });

    it('tests 10 scenarios against decision tree', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      expect(result.decisionTreeAccuracy.totalPaths).toBe(10);
    });

    it('correctly routes noisy data to BOPDMD', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      // noisy-fluid-sim should route to BOPDMD and not appear in pathsIncorrect
      expect(result.decisionTreeAccuracy.pathsIncorrect).not.toContain('noisy-fluid-sim');
    });

    it('correctly routes controlled system to DMDc', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      // controlled-system should route to DMDc and not appear in pathsIncorrect
      expect(result.decisionTreeAccuracy.pathsIncorrect).not.toContain('controlled-system');
    });

    it('calculates API coverage as percentage', () => {
      // KG has 20 API methods total. Skill mentions most of them.
      const result = checkAccuracy(skill, refs, kg, scenarios);

      expect(result.coverageMetrics.apiCoverage).toBeGreaterThanOrEqual(0);
      expect(result.coverageMetrics.apiCoverage).toBeLessThanOrEqual(100);

      // With 20 API methods in graph and most mentioned in skill
      // We expect a reasonable coverage percentage
      const totalMethods = new Set(kg.architecture.apiSurface.map(m => m.name)).size;
      expect(totalMethods).toBeGreaterThan(0);
    });

    it('produces overall score between 0 and 100', () => {
      const result = checkAccuracy(skill, refs, kg, scenarios);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
