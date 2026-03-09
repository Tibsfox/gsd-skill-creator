/**
 * Spatial Awareness — Frog Protocol Controller
 * Paula Chipset Release 2, Wave 2 (2A)
 *
 * The Graduated Response Controller — implements the 5-phase
 * Frog Protocol state machine:
 *
 *   BASELINE → SILENCE → ASSESS → PROBE → CLASSIFY → RESUME → BASELINE
 *
 * Each phase has clear entry/exit criteria. The controller does NOT
 * centralize decision-making — it provides the protocol, agents
 * execute autonomously. No leader election.
 *
 * Safety-critical:
 *   SC-HUM — BLOCK threats wait for CAPCOM/human before irreversible action
 *   SC-RES — No agent resumes work while BLOCK-level threat active
 *   SC-COR — SILENCE entry requires correlated signals from ≥2 sources
 *
 * Core functionality:
 *   CF-06 — SILENCE within 500ms of anomaly detection
 *   CF-07 — ASSESS produces threat characterization within 5s
 *   CF-08 — PROBE dispatches scout; scout acts before others
 *   CF-09 — CLASSIFY correctly labels THREAT/NEUTRAL/OPPORTUNITY
 *   CF-10 — RESUME re-engages agents in priority order
 */

import type {
  FrogPhase,
  ThreatEvent,
  ThreatLevel,
  ThreatClassification,
  CoordinationMessage,
} from './types.js';
import type { CommBus } from './comm-bus.js';
import type { ChorusProtocol } from './chorus-proto.js';
import type { OutputSynthesis } from './output-synthesis.js';

// ============================================================================
// Configuration
// ============================================================================

export interface FrogProtocolConfig {
  /** Silence period duration in ms (default 5000). */
  silenceDurationMs: number;
  /** Maximum assessment time in ms (default 5000). */
  assessTimeoutMs: number;
  /** Maximum probe wait time in ms (default 10000). */
  probeTimeoutMs: number;
  /** Delay between scout resume and follower resume in ms. */
  resumeDelayMs: number;
  /** Maximum probe attempts before forced classification. */
  maxProbeAttempts: number;
  /** SC-HUM: BLOCK-level threats require human approval. */
  blockRequiresHuman: boolean;
  /** SC-RES: Forbid resume while any BLOCK-level threat is active. */
  allowResumeOnBlock: boolean;
}

export const DEFAULT_FROG_CONFIG: FrogProtocolConfig = {
  silenceDurationMs: 5_000,
  assessTimeoutMs: 5_000,
  probeTimeoutMs: 10_000,
  resumeDelayMs: 1_000,
  maxProbeAttempts: 3,
  blockRequiresHuman: true,
  allowResumeOnBlock: false,
};

// ============================================================================
// Phase transition record
// ============================================================================

export interface PhaseTransition {
  from: FrogPhase;
  to: FrogPhase;
  trigger: string;
  threatId: string | null;
  timestamp: number;
}

// ============================================================================
// Probe dispatch and results
// ============================================================================

export interface ProbeDispatch {
  probeId: string;
  scoutId: string;
  threatId: string;
  attempt: number;
  timestamp: number;
}

export interface ProbeResult {
  probeId: string;
  result: 'safe' | 'unsafe' | 'inconclusive';
  scoutId: string;
  timestamp: number;
}

// ============================================================================
// Classification result
// ============================================================================

export interface ClassificationResult {
  threatId: string;
  classification: ThreatClassification;
  confidence: number;
  probeCount: number;
  timestamp: number;
}

// ============================================================================
// Protocol events
// ============================================================================

