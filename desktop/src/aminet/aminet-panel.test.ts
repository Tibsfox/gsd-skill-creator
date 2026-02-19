import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AminetPanel,
  type AminetPanelOptions,
  type AminetCategoryView,
  type AminetPackageView,
  type AminetDetailView,
} from "./aminet-panel";

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makePanel(
  overrides: Partial<AminetPanelOptions> = {},
): { panel: AminetPanel; container: HTMLElement } {
  const container = overrides.container ?? makeContainer();
  const panel = new AminetPanel({ container, ...overrides });
  return { panel, container };
}

describe("AminetPanel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("creates a root element with class 'aminet-panel'", () => {
      const { container } = makePanel();
      const root = container.querySelector(".aminet-panel");
      expect(root).not.toBeNull();
    });

    it("root contains search bar div", () => {
      const { container } = makePanel();
      const search = container.querySelector(".aminet-search");
      expect(search).not.toBeNull();
    });

    it("root contains category tree div", () => {
      const { container } = makePanel();
      const categories = container.querySelector(".aminet-categories");
      expect(categories).not.toBeNull();
    });

    it("root contains results list div", () => {
      const { container } = makePanel();
      const results = container.querySelector(".aminet-results");
      expect(results).not.toBeNull();
    });

    it("root contains detail pane div", () => {
      const { container } = makePanel();
      const detail = container.querySelector(".aminet-detail");
      expect(detail).not.toBeNull();
    });

    it("search bar contains an input element with placeholder", () => {
      const { container } = makePanel();
      const input = container.querySelector(
        ".aminet-search input",
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.placeholder).toBe("Search Aminet...");
    });
  });

  describe("workbench styling", () => {
    it("root element has data-theme='workbench' attribute", () => {
      const { container } = makePanel();
      const root = container.querySelector(".aminet-panel");
      expect(root!.getAttribute("data-theme")).toBe("workbench");
    });

    it("panel creates a style element with Topaz font-family reference", () => {
      const { container } = makePanel();
      const style = container.querySelector("style");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain("Topaz");
    });

    it("panel creates CSS with Workbench colors", () => {
      const { container } = makePanel();
      const style = container.querySelector("style");
      const css = style!.textContent!;
      expect(css).toContain("#0055aa");
      expect(css).toContain("#ffffff");
      expect(css).toContain("#ff8800");
    });
  });

  describe("data rendering", () => {
    it("setCategories populates category tree with clickable items", () => {
      const { panel, container } = makePanel();
      const categories: AminetCategoryView[] = [
        { path: "game/action", name: "Action", count: 42 },
        { path: "game/puzzle", name: "Puzzle", count: 15 },
      ];
      panel.setCategories(categories);

      const items = container.querySelectorAll(
        ".aminet-categories .aminet-category-item",
      );
      expect(items.length).toBe(2);
      expect(items[0].textContent).toContain("Action");
      expect(items[0].textContent).toContain("42");
    });

    it("setResults populates results list with package entries", () => {
      const { panel, container } = makePanel();
      const results: AminetPackageView[] = [
        {
          filename: "Doom.lha",
          category: "game/action",
          sizeKb: 512,
          description: "Doom for Amiga",
          status: "clean",
        },
        {
          filename: "Tetris.lha",
          category: "game/puzzle",
          sizeKb: 64,
          description: "Classic Tetris",
          status: "clean",
        },
      ];
      panel.setResults(results);

      const rows = container.querySelectorAll(
        ".aminet-results .aminet-result-row",
      );
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain("Doom.lha");
      expect(rows[0].textContent).toContain("512");
      expect(rows[0].textContent).toContain("Doom for Amiga");
    });

    it("setDetail populates detail pane with package metadata", () => {
      const { panel, container } = makePanel();
      const detail: AminetDetailView = {
        filename: "Doom.lha",
        category: "game/action",
        description: "Doom for Amiga",
        author: "id Software",
        version: "1.9",
        architecture: "m68k-amigaos",
        requires: "AGA",
        status: "clean",
        scanResult: "No threats detected",
      };
      panel.setDetail(detail);

      const pane = container.querySelector(".aminet-detail");
      expect(pane!.textContent).toContain("Doom.lha");
      expect(pane!.textContent).toContain("id Software");
      expect(pane!.textContent).toContain("1.9");
      expect(pane!.textContent).toContain("m68k-amigaos");
    });

    it("setResults with empty array shows 'No packages found' empty state", () => {
      const { panel, container } = makePanel();
      panel.setResults([]);

      const resultPane = container.querySelector(".aminet-results");
      expect(resultPane!.textContent).toContain("No packages found");
    });
  });

  describe("search callback", () => {
    it("constructor accepts onSearch callback", () => {
      const onSearch = vi.fn();
      expect(() => makePanel({ onSearch })).not.toThrow();
    });

    it("pressing Enter in search input triggers onSearch with input value", () => {
      const onSearch = vi.fn();
      const { container } = makePanel({ onSearch });
      const input = container.querySelector(
        ".aminet-search input",
      ) as HTMLInputElement;

      input.value = "doom";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(onSearch).toHaveBeenCalledWith("doom");
    });

    it("search input value is trimmed before callback", () => {
      const onSearch = vi.fn();
      const { container } = makePanel({ onSearch });
      const input = container.querySelector(
        ".aminet-search input",
      ) as HTMLInputElement;

      input.value = "  doom  ";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(onSearch).toHaveBeenCalledWith("doom");
    });
  });

  describe("category selection callback", () => {
    it("constructor accepts onCategorySelect callback", () => {
      const onCategorySelect = vi.fn();
      expect(() => makePanel({ onCategorySelect })).not.toThrow();
    });

    it("clicking a category item triggers onCategorySelect with category path", () => {
      const onCategorySelect = vi.fn();
      const { panel, container } = makePanel({ onCategorySelect });
      const categories: AminetCategoryView[] = [
        { path: "game/action", name: "Action", count: 42 },
      ];
      panel.setCategories(categories);

      const item = container.querySelector(
        ".aminet-category-item",
      ) as HTMLElement;
      item.click();

      expect(onCategorySelect).toHaveBeenCalledWith("game/action");
    });
  });

  describe("result selection callback", () => {
    it("constructor accepts onResultSelect callback", () => {
      const onResultSelect = vi.fn();
      expect(() => makePanel({ onResultSelect })).not.toThrow();
    });

    it("clicking a result row triggers onResultSelect with package filename", () => {
      const onResultSelect = vi.fn();
      const { panel, container } = makePanel({ onResultSelect });
      const results: AminetPackageView[] = [
        {
          filename: "Doom.lha",
          category: "game/action",
          sizeKb: 512,
          description: "Doom for Amiga",
          status: "clean",
        },
      ];
      panel.setResults(results);

      const row = container.querySelector(
        ".aminet-result-row",
      ) as HTMLElement;
      row.click();

      expect(onResultSelect).toHaveBeenCalledWith("Doom.lha");
    });
  });

  describe("destroy", () => {
    it("calling destroy() removes all DOM elements from container", () => {
      const { panel, container } = makePanel();
      panel.destroy();

      expect(container.querySelector(".aminet-panel")).toBeNull();
      expect(container.children.length).toBe(0);
    });

    it("calling destroy() twice does not throw", () => {
      const { panel } = makePanel();
      panel.destroy();
      expect(() => panel.destroy()).not.toThrow();
    });
  });
});
