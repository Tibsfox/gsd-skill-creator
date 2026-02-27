/**
 * Pattern synthesizer: cross-references structure, concepts, and tutorial
 * data to build the unified KnowledgeGraph and algorithm selection DecisionTree.
 *
 * Phase 405 Plan 03 -- convergence point of the learn engine.
 */

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
} from '../types.js';
import type { ComplexPlaneMap } from './complex-plane-mapper.js';

// --- KnowledgeGraph assembly ---

export interface SynthesisInput {
  classes: ClassNode[];
  modules: ModuleNode[];
  concepts: Concept[];
  variants: AlgorithmVariant[];
  tutorials: TutorialSummary[];
  complexPlaneMap: ComplexPlaneMap;
  manifest: RepoManifest;
}

/** Derive APIMethod[] from ClassNode[] by flattening method names. */
function deriveAPISurface(classes: ClassNode[]): APIMethod[] {
  const methods: APIMethod[] = [];
  const seen = new Set<string>();

  for (const cls of classes) {
    for (const methodName of cls.methods) {
      const key = `${cls.name}.${methodName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      methods.push({
        class: cls.name,
        name: methodName,
        signature: `${methodName}()`,
        returnType: 'Any',
        docstring: '',
        isInherited: cls.parent !== null,
      });
    }
  }

  return methods;
}

/** Identify common workflow patterns across tutorials. */
function synthesizeUsagePatterns(
  tutorials: TutorialSummary[],
  variants: AlgorithmVariant[],
): UsagePattern[] {
  const patterns: UsagePattern[] = [];

  if (tutorials.length === 0) return patterns;

  // Check for standard workflow pattern (import -> instantiate -> fit -> analyze/reconstruct -> visualize)
  const standardSteps = ['import', 'instantiat', 'fit', 'reconstruct', 'visual'];
  const matchingTutorials = tutorials.filter(t => {
    const combined = t.codePatterns.join(' ').toLowerCase();
    return standardSteps.filter(s => combined.includes(s)).length >= 3;
  });

  if (matchingTutorials.length >= 1) {
    const tutVariants = [...new Set(matchingTutorials.map(t => t.variant))];
    patterns.push({
      name: 'standard-dmd-workflow',
      steps: [
        'Import DMD class from pydmd',
        'Create or load data',
        'Instantiate DMD variant with parameters',
        'Fit model to data matrix',
        'Analyze or reconstruct results',
        'Visualize output',
      ],
      codeExample: [
        'from pydmd import DMD',
        'dmd = DMD(svd_rank=2)',
        'dmd.fit(X)',
        'reconstructed = dmd.reconstructed_data',
      ].join('\n'),
      variants: tutVariants,
    });
  }

  // Data preparation pattern
  const prepTutorials = tutorials.filter(t =>
    t.codePatterns.some((p: string) => p.toLowerCase().includes('data') || p.toLowerCase().includes('load')),
  );
  if (prepTutorials.length > 0) {
    patterns.push({
      name: 'data-preparation',
      steps: [
        'Load or generate raw data',
        'Reshape into snapshot matrix (features x time)',
        'Optionally preprocess (normalize, detrend)',
      ],
      codeExample: 'X = np.vstack([signal_1, signal_2])',
      variants: [...new Set(prepTutorials.map(t => t.variant))],
    });
  }

  return patterns;
}

// --- Pitfall generation ---

function generatePitfalls(
  _concepts: Concept[],
  _variants: AlgorithmVariant[],
): Pitfall[] {
  return [
    {
      description: 'Applying standard DMD to noisy data',
      symptom: 'Eigenvalues scattered far from the unit circle, poor reconstruction',
      cause: 'Standard DMD is sensitive to noise in measurements',
      solution: 'Use FbDMD for forward-backward averaging or BOPDMD for bagging-based noise handling',
      affectsVariants: ['DMD'],
    },
    {
      description: 'Ignoring rank truncation on noisy datasets',
      symptom: 'Too many modes capturing noise rather than signal',
      cause: 'Default svd_rank=-1 retains all singular values including noise',
      solution: 'Set svd_rank to expected number of modes or use OptDMD for automatic rank selection',
      affectsVariants: ['DMD', 'MrDMD', 'HankelDMD'],
    },
    {
      description: 'Wrong time-delay parameter for HankelDMD',
      symptom: 'Modes that do not correspond to physical dynamics',
      cause: 'Arbitrary delay parameter d does not match the system characteristic timescale',
      solution: 'Set d based on the system characteristic timescale or use cross-validation',
      affectsVariants: ['HankelDMD', 'HODMD'],
    },
    {
      description: 'Applying single-scale DMD to multi-timescale data',
      symptom: 'Only the dominant timescale is captured, transient events are missed',
      cause: 'Standard DMD assumes a single characteristic timescale',
      solution: 'Use MrDMD to decompose at multiple temporal resolutions',
      affectsVariants: ['DMD', 'OptDMD'],
    },
    {
      description: 'Neglecting control inputs in controlled systems',
      symptom: 'DMD modes conflate autonomous dynamics with control-driven response',
      cause: 'Standard DMD does not separate state evolution from external forcing',
      solution: 'Use DMDc which explicitly models the control input matrix B',
      affectsVariants: ['DMD', 'FbDMD'],
    },
  ];
}

// --- Cross-reference generation ---

function buildComplexPlaneConnections(complexPlaneMap: ComplexPlaneMap): Connection[] {
  return [
    {
      from: 'DMD eigenvalue analysis',
      to: 'Unit circle stability framework',
      relationship:
        'Eigenvalues on the unit circle represent neutrally stable modes; ' +
        'magnitude encodes stability, angle encodes frequency.',
      strength: 0.95,
    },
    {
      from: 'Mode decomposition',
      to: 'Spatial coordinate system',
      relationship:
        'DMD spatial modes form a basis analogous to skill dimensions in the complex plane.',
      strength: 0.8,
    },
    {
      from: 'Temporal dynamics',
      to: 'Rotational evolution',
      relationship:
        'Mode time evolution lambda^n traces spirals on the complex plane, ' +
        'mirroring skill activation trajectories.',
      strength: 0.85,
    },
  ];
}

function buildSkillCreatorConnections(): Connection[] {
  return [
    {
      from: 'Algorithm selection (decision tree)',
      to: 'Skill activation (choosing the right tool)',
      relationship:
        'The DMD variant selection tree maps to the skill-creator activation model: ' +
        'data characteristics drive which algorithm/skill is most relevant.',
      strength: 0.9,
    },
    {
      from: 'Progressive disclosure in tutorials',
      to: 'Tiered knowledge (summary/active/reference)',
      relationship:
        'Tutorials introduce concepts incrementally, matching the skill-creator ' +
        'pattern of layered knowledge delivery.',
      strength: 0.75,
    },
  ];
}

// --- Decision tree construction ---

/**
 * Build the algorithm selection decision tree from known DMD variant characteristics.
 *
 * The tree uses yes/no questions about data characteristics to route users
 * to the most appropriate DMD variant.
 */
export function buildDecisionTree(
  variants: AlgorithmVariant[],
  _tutorials: TutorialSummary[],
): DecisionNode[] {
  if (variants.length === 0) {
    return [{
      question: 'Do you have data to analyze?',
      yes: 'Standard DMD',
      no: 'No applicable variant',
    }];
  }

  if (variants.length === 1) {
    return [{
      question: 'Do you have data to analyze?',
      yes: variants[0].name,
      no: variants[0].name,
    }];
  }

  // Build the canonical decision tree
  const tree: DecisionNode = {
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
                yes: {
                  question: 'Is it higher-order?',
                  yes: 'Higher-Order DMD (HODMD)',
                  no: 'Hankel DMD',
                },
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

  // Collect leaves present in the tree
  const leaves = collectLeafValues(tree);
  const leafSet = new Set(leaves);

  // Check which input variants are NOT covered by the tree
  const uncoveredVariants = variants.filter(v =>
    !leafSet.has(v.name) &&
    !leafSet.has(v.class) &&
    !leaves.some(l => l.includes(v.class) || l.includes(v.name)),
  );

  // If there are uncovered variants, add an overflow subtree
  if (uncoveredVariants.length > 0) {
    const overflowTree = buildOverflowSubtree(uncoveredVariants);
    // Attach overflow as an alternative path at the bottom of the tree
    const bottomLeaf = findDeepestNoLeaf(tree);
    if (bottomLeaf) {
      const originalNo = bottomLeaf.no;
      bottomLeaf.no = {
        question: 'Do you need a specialized variant?',
        yes: overflowTree,
        no: typeof originalNo === 'string' ? originalNo : 'Standard DMD',
      };
    }
  }

  return [tree];
}

/** Collect all string leaf values from a decision tree. */
function collectLeafValues(node: DecisionNode | string): string[] {
  if (typeof node === 'string') return [node];
  return [...collectLeafValues(node.yes), ...collectLeafValues(node.no)];
}

/** Find the deepest node whose 'no' branch is a string. */
function findDeepestNoLeaf(node: DecisionNode): DecisionNode | null {
  if (typeof node.no === 'string') {
    // Check if there's a deeper node in yes branch
    if (typeof node.yes !== 'string') {
      const deeper = findDeepestNoLeaf(node.yes);
      if (deeper) return deeper;
    }
    return node;
  }
  // Go deeper into no branch first (deeper in tree)
  const fromNo = findDeepestNoLeaf(node.no);
  if (fromNo) return fromNo;
  if (typeof node.yes !== 'string') return findDeepestNoLeaf(node.yes);
  return null;
}

/** Build a subtree for variants not covered by the main tree. */
function buildOverflowSubtree(variants: AlgorithmVariant[]): DecisionNode | string {
  if (variants.length === 0) return 'Standard DMD';
  if (variants.length === 1) return variants[0].name;

  // Split variants in half for a balanced binary tree
  const mid = Math.ceil(variants.length / 2);
  const left = variants.slice(0, mid);
  const right = variants.slice(mid);

  return {
    question: `Does your use case match ${left[0].name}?`,
    yes: buildOverflowSubtree(left),
    no: buildOverflowSubtree(right),
  };
}

// --- Main synthesis ---

/** Cross-reference outputs from all three learn tracks to build the
 *  unified KnowledgeGraph. */
export function synthesizePatterns(input: SynthesisInput): KnowledgeGraph {
  const { classes, modules, concepts, variants, tutorials, complexPlaneMap, manifest } = input;

  // 1. Project metadata
  const project = {
    name: 'PyDMD',
    version: manifest.pythonVersion || 'latest',
    description: 'Python Dynamic Mode Decomposition',
    license: 'MIT',
  };

  // 2. Architecture (passthrough + API surface derivation)
  const architecture = {
    classHierarchy: classes,
    apiSurface: deriveAPISurface(classes),
    moduleMap: modules,
  };

  // 3. Concepts (categorize)
  const mathematical = concepts.filter(c => c.category === 'mathematical');
  const algorithmic = variants;
  const domain = concepts.filter(c => c.category === 'domain');

  // 4. Patterns
  const usage = synthesizeUsagePatterns(tutorials, variants);
  const selection = buildDecisionTree(variants, tutorials);
  const pitfalls = generatePitfalls(concepts, variants);

  // 5. Tutorials (passthrough)
  // Already TutorialSummary[]

  // 6. Cross-references
  const complexPlane = buildComplexPlaneConnections(complexPlaneMap);
  const skillCreator = buildSkillCreatorConnections();

  return {
    project,
    architecture,
    concepts: { mathematical, algorithmic, domain },
    patterns: { usage, selection, pitfalls },
    tutorials,
    crossReferences: { complexPlane, skillCreator },
  };
}
