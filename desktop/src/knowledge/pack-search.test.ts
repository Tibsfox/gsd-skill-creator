import { describe, it, expect } from "vitest";
import { PackSearch } from "./pack-search";
import type { PackCardView, SearchResult } from "./types";

// ---------------------------------------------------------------------------
// Fixture data: 5 mock packs across 3 tiers with distinct searchable content
// ---------------------------------------------------------------------------

function makePack(overrides: Partial<PackCardView> = {}): PackCardView {
  return {
    packId: "TEST-101",
    packName: "Test Pack",
    description: "A test pack for unit testing",
    classification: "core_academic",
    moduleCount: 5,
    prerequisiteCount: 0,
    gradeRange: "K-12",
    tags: ["testing"],
    learningOutcomes: ["Understand testing basics"],
    moduleNames: ["Module A", "Module B"],
    progress: "not-started",
    prerequisitesMet: true,
    icon: "book",
    color: "#4a90d9",
    ...overrides,
  };
}

const MATH = makePack({
  packId: "MATH-101",
  packName: "Mathematics Foundations",
  description: "Core math concepts from arithmetic to algebra",
  classification: "core_academic",
  gradeRange: "PreK - 8th",
  tags: ["mathematics", "numeracy", "STEM"],
  learningOutcomes: [
    "Master arithmetic operations",
    "Understand algebraic thinking",
  ],
  moduleNames: ["Algebra Basics", "Geometry Intro", "Number Sense"],
});

const READ = makePack({
  packId: "READ-101",
  packName: "Reading & Literacy",
  description: "Phonics, vocabulary, and comprehension strategies",
  classification: "core_academic",
  gradeRange: "PreK - 12th",
  tags: ["literacy", "reading", "language-arts"],
  learningOutcomes: [
    "Decode unfamiliar words",
    "Analyze primary sources critically",
  ],
  moduleNames: ["Phonics Foundations", "Vocabulary Building"],
});

const CODE = makePack({
  packId: "CODE-101",
  packName: "Computational Thinking",
  description: "Programming fundamentals and algorithmic reasoning",
  classification: "applied",
  gradeRange: "3rd - College+",
  tags: ["programming", "computer-science", "STEM"],
  learningOutcomes: [
    "Write simple programs",
    "Decompose problems into steps",
  ],
  moduleNames: ["Block Coding", "Text-Based Programming"],
});

const PHILO = makePack({
  packId: "PHILO-101",
  packName: "Philosophy & Ethics",
  description: "Wonder, questioning, logic, and moral reasoning",
  classification: "specialized",
  gradeRange: "6th - College+",
  tags: ["philosophy", "ethics", "critical-thinking"],
  learningOutcomes: [
    "Construct valid arguments",
    "Evaluate ethical dilemmas",
  ],
  moduleNames: ["Wonder & Questioning", "Logic & Reasoning"],
});

const ENVR = makePack({
  packId: "ENVR-101",
  packName: "Environmental Science",
  description: "Ecosystems, sustainability, and climate science",
  classification: "applied",
  gradeRange: "3rd - 12th",
  tags: ["environment", "ecology", "sustainability"],
  learningOutcomes: [
    "Explain ecosystem interactions",
    "Assess human environmental impact",
  ],
  moduleNames: ["Ecosystems", "Climate & Weather"],
});

const ALL_PACKS = [MATH, READ, CODE, PHILO, ENVR];

// Topological order: MATH -> READ -> CODE -> ENVR -> PHILO
const TOPO_ORDER = ["MATH-101", "READ-101", "CODE-101", "ENVR-101", "PHILO-101"];

