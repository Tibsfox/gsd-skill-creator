/**
 * Learn-to-observe bridge (Phase 407).
 *
 * Converts KnowledgeGraph entries produced by the sc:learn pipeline
 * into LearnedObservation records compatible with skill-creator's
 * observation pipeline. This closes the loop between learned knowledge
 * and the normal observe -> detect -> suggest lifecycle.
 *
 * Confidence levels:
 *   1.0  — AlgorithmVariant (derived from source code, highest trust)
 *   0.9  — UsagePattern     (derived from tutorials, high confidence)
 *   0.85 — DecisionTree     (synthesized, slightly lower confidence)
 */

import { randomUUID } from "node:crypto";

import type { KnowledgeGraph } from "../types.js";
import type {
  BridgeOptions,
  BridgeResult,
  LearnedObservation,
  ProvenanceChain,
} from "./types.js";

const DEFAULT_GITHUB_URL = "https://github.com/PyDMD/PyDMD";

/** Generate a unique observation ID. */
function generateId(): string {
  return randomUUID();
}

/** Build a provenance chain for a single observation. */
function buildProvenance(
  filePath: string,
  extractionMethod: string,
  githubUrl: string,
): ProvenanceChain {
  return {
    githubUrl,
    filePath,
    extractionMethod,
    observationId: generateId(),
  };
}

/**
 * Convert a KnowledgeGraph into an array of LearnedObservation records
 * with aggregate statistics.
 *
 * Each AlgorithmVariant becomes a `learned-concept` observation.
 * Each UsagePattern becomes a `learned-pattern` observation.
 * All DecisionNodes collapse into a single `learned-decision-model`.
 */
export function bridgeToObservations(
  knowledgeGraph: KnowledgeGraph,
  options?: BridgeOptions,
): BridgeResult {
  const githubUrl = options?.githubUrl ?? DEFAULT_GITHUB_URL;
  const now = new Date().toISOString();
  const observations: LearnedObservation[] = [];

  // --- AlgorithmVariant -> learned-concept (confidence 1.0) ---
  for (const variant of knowledgeGraph.concepts.algorithmic) {
    observations.push({
      id: generateId(),
      type: "learned-concept",
      source: "sc:learn/pydmd",
      pattern: {
        class: variant.class,
        purpose: variant.purpose,
        parameters: variant.parameters,
        mathBasis: variant.mathBasis,
      },
      confidence: 1.0,
      provenance: buildProvenance(
        variant.class.replace(/\./g, "/") + ".py",
        "structure-analysis",
        githubUrl,
      ),
      timestamp: now,
    });
  }

  // --- UsagePattern -> learned-pattern (confidence 0.9) ---
  for (const pattern of knowledgeGraph.patterns.usage) {
    const suffix = pattern.name || "general";
    observations.push({
      id: generateId(),
      type: "learned-pattern",
      source: `sc:learn/pydmd/tutorial-${suffix}`,
      pattern: {
        steps: pattern.steps,
        codeExample: pattern.codeExample,
        variants: pattern.variants,
      },
      confidence: 0.9,
      provenance: buildProvenance(
        `tutorials/${suffix}.py`,
        "tutorial-parsing",
        githubUrl,
      ),
      timestamp: now,
    });
  }

  // --- DecisionNodes -> single learned-decision-model (confidence 0.85) ---
  if (knowledgeGraph.patterns.selection.length > 0) {
    observations.push({
      id: generateId(),
      type: "learned-decision-model",
      source: "sc:learn/pydmd/synthesis",
      pattern: {
        nodes: knowledgeGraph.patterns.selection,
      },
      confidence: 0.85,
      provenance: buildProvenance(
        "synthesis/decision-tree",
        "decision-tree-synthesis",
        githubUrl,
      ),
      timestamp: now,
    });
  }

  // --- Aggregate stats ---
  const concepts = knowledgeGraph.concepts.algorithmic.length;
  const patterns = knowledgeGraph.patterns.usage.length;
  const decisionModels = knowledgeGraph.patterns.selection.length > 0 ? 1 : 0;

  return {
    observations,
    stats: {
      concepts,
      patterns,
      decisionModels,
      totalObservations: observations.length,
    },
  };
}

/**
 * Class wrapper for lifecycle management.
 * Holds bridge options and provides a `bridge()` method.
 */
export class LearnToObserveBridge {
  private readonly options: BridgeOptions;

  constructor(options?: BridgeOptions) {
    this.options = options ?? {};
  }

  bridge(knowledgeGraph: KnowledgeGraph): BridgeResult {
    return bridgeToObservations(knowledgeGraph, this.options);
  }
}
