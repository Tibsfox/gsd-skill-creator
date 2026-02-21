/**
 * Barrel export verification tests for desktop/src/knowledge.
 *
 * Ensures all classes, types, and constants are accessible from the
 * single entry point. Class exports verified as constructor functions.
 *
 * @module knowledge/index.test
 */

import { describe, it, expect } from "vitest";
import {
  // Constants
  TIER_LABELS,
  TIER_ORDER,
  // Classes
  ProgressTracker,
  PackSearch,
  KnowledgePanel,
  PackDetail,
  SkillTree,
  ActivitySuggester,
} from "./index";

describe("knowledge barrel exports", () => {
  it("exports TIER_LABELS with 3 entries", () => {
    expect(TIER_LABELS).toBeDefined();
    expect(Object.keys(TIER_LABELS)).toHaveLength(3);
    expect(TIER_LABELS.core_academic).toBe("Core Academic");
    expect(TIER_LABELS.applied).toBe("Applied & Practical");
    expect(TIER_LABELS.specialized).toBe("Specialized & Deepening");
  });

  it("exports TIER_ORDER with 3 entries", () => {
    expect(TIER_ORDER).toBeDefined();
    expect(TIER_ORDER).toHaveLength(3);
    expect(TIER_ORDER[0]).toBe("core_academic");
    expect(TIER_ORDER[1]).toBe("applied");
    expect(TIER_ORDER[2]).toBe("specialized");
  });

  it("exports ProgressTracker class", () => {
    expect(typeof ProgressTracker).toBe("function");
  });

  it("exports PackSearch class", () => {
    expect(typeof PackSearch).toBe("function");
  });

  it("exports KnowledgePanel class", () => {
    expect(typeof KnowledgePanel).toBe("function");
  });

  it("exports PackDetail class", () => {
    expect(typeof PackDetail).toBe("function");
  });

  it("exports SkillTree class", () => {
    expect(typeof SkillTree).toBe("function");
  });

  it("exports ActivitySuggester class", () => {
    expect(typeof ActivitySuggester).toBe("function");
  });
});
