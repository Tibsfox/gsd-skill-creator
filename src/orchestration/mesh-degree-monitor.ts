/**
 * JP-006 — Mesh-Degree Monitor (r ≥ 2 string-stability invariant).
 *
 * Anchor: arXiv:2604.21329 (Generalized String-Stability Criteria).
 * String stability for a vehicle string (mesh) holds iff every node has
 * communication degree r ≥ 2. When r drops below 2 and stays there for
 * longer than `graceWindowMs`, the monitor emits a CAPCOM escalation.
 *
 * Architecture note: CAPCOM is an architectural pattern enforced statically
 * and via escalation events (see anytime-gate.ts, selector.ts). The escalation
 * emitted here is a structured event ready for call-site wiring; the monitor
 * itself is a pure-memory primitive with no filesystem I/O.
 *
 * @module orchestration/mesh-degree-monitor
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A node identifier in the mesh. */
export type NodeId = string;

/** Severity levels mirroring the CAPCOM escalation taxonomy. */
export type EscalationSeverity = 'WARN' | 'CRITICAL';

/** Emitted when r < 2 persists past the grace window. */
export interface CapcomEscalation {
  /** The node whose degree fell below 2. */
  nodeId: NodeId;
  /** Current mesh degree r at time of escalation. */
  currentDegree: number;
  /** How long (ms) the node has been in sub-threshold state. */
  durationMs: number;
  /** Severity: WARN when 1 ≤ r < 2; CRITICAL when r = 0. */
  severity: EscalationSeverity;
  /** Timestamp of the escalation event (Date.now()). */
  ts: number;
}

/** Emitted when a previously-degraded node recovers to r ≥ 2. */
export interface DegreeRecovery {
  nodeId: NodeId;
  restoredDegree: number;
  ts: number;
}

/** Handler called on CAPCOM escalation events. */
export type EscalationHandler = (e: CapcomEscalation) => void;
/** Handler called on degree-recovery events. */
export type RecoveryHandler = (e: DegreeRecovery) => void;

export interface MeshDegreeMonitorOptions {
  /**
   * Grace window in milliseconds before a sub-threshold degree triggers a
   * CAPCOM escalation. Default: 500 ms.
   */
  graceWindowMs?: number;
  /** Called for each CAPCOM escalation event. */
  onEscalation?: EscalationHandler;
  /** Called when a node recovers to r ≥ 2. */
  onRecovery?: RecoveryHandler;
  /**
   * Clock override for deterministic testing (replaces Date.now()).
   * Default: () => Date.now().
   */
  clock?: () => number;
}

// ─── Internal state ──────────────────────────────────────────────────────────

interface NodeState {
  /** Set of neighbour ids (edges). */
  neighbours: Set<NodeId>;
  /**
   * Timestamp when degree first dropped below 2 after having been stable.
   * Null when the node is currently at r ≥ 2, or has never been stable.
   */
  belowSince: number | null;
  /** True if an escalation has already been fired for the current degraded run. */
  escalationFired: boolean;
  /**
   * True once the node has reached r ≥ 2 at least once. The grace clock and
   * escalation machinery only engage after this flag is set — a freshly-built
   * node ramping up from 0 to 2 edges is not considered degraded.
   */
  wasStable: boolean;
}

// ─── MeshDegreeMonitor ───────────────────────────────────────────────────────

/**
 * Monitor that maintains per-node mesh degree and enforces the r ≥ 2
 * string-stability invariant. Call `onJoin` when a directed edge (u → v) is
 * established and `onLeave` when it is removed. Call `tick()` periodically
 * (or after state-changing operations) to check whether any node has been
 * below threshold past the grace window and emit CAPCOM escalations.
 *
 * @example
 * ```ts
 * const monitor = new MeshDegreeMonitor({ graceWindowMs: 200 });
 * monitor.onJoin('A', 'B');
 * monitor.onJoin('A', 'C'); // A now has degree 2 — stable
 * monitor.onLeave('A', 'C'); // A drops to degree 1 — grace window starts
 * monitor.tick(); // called after graceWindowMs — emits CAPCOM escalation
 * ```
 */
export class MeshDegreeMonitor {
  private readonly graceWindowMs: number;
  private readonly onEscalation: EscalationHandler | undefined;
  private readonly onRecovery: RecoveryHandler | undefined;
  private readonly clock: () => number;

  /** Per-node state map. */
  private readonly nodes = new Map<NodeId, NodeState>();