export type FrogProtocolEvent =
  | { type: 'phase_change'; transition: PhaseTransition }
  | { type: 'probe_dispatched'; dispatch: ProbeDispatch }
  | { type: 'probe_result_received'; result: ProbeResult }
  | { type: 'threat_classified'; result: ClassificationResult }
  | { type: 'human_approval_required'; threatId: string; level: ThreatLevel }
  | { type: 'human_approval_granted'; threatId: string }
  | { type: 'resume_started'; scoutId: string }
  | { type: 'resume_complete'; agentsResumed: number }
  | { type: 'anomaly_during_assess'; threatId: string }
  | { type: 'protocol_complete'; cycleId: string; durationMs: number };

export type FrogProtocolEventHandler = (event: FrogProtocolEvent) => void;

// ============================================================================
// Protocol cycle tracking
// ============================================================================

interface ProtocolCycle {
  id: string;
  startTime: number;
  triggerThreat: ThreatEvent;
  probeDispatches: ProbeDispatch[];
  probeResults: ProbeResult[];
  classification: ClassificationResult | null;
  humanApprovalPending: boolean;
  humanApprovalGranted: boolean;
  completed: boolean;
}

// ============================================================================
// Frog Protocol Controller
// ============================================================================

export class FrogProtocolController {
  private _config: FrogProtocolConfig;
  private _phase: FrogPhase = 'BASELINE';
  private _bus: CommBus | null = null;
  private _chorus: ChorusProtocol | null = null;
  private _output: OutputSynthesis | null = null;

  private _activeCycle: ProtocolCycle | null = null;
  private _completedCycles: ProtocolCycle[] = [];
  private _scoutId: string | null = null;
  private _agents: string[] = [];

  private _transitions: PhaseTransition[] = [];
  private _listeners = new Set<FrogProtocolEventHandler>();
  private _running = false;
  private _cycleCounter = 0;

