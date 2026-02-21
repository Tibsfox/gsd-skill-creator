import { describe, it, expect } from "vitest";
import {
  TIER_LABELS,
  TIER_ORDER,
  type PackCardView,
  type PackDetailView,
  type PackProgress,
  type SkillTreeNode,
  type ProgressState,
  type SearchScope,
  type DetailTab,
  type TierGroup,
  type SearchResult,
  type PackModuleView,
  type PackActivityView,
  type SkillTreeEdge,
  type SkillTreeData,
  type ActivitySuggestion,
} from "./types";

describe("TIER_LABELS", () => {
  it("contains all 3 tiers", () => {
    expect(Object.keys(TIER_LABELS)).toHaveLength(3);
  });

  it("maps core_academic to 'Core Academic'", () => {
    expect(TIER_LABELS["core_academic"]).toBe("Core Academic");
  });

  it("maps applied to 'Applied & Practical'", () => {
    expect(TIER_LABELS["applied"]).toBe("Applied & Practical");
  });

  it("maps specialized to 'Specialized & Deepening'", () => {
    expect(TIER_LABELS["specialized"]).toBe("Specialized & Deepening");
  });
});

describe("TIER_ORDER", () => {
  it("has 3 entries", () => {
    expect(TIER_ORDER).toHaveLength(3);
  });

  it("orders core_academic first", () => {
    expect(TIER_ORDER[0]).toBe("core_academic");
  });

  it("orders applied second", () => {
    expect(TIER_ORDER[1]).toBe("applied");
  });

  it("orders specialized third", () => {
    expect(TIER_ORDER[2]).toBe("specialized");
  });

  it("contains exactly the same keys as TIER_LABELS", () => {
    const labelKeys = Object.keys(TIER_LABELS).sort();
    const orderKeys = [...TIER_ORDER].sort();
    expect(orderKeys).toEqual(labelKeys);
  });
});

