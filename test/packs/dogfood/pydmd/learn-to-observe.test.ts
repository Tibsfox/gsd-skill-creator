import { describe, it, expect } from "vitest";
import type { KnowledgeGraph } from "../../../../src/packs/dogfood/pydmd/types.js";
import type {
  BridgeResult,
  LearnedObservation,
} from "../../../../src/packs/dogfood/pydmd/integration/types.js";
import { bridgeToObservations } from "../../../../src/packs/dogfood/pydmd/integration/learn-to-observe.js";

// ---------------------------------------------------------------------------
// Mock helper
// ---------------------------------------------------------------------------

function createMockKnowledgeGraph(
  overrides: Partial<KnowledgeGraph> = {},
): KnowledgeGraph {
  return {
    project: {
      name: "PyDMD",
      version: "1.0.0",
      description: "Python Dynamic Mode Decomposition",
      license: "MIT",
    },
    architecture: {
      classHierarchy: [],
      apiSurface: [],
      moduleMap: [],
    },
    concepts: {
      mathematical: [],
      algorithmic: [
        {
          name: "DMD",
          class: "pydmd.dmd.DMD",
          purpose: "Standard Dynamic Mode Decomposition",
          distinguishing: ["exact", "linear"],
          parameters: [
            { name: "svd_rank", type: "int", default: "-1", description: "SVD truncation rank" },
          ],
          mathBasis: "SVD-based low-rank approximation of the Koopman operator",
          tutorial: 1,
        },
        {
          name: "BOPDMD",
          class: "pydmd.bopdmd.BOPDMD",
          purpose: "Bagging Optimized DMD for noisy data",
          distinguishing: ["bagging", "noise-robust"],
          parameters: [
            { name: "num_trials", type: "int", default: "10", description: "Number of bagging trials" },
          ],
          mathBasis: "Bootstrap aggregation of optimized DMD",
          tutorial: 2,
        },
      ],
      domain: [],
      ...overrides.concepts,
    },
    patterns: {
      usage: [
        {
          name: "basic-fit-predict",
          steps: ["import", "create", "fit", "predict"],
          codeExample: "dmd = DMD(); dmd.fit(data)",
          variants: ["DMD"],
        },
      ],
      selection: [
        {
          question: "Is the data noisy?",
          yes: "BOPDMD",
          no: "DMD",
        },
      ],
      pitfalls: [],
      ...overrides.patterns,
    },
    tutorials: [],
    crossReferences: {
      complexPlane: [],
      skillCreator: [],
    },
    ...overrides,
    // Re-apply nested overrides that the spread above would clobber
    ...(overrides.concepts ? { concepts: { ...{ mathematical: [], algorithmic: [], domain: [] }, ...overrides.concepts } } : {}),
    ...(overrides.patterns ? { patterns: { ...{ usage: [], selection: [], pitfalls: [] }, ...overrides.patterns } } : {}),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("bridgeToObservations", () => {
  it("converts AlgorithmVariant entries to learned-concept observations with confidence 1.0", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    const concepts = result.observations.filter(
      (o) => o.type === "learned-concept",
    );
    expect(concepts).toHaveLength(2);
    for (const obs of concepts) {
      expect(obs.confidence).toBe(1.0);
      expect(obs.source).toMatch(/^sc:learn\//);
      expect(obs.type).toBe("learned-concept");
    }
  });

  it("converts UsagePattern entries to learned-pattern observations with confidence 0.9", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    const patterns = result.observations.filter(
      (o) => o.type === "learned-pattern",
    );
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    for (const obs of patterns) {
      expect(obs.confidence).toBe(0.9);
      expect(obs.source).toMatch(/^sc:learn\/pydmd\/tutorial-/);
      expect(obs.type).toBe("learned-pattern");
    }
  });

  it("converts DecisionTree to a single learned-decision-model observation with confidence 0.85", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    const decisionModels = result.observations.filter(
      (o) => o.type === "learned-decision-model",
    );
    expect(decisionModels).toHaveLength(1);
    expect(decisionModels[0].confidence).toBe(0.85);
    expect(decisionModels[0].source).toBe("sc:learn/pydmd/synthesis");
  });

  it("includes provenance chain on every observation", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    expect(result.observations.length).toBeGreaterThan(0);
    for (const obs of result.observations) {
      expect(obs.provenance).toBeDefined();
      expect(obs.provenance.githubUrl).toBeTruthy();
      expect(obs.provenance.filePath).toBeTruthy();
      expect(obs.provenance.extractionMethod).toBeTruthy();
      expect(obs.provenance.observationId).toBeTruthy();
    }
  });

  it("returns BridgeResult with accurate stats", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    expect(result.stats.totalObservations).toBe(result.observations.length);
    expect(
      result.stats.concepts + result.stats.patterns + result.stats.decisionModels,
    ).toBe(result.stats.totalObservations);

    // With default mock: 2 algo variants, 1 usage pattern, 1 decision node
    expect(result.stats.concepts).toBe(2);
    expect(result.stats.patterns).toBe(1);
    expect(result.stats.decisionModels).toBe(1);
  });

  it("handles empty knowledge graph gracefully", () => {
    const kg = createMockKnowledgeGraph({
      concepts: { mathematical: [], algorithmic: [], domain: [] },
      patterns: { usage: [], selection: [], pitfalls: [] },
    });
    const result: BridgeResult = bridgeToObservations(kg);

    expect(result.observations).toHaveLength(0);
    expect(result.stats.concepts).toBe(0);
    expect(result.stats.patterns).toBe(0);
    expect(result.stats.decisionModels).toBe(0);
    expect(result.stats.totalObservations).toBe(0);
  });

  it("source strings follow sc:learn prefix convention", () => {
    const kg = createMockKnowledgeGraph();
    const result: BridgeResult = bridgeToObservations(kg);

    for (const obs of result.observations) {
      expect(obs.source).toMatch(/^sc:learn\//);
    }
  });
});
