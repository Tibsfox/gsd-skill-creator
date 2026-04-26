/**
 * JP-006 — Mesh-degree monitor tests.
 *
 * Validates:
 *   1. 5-node mesh: rapid leave drops r below 2; grace-window enforcement
 *      prevents premature escalation; escalation fires after window expires.
 *   2. Recovery: re-joining restores degree, recovery handler fires, escalation
 *      does NOT fire again on the subsequent tick.
 *   3. Full-mesh stability: isStable() iff all nodes have r ≥ 2.
 *
 * Uses a deterministic clock (manual counter) so tests run in zero real time.
 *
 * @module orchestration/__tests__/mesh-degree-monitor.test
 */

import { describe, it, expect } from 'vitest';
import {
  MeshDegreeMonitor,
  type CapcomEscalation,
  type DegreeRecovery,
} from '../mesh-degree-monitor.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a clock that the test controls by mutating `clock.now`. */
function makeControllableClock(): { now: number; fn: () => number } {
  // Return the object itself (no spread) so that `clock.now = X` mutations
  // are visible to the closure.
  const clock = { now: 0 } as { now: number; fn: () => number };
  clock.fn = () => clock.now;
  return clock;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('MeshDegreeMonitor — 5-node mesh, grace-window enforcement', () => {
  it('grace window prevents premature escalation; fires after window expires', () => {
    const GRACE = 500;
    const escalations: CapcomEscalation[] = [];
    const recoveries: DegreeRecovery[] = [];
    const clock = makeControllableClock();

    const monitor = new MeshDegreeMonitor({
      graceWindowMs: GRACE,
      onEscalation: (e) => escalations.push(e),
      onRecovery: (r) => recoveries.push(r),
      clock: clock.fn,
    });

    // Build a 5-node mesh: each node starts with r = 2 (edges to two peers).
    // Topology: A↔B↔C↔D↔E (ring, directed outbound edges per node).
    const nodes = ['A', 'B', 'C', 'D', 'E'];
    monitor.onJoin('A', 'B'); monitor.onJoin('A', 'C');
    monitor.onJoin('B', 'A'); monitor.onJoin('B', 'C');
    monitor.onJoin('C', 'B'); monitor.onJoin('C', 'D');
    monitor.onJoin('D', 'C'); monitor.onJoin('D', 'E');
    monitor.onJoin('E', 'D'); monitor.onJoin('E', 'A');

    // All nodes should have r ≥ 2 initially.
    expect(monitor.isStable()).toBe(true);
    for (const n of nodes) {
      expect(monitor.degree(n)).toBeGreaterThanOrEqual(2);
    }

    // --- Rapid leave: node A loses edge to C (r drops to 1 < 2) ---
    clock.now = 100; // t=100ms
    monitor.onLeave('A', 'C');
    expect(monitor.degree('A')).toBe(1);
    expect(monitor.isStable()).toBe(false);

    // Tick at t=400ms (before grace window of 500ms).
    clock.now = 400;
    monitor.tick();
    // Escalation must NOT have fired yet — within grace window.
    expect(escalations).toHaveLength(0);

    // Tick at t=601ms (past grace window: 601 - 100 = 501 > 500).
    clock.now = 601;
    monitor.tick();
    // NOW the escalation should fire.
    expect(escalations).toHaveLength(1);
    expect(escalations[0].nodeId).toBe('A');
    expect(escalations[0].currentDegree).toBe(1);
    expect(escalations[0].severity).toBe('WARN');
    expect(escalations[0].durationMs).toBeGreaterThanOrEqual(GRACE);

    // Repeated tick should NOT emit a second escalation (already fired).
    clock.now = 900;
    monitor.tick();
    expect(escalations).toHaveLength(1);

    // --- Recovery: node A rejoins C ---
    clock.now = 1000;
    monitor.onJoin('A', 'C');
    expect(monitor.degree('A')).toBe(2);
    expect(monitor.isStable()).toBe(true);
    // Recovery event should have fired.
    expect(recoveries).toHaveLength(1);
    expect(recoveries[0].nodeId).toBe('A');
    expect(recoveries[0].restoredDegree).toBe(2);

    // After recovery, a tick should not re-fire the escalation.
    clock.now = 1200;
    monitor.tick();
    expect(escalations).toHaveLength(1); // still only 1
  });

  it('CRITICAL severity when degree drops to 0', () => {
    const escalations: CapcomEscalation[] = [];
    const clock = makeControllableClock();

    const monitor = new MeshDegreeMonitor({
      graceWindowMs: 100,
      onEscalation: (e) => escalations.push(e),
      clock: clock.fn,
    });

    // Node X starts with degree 2, then both edges leave.
    clock.now = 0;
    monitor.onJoin('X', 'Y');
    monitor.onJoin('X', 'Z');
    expect(monitor.degree('X')).toBe(2);

    // Remove both edges rapidly.
    clock.now = 10;
    monitor.onLeave('X', 'Y');
    monitor.onLeave('X', 'Z');
    expect(monitor.degree('X')).toBe(0);

    // Tick past grace window.
    clock.now = 200;
    monitor.tick();
    expect(escalations).toHaveLength(1);
    expect(escalations[0].nodeId).toBe('X');
    expect(escalations[0].currentDegree).toBe(0);
    expect(escalations[0].severity).toBe('CRITICAL');
  });

  it('degradedNodes() lists nodes that were stable and then dropped', () => {
    const clock = makeControllableClock();
    const monitor = new MeshDegreeMonitor({ graceWindowMs: 1000, clock: clock.fn });

    // Build A and C to stable, then drop A.
    monitor.onJoin('A', 'B'); monitor.onJoin('A', 'C'); // A: r=2 (stable)
    monitor.onJoin('C', 'A'); monitor.onJoin('C', 'B'); // C: r=2 (stable)

    expect(monitor.isStable()).toBe(true);

    // Drop A below threshold.
    monitor.onLeave('A', 'C'); // A: r=1 (degraded)

    const degraded = monitor.degradedNodes();
    expect(degraded).toContain('A');
    expect(degraded).not.toContain('C');
  });
});