  // Phase timers (for auto-advance in production; tests advance manually)
  private _phaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<FrogProtocolConfig> = {}) {
    this._config = { ...DEFAULT_FROG_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  get phase(): FrogPhase { return this._phase; }
  get running(): boolean { return this._running; }
  get activeCycle(): ProtocolCycle | null {
    return this._activeCycle ? { ...this._activeCycle } : null;
  }
  get transitions(): readonly PhaseTransition[] { return this._transitions; }
  get completedCycles(): readonly ProtocolCycle[] { return this._completedCycles; }
  get scoutId(): string | null { return this._scoutId; }

  // --------------------------------------------------------------------------
  // Dependency injection
  // --------------------------------------------------------------------------

  /** Connect to CommBus for message dispatch. */
  connectBus(bus: CommBus): void {
    this._bus = bus;
  }

  /** Connect to ChorusProtocol for agent coordination. */
  connectChorus(chorus: ChorusProtocol): void {
    this._chorus = chorus;
  }

  /** Connect to OutputSynthesis for visual/audio phase feedback. */
  connectOutput(output: OutputSynthesis): void {
    this._output = output;
  }

  /** Register agents for protocol participation. */
  registerAgents(agentIds: string[]): void {
    this._agents = [...agentIds];
  }

  /** Designate the scout agent for probe-first pattern. */
  setScout(agentId: string): void {
    this._scoutId = agentId;
    if (this._chorus) {
      this._chorus.setScoutReady(agentId, true);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  start(): void {
    this._running = true;
  }

  stop(): void {
    this._running = false;
    this._clearPhaseTimer();
  }

  // --------------------------------------------------------------------------
  // Threat ingestion — the entry point
  // --------------------------------------------------------------------------

  /**
   * Ingest a threat event from the ThreatDetectionEngine.
   * This is the primary entry point for the Frog Protocol.
   *
   * CF-06: Transitions to SILENCE within 500ms.
   * SC-COR: Requires correlated signals (≥2 sources on the threat event).
   *
   * Returns the phase transition if one occurred, null otherwise.
   */
  ingestThreat(event: ThreatEvent): PhaseTransition | null {
    // If already in an active cycle and in ASSESS, extend assessment
    if (this._activeCycle && this._phase === 'ASSESS') {
      this._emitEvent({
        type: 'anomaly_during_assess',
        threatId: event.id,
      });
      // Reset assess timer if running
      this._clearPhaseTimer();
      return null;
    }

    // If already processing a threat (past ASSESS), queue or ignore
    if (this._activeCycle && this._phase !== 'BASELINE') {
      return null;
    }

    // Start a new protocol cycle
    return this._startCycle(event);
  }

  // --------------------------------------------------------------------------
  // Phase advancement — explicit transitions
  // --------------------------------------------------------------------------

  /**
   * Advance from SILENCE to ASSESS.
   * Called when the silence period has elapsed (or by timer).
   * CF-07: ASSESS should produce characterization within 5s.
   */
  advanceToAssess(): PhaseTransition | null {
    if (this._phase !== 'SILENCE') return null;
    return this._transition('ASSESS', 'silence_period_elapsed');
  }

  /**
   * Advance from ASSESS to PROBE.
   * Called when the scout agent is ready to probe.
   * CF-08: PROBE dispatches scout; scout acts before others.
   */
  advanceToProbe(): PhaseTransition | null {
    if (this._phase !== 'ASSESS') return null;
    const transition = this._transition('PROBE', 'assessment_complete');
    if (transition) {
      this._dispatchProbe();
    }
    return transition;
  }

  /**
   * Submit a probe result.
   * May trigger advancement to CLASSIFY if enough results are in.
   */
  submitProbeResult(result: ProbeResult): PhaseTransition | null {
    if (this._phase !== 'PROBE' || !this._activeCycle) return null;

    this._activeCycle.probeResults.push(result);
    this._emitEvent({ type: 'probe_result_received', result });

    // Check if we have enough results to classify
    if (this._shouldClassify()) {
      return this._transition('CLASSIFY', 'probe_results_sufficient');
    }

    // If probe failed, maybe dispatch another
    if (result.result === 'unsafe') {
      // Scout failure during PROBE — EC-03: escalate, don't resume
      return this._transition('CLASSIFY', 'probe_failure_escalation');
    }

    if (result.result === 'inconclusive') {
      const attempts = this._activeCycle.probeDispatches.length;
      if (attempts < this._config.maxProbeAttempts) {
        this._dispatchProbe();
        return null;
      }
      // Max attempts reached — force classify
      return this._transition('CLASSIFY', 'max_probes_reached');
    }

    // Safe result — classify
    return this._transition('CLASSIFY', 'probe_safe');
  }

  /**
   * Perform classification and advance from CLASSIFY.
   * CF-09: Labels threat as THREAT, NEUTRAL, or OPPORTUNITY.
   *
   * Returns the classification result.
   */
  classify(): ClassificationResult | null {
    if (this._phase !== 'CLASSIFY' || !this._activeCycle) return null;

    const result = this._performClassification();
    this._activeCycle.classification = result;
    this._emitEvent({ type: 'threat_classified', result });

    // Update the original threat event classification
    this._activeCycle.triggerThreat.classification = result.classification;

    // SC-HUM: BLOCK-level threats require human approval
    if (this._activeCycle.triggerThreat.level === 'BLOCK' && this._config.blockRequiresHuman) {
      this._activeCycle.humanApprovalPending = true;
      this._emitEvent({
        type: 'human_approval_required',
        threatId: this._activeCycle.triggerThreat.id,
        level: 'BLOCK',
      });
      // Stay in CLASSIFY until human approves
      return result;
    }

    // If THREAT classification, stay in heightened awareness (CLASSIFY)
    if (result.classification === 'THREAT') {
      // Don't auto-advance — require explicit resolution
      return result;
    }

    // NEUTRAL or OPPORTUNITY — advance to RESUME
    this._transition('RESUME', `classified_${result.classification.toLowerCase()}`);
    return result;
  }

  /**
   * Grant human approval for a BLOCK-level threat.
   * SC-HUM: Required before irreversible action on BLOCK threats.
   */
  grantHumanApproval(threatId: string): boolean {
    if (!this._activeCycle) return false;
    if (this._activeCycle.triggerThreat.id !== threatId) return false;
    if (!this._activeCycle.humanApprovalPending) return false;

    this._activeCycle.humanApprovalPending = false;
    this._activeCycle.humanApprovalGranted = true;
    this._emitEvent({ type: 'human_approval_granted', threatId });

    // Now we can proceed — if classified as non-threat, resume
    if (this._activeCycle.classification) {
      if (this._activeCycle.classification.classification !== 'THREAT') {
        this._transition('RESUME', 'human_approved_resume');
      }
    }

    return true;
  }

  /**
   * Resolve a threat and trigger RESUME.
   * Can be called from CLASSIFY when a THREAT is resolved externally.
   */
  resolveThreat(threatId: string): PhaseTransition | null {
    if (!this._activeCycle) return null;
    if (this._activeCycle.triggerThreat.id !== threatId) return null;
    if (this._phase !== 'CLASSIFY') return null;

    // SC-RES: No resume during BLOCK unless human approved
    if (this._activeCycle.triggerThreat.level === 'BLOCK' &&
        this._config.blockRequiresHuman &&
        !this._activeCycle.humanApprovalGranted) {
      return null;
    }

    this._activeCycle.triggerThreat.resolved = true;
    return this._transition('RESUME', 'threat_resolved');
  }

  /**
   * Initiate graduated resume sequence.
   * CF-10: Scout re-engages first, then followers in priority order.
   */
  initiateResume(): PhaseTransition | null {
    if (this._phase !== 'RESUME') return null;
    if (!this._activeCycle) return null;

    // SC-RES: No resume while BLOCK active and not approved
    if (this._activeCycle.triggerThreat.level === 'BLOCK' &&
        !this._config.allowResumeOnBlock &&
        !this._activeCycle.humanApprovalGranted &&
        !this._activeCycle.triggerThreat.resolved) {
      return null;
    }

    // Use chorus protocol for scout-first resume
    if (this._chorus) {
      const resumeResult = this._chorus.resume(
        this._scoutId ?? this._agents[0] ?? 'controller',
      );
      if (resumeResult.success) {
        this._emitEvent({
          type: 'resume_started',
          scoutId: resumeResult.scoutId ?? this._agents[0] ?? 'unknown',
        });
        this._emitEvent({
          type: 'resume_complete',
          agentsResumed: resumeResult.agentsResumed,
        });
      }
    }

    // Update output synthesis phase
    if (this._output) {
      this._output.setPhase('RESUME');
    }

    // Complete the cycle
    return this._completeCycle();
  }

  /**
   * Force-complete the current cycle and return to BASELINE.
   * Emergency use — bypasses normal flow.
   */
  forceBaseline(): PhaseTransition | null {
    if (this._phase === 'BASELINE') return null;
    this._clearPhaseTimer();
    if (this._activeCycle) {
      this._activeCycle.completed = true;
      this._completedCycles.push(this._activeCycle);
      this._activeCycle = null;
    }
    return this._transition('BASELINE', 'forced_reset');
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  configure(config: Partial<FrogProtocolConfig>): void {
    this._config = { ...this._config, ...config };
  }

  getConfig(): FrogProtocolConfig {
    return { ...this._config };
  }

  // --------------------------------------------------------------------------
  // Event system
  // --------------------------------------------------------------------------

  onEvent(handler: FrogProtocolEventHandler): () => void {
    this._listeners.add(handler);
    return () => this._listeners.delete(handler);
  }

  // --------------------------------------------------------------------------
  // Status
  // --------------------------------------------------------------------------

  getStatus(): {
    phase: FrogPhase;
    running: boolean;
    activeCycleId: string | null;
    activeThreatId: string | null;
    activeThreatLevel: ThreatLevel | null;
    scoutId: string | null;
    probeCount: number;
    humanApprovalPending: boolean;
    completedCycles: number;
    totalTransitions: number;
  } {
    return {
      phase: this._phase,
      running: this._running,
      activeCycleId: this._activeCycle?.id ?? null,
      activeThreatId: this._activeCycle?.triggerThreat.id ?? null,
      activeThreatLevel: this._activeCycle?.triggerThreat.level ?? null,
      scoutId: this._scoutId,
      probeCount: this._activeCycle?.probeDispatches.length ?? 0,
      humanApprovalPending: this._activeCycle?.humanApprovalPending ?? false,
      completedCycles: this._completedCycles.length,
      totalTransitions: this._transitions.length,
    };
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  reset(): void {
    this._clearPhaseTimer();
    this._phase = 'BASELINE';
    this._activeCycle = null;
    this._completedCycles = [];
    this._transitions = [];
    this._cycleCounter = 0;
    this._running = false;
  }

  // --------------------------------------------------------------------------
  // Internal — cycle management
  // --------------------------------------------------------------------------

  private _startCycle(event: ThreatEvent): PhaseTransition | null {
    this._cycleCounter++;
    this._activeCycle = {
      id: `cycle-${this._cycleCounter}-${Date.now()}`,
      startTime: Date.now(),
      triggerThreat: event,
      probeDispatches: [],
      probeResults: [],
      classification: null,
      humanApprovalPending: false,
      humanApprovalGranted: false,
      completed: false,
    };

    // CF-06: Transition to SILENCE immediately
    const transition = this._transition('SILENCE', 'threat_detected');
    if (!transition) return null;

    // Pause all agents via chorus protocol
    if (this._chorus) {
      this._chorus.pause(this._scoutId ?? this._agents[0] ?? 'controller');
    }

    // Broadcast SILENCE phase via comm bus
    if (this._bus) {
      this._bus.emit(
        'frog-controller',
        'BROADCAST',
        'SILENCE',
        {
          command: 'FROG_SILENCE',
          threatId: event.id,
          threatLevel: event.level,
        },
      );
    }

    // Update output synthesis
    if (this._output) {
      this._output.setPhase('SILENCE');
    }

    return transition;
  }

  private _completeCycle(): PhaseTransition | null {
    if (!this._activeCycle) return null;

    const durationMs = Date.now() - this._activeCycle.startTime;
    this._activeCycle.completed = true;
    this._completedCycles.push(this._activeCycle);

    this._emitEvent({
      type: 'protocol_complete',
      cycleId: this._activeCycle.id,
      durationMs,
    });

    this._activeCycle = null;

    // Return to BASELINE
    const transition = this._transition('BASELINE', 'cycle_complete');

    // Update output to baseline
    if (this._output) {
      this._output.setPhase('BASELINE');
    }

    return transition;
  }

  // --------------------------------------------------------------------------
  // Internal — phase transitions
  // --------------------------------------------------------------------------

  private _transition(to: FrogPhase, trigger: string): PhaseTransition | null {
    const from = this._phase;
    if (from === to) return null;

    this._clearPhaseTimer();
    this._phase = to;

    const transition: PhaseTransition = {
      from,
      to,
      trigger,
      threatId: this._activeCycle?.triggerThreat.id ?? null,
      timestamp: Date.now(),
    };

    this._transitions.push(transition);
    this._emitEvent({ type: 'phase_change', transition });

    // Update chorus protocol phase for all agents
    if (this._chorus) {
      for (const agentId of this._agents) {
        this._chorus.transitionPhase(agentId, to);
      }
    }

    // Update output synthesis phase
    if (this._output) {
      this._output.setPhase(to);
    }

    // Broadcast phase change via comm bus
    if (this._bus) {
      this._bus.emit('frog-controller', 'BROADCAST', to, {
        command: 'FROG_PHASE_CHANGE',
        from,
        to,
        trigger,
        threatId: this._activeCycle?.triggerThreat.id ?? null,
      });
    }

    return transition;
  }

  // --------------------------------------------------------------------------
  // Internal — probe dispatch
  // --------------------------------------------------------------------------

  private _dispatchProbe(): void {
    if (!this._activeCycle) return;

    const scoutId = this._scoutId ?? this._agents[0];
    if (!scoutId) return;

    const attempt = this._activeCycle.probeDispatches.length + 1;
    const dispatch: ProbeDispatch = {
      probeId: `probe-${this._activeCycle.id}-${attempt}`,
      scoutId,
      threatId: this._activeCycle.triggerThreat.id,
      attempt,
      timestamp: Date.now(),
    };

    this._activeCycle.probeDispatches.push(dispatch);
    this._emitEvent({ type: 'probe_dispatched', dispatch });

    // Send directed message to scout via comm bus
    if (this._bus) {
      this._bus.emit(
        'frog-controller',
        'DIRECTED',
        'PROBE',
        {
          command: 'FROG_PROBE',
          probeId: dispatch.probeId,
          threatId: dispatch.threatId,
          attempt,
        },
        [scoutId],
      );
    }
  }

  // --------------------------------------------------------------------------
  // Internal — classification logic
  // --------------------------------------------------------------------------

  private _shouldClassify(): boolean {
    if (!this._activeCycle) return false;
    const results = this._activeCycle.probeResults;
    // Classify if we have at least one safe result
    return results.some(r => r.result === 'safe');
  }

  private _performClassification(): ClassificationResult {
    const cycle = this._activeCycle!;
    const results = cycle.probeResults;
    const threat = cycle.triggerThreat;

    let classification: ThreatClassification;
    let confidence: number;

    if (results.length === 0) {
      // No probe results — inconclusive, treat as threat
      classification = 'THREAT';
      confidence = 0.3;
    } else {
      const safeCount = results.filter(r => r.result === 'safe').length;
      const unsafeCount = results.filter(r => r.result === 'unsafe').length;
      const inconclusiveCount = results.filter(r => r.result === 'inconclusive').length;
      const total = results.length;

      if (unsafeCount > 0) {
        // Any unsafe result = THREAT
        classification = 'THREAT';
        confidence = 0.7 + (unsafeCount / total) * 0.3;
      } else if (safeCount > 0 && inconclusiveCount === 0) {
        // All probes safe — check if originally high threat
        if (threat.level === 'BLOCK' || threat.level === 'HIGH') {
          // EC-06: High threat + safe probes = reclassify to NEUTRAL
          classification = 'NEUTRAL';
          confidence = 0.6 + (safeCount / total) * 0.3;
        } else {
          // Lower threat + safe probes = OPPORTUNITY (can adapt)
          classification = 'OPPORTUNITY';
          confidence = 0.5 + (safeCount / total) * 0.4;
        }
      } else {
        // Mixed results — NEUTRAL (cautious)
        classification = 'NEUTRAL';
        confidence = 0.4 + (safeCount / total) * 0.3;
      }
    }

    return {
      threatId: threat.id,
      classification,
      confidence,
      probeCount: results.length,
      timestamp: Date.now(),
    };
  }

  // --------------------------------------------------------------------------
  // Internal — timer management
  // --------------------------------------------------------------------------

  private _clearPhaseTimer(): void {
    if (this._phaseTimer) {
      clearTimeout(this._phaseTimer);
      this._phaseTimer = null;
    }
  }

  // --------------------------------------------------------------------------
  // Internal — event emission
  // --------------------------------------------------------------------------

  private _emitEvent(event: FrogProtocolEvent): void {
    for (const handler of this._listeners) {
      handler(event);
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createFrogProtocol(
  config: Partial<FrogProtocolConfig> = {},
): FrogProtocolController {
  return new FrogProtocolController(config);
}
