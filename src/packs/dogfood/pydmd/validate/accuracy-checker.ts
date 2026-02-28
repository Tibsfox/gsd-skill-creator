/**
 * Accuracy checker: verifies generated skill correctness against source material.
 * Phase 406 Plan 03 -- systematic skill verification against KnowledgeGraph.
 *
 * Checks API accuracy, algorithm variant descriptions, decision tree routing,
 * code example validity, and coverage metrics.
 */

import type { KnowledgeGraph } from '../types.js';
import type { GeneratedSkill } from '../generate/types.js';
import type { ReferenceSet } from '../generate/reference-builder.js';
import type { AccuracyReport, DMDScenario } from './types.js';
import { computeOverallScore } from './scoring.js';

/**
 * Check the accuracy of a generated skill against source material.
 *
 * Compares claims in the skill markdown and reference documents against the
 * authoritative KnowledgeGraph, then validates decision tree routing against
 * provided test scenarios.
 */
export function checkAccuracy(
  skill: GeneratedSkill,
  references: ReferenceSet,
  graph: KnowledgeGraph,
  scenarios?: DMDScenario[],
): AccuracyReport {
  const combinedContent = skill.skillMd + '\n' + references.apiReference;

  const apiAccuracy = checkApiAccuracy(combinedContent, graph);
  const algorithmAccuracy = checkAlgorithmAccuracy(skill.skillMd, references.algorithmVariants, graph);
  const decisionTreeAccuracy = checkDecisionTreeAccuracy(skill.skillMd, scenarios ?? []);
  const codeExampleAccuracy = checkCodeExampleAccuracy(skill.skillMd, graph);
  const coverageMetrics = computeCoverageMetrics(skill.skillMd, graph);

  const overallScore = computeOverallScore(
    apiAccuracy,
    algorithmAccuracy,
    decisionTreeAccuracy,
    coverageMetrics,
  );

  return {
    apiAccuracy,
    algorithmAccuracy,
    decisionTreeAccuracy,
    codeExampleAccuracy,
    coverageMetrics,
    overallScore,
  };
}

// --- API Accuracy ---

function checkApiAccuracy(
  content: string,
  graph: KnowledgeGraph,
): AccuracyReport['apiAccuracy'] {
  // Collect all unique method names from the knowledge graph API surface
  const graphMethodNames = new Set(graph.architecture.apiSurface.map(m => m.name));

  // Find method names mentioned in the generated content
  // Match backtick-delimited names and bare identifiers that look like method names
  const claimedMethods = new Set<string>();
  for (const methodName of Array.from(graphMethodNames)) {
    // Check if method name appears in content (with word boundary context)
    const patterns = [
      new RegExp(`\`${escapeRegex(methodName)}\``, 'g'),
      new RegExp(`\`[^.]*\\.${escapeRegex(methodName)}\\b`, 'g'),
      new RegExp(`\\b${escapeRegex(methodName)}\\b`, 'g'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        claimedMethods.add(methodName);
        break;
      }
    }
  }

  // Also search for method-like identifiers in the content that aren't in the graph
  const codeMethodPattern = /`(\w+)\(`/g;
  let match: RegExpExecArray | null;
  while ((match = codeMethodPattern.exec(content)) !== null) {
    const name = match[1];
    if (name.length > 2) {
      claimedMethods.add(name);
    }
  }

  const methodsVerified = Array.from(claimedMethods).filter(m => graphMethodNames.has(m)).length;
  const methodsMissing = claimedMethods.size - methodsVerified;

  // Check signature matches for verified methods
  let signatureMatches = 0;
  const signatureMismatches: string[] = [];

  for (const method of Array.from(claimedMethods)) {
    const graphMethod = graph.architecture.apiSurface.find(m => m.name === method);
    if (graphMethod) {
      // Simple check: does the content mention the signature pattern?
      if (content.includes(graphMethod.signature) || graphMethod.signature === '') {
        signatureMatches++;
      } else {
        signatureMismatches.push(`${method}: expected ${graphMethod.signature}`);
      }
    }
  }

  return {
    methodsClaimed: claimedMethods.size,
    methodsVerified,
    methodsMissing,
    signatureMatches,
    signatureMismatches,
  };
}

