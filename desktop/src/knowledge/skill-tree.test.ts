import { describe, it, expect, beforeEach, vi } from "vitest";
import { SkillTree } from "./skill-tree";
import type { SkillTreeData, SkillTreeNode, SkillTreeEdge } from "./types";

// ============================================================================
// Test data
// ============================================================================

function makeNode(
  packId: string,
  ring: "center" | "inner" | "outer",
  progress: "not-started" | "in-progress" | "completed" = "not-started",
  classification = "core_academic",
): SkillTreeNode {
  return {
    packId,
    packName: packId.replace("-", " "),
    classification,
    progress,
    icon: "book",
    color: "#4fc3f7",
    ring,
  };
}

function makeFocusedData(): SkillTreeData {
  return {
    centerPack: "CODE-101",
    nodes: [
      makeNode("CODE-101", "center", "in-progress"),
      makeNode("MATH-101", "inner", "completed"),
      makeNode("READ-101", "inner", "completed"),
      makeNode("DATA-101", "outer", "not-started", "applied"),
      makeNode("ENGR-101", "outer", "not-started", "applied"),
      makeNode("DIGLIT-101", "outer", "not-started", "applied"),
    ],
    edges: [
      { from: "MATH-101", to: "CODE-101", type: "prerequisite" },
      { from: "READ-101", to: "CODE-101", type: "prerequisite" },
      { from: "CODE-101", to: "DATA-101", type: "enables" },
      { from: "CODE-101", to: "ENGR-101", type: "enables" },
      { from: "CODE-101", to: "DIGLIT-101", type: "enables" },
    ],
  };
}

