import { describe, it, expect, beforeEach, vi } from "vitest";
import { PackDetail, type PackDetailOptions } from "./pack-detail";
import type { PackDetailView, DetailTab } from "./types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makeDetail(overrides: Partial<PackDetailView> = {}): PackDetailView {
  return {
    packId: "MATH-101",
    packName: "Mathematics Foundations",
    description: "Core math skills",
    classification: "core_academic",
    version: "1.0.0",
    status: "published",
    gradeRange: "PreK - 8",
    icon: "\uD83D\uDCCA",
    color: "#4287f5",
    progress: "not-started",
    visionSummary: "Build foundational math skills.\n\nCovers number sense through geometry.",
    modules: [
      { id: "M1", name: "Number Sense", description: "Counting and place value", topicCount: 5, activityCount: 3 },
      { id: "M2", name: "Operations", description: "Addition, subtraction, multiplication", topicCount: 4, activityCount: 3 },
    ],
    activities: [
      { id: "A1", name: "Counting Games", moduleId: "M1", durationMinutes: 30, gradeRange: "PreK - 2", description: "Fun counting activities" },
      { id: "A2", name: "Place Value Puzzles", moduleId: "M1", durationMinutes: 25, gradeRange: "1 - 3", description: "Explore place value" },
      { id: "A3", name: "Addition Drills", moduleId: "M2", durationMinutes: 20, gradeRange: "1 - 4", description: "Practice addition" },
    ],
    assessmentSummary: "Assessment uses rubric-based evaluation at four levels.",
    resourcesSummary: "Curated links to Khan Academy, NCTM, and Math is Fun.",
    prerequisites: ["READ-101", "CRIT-101"],
    dependents: ["STAT-101"],
    tags: ["mathematics", "numeracy", "stem"],
    ...overrides,
  };
}

