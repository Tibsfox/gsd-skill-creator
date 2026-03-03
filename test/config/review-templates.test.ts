import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE_DIR = join(process.cwd(), "config", "templates", "review");

function readTemplate(filename: string): string {
  return readFileSync(join(TEMPLATE_DIR, filename), "utf-8");
}

describe("review templates", () => {
  describe("all templates exist", () => {
    const templateFiles = [
      "review-plan.md",
      "review-retrospective.md",
      "review-lessons-learned.md",
      "review-scores.md",
      "review-config.yaml",
    ];

    for (const file of templateFiles) {
      it(`${file} exists`, () => {
        expect(() => readTemplate(file)).not.toThrow();
      });
    }
  });

  describe("review-plan.md", () => {
    it("contains Objective section", () => {
      const content = readTemplate("review-plan.md");
      expect(content).toMatch(/^## Objective/m);
    });

    it("contains Prior Lessons Reference section", () => {
      const content = readTemplate("review-plan.md");
      expect(content).toMatch(/^## Prior Lessons Reference/m);
    });

    it("contains Scope section", () => {
      const content = readTemplate("review-plan.md");
      expect(content).toMatch(/^## Scope/m);
    });

    it("contains Session Plan section", () => {
      const content = readTemplate("review-plan.md");
      expect(content).toMatch(/^## Session Plan/m);
    });

    it("contains Success Criteria section", () => {
      const content = readTemplate("review-plan.md");
      expect(content).toMatch(/^## Success Criteria/m);
    });
  });

  describe("review-retrospective.md", () => {
    it("contains What Worked section", () => {
      const content = readTemplate("review-retrospective.md");
      expect(content).toMatch(/^## What Worked/m);
    });

    it("contains What Was Inefficient section", () => {
      const content = readTemplate("review-retrospective.md");
      expect(content).toMatch(/^## What Was Inefficient/m);
    });

    it("contains Key Lessons section", () => {
      const content = readTemplate("review-retrospective.md");
      expect(content).toMatch(/^## Key Lessons/m);
    });

    it("contains Patterns Established section", () => {
      const content = readTemplate("review-retrospective.md");
      expect(content).toMatch(/^## Patterns Established/m);
    });

    it("contains Recommendations section", () => {
      const content = readTemplate("review-retrospective.md");
      expect(content).toMatch(/^## Recommendations/m);
    });
  });

  describe("review-lessons-learned.md", () => {
    it("contains Chain Metadata section", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/^## Chain Metadata/m);
    });

    it("contains prior_milestone field in Chain Metadata", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/prior_milestone/);
    });

    it("contains prior_lessons_path field in Chain Metadata", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/prior_lessons_path/);
    });

    it("contains chain_position field in Chain Metadata", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/chain_position/);
    });

    it("contains total_in_series field in Chain Metadata", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/total_in_series/);
    });

    it("contains Lessons section", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/^## Lessons/m);
    });

    it("contains Recurring Patterns section", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/^## Recurring Patterns/m);
    });

    it("contains Feed-Forward Actions section", () => {
      const content = readTemplate("review-lessons-learned.md");
      expect(content).toMatch(/^## Feed-Forward Actions/m);
    });
  });

  describe("review-scores.md", () => {
    it("contains Scoring Rubric section", () => {
      const content = readTemplate("review-scores.md");
      expect(content).toMatch(/^## Scoring Rubric/m);
    });

    it("contains Dimension Scores section", () => {
      const content = readTemplate("review-scores.md");
      expect(content).toMatch(/^## Dimension Scores/m);
    });

    it("contains all 4 dimensions", () => {
      const content = readTemplate("review-scores.md");
      expect(content).toMatch(/completeness/i);
      expect(content).toMatch(/depth/i);
      expect(content).toMatch(/connections/i);
      expect(content).toMatch(/honesty/i);
    });

    it("uses 1-5 scale", () => {
      const content = readTemplate("review-scores.md");
      expect(content).toMatch(/1-5/);
    });

    it("contains Summary section", () => {
      const content = readTemplate("review-scores.md");
      expect(content).toMatch(/^## Summary/m);
    });
  });

  describe("review-config.yaml", () => {
    it("has type: review", () => {
      const content = readTemplate("review-config.yaml");
      expect(content).toMatch(/^type:\s*review$/m);
    });

    it("has pacing section", () => {
      const content = readTemplate("review-config.yaml");
      expect(content).toMatch(/^pacing:/m);
    });

    it("has chain section", () => {
      const content = readTemplate("review-config.yaml");
      expect(content).toMatch(/^chain:/m);
    });

    it("has scoring section", () => {
      const content = readTemplate("review-config.yaml");
      expect(content).toMatch(/^scoring:/m);
    });

    it("has rubric with all 4 dimensions", () => {
      const content = readTemplate("review-config.yaml");
      expect(content).toMatch(/rubric:/);
      expect(content).toMatch(/completeness/);
      expect(content).toMatch(/depth/);
      expect(content).toMatch(/connections/);
      expect(content).toMatch(/honesty/);
    });
  });
});
