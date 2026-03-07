import { describe, it, expect, beforeEach } from "vitest";
import { MathPanel } from "./math-panel";
import type { MathPanelData, ChipStatus, OperationRecord } from "./math-panel";

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makeChip(overrides: Partial<ChipStatus> = {}): ChipStatus {
  return {
    name: "ALGEBRUS",
    enabled: true,
    backend: "gpu",
    operations: ["gemm", "solve"],
    opCount: 42,
    ...overrides,
  };
}

function makeFiveChips(): ChipStatus[] {
  return [
    makeChip({ name: "ALGEBRUS", backend: "gpu", operations: ["gemm"], opCount: 10 }),
    makeChip({ name: "FOURIER", backend: "cpu", operations: ["fft", "ifft"], opCount: 5 }),
    makeChip({ name: "VECTORA", backend: "cpu", operations: ["gradient"], opCount: 3 }),
    makeChip({ name: "STATOS", backend: "cpu", operations: ["describe", "monte_carlo"], opCount: 7 }),
    makeChip({ name: "SYMBEX", backend: "cpu", operations: ["eval", "verify"], opCount: 2 }),
  ];
}

function makeData(overrides: Partial<MathPanelData> = {}): MathPanelData {
  return {
    chips: makeFiveChips(),
    vram: {
      budgetMb: 750,
      allocatedMb: 128,
      utilizationPct: 17.1,
      gpuName: "RTX 4060 Ti",
      gpuFreeMb: 6144,
    },
    streams: {
      dedicatedStream: true,
      streamPriority: 1,
      activeOps: 2,
      maxConcurrentOps: 4,
    },
    ...overrides,
  };
}

