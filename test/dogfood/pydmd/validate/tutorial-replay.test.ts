import { describe, it, expect } from 'vitest';
import type {
  KnowledgeGraph,
  AlgorithmVariant,
  DecisionNode,
  Concept,
  ClassNode,
  APIMethod,
  TutorialSummary,
  Connection,
} from '../../../../src/dogfood/pydmd/types.js';
import type { GeneratedSkill } from '../../../../src/dogfood/pydmd/generate/types.js';
import type { ReplayReport, ReplayResult } from '../../../../src/dogfood/pydmd/validate/types.js';
import { replayTutorials } from '../../../../src/dogfood/pydmd/validate/tutorial-replay.js';
import { computeOverallScore, computeReplayScore } from '../../../../src/dogfood/pydmd/validate/scoring.js';

// --- Factory functions ---

const variantDefs = [
  { name: 'Standard DMD', cls: 'DMD', purpose: 'Basic DMD for clean data' },
  { name: 'BOP-DMD', cls: 'BOPDMD', purpose: 'Bagging-optimized DMD for noisy data' },
  { name: 'Multi-Resolution DMD', cls: 'MrDMD', purpose: 'Multi-timescale decomposition' },
  { name: 'DMD with Control', cls: 'DMDc', purpose: 'DMD with external control inputs' },
  { name: 'Forward-Backward DMD', cls: 'FbDMD', purpose: 'Noise-robust DMD' },
  { name: 'Extended DMD', cls: 'EDMD', purpose: 'Koopman operator approximation' },
  { name: 'Compressed DMD', cls: 'CDMD', purpose: 'DMD for high-dimensional data' },
  { name: 'Hankel DMD', cls: 'HankelDMD', purpose: 'Time-delay embedding DMD' },
  { name: 'Sparsity-Promoting DMD', cls: 'SpDMD', purpose: 'Sparse mode selection' },
  { name: 'LANDO', cls: 'LANDO', purpose: 'Nonlinear Koopman dynamics' },
];

function makeKnowledgeGraph(): KnowledgeGraph {
  const algorithmVariants: AlgorithmVariant[] = variantDefs.map((v, i) => ({
    name: v.name,
    class: v.cls,
    purpose: v.purpose,
    distinguishing: [`Key feature of ${v.name}`],
    parameters: [
      { name: 'svd_rank', type: 'int', default: '-1', description: 'Rank truncation' },
    ],
    mathBasis: `Mathematical basis for ${v.name}`,
    tutorial: i < 10 ? i + 1 : null,
  }));

  const apiMethods: APIMethod[] = [
    { class: 'DMDBase', name: 'fit', signature: '(X)', returnType: 'None', docstring: 'Fit model', isInherited: false },
    { class: 'DMDBase', name: 'predict', signature: '(X)', returnType: 'ndarray', docstring: 'Predict', isInherited: false },
    { class: 'DMDBase', name: 'eigs', signature: '', returnType: 'ndarray', docstring: 'Eigenvalues', isInherited: false },
    { class: 'DMDBase', name: 'modes', signature: '', returnType: 'ndarray', docstring: 'DMD modes', isInherited: false },
    { class: 'DMDBase', name: 'reconstructed_data', signature: '', returnType: 'ndarray', docstring: 'Reconstructed data', isInherited: false },
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
    project: { name: 'PyDMD', version: '1.0.0', description: 'Python DMD', license: 'MIT' },
    architecture: {
      classHierarchy: [
        { name: 'DMDBase', parent: null, module: 'pydmd.dmdbase', methods: ['fit', 'predict', 'eigs', 'modes', 'reconstructed_data'], isAbstract: true },
        ...variantDefs.map(v => ({
          name: v.cls,
          parent: 'DMDBase',
          module: `pydmd.${v.cls.toLowerCase()}`,
          methods: ['fit', 'predict'],
          isAbstract: false,
        })),
      ],
      apiSurface: apiMethods,
      moduleMap: [],
    },
    concepts: {
      mathematical: [
        { name: 'SVD', category: 'mathematical', description: 'SVD factorization.', relatedConcepts: [], sourceFiles: [] },
      ],
      algorithmic: algorithmVariants,
      domain: [],
    },
    patterns: {
      usage: [
        {
          name: 'standard-dmd-workflow',
          steps: ['Import', 'Create', 'Fit', 'Analyze'],
          codeExample: 'from pydmd import DMD\ndmd = DMD()\ndmd.fit(X)',
          variants: ['DMD'],
        },
      ],
      selection: [],
      pitfalls: [],
    },
    tutorials,
    crossReferences: { complexPlane: [], skillCreator: [] },
  };
}