describe("type shape verification", () => {
  it("PackProgress satisfies expected shape", () => {
    const progress: PackProgress = {
      packId: "MATH-101",
      state: "in-progress",
      startedAt: "2026-01-15T10:00:00Z",
      completedAt: null,
      favorited: true,
    };
    expect(progress.packId).toBe("MATH-101");
    expect(progress.state).toBe("in-progress");
    expect(progress.startedAt).not.toBeNull();
    expect(progress.completedAt).toBeNull();
    expect(progress.favorited).toBe(true);
  });

  it("PackProgress allows all three ProgressState values", () => {
    const states: ProgressState[] = ["not-started", "in-progress", "completed"];
    expect(states).toHaveLength(3);
    states.forEach((s) => {
      const p: PackProgress = {
        packId: "TEST",
        state: s,
        startedAt: null,
        completedAt: null,
        favorited: false,
      };
      expect(p.state).toBe(s);
    });
  });

  it("PackCardView satisfies expected shape with moduleNames", () => {
    const card: PackCardView = {
      packId: "MATH-101",
      packName: "Mathematics Foundations",
      description: "Core math pack",
      classification: "core_academic",
      moduleCount: 5,
      prerequisiteCount: 0,
      gradeRange: "PreK - College+",
      tags: ["math", "arithmetic", "algebra"],
      learningOutcomes: ["Count to 100", "Add single digits"],
      moduleNames: ["Number Sense", "Operations", "Geometry", "Measurement", "Data"],
      progress: "not-started",
      prerequisitesMet: true,
      icon: "calculator",
      color: "#4488cc",
    };
    expect(card.packId).toBe("MATH-101");
    expect(card.moduleNames).toHaveLength(5);
    expect(card.tags).toContain("math");
    expect(card.prerequisitesMet).toBe(true);
  });

  it("PackDetailView satisfies expected shape", () => {
    const detail: PackDetailView = {
      packId: "SCI-101",
      packName: "Science Foundations",
      description: "Core science pack",
      classification: "core_academic",
      version: "1.0.0",
      status: "stable",
      gradeRange: "PreK - College+",
      icon: "microscope",
      color: "#22aa66",
      progress: "completed",
      visionSummary: "Science for all learners",
      modules: [
        { id: "M1", name: "Scientific Method", description: "Inquiry basics", topicCount: 4, activityCount: 3 },
      ],
      activities: [
        { id: "A1", name: "Observation Walk", moduleId: "M1", durationMinutes: 30, gradeRange: "K-2", description: "Outdoor observation" },
      ],
      assessmentSummary: "Portfolio-based assessment",
      resourcesSummary: "Recommended textbooks and websites",
      prerequisites: [],
      dependents: ["CHEM-101", "PHYS-101"],
      tags: ["science", "inquiry"],
    };
    expect(detail.packId).toBe("SCI-101");
    expect(detail.modules).toHaveLength(1);
    expect(detail.activities).toHaveLength(1);
    expect(detail.dependents).toContain("CHEM-101");
  });

  it("SkillTreeNode satisfies expected shape", () => {
    const node: SkillTreeNode = {
      packId: "MATH-101",
      packName: "Mathematics Foundations",
      classification: "core_academic",
      progress: "completed",
      icon: "calculator",
      color: "#4488cc",
      ring: "center",
    };
    expect(node.ring).toBe("center");
    expect(node.progress).toBe("completed");
  });

  it("SkillTreeNode ring accepts all three positions", () => {
    const rings: Array<SkillTreeNode["ring"]> = ["center", "inner", "outer"];
    expect(rings).toHaveLength(3);
  });

  it("SkillTreeEdge satisfies expected shape", () => {
    const edge: SkillTreeEdge = {
      from: "MATH-101",
      to: "PHYS-101",
      type: "enables",
    };
    expect(edge.from).toBe("MATH-101");
    expect(edge.type).toBe("enables");
  });

  it("SkillTreeData satisfies expected shape", () => {
    const tree: SkillTreeData = {
      centerPack: "MATH-101",
      nodes: [],
      edges: [],
    };
    expect(tree.centerPack).toBe("MATH-101");
  });

  it("ActivitySuggestion satisfies expected shape", () => {
    const suggestion: ActivitySuggestion = {
      packId: "CODE-101",
      packName: "Coding Foundations",
      activityId: "A1",
      activityName: "Hello World",
      reason: "Good starting activity",
      durationMinutes: 15,
    };
    expect(suggestion.durationMinutes).toBe(15);
    expect(suggestion.reason).toBeTruthy();
  });

  it("SearchScope accepts valid values", () => {
    const scopes: SearchScope[] = ["all", "tier"];
    expect(scopes).toHaveLength(2);
  });

  it("DetailTab accepts all tab names", () => {
    const tabs: DetailTab[] = ["vision", "modules", "activities", "assessment", "resources"];
    expect(tabs).toHaveLength(5);
  });

  it("TierGroup satisfies expected shape", () => {
    const group: TierGroup = {
      tier: "core_academic",
      label: TIER_LABELS["core_academic"],
      packs: [],
      expanded: true,
    };
    expect(group.label).toBe("Core Academic");
    expect(group.expanded).toBe(true);
  });

  it("SearchResult satisfies expected shape", () => {
    const result: SearchResult = {
      pack: {
        packId: "MATH-101",
        packName: "Mathematics",
        description: "Math",
        classification: "core_academic",
        moduleCount: 5,
        prerequisiteCount: 0,
        gradeRange: "PreK - College+",
        tags: ["math"],
        learningOutcomes: [],
        moduleNames: [],
        progress: "not-started",
        prerequisitesMet: true,
        icon: "calculator",
        color: "#4488cc",
      },
      score: 0.95,
      matchedFields: ["packName", "tags"],
    };
    expect(result.score).toBe(0.95);
    expect(result.matchedFields).toContain("packName");
  });
});
