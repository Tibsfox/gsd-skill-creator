import { describe, it, expect, vi, beforeEach } from "vitest";
import { KnowledgePanel, type KnowledgePanelOptions } from "./knowledge-panel";
import type { PackCardView } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makePanel(
  overrides: Partial<KnowledgePanelOptions> = {},
): { panel: KnowledgePanel; container: HTMLElement } {
  const container = overrides.container ?? makeContainer();
  const panel = new KnowledgePanel({
    container,
    topologicalOrder: TOPO_ORDER,
    ...overrides,
  });
  return { panel, container };
}

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
    learningOutcomes: ["Understand testing"],
    moduleNames: ["Module A"],
    progress: "not-started",
    prerequisitesMet: true,
    icon: "book",
    color: "#4a90d9",
    ...overrides,
  };
}

// Fixture packs across all 3 tiers
const MATH = makePack({
  packId: "MATH-101",
  packName: "Mathematics Foundations",
  description: "Core math concepts",
  classification: "core_academic",
  moduleCount: 5,
  prerequisiteCount: 0,
  progress: "completed",
  prerequisitesMet: true,
});

const READ = makePack({
  packId: "READ-101",
  packName: "Reading & Literacy",
  description: "Phonics and comprehension",
  classification: "core_academic",
  moduleCount: 5,
  prerequisiteCount: 0,
  progress: "in-progress",
  prerequisitesMet: true,
});

const CODE = makePack({
  packId: "CODE-101",
  packName: "Computational Thinking",
  description: "Programming fundamentals",
  classification: "applied",
  moduleCount: 5,
  prerequisiteCount: 2,
  progress: "not-started",
  prerequisitesMet: false,
});

const PHILO = makePack({
  packId: "PHILO-101",
  packName: "Philosophy & Ethics",
  description: "Wonder and moral reasoning",
  classification: "specialized",
  moduleCount: 5,
  prerequisiteCount: 1,
  progress: "not-started",
  prerequisitesMet: true,
});

const ENVR = makePack({
  packId: "ENVR-101",
  packName: "Environmental Science",
  description: "Ecosystems and sustainability",
  classification: "applied",
  moduleCount: 4,
  prerequisiteCount: 1,
  progress: "not-started",
  prerequisitesMet: true,
});

