/**
 * Math Co-Processor Dashboard Panel.
 *
 * Pure TypeScript panel that renders chip status, VRAM gauge, stream status,
 * and operation history for the GSD Math Co-Processor. Receives data via
 * typed interfaces (routed from MCP server responses through the app).
 *
 * @module dashboard/math-panel
 */

/** Status of a single math chip. */
export interface ChipStatus {
  name: string;
  enabled: boolean;
  backend: "gpu" | "cpu";
  operations: string[];
  opCount: number;
}

/** VRAM allocation and GPU memory status. */
export interface VRAMStatus {
  budgetMb: number;
  allocatedMb: number;
  utilizationPct: number;
  gpuName: string;
  gpuFreeMb: number;
}

/** CUDA stream isolation status. */
export interface StreamStatus {
  dedicatedStream: boolean;
  streamPriority: number;
  activeOps: number;
  maxConcurrentOps: number;
}

/** A single completed operation record. */
export interface OperationRecord {
  name: string;
  backend: "gpu" | "cpu";
  timeMs: number;
  precision: string;
  timestamp: number;
}

/** Top-level data payload for the math panel. */
export interface MathPanelData {
  chips: ChipStatus[];
  vram: VRAMStatus;
  streams: StreamStatus;
}

const MAX_HISTORY = 20;

/**
 * Dashboard panel component for Math Co-Processor status.
 *
 * Renders chip table, VRAM gauge, stream status, and operation history
 * into a container element using DOM manipulation (no innerHTML for data).
 */
export class MathPanel {
  private readonly container: HTMLElement;
  private readonly root: HTMLDivElement;
  private readonly chipSection: HTMLDivElement;
  private readonly vramSection: HTMLDivElement;
  private readonly streamSection: HTMLDivElement;
  private readonly historySection: HTMLDivElement;
  private readonly history: OperationRecord[] = [];

  constructor(container: HTMLElement) {
    this.container = container;

    this.root = document.createElement("div");
    this.root.className = "math-panel-root";

    // Chip status section
    this.chipSection = document.createElement("div");
    this.chipSection.className = "math-panel-chips";
    this.root.appendChild(this.chipSection);

    // VRAM gauge section
    this.vramSection = document.createElement("div");
    this.vramSection.className = "math-panel-vram";
    this.root.appendChild(this.vramSection);

    // Stream status section
    this.streamSection = document.createElement("div");
    this.streamSection.className = "math-panel-streams";
    this.root.appendChild(this.streamSection);

    // Operation history section
    this.historySection = document.createElement("div");
    this.historySection.className = "math-panel-history";
    this.root.appendChild(this.historySection);

    this.container.appendChild(this.root);
  }

  /** Re-render the panel with new data. */
  update(data: MathPanelData): void {
    this.renderChips(data.chips);
    this.renderVRAM(data.vram);
    this.renderStreams(data.streams);
    this.renderHistory();
  }

