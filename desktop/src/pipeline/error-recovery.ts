/**
 * ErrorRecoveryManager -- Detects service failures and guides the user
 * through recovery.
 *
 * When a service fails, shows an error in the CLI Chat with recovery
 * guidance. Supports `/restart <service>` commands for recoverable
 * failures and directs to `bootstrap.sh` for non-recoverable ones.
 *
 * @module pipeline/error-recovery
 * @since Phase 383
 */

import type { ChatRendererPort } from "./chat-pipeline";
import type { LedPanelPort } from "./led-bridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceFailedPayload {
  service_id: string;
  error: string;
  restart_available: boolean;
}

export interface ErrorRecoveryConfig {
  chatRenderer: ChatRendererPort;
  ledPanel: LedPanelPort;
  restartService: (
    serviceId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class ErrorRecoveryManager {
  private chatRenderer: ChatRendererPort;
  private ledPanel: LedPanelPort;
  private restartService: (
    serviceId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  private failedServices: Map<string, ServiceFailedPayload> = new Map();

  constructor(config: ErrorRecoveryConfig) {
    this.chatRenderer = config.chatRenderer;
    this.ledPanel = config.ledPanel;
    this.restartService = config.restartService;
  }

  /** Handle a service failure event. Updates LED and shows guidance. */
  handleServiceFailed(payload: ServiceFailedPayload): void {
    this.failedServices.set(payload.service_id, payload);

    // Update LED to red
    this.ledPanel.setServiceState(payload.service_id, "failed", "red");

    // Show error in chat
    this.chatRenderer.showError(
      `Service '${payload.service_id}' failed: ${payload.error}`,
      payload.restart_available,
    );

    // Show recovery guidance
    if (payload.restart_available) {
      this.chatRenderer.appendMessage(
        "system",
        `Service '${payload.service_id}' failed. Type /restart ${payload.service_id} to recover.`,
      );
    } else {
      this.chatRenderer.appendMessage(
        "system",
        `Service '${payload.service_id}' failed permanently. Run bootstrap.sh to reinitialize.`,
      );
    }
  }

  /**
   * Handle a recovery command from the user.
   * Returns true if recovery was attempted, false if command not recognized.
   */
  async handleRecoveryCommand(command: string): Promise<boolean> {
    const match = command.match(/^\/restart\s+(\S+)$/);
    if (!match) return false;

    const serviceId = match[1];
    const failedInfo = this.failedServices.get(serviceId);
    if (!failedInfo) {
      this.chatRenderer.appendMessage(
        "system",
        `Service '${serviceId}' is not in a failed state.`,
      );
      return false;
    }

    if (!failedInfo.restart_available) {
      this.chatRenderer.appendMessage(
        "system",
        `Service '${serviceId}' cannot be restarted. Run bootstrap.sh to reinitialize.`,
      );
      return false;
    }

    // Attempt restart
    this.chatRenderer.appendMessage("system", `Restarting ${serviceId}...`);
    this.ledPanel.setServiceState(serviceId, "starting", "amber");

    const result = await this.restartService(serviceId);
    if (result.ok) {
      this.failedServices.delete(serviceId);
      return true;
    } else {
      this.chatRenderer.showError(
        `Restart of '${serviceId}' failed: ${result.error || "unknown error"}`,
        true,
      );
      return false;
    }
  }

  /** Handle a service recovering (coming back online). */
  handleServiceRecovered(serviceId: string): void {
    this.failedServices.delete(serviceId);
    this.ledPanel.setServiceState(serviceId, "online", "green");
    this.chatRenderer.appendMessage(
      "system",
      `Service '${serviceId}' recovered and is back online.`,
    );
  }

  /** Get list of currently failed service IDs. */
  getFailedServices(): string[] {
    return Array.from(this.failedServices.keys());
  }
}

export function createErrorRecovery(
  config: ErrorRecoveryConfig,
): ErrorRecoveryManager {
  return new ErrorRecoveryManager(config);
}