function makeOp(overrides: Partial<OperationRecord> = {}): OperationRecord {
  return {
    name: "gemm",
    backend: "gpu",
    timeMs: 1.234,
    precision: "fp64",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("MathPanel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("construction", () => {
    it("creates container structure with four sections", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);

      const root = container.querySelector(".math-panel-root");
      expect(root).not.toBeNull();
      expect(root!.querySelector(".math-panel-chips")).not.toBeNull();
      expect(root!.querySelector(".math-panel-vram")).not.toBeNull();
      expect(root!.querySelector(".math-panel-streams")).not.toBeNull();
      expect(root!.querySelector(".math-panel-history")).not.toBeNull();

      panel.destroy();
    });
  });

  describe("update() — chip table", () => {
    it("renders chip table with 5 rows", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const rows = container.querySelectorAll(".math-panel-chip-table tbody tr");
      expect(rows).toHaveLength(5);

      panel.destroy();
    });

    it("renders chip names correctly", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const names = container.querySelectorAll(".math-panel-chip-name");
      const nameTexts = Array.from(names).map((n) => n.textContent);
      expect(nameTexts).toEqual(["ALGEBRUS", "FOURIER", "VECTORA", "STATOS", "SYMBEX"]);

      panel.destroy();
    });
  });

  describe("update() — VRAM gauge", () => {
    it("renders VRAM gauge with correct percentage width", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const fill = container.querySelector(".math-panel-vram-fill") as HTMLElement;
      expect(fill).not.toBeNull();
      expect(fill.style.width).toBe("17.1%");

      panel.destroy();
    });

    it("shows VRAM stats text with allocated / budget", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const stats = container.querySelector(".math-panel-vram-stats");
      expect(stats!.textContent).toBe("128 / 750 MB (17.1%)");

      panel.destroy();
    });

    it("with zero VRAM shows empty gauge (0% width)", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData({
        vram: {
          budgetMb: 750,
          allocatedMb: 0,
          utilizationPct: 0,
          gpuName: "RTX 4060 Ti",
          gpuFreeMb: 6144,
        },
      }));

      const fill = container.querySelector(".math-panel-vram-fill") as HTMLElement;
      expect(fill.style.width).toBe("0%");

      panel.destroy();
    });
  });

  describe("update() — stream status", () => {
    it("renders stream status with dedicated stream active", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const dl = container.querySelector(".math-panel-stream-list");
      expect(dl).not.toBeNull();

      const dds = dl!.querySelectorAll("dd");
      const values = Array.from(dds).map((dd) => dd.textContent);
      expect(values).toContain("Active");
      expect(values).toContain("1");
      expect(values).toContain("2 / 4");

      panel.destroy();
    });

    it("shows Inactive when dedicated stream is off", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData({
        streams: {
          dedicatedStream: false,
          streamPriority: 0,
          activeOps: 0,
          maxConcurrentOps: 4,
        },
      }));

      const dds = container.querySelectorAll(".math-panel-stream-list dd");
      const values = Array.from(dds).map((dd) => dd.textContent);
      expect(values).toContain("Inactive");

      panel.destroy();
    });
  });

  describe("addOperation()", () => {
    it("adds an operation visible in the DOM history table", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      panel.addOperation(makeOp({ name: "gemm", backend: "gpu", timeMs: 0.512 }));

      const historyRows = container.querySelectorAll(".math-panel-history-table tbody tr");
      expect(historyRows.length).toBe(1);
      expect(historyRows[0].querySelector("td")!.textContent).toBe("gemm");

      panel.destroy();
    });

    it("caps operation history at 20 entries", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      for (let i = 0; i < 25; i++) {
        panel.addOperation(makeOp({ name: `op-${i}`, timeMs: i * 0.1 }));
      }

      const historyRows = container.querySelectorAll(".math-panel-history-table tbody tr");
      expect(historyRows.length).toBe(20);

      // Oldest entries (op-0 through op-4) should be evicted
      const allText = Array.from(historyRows).map((r) => r.querySelector("td")!.textContent);
      expect(allText).not.toContain("op-0");
      expect(allText).not.toContain("op-4");
      // Most recent should be present (rendered newest-first)
      expect(allText[0]).toBe("op-24");

      panel.destroy();
    });
  });

  describe("destroy()", () => {
    it("removes all DOM elements from the container", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      // Verify content exists before destroy
      expect(container.querySelector(".math-panel-root")).not.toBeNull();

      panel.destroy();

      expect(container.querySelector(".math-panel-root")).toBeNull();
      expect(container.querySelector(".math-panel-chips")).toBeNull();
      expect(container.querySelector(".math-panel-vram")).toBeNull();
    });
  });

  describe("chip states", () => {
    it("disabled chip row has disabled class", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);

      const chips = makeFiveChips();
      chips[2] = makeChip({ name: "VECTORA", enabled: false, backend: "cpu" });
      panel.update(makeData({ chips }));

      const rows = container.querySelectorAll(".math-panel-chip-table tbody tr");
      expect(rows[2].className).toBe("math-panel-chip-disabled");
      // Enabled rows
      expect(rows[0].className).toBe("math-panel-chip-enabled");

      panel.destroy();
    });

    it("disabled chip shows 'Disabled' status text", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);

      const chips = makeFiveChips();
      chips[1] = makeChip({ name: "FOURIER", enabled: false, backend: "cpu" });
      panel.update(makeData({ chips }));

      const statusCells = container.querySelectorAll(".math-panel-chip-status");
      expect(statusCells[1].textContent).toBe("Disabled");

      panel.destroy();
    });
  });

  describe("backend highlighting", () => {
    it("GPU backend cell has gpu class, CPU has cpu class", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      const backendCells = container.querySelectorAll(
        ".math-panel-chip-table tbody td:nth-child(3)"
      );
      // ALGEBRUS = gpu
      expect(backendCells[0].className).toBe("math-panel-backend-gpu");
      expect(backendCells[0].textContent).toBe("GPU");
      // FOURIER = cpu
      expect(backendCells[1].className).toBe("math-panel-backend-cpu");
      expect(backendCells[1].textContent).toBe("CPU");

      panel.destroy();
    });

    it("operation history rows have backend-specific classes", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      panel.addOperation(makeOp({ name: "gemm", backend: "gpu" }));
      panel.addOperation(makeOp({ name: "fft", backend: "cpu" }));

      const rows = container.querySelectorAll(".math-panel-history-table tbody tr");
      // Newest first: fft (cpu), then gemm (gpu)
      expect(rows[0].className).toBe("math-panel-backend-cpu");
      expect(rows[1].className).toBe("math-panel-backend-gpu");

      panel.destroy();
    });
  });

  describe("re-render", () => {
    it("update() replaces previous content cleanly", () => {
      const container = makeContainer();
      const panel = new MathPanel(container);
      panel.update(makeData());

      // First render: 5 chip rows
      expect(container.querySelectorAll(".math-panel-chip-table tbody tr")).toHaveLength(5);

      // Second render with different data: still 5 rows, no duplication
      panel.update(makeData());
      expect(container.querySelectorAll(".math-panel-chip-table tbody tr")).toHaveLength(5);

      // Only one chip table exists
      expect(container.querySelectorAll(".math-panel-chip-table")).toHaveLength(1);

      panel.destroy();
    });
  });
});