function makeSearch(
  packs = ALL_PACKS,
  order = TOPO_ORDER,
): PackSearch {
  return new PackSearch({ packs, topologicalOrder: order });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PackSearch", () => {
  describe("empty/whitespace queries", () => {
    it("returns empty results for empty query", () => {
      const search = makeSearch();
      expect(search.search("", "all")).toEqual([]);
    });

    it("returns empty results for whitespace-only query", () => {
      const search = makeSearch();
      expect(search.search("   ", "all")).toEqual([]);
    });
  });

  describe("field matching", () => {
    it("finds pack by exact pack name", () => {
      const search = makeSearch();
      const results = search.search("Mathematics Foundations", "all");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].pack.packId).toBe("MATH-101");
    });

    it("finds pack by partial pack name", () => {
      const search = makeSearch();
      const results = search.search("Mathemat", "all");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].pack.packId).toBe("MATH-101");
    });

    it("finds pack by tag", () => {
      const search = makeSearch();
      const results = search.search("ecology", "all");
      expect(results.length).toBe(1);
      expect(results[0].pack.packId).toBe("ENVR-101");
      expect(results[0].matchedFields).toContain("tags");
    });

    it("finds pack by grade range", () => {
      const search = makeSearch();
      // "PreK" is unique to MATH and READ
      const results = search.search("PreK", "all");
      expect(results.length).toBe(2);
      const ids = results.map((r) => r.pack.packId);
      expect(ids).toContain("MATH-101");
      expect(ids).toContain("READ-101");
    });

    it("finds pack by learning outcome text", () => {
      const search = makeSearch();
      const results = search.search("ethical dilemmas", "all");
      expect(results.length).toBe(1);
      expect(results[0].pack.packId).toBe("PHILO-101");
      expect(results[0].matchedFields).toContain("learningOutcomes");
    });

    it("finds pack by module name", () => {
      const search = makeSearch();
      const results = search.search("Algebra", "all");
      expect(results.length).toBeGreaterThanOrEqual(1);
      // MATH-101 has module "Algebra Basics"
      const mathResult = results.find((r) => r.pack.packId === "MATH-101");
      expect(mathResult).toBeDefined();
      expect(mathResult!.matchedFields).toContain("moduleNames");
    });

    it("finds pack by packId", () => {
      const search = makeSearch();
      const results = search.search("MATH", "all");
      expect(results.length).toBeGreaterThanOrEqual(1);
      const mathResult = results.find((r) => r.pack.packId === "MATH-101");
      expect(mathResult).toBeDefined();
      expect(mathResult!.matchedFields).toContain("packId");
    });

    it("finds pack by description text", () => {
      const search = makeSearch();
      const results = search.search("algorithmic reasoning", "all");
      expect(results.length).toBe(1);
      expect(results[0].pack.packId).toBe("CODE-101");
      expect(results[0].matchedFields).toContain("description");
    });
  });

  describe("case insensitivity", () => {
    it("matches regardless of case", () => {
      const search = makeSearch();
      const upper = search.search("MATHEMATICS", "all");
      const lower = search.search("mathematics", "all");
      const mixed = search.search("MaThEmAtIcS", "all");
      expect(upper.length).toBe(lower.length);
      expect(upper.length).toBe(mixed.length);
      expect(upper.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("scope filtering", () => {
    it('scope "tier" filters to current tier only', () => {
      const search = makeSearch();
      // "STEM" tag appears on MATH (core_academic) and CODE (applied)
      const results = search.search("STEM", "tier", "core_academic");
      expect(results.length).toBe(1);
      expect(results[0].pack.packId).toBe("MATH-101");
    });

    it('scope "all" searches across all tiers', () => {
      const search = makeSearch();
      // "101" appears in every packId across all tiers
      const results = search.search("101", "all");
      expect(results.length).toBe(5);
      const classifications = new Set(results.map((r) => r.pack.classification));
      expect(classifications.size).toBe(3); // all 3 tiers represented
    });

    it('scope "tier" without currentTier searches all', () => {
      const search = makeSearch();
      // "101" matches all 5 packs in packId
      const results = search.search("101", "tier");
      // Without currentTier, no filtering happens
      expect(results.length).toBe(5);
    });
  });

  describe("topological ordering", () => {
    it("results sorted by topological order (foundational first)", () => {
      const search = makeSearch();
      // "STEM" matches MATH (pos 0) and CODE (pos 2)
      const results = search.search("STEM", "all");
      expect(results[0].pack.packId).toBe("MATH-101");
      expect(results[1].pack.packId).toBe("CODE-101");
    });

    it("pack not in topological order sorts to end", () => {
      const search = makeSearch(ALL_PACKS, ["READ-101"]); // Only READ in order
      const results = search.search("101", "all");
      // READ-101 should be first (position 0), rest have Infinity
      expect(results[0].pack.packId).toBe("READ-101");
    });
  });

  describe("scoring", () => {
    it("score reflects number of matched fields", () => {
      const search = makeSearch();
      // "mathematics" matches MATH-101 in tags and description
      const results = search.search("mathematics", "all");
      const mathResult = results.find((r) => r.pack.packId === "MATH-101");
      expect(mathResult).toBeDefined();
      expect(mathResult!.score).toBeGreaterThanOrEqual(2);
      expect(mathResult!.matchedFields.length).toBe(mathResult!.score);
    });

    it("single-field match has score of 1", () => {
      const search = makeSearch();
      const results = search.search("ecology", "all");
      expect(results.length).toBe(1);
      expect(results[0].score).toBe(1);
    });
  });

  describe("updatePacks", () => {
    it("replaces the pack dataset for subsequent searches", () => {
      const search = makeSearch();
      expect(search.search("MATH", "all").length).toBeGreaterThanOrEqual(1);

      search.updatePacks([READ]);
      expect(search.search("MATH", "all").length).toBe(0);
      expect(search.search("READ", "all").length).toBe(1);
    });
  });
});
