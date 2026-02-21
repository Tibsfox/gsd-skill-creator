/**
 * Tests for ActivitySuggester — progress-aware activity recommendation engine.
 *
 * @module knowledge/activity-suggestions.test
 */

import { describe, it, expect } from "vitest";
import { ActivitySuggester } from "./activity-suggestions";
import type { PackCardView, PackActivityView, PackProgress } from "./types";

// ============================================================================
// Test helpers
// ============================================================================

function makePack(overrides: Partial<PackCardView> & { packId: string }): PackCardView {
  return {
    packName: overrides.packId.toUpperCase(),
    description: `Description for ${overrides.packId}`,
    classification: "core_academic",
    moduleCount: 3,
    prerequisiteCount: 0,
    gradeRange: "K-12",
    tags: [],
    learningOutcomes: [],
    moduleNames: [],
    progress: "not-started",
    prerequisitesMet: true,
    icon: "📘",
    color: "#333",
    ...overrides,
  };
}

function makeActivity(packId: string, idx: number): PackActivityView {
  return {
    id: `${packId}-A${idx}`,
    name: `Activity ${idx} for ${packId}`,
    moduleId: `${packId}-M1`,
    durationMinutes: 30,
    gradeRange: "K-12",
    description: `Activity ${idx} description`,
  };
}