const ALL_PACKS = [MATH, READ, CODE, PHILO, ENVR];
const TOPO_ORDER = ["MATH-101", "READ-101", "CODE-101", "ENVR-101", "PHILO-101"];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("KnowledgePanel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("creates root element with class 'knowledge-panel'", () => {
      const { container } = makePanel();
      const root = container.querySelector(".knowledge-panel");
      expect(root).not.toBeNull();
    });

    it("root contains search bar with input", () => {
      const { container } = makePanel();
      const search = container.querySelector(".knowledge-search");
      expect(search).not.toBeNull();
      const input = search!.querySelector("input");
      expect(input).not.toBeNull();
      expect(input!.placeholder).toBe("Search packs...");
    });

    it("root contains scope toggle button", () => {
      const { container } = makePanel();
      const button = container.querySelector(".knowledge-scope-toggle");
      expect(button).not.toBeNull();
      expect(button!.textContent).toBe("All");
    });

    it("root contains tiers container", () => {
      const { container } = makePanel();
      const tiers = container.querySelector(".knowledge-tiers");
      expect(tiers).not.toBeNull();
    });

    it("injects CSS style element", () => {
      const { container } = makePanel();
      const style = container.querySelector("style");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain("knowledge-panel");
    });
  });

  describe("tier rendering", () => {
    it("setPacks creates 3 tier sections", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const sections = container.querySelectorAll(".knowledge-tier-section");
      expect(sections.length).toBe(3);
    });

    it("Core Academic tier is expanded by default", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const sections = container.querySelectorAll(".knowledge-tier-section");
      // First section is core_academic
      const header = sections[0].querySelector(".knowledge-tier-header");
      expect(header!.classList.contains("knowledge-tier-header--expanded")).toBe(true);
      const grid = sections[0].querySelector(".knowledge-card-grid") as HTMLElement;
      expect(grid.style.display).not.toBe("none");
    });

    it("Applied and Specialized tiers are collapsed by default", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const sections = container.querySelectorAll(".knowledge-tier-section");
      // Applied (index 1)
      const appliedHeader = sections[1].querySelector(".knowledge-tier-header");
      expect(appliedHeader!.classList.contains("knowledge-tier-header--expanded")).toBe(false);
      const appliedGrid = sections[1].querySelector(".knowledge-card-grid") as HTMLElement;
      expect(appliedGrid.style.display).toBe("none");
      // Specialized (index 2)
      const specHeader = sections[2].querySelector(".knowledge-tier-header");
      expect(specHeader!.classList.contains("knowledge-tier-header--expanded")).toBe(false);
      const specGrid = sections[2].querySelector(".knowledge-card-grid") as HTMLElement;
      expect(specGrid.style.display).toBe("none");
    });

    it("clicking tier header toggles expansion", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const sections = container.querySelectorAll(".knowledge-tier-section");
      const header = sections[1].querySelector(".knowledge-tier-header") as HTMLElement;
      const grid = sections[1].querySelector(".knowledge-card-grid") as HTMLElement;

      // Initially collapsed
      expect(grid.style.display).toBe("none");

      // Click to expand
      header.click();
      expect(header.classList.contains("knowledge-tier-header--expanded")).toBe(true);
      expect(grid.style.display).not.toBe("none");

      // Click again to collapse
      header.click();
      expect(header.classList.contains("knowledge-tier-header--expanded")).toBe(false);
      expect(grid.style.display).toBe("none");
    });

    it("tier headers show pack count", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const headers = container.querySelectorAll(".knowledge-tier-header");
      // Core Academic has 2 packs (MATH, READ)
      expect(headers[0].textContent).toContain("(2)");
      // Applied has 2 packs (CODE, ENVR)
      expect(headers[1].textContent).toContain("(2)");
      // Specialized has 1 pack (PHILO)
      expect(headers[2].textContent).toContain("(1)");
    });
  });

  describe("pack cards", () => {
    it("cards render with name and description", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const cards = container.querySelectorAll(".knowledge-pack-card");
      // Core academic tier is expanded so its 2 cards are visible
      const firstCard = cards[0];
      expect(firstCard.querySelector(".knowledge-pack-card__name")!.textContent).toContain("Mathematics Foundations");
      expect(firstCard.querySelector(".knowledge-pack-card__desc")!.textContent).toContain("Core math concepts");
    });

    it("cards render with module count", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      const meta = container.querySelector(".knowledge-pack-card__meta");
      expect(meta!.textContent).toContain("5 modules");
    });

    it("cards with unmet prerequisites get prereqs-unmet class", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      // CODE has prerequisitesMet: false -- but it's in applied tier (collapsed)
      // Expand applied tier first
      const sections = container.querySelectorAll(".knowledge-tier-section");
      const appliedHeader = sections[1].querySelector(".knowledge-tier-header") as HTMLElement;
      appliedHeader.click();
      const cards = sections[1].querySelectorAll(".knowledge-pack-card");
      // CODE-101 has prereqs unmet
      const codeCard = Array.from(cards).find((c) =>
        c.querySelector(".knowledge-pack-card__name")!.textContent!.includes("Computational"),
      );
      expect(codeCard).toBeDefined();
      expect(codeCard!.classList.contains("knowledge-pack-card--prereqs-unmet")).toBe(true);
    });

    it("cards with unmet prerequisites show faded prereq text", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      // Expand applied tier
      const sections = container.querySelectorAll(".knowledge-tier-section");
      const appliedHeader = sections[1].querySelector(".knowledge-tier-header") as HTMLElement;
      appliedHeader.click();
      const unmetPrereq = sections[1].querySelector(".knowledge-pack-card__prereq--unmet");
      expect(unmetPrereq).not.toBeNull();
      expect(unmetPrereq!.textContent).toContain("Requires: 2 packs");
    });

    it("progress dots render with correct state class", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      // MATH is completed, READ is in-progress
      const progressDots = container.querySelectorAll(".knowledge-pack-card__progress");
      // First card (MATH) should be completed
      expect(progressDots[0].classList.contains("knowledge-pack-card__progress--completed")).toBe(true);
      // Second card (READ) should be in-progress
      expect(progressDots[1].classList.contains("knowledge-pack-card__progress--in-progress")).toBe(true);
    });

    it("clicking a pack card fires onPackSelect with packId", () => {
      const onPackSelect = vi.fn();
      const { panel, container } = makePanel({ onPackSelect });
      panel.setPacks(ALL_PACKS);
      const card = container.querySelector(".knowledge-pack-card") as HTMLElement;
      card.click();
      expect(onPackSelect).toHaveBeenCalledWith("MATH-101");
    });
  });

  describe("search", () => {
    it("typing in search input filters visible packs after debounce", () => {
      vi.useFakeTimers();
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);

      const input = container.querySelector(".knowledge-search input") as HTMLInputElement;
      input.value = "Mathematics";
      input.dispatchEvent(new Event("input"));

      // Before debounce, tiers still visible
      expect(container.querySelectorAll(".knowledge-tier-section").length).toBe(3);

      // After 150ms debounce
      vi.advanceTimersByTime(150);
      // Tiers replaced with search results
      expect(container.querySelectorAll(".knowledge-tier-section").length).toBe(0);
      const cards = container.querySelectorAll(".knowledge-pack-card");
      expect(cards.length).toBeGreaterThanOrEqual(1);

      vi.useRealTimers();
    });

    it("empty search restores tier view", () => {
      vi.useFakeTimers();
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);

      // Search first
      const input = container.querySelector(".knowledge-search input") as HTMLInputElement;
      input.value = "Mathematics";
      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(150);

      // Clear search
      input.value = "";
      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(150);

      // Tier sections restored
      expect(container.querySelectorAll(".knowledge-tier-section").length).toBe(3);

      vi.useRealTimers();
    });

    it("search scope toggle changes button text", () => {
      const { panel, container } = makePanel();
      const button = container.querySelector(".knowledge-scope-toggle") as HTMLElement;
      expect(button.textContent).toBe("All");

      button.click();
      expect(button.textContent).toBe("Current Tier");

      button.click();
      expect(button.textContent).toBe("All");
    });

    it("getSearchScope returns current scope", () => {
      const { panel } = makePanel();
      expect(panel.getSearchScope()).toBe("all");
      panel.setSearchScope("tier");
      expect(panel.getSearchScope()).toBe("tier");
    });
  });

  describe("empty state", () => {
    it("no packs renders empty state message", () => {
      const { panel, container } = makePanel();
      panel.setPacks([]);
      const empty = container.querySelector(".knowledge-empty");
      expect(empty).not.toBeNull();
      expect(empty!.textContent).toContain("No knowledge packs available");
    });
  });

  describe("destroy", () => {
    it("removes all DOM and cleans up listeners", () => {
      const { panel, container } = makePanel();
      panel.setPacks(ALL_PACKS);
      panel.destroy();
      expect(container.querySelector(".knowledge-panel")).toBeNull();
      expect(container.children.length).toBe(0);
    });

    it("called twice does not throw", () => {
      const { panel } = makePanel();
      panel.destroy();
      expect(() => panel.destroy()).not.toThrow();
    });
  });
});