  /** Push an operation to the circular history buffer and re-render history. */
  addOperation(op: OperationRecord): void {
    this.history.push(op);
    while (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.renderHistory();
  }

  /** Remove all DOM elements and clean up. */
  destroy(): void {
    this.root.remove();
    this.history.length = 0;
  }

  // -- Private renderers --

  private renderChips(chips: ChipStatus[]): void {
    this.clearChildren(this.chipSection);

    const heading = document.createElement("h3");
    heading.className = "math-panel-section-title";
    heading.textContent = "Chip Status";
    this.chipSection.appendChild(heading);

    const table = document.createElement("table");
    table.className = "math-panel-chip-table";

    // Header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const label of ["Chip", "Status", "Backend", "Ops", "Count"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Data rows
    const tbody = document.createElement("tbody");
    for (const chip of chips) {
      const tr = document.createElement("tr");
      tr.className = chip.enabled
        ? "math-panel-chip-enabled"
        : "math-panel-chip-disabled";

      // Name
      const tdName = document.createElement("td");
      tdName.className = "math-panel-chip-name";
      tdName.textContent = chip.name;
      tr.appendChild(tdName);

      // Status
      const tdStatus = document.createElement("td");
      tdStatus.className = "math-panel-chip-status";
      tdStatus.textContent = chip.enabled ? "Enabled" : "Disabled";
      tr.appendChild(tdStatus);

      // Backend
      const tdBackend = document.createElement("td");
      tdBackend.className = chip.backend === "gpu"
        ? "math-panel-backend-gpu"
        : "math-panel-backend-cpu";
      tdBackend.textContent = chip.backend.toUpperCase();
      tr.appendChild(tdBackend);

      // Operations
      const tdOps = document.createElement("td");
      tdOps.textContent = chip.operations.join(", ");
      tr.appendChild(tdOps);

      // Count
      const tdCount = document.createElement("td");
      tdCount.textContent = String(chip.opCount);
      tr.appendChild(tdCount);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    this.chipSection.appendChild(table);
  }

  private renderVRAM(vram: VRAMStatus): void {
    this.clearChildren(this.vramSection);

    const heading = document.createElement("h3");
    heading.className = "math-panel-section-title";
    heading.textContent = "VRAM";
    this.vramSection.appendChild(heading);

    // GPU name label
    const gpuLabel = document.createElement("div");
    gpuLabel.className = "math-panel-vram-gpu";
    gpuLabel.textContent = `${vram.gpuName} (${vram.gpuFreeMb} MB free)`;
    this.vramSection.appendChild(gpuLabel);

    // Gauge outer track
    const gaugeOuter = document.createElement("div");
    gaugeOuter.className = "math-panel-vram-gauge";

    // Gauge inner fill bar
    const gaugeInner = document.createElement("div");
    gaugeInner.className = "math-panel-vram-fill";
    const pct = Math.max(0, Math.min(100, vram.utilizationPct));
    gaugeInner.style.width = `${pct}%`;
    gaugeOuter.appendChild(gaugeInner);
    this.vramSection.appendChild(gaugeOuter);

    // Utilization text
    const stats = document.createElement("div");
    stats.className = "math-panel-vram-stats";
    stats.textContent =
      `${vram.allocatedMb} / ${vram.budgetMb} MB (${vram.utilizationPct}%)`;
    this.vramSection.appendChild(stats);
  }

  private renderStreams(streams: StreamStatus): void {
    this.clearChildren(this.streamSection);

    const heading = document.createElement("h3");
    heading.className = "math-panel-section-title";
    heading.textContent = "Stream Status";
    this.streamSection.appendChild(heading);

    const entries: [string, string][] = [
      ["Dedicated Stream", streams.dedicatedStream ? "Active" : "Inactive"],
      ["Priority", String(streams.streamPriority)],
      ["Active Ops", `${streams.activeOps} / ${streams.maxConcurrentOps}`],
    ];

    const dl = document.createElement("dl");
    dl.className = "math-panel-stream-list";
    for (const [label, value] of entries) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      dl.appendChild(dt);

      const dd = document.createElement("dd");
      dd.textContent = value;
      dl.appendChild(dd);
    }
    this.streamSection.appendChild(dl);
  }

  private renderHistory(): void {
    this.clearChildren(this.historySection);

    const heading = document.createElement("h3");
    heading.className = "math-panel-section-title";
    heading.textContent = "Operation History";
    this.historySection.appendChild(heading);

    if (this.history.length === 0) {
      const empty = document.createElement("p");
      empty.className = "math-panel-history-empty";
      empty.textContent = "No operations recorded.";
      this.historySection.appendChild(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "math-panel-history-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const label of ["Operation", "Backend", "Time (ms)", "Precision"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    // Render most recent first
    for (let i = this.history.length - 1; i >= 0; i--) {
      const op = this.history[i];
      const tr = document.createElement("tr");
      tr.className = op.backend === "gpu"
        ? "math-panel-backend-gpu"
        : "math-panel-backend-cpu";

      const tdName = document.createElement("td");
      tdName.textContent = op.name;
      tr.appendChild(tdName);

      const tdBackend = document.createElement("td");
      tdBackend.textContent = op.backend.toUpperCase();
      tr.appendChild(tdBackend);

      const tdTime = document.createElement("td");
      tdTime.textContent = op.timeMs.toFixed(3);
      tr.appendChild(tdTime);

      const tdPrec = document.createElement("td");
      tdPrec.textContent = op.precision;
      tr.appendChild(tdPrec);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    this.historySection.appendChild(table);
  }

  private clearChildren(el: HTMLElement): void {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
}