  constructor(opts: MeshDegreeMonitorOptions = {}) {
    this.graceWindowMs = opts.graceWindowMs ?? 500;
    this.onEscalation = opts.onEscalation;
    this.onRecovery = opts.onRecovery;
    this.clock = opts.clock ?? (() => Date.now());
    if (this.graceWindowMs < 0) {
      throw new RangeError(`graceWindowMs must be >= 0, got ${this.graceWindowMs}`);
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Register a directed edge from `from` to `to`. This increments `from`'s
   * outgoing communication degree. Only `from` is tracked; `to` is noted as a
   * valid neighbour but only acquires its own degree tracking when it itself
   * calls `onJoin`.
   * Idempotent: adding the same edge twice has no additional effect.
   */
  onJoin(from: NodeId, to: NodeId): void {
    const state = this._ensureNode(from);
    const sizeBefore = state.neighbours.size;
    state.neighbours.add(to);
    const sizeAfter = state.neighbours.size;
    if (sizeAfter > sizeBefore) {
      // Edge was newly added — recheck threshold.
      this._updateThreshold(from, state);
    }
  }

  /**
   * Remove a directed edge from `from` to `to`. Decrements `from`'s degree.
   * If the edge did not exist, this is a no-op.
   */
  onLeave(from: NodeId, to: NodeId): void {
    const state = this.nodes.get(from);
    if (!state) return;
    const sizeBefore = state.neighbours.size;
    state.neighbours.delete(to);
    const sizeAfter = state.neighbours.size;
    if (sizeAfter < sizeBefore) {
      this._updateThreshold(from, state);
    }
  }

  /**
   * Check all sub-threshold nodes against the grace window, emitting CAPCOM
   * escalation events for those that have exceeded it. Call this after each
   * join/leave batch or periodically.
   */
  tick(): void {
    const now = this.clock();
    for (const [nodeId, state] of this.nodes) {
      if (state.belowSince !== null && !state.escalationFired) {
        const elapsed = now - state.belowSince;
        if (elapsed >= this.graceWindowMs) {
          state.escalationFired = true;
          const degree = state.neighbours.size;
          const escalation: CapcomEscalation = {
            nodeId,
            currentDegree: degree,
            durationMs: elapsed,
            severity: degree === 0 ? 'CRITICAL' : 'WARN',
            ts: now,
          };
          this.onEscalation?.(escalation);
        }
      }
    }
  }

  /** Return the current degree of `nodeId`, or 0 if unknown. */
  degree(nodeId: NodeId): number {
    return this.nodes.get(nodeId)?.neighbours.size ?? 0;
  }

  /**
   * Return all nodes that were previously stable (r ≥ 2) and are currently
   * degraded (r < 2). Freshly-created nodes that have never reached r ≥ 2
   * are excluded — they are in ramp-up, not degraded.
   */
  degradedNodes(): NodeId[] {
    const out: NodeId[] = [];
    for (const [id, state] of this.nodes) {
      if (state.wasStable && state.neighbours.size < 2) out.push(id);
    }
    return out;
  }

  /**
   * True if every known node that has ever been stable is currently at r ≥ 2.
   * Returns true when no nodes have been added yet (vacuously stable).
   */
  isStable(): boolean {
    for (const state of this.nodes.values()) {
      if (state.wasStable && state.neighbours.size < 2) return false;
    }
    return true;
  }

  /** Number of nodes currently tracked. */
  nodeCount(): number {
    return this.nodes.size;
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private _ensureNode(id: NodeId): NodeState {
    let state = this.nodes.get(id);
    if (!state) {
      // wasStable=false: the grace clock and recovery machinery only engage
      // once the node has reached r ≥ 2 at least once.
      state = {
        neighbours: new Set(),
        belowSince: null,
        escalationFired: false,
        wasStable: false,
      };
      this.nodes.set(id, state);
    }
    return state;
  }

  private _updateThreshold(nodeId: NodeId, state: NodeState): void {
    const now = this.clock();
    const degree = state.neighbours.size;
    if (degree >= 2) {
      // Node has reached (or remains at) stable degree.
      const wasBelow = state.belowSince !== null;
      state.wasStable = true;
      state.belowSince = null;
      state.escalationFired = false;
      // Recovery only fires if the node was previously tracked as degraded
      // (i.e., was stable before and then dropped).
      if (wasBelow) {
        const recovery: DegreeRecovery = {
          nodeId,
          restoredDegree: degree,
          ts: now,
        };
        this.onRecovery?.(recovery);
      }
    } else {
      // Below threshold. Only start the grace clock once the node has been
      // stable at least once (wasStable=true). During initial ramp-up (a node
      // building from 0→1→2 edges), we don't treat intermediate degrees as
      // degraded — the node is simply not yet fully connected.
      if (state.wasStable && state.belowSince === null) {
        // Newly dropped below threshold after being stable.
        state.belowSince = now;
        state.escalationFired = false;
      }
      // If already below (belowSince != null), keep the original start time.
    }
  }
}