function makeGeneratedSkill(graph: KnowledgeGraph): GeneratedSkill {
  // Build a skill that covers most variants well, but deliberately lacks
  // coverage for some tutorial-specific details to test gap detection
  let skillMd = `# PyDMD Knowledge Skill\n\n`;
  skillMd += `## Algorithm Variants\n\n`;

  for (const v of graph.concepts.algorithmic) {
    skillMd += `### ${v.name} (\`${v.class}\`)\n`;
    skillMd += `**Purpose:** ${v.purpose}\n`;
    skillMd += `**Parameters:** svd_rank\n`;
    skillMd += `**Workflow:** Import ${v.class}, create instance, fit data, analyze results\n\n`;
  }

  skillMd += `## Core Pattern\n\n`;
  skillMd += `\`\`\`python\nfrom pydmd import DMD\ndmd = DMD(svd_rank=2)\ndmd.fit(X)\nresult = dmd.reconstructed_data\n\`\`\`\n\n`;
  skillMd += `## Workflow\n\n`;
  skillMd += `1. Import the appropriate DMD class\n`;
  skillMd += `2. Instantiate with parameters (e.g., svd_rank)\n`;
  skillMd += `3. Call fit(X) with snapshot matrix\n`;
  skillMd += `4. Access results: eigs, modes, reconstructed_data\n\n`;

  // Add tutorial references for the first 7 tutorials only
  // (tutorials 8-10 will have gaps for testing)
  skillMd += `## Tutorials\n\n`;
  for (let i = 0; i < 7; i++) {
    const t = graph.tutorials[i];
    skillMd += `- Tutorial ${t.index}: ${t.title} using ${t.variant}\n`;
  }

  return {
    skillMd,
    wordCount: skillMd.split(/\s+/).length,
    sections: [],
    warnings: [],
  };
}

// --- Tests ---

describe('tutorial-replay', () => {
  const kg = makeKnowledgeGraph();
  const skill = makeGeneratedSkill(kg);

  describe('replayTutorials', () => {
    it('returns ReplayReport with all required fields', () => {
      const result: ReplayReport = replayTutorials(skill, kg);

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('maxScore');
      expect(result).toHaveProperty('passRate');
      expect(result).toHaveProperty('identifiedGaps');

      expect(Array.isArray(result.results)).toBe(true);
      expect(Array.isArray(result.identifiedGaps)).toBe(true);
    });

    it('scores each tutorial on 5 boolean criteria with score 0-5', () => {
      const result = replayTutorials(skill, kg);

      for (const r of result.results) {
        expect(typeof r.correctVariant).toBe('boolean');
        expect(typeof r.correctWorkflow).toBe('boolean');
        expect(typeof r.correctParameters).toBe('boolean');
        expect(typeof r.producesResults).toBe('boolean');
        expect(typeof r.qualitativeMatch).toBe('boolean');
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(5);
      }
    });

    it('identifies correct variant for standard DMD tutorial', () => {
      const result = replayTutorials(skill, kg);

      // Tutorial 1 is about Standard DMD
      const dmdTutorial = result.results.find(r => r.tutorialNumber === 1);
      expect(dmdTutorial).toBeDefined();
      expect(dmdTutorial!.correctVariant).toBe(true);
    });

    it('detects missing guidance as a gap', () => {
      // Create a skill that deliberately omits some tutorials
      const sparseSkill: GeneratedSkill = {
        skillMd: '# Minimal Skill\n\nOnly covers DMD basics.\n',
        wordCount: 5,
        sections: [],
        warnings: [],
      };

      const result = replayTutorials(sparseSkill, kg);

      // With a minimal skill, there should be gaps identified
      expect(result.identifiedGaps.length).toBeGreaterThan(0);
    });

    it('computes passRate as percentage of tutorials scoring 3+', () => {
      const result = replayTutorials(skill, kg);

      const totalTutorials = result.results.length;
      const passing = result.results.filter(r => r.score >= 3).length;
      const expectedPassRate = Math.round((passing / totalTutorials) * 100);

      expect(result.passRate).toBe(expectedPassRate);
    });
  });
});

describe('scoring', () => {
  describe('computeOverallScore', () => {
    it('weights dimensions correctly: API 30%, algorithm 25%, decision tree 25%, coverage 20%', () => {
      const result = computeOverallScore(
        { methodsClaimed: 10, methodsVerified: 10, methodsMissing: 0, signatureMatches: 10, signatureMismatches: [] },
        { variantsClaimed: 8, variantsVerified: 8, purposeCorrect: 8, parameterCorrect: 8 },
        { totalPaths: 10, pathsValidated: 10, pathsIncorrect: [] },
        { apiCoverage: 100, variantCoverage: 100, tutorialCoverage: 100 },
      );

      // All perfect => 100 * 0.3 + 100 * 0.25 + 100 * 0.25 + 100 * 0.2 = 100
      expect(result).toBe(100);
    });
  });

  describe('computeReplayScore', () => {
    it('sums boolean criteria to produce score 0-5', () => {
      const score = computeReplayScore({
        tutorialNumber: 1,
        objective: 'Test',
        correctVariant: true,
        correctWorkflow: true,
        correctParameters: true,
        producesResults: true,
        qualitativeMatch: true,
        gaps: [],
      });

      expect(score).toBe(5);
    });
  });
});