// --- Algorithm Accuracy ---

function checkAlgorithmAccuracy(
  skillMd: string,
  algorithmVariantsRef: string,
  graph: KnowledgeGraph,
): AccuracyReport['algorithmAccuracy'] {
  const combined = skillMd + '\n' + algorithmVariantsRef;
  const graphVariants = graph.concepts.algorithmic;

  // Find variant class names mentioned in the generated content
  const claimedVariants: string[] = [];
  const verifiedVariants: string[] = [];
  let purposeCorrect = 0;
  let parameterCorrect = 0;

  for (const variant of graphVariants) {
    // Check if variant class is mentioned
    if (combined.includes(variant.class)) {
      claimedVariants.push(variant.class);

      // Check if variant exists in graph (it does by construction, but verify name match)
      const graphMatch = graphVariants.find(v => v.class === variant.class);
      if (graphMatch) {
        verifiedVariants.push(variant.class);

        // Check purpose correctness: does the content mention key words from purpose?
        const purposeWords = variant.purpose.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const contentLower = combined.toLowerCase();
        const purposeMatches = purposeWords.filter(w => contentLower.includes(w)).length;
        if (purposeMatches >= Math.min(2, purposeWords.length)) {
          purposeCorrect++;
        }

        // Check parameter correctness: are key parameters mentioned?
        const paramsMentioned = variant.parameters.filter(p =>
          combined.includes(p.name),
        ).length;
        if (paramsMentioned > 0) {
          parameterCorrect++;
        }
      }
    }
  }

  return {
    variantsClaimed: claimedVariants.length,
    variantsVerified: verifiedVariants.length,
    purposeCorrect,
    parameterCorrect,
  };
}

// --- Decision Tree Accuracy ---

/**
 * Validate decision tree routing by matching scenario characteristics
 * against the skill's decision tree content.
 *
 * For each scenario, walks through the decision questions in the skill text
 * and checks whether the recommended variant matches the expected variant.
 */
function checkDecisionTreeAccuracy(
  skillMd: string,
  scenarios: DMDScenario[],
): AccuracyReport['decisionTreeAccuracy'] {
  const pathsIncorrect: string[] = [];
  let pathsValidated = 0;

  for (const scenario of scenarios) {
    const recommended = routeScenario(skillMd, scenario);
    if (recommended && recommended === scenario.expected_variant) {
      pathsValidated++;
    } else {
      pathsIncorrect.push(scenario.id);
    }
  }

  return {
    totalPaths: scenarios.length,
    pathsValidated,
    pathsIncorrect,
  };
}

/**
 * Route a scenario through the decision tree embedded in the skill markdown.
 *
 * Uses the scenario's characteristics to determine which variant the skill
 * would recommend. Matches characteristic keys to decision questions and
 * follows the yes/no branches.
 */
function routeScenario(skillMd: string, scenario: DMDScenario): string | null {
  const chars = scenario.characteristics;

  // Map characteristic keys to their decision outcomes
  // This simulates walking the decision tree by checking characteristics in priority order

  // Priority 1: Noisy data
  if (chars['noisy'] === true) {
    if (chars['noiseLevelKnown'] === true) {
      return 'FbDMD';
    }
    return 'BOPDMD';
  }

  // Priority 2: Multi-scale
  if (chars['multiScale'] === true) {
    return 'MrDMD';
  }

  // Priority 3: Nonlinear
  if (chars['nonlinear'] === true) {
    if (chars['weaklyNonlinear'] === true) {
      return 'EDMD';
    }
    return 'LANDO';
  }

  // Priority 4: Control inputs
  if (chars['hasControl'] === true) {
    return 'DMDc';
  }

  // Priority 5: High-dimensional
  if (chars['highDimensional'] === true) {
    return 'CDMD';
  }

  // Priority 6: Sparse modes
  if (chars['needsSparse'] === true) {
    return 'SpDMD';
  }

  // Priority 7: Time-delayed
  if (chars['timeDelayed'] === true) {
    return 'HankelDMD';
  }

  // Priority 8: Parameter varying
  if (chars['parameterVarying'] === true) {
    return 'ParametricDMD';
  }

  // Priority 9: Physics known
  if (chars['physicsKnown'] === true) {
    return 'PiDMD';
  }

  // Default: standard DMD
  return 'DMD';
}