function makeProgress(packId: string, overrides: Partial<PackProgress> = {}): PackProgress {
  return {
    packId,
    state: "not-started",
    startedAt: null,
    completedAt: null,
    favorited: false,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("ActivitySuggester", () => {
  const topoOrder = ["MATH-101", "READ-101", "SCI-101", "CODE-101", "PHILO-101"];

  it("returns empty array for empty packs", () => {
    const suggester = new ActivitySuggester();
    const result = suggester.suggest({
      packs: [],
      activities: new Map(),
      progress: [],
      topologicalOrder: topoOrder,
    });
    expect(result).toEqual([]);
  });

  it("returns empty array when all packs are completed", () => {
    const packs = [makePack({ packId: "MATH-101", progress: "completed" })];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
    ]);
    const progress = [makeProgress("MATH-101", { state: "completed" })];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result).toEqual([]);
  });

  it("prioritizes in-progress packs over not-started", () => {
    const packs = [
      makePack({ packId: "MATH-101", progress: "not-started" }),
      makePack({ packId: "READ-101", progress: "in-progress" }),
    ];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
      ["READ-101", [makeActivity("READ-101", 1)]],
    ]);
    const progress = [
      makeProgress("MATH-101", { state: "not-started" }),
      makeProgress("READ-101", { state: "in-progress" }),
    ];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].packId).toBe("READ-101");
  });

  it("excludes packs with unmet prerequisites", () => {
    const packs = [
      makePack({ packId: "MATH-101", prerequisitesMet: true }),
      makePack({ packId: "PHILO-101", prerequisitesMet: false }),
    ];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
      ["PHILO-101", [makeActivity("PHILO-101", 1)]],
    ]);
    const progress = [
      makeProgress("MATH-101"),
      makeProgress("PHILO-101"),
    ];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result.map((s) => s.packId)).toContain("MATH-101");
    expect(result.map((s) => s.packId)).not.toContain("PHILO-101");
  });

  it("skips packs without activities", () => {
    const packs = [
      makePack({ packId: "MATH-101" }),
      makePack({ packId: "READ-101" }),
    ];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
      // READ-101 has no activities
    ]);
    const progress = [makeProgress("MATH-101"), makeProgress("READ-101")];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result.map((s) => s.packId)).toContain("MATH-101");
    expect(result.map((s) => s.packId)).not.toContain("READ-101");
  });

  it("ranks favorited packs higher among same-progress peers", () => {
    const packs = [
      makePack({ packId: "MATH-101" }),
      makePack({ packId: "READ-101" }),
      makePack({ packId: "SCI-101" }),
    ];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
      ["READ-101", [makeActivity("READ-101", 1)]],
      ["SCI-101", [makeActivity("SCI-101", 1)]],
    ]);
    // SCI-101 is favorited, lower in topo order than MATH-101 but should rank higher
    const progress = [
      makeProgress("MATH-101"),
      makeProgress("READ-101"),
      makeProgress("SCI-101", { favorited: true }),
    ];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    const sciIdx = result.findIndex((s) => s.packId === "SCI-101");
    const mathIdx = result.findIndex((s) => s.packId === "MATH-101");
    expect(sciIdx).toBeLessThan(mathIdx);
  });

  it("limits output to maxSuggestions", () => {
    const packs = topoOrder.map((id) => makePack({ packId: id }));
    const activities = new Map(
      topoOrder.map((id) => [id, [makeActivity(id, 1)]] as [string, PackActivityView[]]),
    );
    const progress = topoOrder.map((id) => makeProgress(id));

    const suggester = new ActivitySuggester({ maxSuggestions: 2 });
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result.length).toBe(2);
  });

  it("generates correct reason for in-progress pack", () => {
    const packs = [makePack({ packId: "MATH-101", packName: "Mathematics", progress: "in-progress" })];
    const activities = new Map([["MATH-101", [makeActivity("MATH-101", 1)]]]);
    const progress = [makeProgress("MATH-101", { state: "in-progress" })];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result[0].reason).toBe("Continue your work in Mathematics");
  });

  it("generates correct reason for favorited not-started pack", () => {
    const packs = [makePack({ packId: "MATH-101", packName: "Mathematics" })];
    const activities = new Map([["MATH-101", [makeActivity("MATH-101", 1)]]]);
    const progress = [makeProgress("MATH-101", { favorited: true })];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result[0].reason).toBe("Start your favorited pack Mathematics");
  });

  it("generates correct reason for not-started pack without favorite", () => {
    const packs = [makePack({ packId: "MATH-101", packName: "Mathematics" })];
    const activities = new Map([["MATH-101", [makeActivity("MATH-101", 1)]]]);
    const progress = [makeProgress("MATH-101")];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result[0].reason).toBe("Ready to begin Mathematics (prerequisites met)");
  });

  it("topological order influences ranking (foundational packs first among ties)", () => {
    // Both not-started, not favorited -- topological order breaks the tie
    const packs = [
      makePack({ packId: "PHILO-101" }), // position 4 in topoOrder
      makePack({ packId: "MATH-101" }),   // position 0 in topoOrder
    ];
    const activities = new Map([
      ["PHILO-101", [makeActivity("PHILO-101", 1)]],
      ["MATH-101", [makeActivity("MATH-101", 1)]],
    ]);
    const progress = [makeProgress("PHILO-101"), makeProgress("MATH-101")];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result[0].packId).toBe("MATH-101");
    expect(result[1].packId).toBe("PHILO-101");
  });

  it("uses default maxSuggestions of 5", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G"];
    const packs = ids.map((id) => makePack({ packId: id }));
    const activities = new Map(
      ids.map((id) => [id, [makeActivity(id, 1)]] as [string, PackActivityView[]]),
    );
    const progress = ids.map((id) => makeProgress(id));

    const suggester = new ActivitySuggester(); // no options = default 5
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: ids });
    expect(result.length).toBe(5);
  });

  it("returns empty when no packs have met prerequisites", () => {
    const packs = [
      makePack({ packId: "MATH-101", prerequisitesMet: false }),
      makePack({ packId: "READ-101", prerequisitesMet: false }),
    ];
    const activities = new Map([
      ["MATH-101", [makeActivity("MATH-101", 1)]],
      ["READ-101", [makeActivity("READ-101", 1)]],
    ]);
    const progress = [makeProgress("MATH-101"), makeProgress("READ-101")];

    const suggester = new ActivitySuggester();
    const result = suggester.suggest({ packs, activities, progress, topologicalOrder: topoOrder });
    expect(result).toEqual([]);
  });
});