function makePanel(
  overrides: Partial<PackDetailOptions> = {},
): { panel: PackDetail; container: HTMLElement } {
  const container = overrides.container ?? makeContainer();
  const panel = new PackDetail({ container, ...overrides });
  return { panel, container };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PackDetail", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // -- Constructor ----------------------------------------------------------

  describe("constructor", () => {
    it("creates root element with class 'knowledge-detail'", () => {
      const { container } = makePanel();
      const root = container.querySelector(".knowledge-detail");
      expect(root).not.toBeNull();
    });

    it("injects a style element", () => {
      const { container } = makePanel();
      const style = container.querySelector(".knowledge-detail style");
      expect(style).not.toBeNull();
    });

    it("does not render content before setPackDetail is called", () => {
      const { container } = makePanel();
      expect(container.querySelector(".knowledge-detail__header")).toBeNull();
    });
  });

  // -- Header ---------------------------------------------------------------

  describe("header", () => {
    it("renders header with pack name and classification", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const header = container.querySelector(".knowledge-detail__header");
      expect(header).not.toBeNull();
      const title = container.querySelector(".knowledge-detail__title");
      expect(title!.textContent).toContain("Mathematics Foundations");
      const meta = container.querySelector(".knowledge-detail__meta");
      expect(meta!.textContent).toContain("core_academic");
    });

    it("renders version and grade range in meta", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const meta = container.querySelector(".knowledge-detail__meta");
      expect(meta!.textContent).toContain("v1.0.0");
      expect(meta!.textContent).toContain("PreK - 8");
    });
  });

  // -- Back button ----------------------------------------------------------

  describe("back button", () => {
    it("exists in header", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const back = container.querySelector(".knowledge-detail__back");
      expect(back).not.toBeNull();
      expect(back!.textContent).toContain("Back to packs");
    });

    it("fires onBack callback when clicked", () => {
      const onBack = vi.fn();
      const { panel, container } = makePanel({ onBack });
      panel.setPackDetail(makeDetail());
      const back = container.querySelector(".knowledge-detail__back") as HTMLElement;
      back.click();
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  // -- Action bar -----------------------------------------------------------

  describe("action bar", () => {
    it("shows 'Start Pack' when progress is not-started", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ progress: "not-started" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary");
      expect(btn!.textContent).toBe("Start Pack");
    });

    it("shows 'Complete Pack' when progress is in-progress", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ progress: "in-progress" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary");
      expect(btn!.textContent).toBe("Complete Pack");
    });

    it("shows 'Reset' when progress is completed", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ progress: "completed" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary");
      expect(btn!.textContent).toBe("Reset");
    });

    it("clicking start button fires onProgressChange with 'start'", () => {
      const onProgressChange = vi.fn();
      const { panel, container } = makePanel({ onProgressChange });
      panel.setPackDetail(makeDetail({ progress: "not-started" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary") as HTMLElement;
      btn.click();
      expect(onProgressChange).toHaveBeenCalledWith("MATH-101", "start");
    });

    it("clicking complete button fires onProgressChange with 'complete'", () => {
      const onProgressChange = vi.fn();
      const { panel, container } = makePanel({ onProgressChange });
      panel.setPackDetail(makeDetail({ progress: "in-progress" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary") as HTMLElement;
      btn.click();
      expect(onProgressChange).toHaveBeenCalledWith("MATH-101", "complete");
    });

    it("clicking reset button fires onProgressChange with 'reset'", () => {
      const onProgressChange = vi.fn();
      const { panel, container } = makePanel({ onProgressChange });
      panel.setPackDetail(makeDetail({ progress: "completed" }));
      const btn = container.querySelector(".knowledge-detail__action-btn--primary") as HTMLElement;
      btn.click();
      expect(onProgressChange).toHaveBeenCalledWith("MATH-101", "reset");
    });

    it("favorite toggle button exists and fires onFavoriteToggle", () => {
      const onFavoriteToggle = vi.fn();
      const { panel, container } = makePanel({ onFavoriteToggle });
      panel.setPackDetail(makeDetail());
      const buttons = container.querySelectorAll(".knowledge-detail__action-btn");
      // Second button (index 1) is favorite
      const favBtn = buttons[1] as HTMLElement;
      expect(favBtn.textContent).toContain("Favorite");
      favBtn.click();
      expect(onFavoriteToggle).toHaveBeenCalledWith("MATH-101");
    });

    it("start activity button fires onStartActivity", () => {
      const onStartActivity = vi.fn();
      const { panel, container } = makePanel({ onStartActivity });
      panel.setPackDetail(makeDetail());
      const buttons = container.querySelectorAll(".knowledge-detail__action-btn");
      // Third button (index 2) is Start Activity
      const actBtn = buttons[2] as HTMLElement;
      expect(actBtn.textContent).toContain("Start Activity");
      actBtn.click();
      expect(onStartActivity).toHaveBeenCalledWith("MATH-101");
    });
  });

  // -- Tab bar --------------------------------------------------------------

  describe("tab bar", () => {
    it("renders 5 tabs", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const tabs = container.querySelectorAll(".knowledge-detail__tab");
      expect(tabs.length).toBe(5);
    });

    it("tabs are Vision, Modules, Activities, Assessment, Resources", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const tabs = container.querySelectorAll(".knowledge-detail__tab");
      const labels = Array.from(tabs).map((t) => t.textContent);
      expect(labels).toEqual(["Vision", "Modules", "Activities", "Assessment", "Resources"]);
    });

    it("Vision tab is active by default", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const active = container.querySelector(".knowledge-detail__tab--active");
      expect(active).not.toBeNull();
      expect(active!.textContent).toBe("Vision");
    });

    it("clicking a tab switches active tab", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const tabs = container.querySelectorAll(".knowledge-detail__tab");
      const modulesTab = tabs[1] as HTMLElement;
      modulesTab.click();
      expect(modulesTab.classList.contains("knowledge-detail__tab--active")).toBe(true);
      // Vision should no longer be active
      expect(tabs[0].classList.contains("knowledge-detail__tab--active")).toBe(false);
    });
  });

  // -- Tab content ----------------------------------------------------------

  describe("tab content", () => {
    it("vision tab displays summary text", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const text = container.querySelector(".knowledge-detail__vision-text");
      expect(text!.textContent).toContain("Build foundational math skills.");
    });

    it("vision tab displays tag pills", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const tags = container.querySelectorAll(".knowledge-detail__tag");
      expect(tags.length).toBe(3);
      expect(tags[0].textContent).toBe("mathematics");
    });

    it("setActiveTab programmatically switches to modules tab", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("modules");
      const items = container.querySelectorAll(".knowledge-detail__module-item");
      expect(items.length).toBe(2);
    });

    it("modules tab renders module list items with descriptions", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("modules");
      const items = container.querySelectorAll(".knowledge-detail__module-item");
      expect(items.length).toBe(2);
      expect(items[0].querySelector(".knowledge-detail__module-name")!.textContent).toContain("Number Sense");
      expect(items[0].querySelector(".knowledge-detail__module-desc")!.textContent).toContain("Counting and place value");
      expect(items[0].querySelector(".knowledge-detail__module-badges")!.textContent).toContain("5 topics");
      expect(items[0].querySelector(".knowledge-detail__module-badges")!.textContent).toContain("3 activities");
    });

    it("activities tab renders activity items with duration and grade range", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("activities");
      const rows = container.querySelectorAll(".knowledge-detail__activity-row");
      expect(rows.length).toBe(3);
      expect(rows[0].querySelector(".knowledge-detail__activity-name")!.textContent).toBe("Counting Games");
      expect(rows[0].querySelector(".knowledge-detail__activity-meta")!.textContent).toContain("30 min");
      expect(rows[0].querySelector(".knowledge-detail__activity-meta")!.textContent).toContain("PreK - 2");
    });

    it("assessment tab displays assessment summary text", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("assessment");
      const text = container.querySelector(".knowledge-detail__vision-text");
      expect(text!.textContent).toContain("rubric-based evaluation");
    });

    it("resources tab displays resources summary text", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("resources");
      const text = container.querySelector(".knowledge-detail__vision-text");
      expect(text!.textContent).toContain("Khan Academy");
    });
  });

  // -- Prerequisite graph ---------------------------------------------------

  describe("prerequisite graph", () => {
    it("renders prerequisite chips for each prerequisite", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const chips = container.querySelectorAll(".knowledge-detail__prereq-chip");
      // 2 prerequisites + 1 dependent = 3 chips
      expect(chips.length).toBe(3);
      expect(chips[0].textContent).toBe("READ-101");
      expect(chips[1].textContent).toBe("CRIT-101");
    });

    it("shows 'No prerequisites' when prerequisites array is empty", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ prerequisites: [] }));
      const empties = container.querySelectorAll(".knowledge-detail__prereq-empty");
      expect(empties[0].textContent).toBe("No prerequisites");
    });

    it("shows dependent pack chips", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const chips = container.querySelectorAll(".knowledge-detail__prereq-chip");
      // Last chip is the dependent
      expect(chips[2].textContent).toBe("STAT-101");
    });

    it("shows 'No dependent packs' when dependents array is empty", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ dependents: [] }));
      const empties = container.querySelectorAll(".knowledge-detail__prereq-empty");
      const emptyTexts = Array.from(empties).map((e) => e.textContent);
      expect(emptyTexts).toContain("No dependent packs");
    });

    it("clicking prerequisite chip fires onPackNavigate", () => {
      const onPackNavigate = vi.fn();
      const { panel, container } = makePanel({ onPackNavigate });
      panel.setPackDetail(makeDetail());
      const chips = container.querySelectorAll(".knowledge-detail__prereq-chip");
      (chips[0] as HTMLElement).click();
      expect(onPackNavigate).toHaveBeenCalledWith("READ-101");
    });

    it("clicking dependent chip fires onPackNavigate", () => {
      const onPackNavigate = vi.fn();
      const { panel, container } = makePanel({ onPackNavigate });
      panel.setPackDetail(makeDetail());
      const chips = container.querySelectorAll(".knowledge-detail__prereq-chip");
      (chips[2] as HTMLElement).click();
      expect(onPackNavigate).toHaveBeenCalledWith("STAT-101");
    });

    it("renders center pack with icon and packId", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const center = container.querySelector(".knowledge-detail__prereq-center");
      expect(center).not.toBeNull();
      expect(center!.textContent).toContain("MATH-101");
    });

    it("renders arrow elements between sections", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      const arrows = container.querySelectorAll(".knowledge-detail__prereq-arrow");
      expect(arrows.length).toBe(2);
    });
  });

  // -- updateProgress -------------------------------------------------------

  describe("updateProgress", () => {
    it("changes action button text without full re-render", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail({ progress: "not-started" }));
      let btn = container.querySelector(".knowledge-detail__action-btn--primary");
      expect(btn!.textContent).toBe("Start Pack");

      panel.updateProgress("in-progress");
      btn = container.querySelector(".knowledge-detail__action-btn--primary");
      expect(btn!.textContent).toBe("Complete Pack");
    });

    it("preserves tab content after progress update", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      panel.setActiveTab("modules");
      panel.updateProgress("completed");
      // Modules tab content should still be present
      const items = container.querySelectorAll(".knowledge-detail__module-item");
      expect(items.length).toBe(2);
    });
  });

  // -- Destroy --------------------------------------------------------------

  describe("destroy", () => {
    it("removes DOM from container", () => {
      const { panel, container } = makePanel();
      panel.setPackDetail(makeDetail());
      expect(container.querySelector(".knowledge-detail")).not.toBeNull();
      panel.destroy();
      expect(container.querySelector(".knowledge-detail")).toBeNull();
    });

    it("called twice does not throw", () => {
      const { panel } = makePanel();
      panel.setPackDetail(makeDetail());
      expect(() => {
        panel.destroy();
        panel.destroy();
      }).not.toThrow();
    });
  });
});
