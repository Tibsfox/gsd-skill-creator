/**
 * C1 — Coprocessor watchdog tests (v1.49.634 §14).
 *
 * 6 hermetic tests with injected ping/restart/clock/scheduler. No subprocess
 * spawned. Mirror the v1.49.585 pattern (deterministic + isolated).
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  CoprocessorWatchdog,
  clearWatchdog,
  describeWatchdogError,
  getCoprocessorStatus,
  registerWatchdog,
  setSupervisorPolicy,
} from '../watchdog.js';

afterEach(() => {
  clearWatchdog();
});

describe('CoprocessorWatchdog (C1 v1.49.634)', () => {
  it('watchdog detects running MCP server as alive', async () => {
    const wd = new CoprocessorWatchdog({
      pingFn: async () => 12,
      now: () => 1_700_000_000_000,
    });
    await wd.probeOnce();
    const status = wd.getStatus();
    expect(status.state).toBe('alive');
    if (status.state === 'alive') {
      expect(status.latencyMs).toBe(12);
      expect(status.lastSeen).toBe(1_700_000_000_000);
    }
  });

  it('watchdog detects killed server as dead within timeout', async () => {
    const wd = new CoprocessorWatchdog({
      pingFn: async () => {
        throw new Error('ECONNREFUSED');
      },
      deadAfterMissedProbes: 3,
    });
    // First two probes accumulate missed count without declaring dead.
    await wd.probeOnce();
    expect(wd.getStatus().state).toBe('unknown');
    await wd.probeOnce();
    expect(wd.getStatus().state).toBe('unknown');
    // Third missed probe transitions to dead.
    await wd.probeOnce();
    const status = wd.getStatus();
    expect(status.state).toBe('dead');
    if (status.state === 'dead') {
      expect(status.lastError).toContain('ECONNREFUSED');
    }
  });

  it('watchdog reports degraded on slow responses', async () => {
    const wd = new CoprocessorWatchdog({
      pingFn: async () => 750,
      degradedThresholdMs: 500,
      now: () => 1_700_000_000_000,
    });
    await wd.probeOnce();
    const status = wd.getStatus();
    expect(status.state).toBe('degraded');
    if (status.state === 'degraded') {
      expect(status.latencyMs).toBe(750);
      expect(status.reason).toContain('750ms');
    }
  });

  it('supervisor restarts dead server when policy=auto-restart', async () => {
    let restartCalls = 0;
    let serverAlive = false;
    const wd = new CoprocessorWatchdog({
      policy: 'auto-restart',
      deadAfterMissedProbes: 1,
      pingFn: async () => {
        if (!serverAlive) throw new Error('dead');
        return 5;
      },
      restartFn: async () => {
        restartCalls += 1;
        serverAlive = true;
      },
    });
    // First probe fails → declared dead → auto-restart triggers.
    await wd.probeOnce();
    expect(restartCalls).toBe(1);
    // Status reset to startup-pending after successful restart.
    const status = wd.getStatus();
    expect(status.state).toBe('unknown');
    if (status.state === 'unknown') {
      expect(status.reason).toBe('startup-pending');
    }
    // Next probe should now succeed.
    await wd.probeOnce();
    expect(wd.getStatus().state).toBe('alive');
  });

  it('supervisor does NOT restart when policy=observe-only', async () => {
    let restartCalls = 0;
    const wd = new CoprocessorWatchdog({
      policy: 'observe-only',
      deadAfterMissedProbes: 1,
      pingFn: async () => {
        throw new Error('dead');
      },
      restartFn: async () => {
        restartCalls += 1;
      },
    });
    await wd.probeOnce();
    expect(wd.getStatus().state).toBe('dead');
    expect(restartCalls).toBe(0);
    // Subsequent probes still don't restart.
    await wd.probeOnce();
    expect(restartCalls).toBe(0);
  });

  it('watchdog status surfaces in coprocessor client errors', async () => {
    const wd = new CoprocessorWatchdog({
      pingFn: async () => {
        throw new Error('ECONNREFUSED');
      },
      deadAfterMissedProbes: 1,
    });
    await wd.probeOnce();
    registerWatchdog(wd);
    // Module-level singleton reflects status.
    expect(getCoprocessorStatus().state).toBe('dead');
    // Default policy is observe-only on this instance.
    const msg = describeWatchdogError();
    expect(msg).not.toBeNull();
    expect(msg!).toContain('MCPWatchdog: server dead');
    expect(msg!).toContain('observe-only');
    expect(msg!).toContain('no restart attempted');
    // Switching policy at runtime is reflected.
    setSupervisorPolicy('auto-restart');
    const msg2 = describeWatchdogError();
    expect(msg2!).toContain('auto-restart');
    expect(msg2!).toContain('restart attempted');
  });
});
