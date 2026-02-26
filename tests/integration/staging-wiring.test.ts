import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StagingBridge,
  type StagingIntakeCompletePayload,
} from "../../desktop/src/pipeline/staging-bridge.js";
import type { StagingQuarantinePayload } from "../../desktop/src/ipc/types.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StagingBridge wiring (Staging intake -> Inbox)", () => {
  let onNotification: ReturnType<typeof vi.fn>;
  let onQuarantine: ReturnType<typeof vi.fn>;
  let bridge: StagingBridge;

  beforeEach(() => {
    onNotification = vi.fn();
    onQuarantine = vi.fn();
    bridge = new StagingBridge({ onNotification, onQuarantine });
  });

  it("intake complete triggers notification", () => {
    const payload: StagingIntakeCompletePayload = {
      file_path: "/staging/processed/mission.zip",
      destination: "/staging/processed/",
      notification_id: "notif-123",
    };

    bridge.handleIntakeComplete(payload);

    expect(onNotification).toHaveBeenCalledWith(payload);
  });

  it("quarantine event triggers alert", () => {
    const payload: StagingQuarantinePayload = {
      file_path: "evil.yaml",
      reason: "yaml_code_execution",
      detail: "!!python/object found",
    };

    bridge.handleQuarantine(payload);

    expect(onQuarantine).toHaveBeenCalledWith(payload);
  });

  it("staging status polling returns counts", async () => {
    const mockGetStatus = vi.fn().mockResolvedValue({
      intake_count: 3,
      processing_count: 1,
      quarantine_count: 2,
    });

    const status = await bridge.getStatus(mockGetStatus);

    expect(mockGetStatus).toHaveBeenCalled();
    expect(status).toEqual({
      intake_count: 3,
      processing_count: 1,
      quarantine_count: 2,
    });
  });

  it("multiple rapid intakes handled without loss", () => {
    const payloads: StagingIntakeCompletePayload[] = [
      {
        file_path: "/staging/processed/a.zip",
        destination: "/staging/processed/",
        notification_id: "notif-1",
      },
      {
        file_path: "/staging/processed/b.md",
        destination: "/staging/processed/",
        notification_id: "notif-2",
      },
      {
        file_path: "/staging/processed/c.json",
        destination: "/staging/processed/",
        notification_id: "notif-3",
      },
    ];

    for (const p of payloads) {
      bridge.handleIntakeComplete(p);
    }

    expect(onNotification).toHaveBeenCalledTimes(3);
    expect(onNotification).toHaveBeenNthCalledWith(1, payloads[0]);
    expect(onNotification).toHaveBeenNthCalledWith(2, payloads[1]);
    expect(onNotification).toHaveBeenNthCalledWith(3, payloads[2]);
  });

  it("bridge cleanup prevents further events", () => {
    bridge.destroy();

    bridge.handleIntakeComplete({
      file_path: "/staging/processed/after-destroy.zip",
      destination: "/staging/processed/",
      notification_id: "notif-x",
    });

    expect(onNotification).not.toHaveBeenCalled();
  });
});
