/**
 * BootstrapFlow -- Orchestrates the complete bootstrap-to-READY sequence.
 *
 * Starts all 7 services in dependency order, handles API key provisioning,
 * updates LED panel progressively, and shows the READY prompt when complete.
 * Idempotent: detects already-running services and skips re-starting them.
 *
 * @module pipeline/bootstrap-flow
 * @since Phase 383
 */

import type { ChatRendererPort } from "./chat-pipeline";
import type { LedPanelPort } from "./led-bridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BootstrapStage =
  | "prerequisites"
  | "scaffold"
  | "services"
  | "api_key"
  | "ready"
  | "complete"
  | "failed";

/** Service dependency graph: ordered list with dependency requirements. */
const SERVICE_ORDER = [
  { id: "tmux", deps: [] as string[] },
  { id: "claude", deps: ["tmux"] },
  { id: "file_watcher", deps: ["claude"] },
  { id: "dashboard", deps: ["file_watcher"] },
  { id: "console", deps: ["file_watcher"] },
  { id: "staging", deps: ["dashboard", "console"] },
  { id: "terminal", deps: ["staging"] },
] as const;

/** Port for IPC commands (injectable for testing). */
export interface IpcCommandsPort {
  startService(serviceId: string): Promise<{ ok: boolean; error?: string }>;
  getServiceStates(): Promise<
    Array<{ service_id: string; status: string; led_color: string }>
  >;
  hasApiKey(): Promise<boolean>;
  storeApiKey(key: string): Promise<void>;
  getMagicLevel(): Promise<{ level: number }>;
}

export interface BootstrapFlowConfig {
  chatRenderer: ChatRendererPort;
  ledPanel: LedPanelPort;
  ipcCommands: IpcCommandsPort;
  onStageChange?: (stage: BootstrapStage) => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class BootstrapFlow {
  private chatRenderer: ChatRendererPort;
  private ledPanel: LedPanelPort;
  private ipc: IpcCommandsPort;
  private onStageChange?: (stage: BootstrapStage) => void;
  private _stage: BootstrapStage = "prerequisites";
  private _apiKeyResolver?: (key: string) => void;

  constructor(config: BootstrapFlowConfig) {
    this.chatRenderer = config.chatRenderer;
    this.ledPanel = config.ledPanel;
    this.ipc = config.ipcCommands;
    this.onStageChange = config.onStageChange;
  }

  get stage(): BootstrapStage {
    return this._stage;
  }

  private setStage(stage: BootstrapStage): void {
    this._stage = stage;
    this.onStageChange?.(stage);
  }

  async run(): Promise<void> {
    try {
      // Stage 1: Prerequisites (check if services are already running)
      this.setStage("prerequisites");
      const existingStates = await this.ipc.getServiceStates();
      const allOnline =
        existingStates.length > 0 &&
        existingStates.every((s) => s.status === "online");

      if (allOnline) {
        // Idempotent: already bootstrapped
        this.chatRenderer.appendMessage("system", "Services already online.");
        for (const s of existingStates) {
          this.ledPanel.setServiceState(s.service_id, s.status, s.led_color);
        }
        this.setStage("ready");
        this.chatRenderer.showReady();
        this.setStage("complete");
        return;
      }

      // Stage 2: Scaffold (.planning/ directories)
      this.setStage("scaffold");
      // Scaffold is handled by bootstrap.sh or scaffold-planning-dirs.sh
      // In-app, just verify directories exist via IPC or assume they do

      // Stage 3: Start services in dependency order
      this.setStage("services");
      for (const service of SERVICE_ORDER) {
        // Wait for dependencies to be online
        if (service.deps.length > 0) {
          const states = await this.ipc.getServiceStates();
          const depsOnline = service.deps.every((dep) => {
            const depState = states.find((s) => s.service_id === dep);
            return depState?.status === "online";
          });
          if (!depsOnline) {
            this.chatRenderer.showError(
              `Cannot start ${service.id}: dependencies not online (${service.deps.join(", ")})`,
              true,
            );
            this.setStage("failed");
            return;
          }
        }

        // Update LED: starting (amber)
        this.ledPanel.setServiceState(service.id, "starting", "amber");

        const result = await this.ipc.startService(service.id);
        if (!result.ok) {
          this.ledPanel.setServiceState(service.id, "failed", "red");
          this.chatRenderer.showError(
            `Failed to start ${service.id}: ${result.error || "unknown error"}`,
            true,
          );
          this.setStage("failed");
          return;
        }

        // Update LED: online (green)
        this.ledPanel.setServiceState(service.id, "online", "green");
      }

      // Stage 4: Check API key
      this.setStage("api_key");
      const hasKey = await this.ipc.hasApiKey();
      if (!hasKey) {
        this.chatRenderer.appendMessage(
          "system",
          "API key not found. Please provide your Anthropic API key:",
        );
        // Wait for user to provide key
        const key = await new Promise<string>((resolve) => {
          this._apiKeyResolver = resolve;
        });
        await this.ipc.storeApiKey(key);
      }

      // Stage 5: READY
      this.setStage("ready");
      this.chatRenderer.showReady();
      this.setStage("complete");
    } catch (err) {
      this.chatRenderer.showError(
        `Bootstrap failed: ${err instanceof Error ? err.message : String(err)}`,
        true,
      );
      this.setStage("failed");
    }
  }

  /** Provide the API key when bootstrap is waiting at the api_key stage. */
  provideApiKey(key: string): void {
    this._apiKeyResolver?.(key);
    this._apiKeyResolver = undefined;
  }
}

export function createBootstrapFlow(
  config: BootstrapFlowConfig,
): BootstrapFlow {
  return new BootstrapFlow(config);
}