function makeFullGraphData(): SkillTreeData {
  // Small graph for testing: 3 core, 2 applied, 1 specialized
  return {
    centerPack: "",
    nodes: [
      makeNode("MATH-101", "center", "completed", "core_academic"),
      makeNode("READ-101", "center", "completed", "core_academic"),
      makeNode("SCI-101", "center", "in-progress", "core_academic"),
      makeNode("CODE-101", "center", "not-started", "applied"),
      makeNode("ENGR-101", "center", "not-started", "applied"),
      makeNode("TRADE-101", "center", "not-started", "specialized"),
    ],
    edges: [
      { from: "MATH-101", to: "CODE-101", type: "enables" },
      { from: "SCI-101", to: "ENGR-101", type: "enables" },
    ],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("SkillTree", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Clean up style injection between tests
    const existingStyle = document.getElementById("skill-tree-styles");
    if (existingStyle) existingStyle.remove();
  });

  // --------------------------------------------------------------------------
  // Construction
  // --------------------------------------------------------------------------

  describe("construction", () => {
    it("creates root element with class skill-tree", () => {
      const tree = new SkillTree({ container });
      expect(container.querySelector(".skill-tree")).not.toBeNull();
      tree.destroy();
    });

    it("root contains an SVG element", () => {
      const tree = new SkillTree({ container });
      const root = container.querySelector(".skill-tree")!;
      const svg = root.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.namespaceURI).toBe("http://www.w3.org/2000/svg");
      tree.destroy();
    });

    it("SVG has viewBox matching width and height", () => {
      const tree = new SkillTree({ container, width: 800, height: 800 });
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 800 800");
      tree.destroy();
    });

    it("uses default 600x600 when no dimensions specified", () => {
      const tree = new SkillTree({ container });
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
      tree.destroy();
    });

    it("injects CSS styles into document head", () => {
      const tree = new SkillTree({ container });
      const style = document.getElementById("skill-tree-styles");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain(".skill-tree");
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // Focused view rendering
  // --------------------------------------------------------------------------

  describe("setData (focused view)", () => {
    it("renders center node for center pack", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const nodes = container.querySelectorAll(".skill-tree__node");
      const centerGroup = container.querySelector('[data-pack-id="CODE-101"]');
      expect(centerGroup).not.toBeNull();
      tree.destroy();
    });

    it("renders inner ring nodes for prerequisites", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const mathNode = container.querySelector('[data-pack-id="MATH-101"]');
      const readNode = container.querySelector('[data-pack-id="READ-101"]');
      expect(mathNode).not.toBeNull();
      expect(readNode).not.toBeNull();
      tree.destroy();
    });

    it("renders outer ring nodes for dependents", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const dataNode = container.querySelector('[data-pack-id="DATA-101"]');
      const engrNode = container.querySelector('[data-pack-id="ENGR-101"]');
      const diglitNode = container.querySelector('[data-pack-id="DIGLIT-101"]');
      expect(dataNode).not.toBeNull();
      expect(engrNode).not.toBeNull();
      expect(diglitNode).not.toBeNull();
      tree.destroy();
    });

    it("renders correct total number of nodes", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const nodes = container.querySelectorAll(".skill-tree__node");
      expect(nodes.length).toBe(6); // 1 center + 2 inner + 3 outer
      tree.destroy();
    });

    it("renders edge lines connecting prerequisites to center", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const edges = container.querySelectorAll(".skill-tree__edge");
      // 2 prerequisite + 3 enables = 5 edges
      expect(edges.length).toBe(5);
      tree.destroy();
    });

    it("edge lines connect center to dependents", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const enablesEdge = container.querySelector('[data-from="CODE-101"][data-to="DATA-101"]');
      expect(enablesEdge).not.toBeNull();
      tree.destroy();
    });

    it("center node has larger radius than ring nodes", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const centerCircle = container
        .querySelector('[data-pack-id="CODE-101"]')!
        .querySelector("circle")!;
      const innerCircle = container
        .querySelector('[data-pack-id="MATH-101"]')!
        .querySelector("circle")!;
      expect(Number(centerCircle.getAttribute("r"))).toBe(30);
      expect(Number(innerCircle.getAttribute("r"))).toBe(22);
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // Progress colors
  // --------------------------------------------------------------------------

  describe("node fill color matches progress state", () => {
    it("not-started nodes are dark gray (#444)", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const circle = container
        .querySelector('[data-pack-id="DATA-101"]')!
        .querySelector("circle")!;
      expect(circle.getAttribute("fill")).toBe("#444");
      tree.destroy();
    });

    it("in-progress nodes are amber (#f0a500)", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const circle = container
        .querySelector('[data-pack-id="CODE-101"]')!
        .querySelector("circle")!;
      expect(circle.getAttribute("fill")).toBe("#f0a500");
      tree.destroy();
    });

    it("completed nodes are green (#00c853)", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      const circle = container
        .querySelector('[data-pack-id="MATH-101"]')!
        .querySelector("circle")!;
      expect(circle.getAttribute("fill")).toBe("#00c853");
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // Interaction
  // --------------------------------------------------------------------------

  describe("click interaction", () => {
    it("clicking a node fires onNodeClick with packId", () => {
      const clickSpy = vi.fn();
      const tree = new SkillTree({ container, onNodeClick: clickSpy });
      tree.setData(makeFocusedData());

      const mathGroup = container.querySelector('[data-pack-id="MATH-101"]')!;
      mathGroup.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickSpy).toHaveBeenCalledWith("MATH-101");
      tree.destroy();
    });

    it("clicking a node highlights connected nodes and dims others", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      // Click CODE-101 (center) -- connected to MATH-101, READ-101, DATA-101, ENGR-101, DIGLIT-101
      const codeGroup = container.querySelector('[data-pack-id="CODE-101"]')!;
      codeGroup.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // All nodes are connected to center, so none should be dimmed
      const dimmed = container.querySelectorAll(".skill-tree__node--dimmed");
      expect(dimmed.length).toBe(0);
      tree.destroy();
    });

    it("clicking a non-center node dims unconnected nodes", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      // Click MATH-101 (inner) -- connected to CODE-101 via prerequisite edge
      const mathGroup = container.querySelector('[data-pack-id="MATH-101"]')!;
      mathGroup.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // MATH-101 and CODE-101 should NOT be dimmed
      // READ-101, DATA-101, ENGR-101, DIGLIT-101 should be dimmed
      const dimmed = container.querySelectorAll(".skill-tree__node--dimmed");
      expect(dimmed.length).toBe(4);
      tree.destroy();
    });

    it("clicking SVG background clears all highlights", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      // First highlight
      const mathGroup = container.querySelector('[data-pack-id="MATH-101"]')!;
      mathGroup.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(container.querySelectorAll(".skill-tree__node--dimmed").length).toBeGreaterThan(0);

      // Click background
      const svg = container.querySelector("svg")!;
      svg.dispatchEvent(new MouseEvent("click", { bubbles: false }));

      expect(container.querySelectorAll(".skill-tree__node--dimmed").length).toBe(0);
      tree.destroy();
    });
  });

  describe("double-click interaction", () => {
    it("double-clicking a node fires onNodeOpen with packId", () => {
      const openSpy = vi.fn();
      const tree = new SkillTree({ container, onNodeOpen: openSpy });
      tree.setData(makeFocusedData());

      const dataGroup = container.querySelector('[data-pack-id="DATA-101"]')!;
      dataGroup.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

      expect(openSpy).toHaveBeenCalledWith("DATA-101");
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // updateProgress
  // --------------------------------------------------------------------------

  describe("updateProgress", () => {
    it("changes node fill color without full re-render", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      // DATA-101 starts as not-started (#444)
      let circle = container
        .querySelector('[data-pack-id="DATA-101"]')!
        .querySelector("circle")!;
      expect(circle.getAttribute("fill")).toBe("#444");

      // Update to completed
      tree.updateProgress("DATA-101", "completed");
      circle = container
        .querySelector('[data-pack-id="DATA-101"]')!
        .querySelector("circle")!;
      expect(circle.getAttribute("fill")).toBe("#00c853");
      tree.destroy();
    });

    it("no-ops for unknown packId", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());
      // Should not throw
      tree.updateProgress("UNKNOWN-999", "completed");
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // setFocusPack
  // --------------------------------------------------------------------------

  describe("setFocusPack", () => {
    it("setFocusPack(null) renders full graph with all nodes", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFullGraphData());
      tree.setFocusPack(null);

      const nodes = container.querySelectorAll(".skill-tree__node");
      expect(nodes.length).toBe(6); // 3 core + 2 applied + 1 specialized
      tree.destroy();
    });

    it("setFocusPack(packId) renders focused radial view", () => {
      const tree = new SkillTree({ container });
      tree.setFocusPack("CODE-101");
      tree.setData(makeFocusedData());

      const centerNode = container.querySelector('[data-pack-id="CODE-101"]');
      expect(centerNode).not.toBeNull();
      tree.destroy();
    });

    it("full graph uses smaller node radius (16)", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFullGraphData());
      tree.setFocusPack(null);

      const circle = container
        .querySelector('[data-pack-id="MATH-101"]')!
        .querySelector("circle")!;
      expect(Number(circle.getAttribute("r"))).toBe(16);
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // Labels
  // --------------------------------------------------------------------------

  describe("node labels", () => {
    it("labels show abbreviated pack name", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      const label = container
        .querySelector('[data-pack-id="MATH-101"]')!
        .querySelector("text")!;
      expect(label.textContent).toBe("MATH");
      tree.destroy();
    });

    it("center label has the center CSS class", () => {
      const tree = new SkillTree({ container });
      tree.setData(makeFocusedData());

      const label = container
        .querySelector('[data-pack-id="CODE-101"]')!
        .querySelector("text")!;
      expect(label.getAttribute("class")?.includes("skill-tree__label--center")).toBe(true);
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // abbreviateName
  // --------------------------------------------------------------------------

  describe("abbreviateName", () => {
    it("extracts prefix before hyphen", () => {
      const tree = new SkillTree({ container });
      expect(tree.abbreviateName("MATH-101")).toBe("MATH");
      expect(tree.abbreviateName("CODE-101")).toBe("CODE");
      expect(tree.abbreviateName("DIGLIT-101")).toBe("DIGLIT");
      tree.destroy();
    });

    it("returns first 4 chars if no hyphen", () => {
      const tree = new SkillTree({ container });
      expect(tree.abbreviateName("Algebra")).toBe("Alge");
      tree.destroy();
    });
  });

  // --------------------------------------------------------------------------
  // Destroy
  // --------------------------------------------------------------------------

  describe("destroy", () => {
    it("removes root from DOM", () => {
      const tree = new SkillTree({ container });
      expect(container.querySelector(".skill-tree")).not.toBeNull();
      tree.destroy();
      expect(container.querySelector(".skill-tree")).toBeNull();
    });

    it("called twice does not throw", () => {
      const tree = new SkillTree({ container });
      tree.destroy();
      expect(() => tree.destroy()).not.toThrow();
    });
  });
});
