/**
 * Math Co-Processor Dashboard Bridge.
 *
 * Connects the MathPanel rendering component to live co-processor data
 * via Tauri MCP IPC. Fetches chip status, VRAM, and stream data from
 * the math co-processor MCP server and feeds it to the panel.
 *
 * Also intercepts MCP tool call trace events to populate operation history.
 *
 * @module dashboard/math-bridge
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { MathPanel } from "./math-panel";
import type { MathPanelData, ChipStatus, VRAMStatus, StreamStatus, OperationRecord } from "./math-panel";

/** Server ID for the math co-processor MCP server. */
const MATH_SERVER_ID = "gsd-math-coprocessor";

/** MCP tool call result shape from Rust backend. */
interface ToolCallResult {
  tool_name: string;
  server_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  latency_ms: number;
}

/** Shape of the math.capabilities response from the MCP server. */
interface CapabilitiesResponse {
  chips: Record<string, {
    chip: string;
    operations: string[];
    gpu_accelerated: string[];
    cpu_fallback: string[];
    enabled: boolean;
    jit_available?: boolean;
  }>;
  gpu: { available: boolean; name?: string; free_memory_mb?: number };
  vram: {
    budget_mb: number;
    allocated_mb: number;
    utilization_pct: number;
    gpu_name: string;
    gpu_free_mb: number;
  };
  streams: {
    dedicated_stream: boolean;
    stream_priority: number;
    active_ops: number;
    max_concurrent_ops: number;
  };
}

/** MCP trace event emitted by the Rust backend. */
interface TraceEvent {
  server_id: string;
  method: string;
  timestamp_ms: number;
  result?: unknown;
  error?: string;
}

/** Options for configuring the MathBridge. */
export interface MathBridgeOptions {
  panel: MathPanel;
  pollIntervalMs?: number;
}

/**
 * Bridge between MCP IPC and MathPanel.
 *
 * - Polls math.capabilities at a configurable interval
 * - Listens for MCP trace events to capture operation history
 * - Transforms MCP responses to MathPanelData
 */
export class MathBridge {
  private readonly panel: MathPanel;
  private readonly pollIntervalMs: number;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private traceUnlisten: UnlistenFn | null = null;
  private opCounter = new Map<string, number>();
  private destroyed = false;

  constructor(options: MathBridgeOptions) {
    this.panel = options.panel;
    this.pollIntervalMs = options.pollIntervalMs ?? 5000;
  }

  /**
   * Start polling for status and listening for trace events.
   */
  async start(): Promise<void> {
    if (this.destroyed) return;

    // Initial fetch
    await this.refresh();

    // Set up polling
    this.pollTimer = setInterval(() => {
      void this.refresh();
    }, this.pollIntervalMs);

    // Listen for MCP trace events to capture operation history
    this.traceUnlisten = await listen<TraceEvent>("mcp-trace", (event) => {
      this.handleTraceEvent(event.payload);
    });
  }

  /**
   * Fetch current status from the math co-processor and update the panel.
   */
  async refresh(): Promise<void> {
    if (this.destroyed) return;

    try {
      const result = await invoke<ToolCallResult>("mcp_call_tool", {
        toolName: "math.capabilities",
        params: {},
      });

      if (!result.success || !result.result) return;

      const data = this.transformCapabilities(result.result as CapabilitiesResponse);
      this.panel.update(data);
    } catch {
      // Server not connected or unavailable — silent fail
    }
  }

  /**
   * Stop polling and remove event listeners.
   */
  destroy(): void {
    this.destroyed = true;
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.traceUnlisten) {
      this.traceUnlisten();
      this.traceUnlisten = null;
    }
    this.opCounter.clear();
  }

  // -- Private helpers --

  /**
   * Transform MCP capabilities response to MathPanelData.
   */
  private transformCapabilities(caps: CapabilitiesResponse): MathPanelData {
    const chips: ChipStatus[] = Object.entries(caps.chips).map(([name, chip]) => ({
      name: chip.chip,
      enabled: chip.enabled,
      backend: chip.gpu_accelerated.length > 0 ? "gpu" as const : "cpu" as const,
      operations: chip.operations,
      opCount: this.opCounter.get(name) ?? 0,
    }));

    const vram: VRAMStatus = {
      budgetMb: caps.vram.budget_mb,
      allocatedMb: caps.vram.allocated_mb,
      utilizationPct: caps.vram.utilization_pct,
      gpuName: caps.vram.gpu_name ?? caps.gpu.name ?? "N/A",
      gpuFreeMb: caps.vram.gpu_free_mb ?? caps.gpu.free_memory_mb ?? 0,
    };

    const streams: StreamStatus = {
      dedicatedStream: caps.streams.dedicated_stream,
      streamPriority: caps.streams.stream_priority,
      activeOps: caps.streams.active_ops,
      maxConcurrentOps: caps.streams.max_concurrent_ops,
    };

    return { chips, vram, streams };
  }

  /**
   * Handle an MCP trace event — if it's a math operation, add to history.
   */
  private handleTraceEvent(event: TraceEvent): void {
    if (event.server_id !== MATH_SERVER_ID) return;

    // Extract tool name from method: "tools/call:algebrus.gemm" -> "algebrus.gemm"
    const match = event.method.match(/^tools\/call:(.+)$/);
    if (!match) return;

    const toolName = match[1];

    // Skip meta tools
    if (toolName.startsWith("math.")) return;

    // Extract chip name for operation counter
    const chipName = toolName.split(".")[0];
    this.opCounter.set(chipName, (this.opCounter.get(chipName) ?? 0) + 1);

    // Parse result to extract backend and timing
    const resultData = event.result as Record<string, unknown> | undefined;
    const backend = (resultData?.backend as string) === "gpu" ? "gpu" : "cpu";
    const timeMs = (resultData?.computation_time_ms as number) ?? 0;
    const precision = (resultData?.precision as string) ?? "fp64";

    const op: OperationRecord = {
      name: toolName,
      backend: backend as "gpu" | "cpu",
      timeMs,
      precision,
      timestamp: event.timestamp_ms,
    };

    this.panel.addOperation(op);
  }
}