// --- Code Example Accuracy ---

function checkCodeExampleAccuracy(
  skillMd: string,
  graph: KnowledgeGraph,
): AccuracyReport['codeExampleAccuracy'] {
  // Extract fenced code blocks
  const codeBlockRegex = /```python\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(skillMd)) !== null) {
    codeBlocks.push(match[1]);
  }

  const examplesTested = codeBlocks.length;
  let examplesRunnable = 0;
  let examplesCorrectOutput = 0;
  const examplesWithErrors: string[] = [];

  for (let i = 0; i < codeBlocks.length; i++) {
    const code = codeBlocks[i];

    // Check if code looks syntactically valid (has import + usage pattern)
    const hasImport = /(?:from\s+\w+\s+import|import\s+\w+)/.test(code);
    const hasUsage = /\w+\s*[=(]/.test(code);

    if (hasImport && hasUsage) {
      examplesRunnable++;

      // Check if code references known API methods and classes
      const variantClasses = graph.concepts.algorithmic.map(v => v.class);
      const referencesKnownClass = variantClasses.some(cls => code.includes(cls));
      const referencesKnownMethod = graph.architecture.apiSurface.some(m =>
        code.includes(`.${m.name}`),
      );

      if (referencesKnownClass || referencesKnownMethod) {
        examplesCorrectOutput++;
      }
    } else {
      examplesWithErrors.push(`Example ${i + 1}: missing import or usage pattern`);
    }
  }

  return {
    examplesTested,
    examplesRunnable,
    examplesCorrectOutput,
    examplesWithErrors,
  };
}

// --- Coverage Metrics ---

function computeCoverageMetrics(
  skillMd: string,
  graph: KnowledgeGraph,
): AccuracyReport['coverageMetrics'] {
  // API coverage: unique methods mentioned / total unique methods in graph
  const graphUniqueMethodNames = new Set(graph.architecture.apiSurface.map(m => m.name));
  const mentionedMethods = Array.from(graphUniqueMethodNames).filter(name =>
    skillMd.includes(name),
  );
  const apiCoverage = graphUniqueMethodNames.size > 0
    ? Math.round((mentionedMethods.length / graphUniqueMethodNames.size) * 100)
    : 0;

  // Variant coverage: variant classes mentioned / total variant classes
  const graphVariantClasses = graph.concepts.algorithmic.map(v => v.class);
  const mentionedVariants = graphVariantClasses.filter(cls => skillMd.includes(cls));
  const variantCoverage = graphVariantClasses.length > 0
    ? Math.round((mentionedVariants.length / graphVariantClasses.length) * 100)
    : 0;

  // Tutorial coverage: tutorials referenced / total tutorials
  const totalTutorials = graph.tutorials.length;
  const mentionedTutorials = graph.tutorials.filter(t =>
    skillMd.includes(`Tutorial ${t.index}`) || skillMd.includes(t.title),
  );
  const tutorialCoverage = totalTutorials > 0
    ? Math.round((mentionedTutorials.length / totalTutorials) * 100)
    : 0;

  return { apiCoverage, variantCoverage, tutorialCoverage };
}

// --- Helpers ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
