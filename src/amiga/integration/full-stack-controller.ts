/**
 * FullStackController -- four-component integration harness.
 *
 * Wires MC-1 (Control Surface), ME-1 (Mission Environment), CE-1 (Commons
 * Engine), and GL-1 (Governance Layer) into a single mission lifecycle.
 *
 * Architecture (composition, not inheritance):
 *   MissionController handles MC-1 + ME-1 (ICD-01)
 *   + CE-1 components: AttributionLedger, ContributionRegistry,
 *     InvocationRecorder, WeightingEngine, DividendCalculator, LedgerSealGuard
 *   + GL-1 components: RulesEngine, DecisionLog, PolicyQueryHandler
 *
 * ICD channel wiring:
 *   ICD-01: MC-1/ME-1 telemetry (via MissionController)
 *   ICD-02: ME-1/CE-1 LEDGER_ENTRY events (InvocationRecorder on onEmit)
 *   ICD-03: MC-1/GL-1 GOVERNANCE_QUERY/RESPONSE
 *   ICD-04: CE-1/GL-1 LEDGER_READ
 *
 * The dual onEmit bridge feeds both TelemetryConsumer (MC-1) and
 * InvocationRecorder (CE-1) from every emitted event.
 */

// ME-1 components (real mission environment)
import { provision } from '../me1/provisioner.js';
import { PhaseEngine, PHASE_ORDER } from '../me1/phase-engine.js';
import { GateController } from '../me1/gate-controller.js';
import { SwarmCoordinator } from '../me1/swarm-coordinator.js';
import { TelemetryEmitter } from '../me1/telemetry-emitter.js';
import { ArchiveWriter } from '../me1/archive-writer.js';
import type { MissionBrief } from '../me1/provisioner.js';
import type { PhaseTransitionResult } from '../me1/phase-engine.js';
import type { GateClearance } from '../me1/gate-controller.js';
import type { TeamRegistration } from '../me1/swarm-coordinator.js';
import type { MissionArchive } from '../me1/archive-writer.js';

// MC-1 components (real control surface)
import { Dashboard } from '../mc1/dashboard.js';
import { AlertRenderer } from '../mc1/alert-renderer.js';
import { TelemetryConsumer } from '../mc1/telemetry-consumer.js';
import { parseCommand } from '../mc1/command-parser.js';
import type { DashboardView, MissionView } from '../mc1/dashboard.js';
import type { AlertView } from '../mc1/alert-renderer.js';
import type { TelemetryStats } from '../mc1/telemetry-consumer.js';
import type { ParseResult } from '../mc1/command-parser.js';

// CE-1 components (commons engine)
import { AttributionLedger } from '../ce1/attribution-ledger.js';
import { ContributionRegistry } from '../ce1/contribution-registry.js';
import { InvocationRecorder } from '../ce1/invocation-recorder.js';
import { WeightingEngine } from '../ce1/weighting-engine.js';
import { DividendCalculator } from '../ce1/dividend-calculator.js';
import { LedgerSealGuard } from '../ce1/ledger-seal.js';
import type { LedgerQuery } from '../ce1/attribution-ledger.js';
import type { WeightVector } from '../ce1/weighting-engine.js';
import type { DistributionPlan as CE1DistributionPlan } from '../ce1/dividend-calculator.js';
import type { SealRecord } from '../ce1/ledger-seal.js';

// GL-1 components (governance layer)
import { parseCharter, ratifyCharter, COMMONS_CHARTER_YAML } from '../gl1/charter.js';
import { RulesEngine } from '../gl1/rules-engine.js';
import { DecisionLog } from '../gl1/decision-log.js';
import { PolicyQueryHandler } from '../gl1/policy-query.js';
import type { EvaluationResult } from '../gl1/rules-engine.js';

// Shared
import { createEnvelope } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';

// ============================================================================
// Config and result types
// ============================================================================

/** Configuration for creating a FullStackController. */
export interface FullStackConfig {
  /** Mission identifier (mission-YYYY-MM-DD-NNN format). */
  mission_id: string;
  /** Human-readable mission name. */
  name: string;
  /** Mission description/purpose. */
  description: string;
  /** Skills to load into the mission environment. */
  skills: Array<{ skill_id: string; version: string }>;
  /** Agents to register in the mission environment. */
  agents: Array<{ agent_id: string; role: string }>;
  /** Team registrations for the swarm coordinator. */
  teams: Array<{ team_id: string; agent_ids: string[] }>;
  /** Contributors to register in CE-1 for attribution tracking. */
  contributors: Array<{
    contributor_id: string;
    name: string;
    type: 'human' | 'agent' | 'tool';
    dependencies?: string[];
  }>;
  /** Whether to ratify the charter before mission start (default: true). */
  ratifyCharter?: boolean;
  /** Contributor IDs that qualify for Tier 2 infrastructure commons. */
  infrastructureContributorIds?: string[];
}

/** Complete result from a full stack mission lifecycle. */
export interface FullStackResult {
  /** Normalized weight vector from CE-1 WeightingEngine. */
  weights: WeightVector;
  /** Three-tier distribution plan from CE-1 DividendCalculator. */
  distributionPlan: CE1DistributionPlan;
  /** Governance evaluation from GL-1 RulesEngine. */
  governanceVerdict: EvaluationResult;
  /** Ledger seal record with content hash. */
  sealRecord: SealRecord;
  /** Complete event log across all ICDs. */
  eventLog: readonly EventEnvelope[];
  /** Which ICD channels were exercised during this lifecycle. */
  icdChannelsExercised: string[];
}

/** Current state of the MissionController (reused from MissionController pattern). */
export interface MissionControllerState {
  /** Current mission phase. */
  phase: string;
  /** Whether the mission is suspended at a gate. */
  suspended: boolean;
  /** The mission ID. */
  missionId: string;
  /** Whether the mission has completed (terminal state). */
  completed: boolean;
  /** Whether the mission has been aborted (terminal state). */
  aborted: boolean;
}

// ============================================================================
// ICD channel detection
// ============================================================================

/** Maps event types to their ICD channel for tracking. */
const ICD_CHANNEL_MAP: Record<string, string> = {
  TELEMETRY_UPDATE: 'ICD-01',
  ALERT_SURFACE: 'ICD-01',
  GATE_SIGNAL: 'ICD-01',
  GATE_RESPONSE: 'ICD-01',
  COMMAND_DISPATCH: 'ICD-01',
  LEDGER_ENTRY: 'ICD-02',
  GOVERNANCE_QUERY: 'ICD-03',
  GOVERNANCE_RESPONSE: 'ICD-03',
  LEDGER_READ: 'ICD-04',
  DISPUTE_RECORD: 'ICD-04',
};

// ============================================================================
// Active phases where LEDGER_ENTRY is permitted
// ============================================================================

const ACTIVE_PHASES = new Set(['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE']);

// ============================================================================
// FullStackController
// ============================================================================

/**
 * Four-component integration harness wiring MC-1, ME-1, CE-1, and GL-1.
 *
 * Uses composition: builds all components directly (like MissionController)
 * with a dual-destination onEmit callback that feeds both TelemetryConsumer
 * (ICD-01) and InvocationRecorder (ICD-02).
 */
export class FullStackController {
  // ME-1 components
  private readonly emitter: TelemetryEmitter;
  private engine: PhaseEngine;
  private gateController: GateController;
  private readonly swarmCoordinator: SwarmCoordinator;
  private readonly archiveWriter: ArchiveWriter;

  // MC-1 components
  private readonly dashboard: Dashboard;
  private readonly alertRenderer: AlertRenderer;
  private readonly consumer: TelemetryConsumer;

  // CE-1 components
  private readonly ledger: AttributionLedger;
  private readonly registry: ContributionRegistry;
  private readonly recorder: InvocationRecorder;
  private readonly weightingEngine: WeightingEngine;
  private readonly dividendCalculator: DividendCalculator;
  private sealGuard: LedgerSealGuard;

  // GL-1 components
  private readonly rulesEngine: RulesEngine;
  private readonly decisionLog: DecisionLog;
  private readonly policyQueryHandler: PolicyQueryHandler;

  // State
  private readonly missionId: string;
  private readonly config: FullStackConfig;
  private attributionResult: { weights: WeightVector; distributionPlan: CE1DistributionPlan } | null = null;

  constructor(config: FullStackConfig) {
    this.missionId = config.mission_id;
    this.config = config;

    // === Step 1: Create MC-1 control surface ===
    this.dashboard = new Dashboard();
    this.alertRenderer = new AlertRenderer({
      onGateResponse: (_envelope: EventEnvelope) => {
        // Route gate responses back to ME-1 (logging only)
      },
    });
    this.consumer = new TelemetryConsumer({
      dashboard: this.dashboard,
      alertRenderer: this.alertRenderer,
    });

    // === Step 2: Create CE-1 components ===
    this.ledger = new AttributionLedger();
    this.registry = new ContributionRegistry();
    this.recorder = new InvocationRecorder({ ledger: this.ledger });
    this.weightingEngine = new WeightingEngine();
    this.dividendCalculator = new DividendCalculator(
      config.infrastructureContributorIds?.length
        ? { infrastructureContributorIds: new Set(config.infrastructureContributorIds) }
        : undefined,
    );
    this.sealGuard = new LedgerSealGuard(this.ledger);

    // Register contributors in CE-1
    for (const contrib of config.contributors) {
      // Map 'tool' type to 'agent' for ContributionRegistry (which accepts 'human'|'agent'|'skill')
      const registryType = contrib.type === 'tool' ? 'agent' : contrib.type;
      this.registry.register({
        id: contrib.contributor_id,
        name: contrib.name,
        type: registryType as 'human' | 'agent' | 'skill',
      });
    }

    // Start the recorder immediately so it captures all events
    this.recorder.start();

    // === Step 3: Create GL-1 components ===
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const ratified = (config.ratifyCharter !== false) ? ratifyCharter(charter) : charter;
    this.rulesEngine = new RulesEngine(ratified);
    this.decisionLog = new DecisionLog();
    this.policyQueryHandler = new PolicyQueryHandler(ratified, this.decisionLog);

    // === Step 4: Create bridged TelemetryEmitter with dual onEmit ===
    // This is the critical integration point: feeds BOTH MC-1 consumer AND CE-1 recorder
    this.emitter = new TelemetryEmitter({
      mission_id: config.mission_id,
      onEmit: (event: EventEnvelope) => {
        // ICD-01: Feed MC-1 control surface
        this.consumer.consume(event);
        // ICD-02: Feed CE-1 invocation recorder
        this.recorder.handleEvent(event);
      },
    });

    // === Step 5: Provision manifest and create ME-1 operational components ===
    const brief: MissionBrief = {
      mission_id: config.mission_id,
      name: config.name,
      description: config.description,
      skills: config.skills,
      agents: config.agents,
    };
    const env = provision(brief);
    const manifest = env.manifest;

    this.engine = new PhaseEngine({ manifest, emitter: this.emitter });
    this.gateController = new GateController({ engine: this.engine, emitter: this.emitter });
    this.archiveWriter = new ArchiveWriter({ manifest, emitter: this.emitter });

    // Build team registrations for SwarmCoordinator
    const teams: TeamRegistration[] = config.teams.map((t) => ({
      team_id: t.team_id,
      agent_ids: t.agent_ids,
      status: 'active' as const,
    }));
    this.swarmCoordinator = new SwarmCoordinator({ emitter: this.emitter, teams });

    // === Step 6: Emit initial telemetry to populate dashboard ===
    this.emitter.emitTelemetry({
      phase: 'BRIEFING',
      progress: 0,
      team_status: Object.fromEntries(
        config.teams.map((t) => [
          t.team_id,
          { status: 'green' as const, agent_count: t.agent_ids.length },
        ]),
      ),
      checkpoints: [],
      resources: {
        cpu_percent: 10,
        memory_mb: 256,
        active_agents: config.agents.length,
      },
    });
  }

  // --------------------------------------------------------------------------
  // State queries
  // --------------------------------------------------------------------------

  /** Get the current controller state. */
  getState(): MissionControllerState {
    const phase = this.engine.getCurrentPhase();
    return {
      phase,
      suspended: this.gateController.isSuspended(),
      missionId: this.missionId,
      completed: phase === 'COMPLETION',
      aborted: phase === 'ABORT',
    };
  }

  /** Get the MC-1 dashboard view with all tracked missions. */
  getDashboardView(): DashboardView {
    return this.dashboard.getView();
  }

  /** Get the MC-1 dashboard view for this specific mission. */
  getMissionView(): MissionView | undefined {
    return this.dashboard.getMission(this.missionId);
  }

  /** Get the MC-1 alert view for this mission. */
  getAlertView(): AlertView {
    return this.alertRenderer.getView(this.missionId);
  }

  /** Get telemetry consumption stats. */
  getStats(): TelemetryStats {
    return this.consumer.getStats();
  }

  /** Get the complete event log from ME-1's telemetry emitter. */
  getEventLog(): readonly EventEnvelope[] {
    return this.emitter.getEventLog();
  }

  /** Get CE-1 diagnostics. */
  getCE1State(): { ledgerCount: number; recorderActive: boolean; sealed: boolean } {
    return {
      ledgerCount: this.ledger.count(),
      recorderActive: this.recorder.isRecording(),
      sealed: this.ledger.isSealed(),
    };
  }

  /** Get GL-1 diagnostics. */
  getGL1State(): { charterRatified: boolean; decisionCount: number } {
    return {
      charterRatified: this.config.ratifyCharter !== false,
      decisionCount: this.decisionLog.size,
    };
  }

  // --------------------------------------------------------------------------
  // Phase control (MC-1/ME-1 delegates)
  // --------------------------------------------------------------------------

  /** Advance to the next lifecycle phase. */
  advancePhase(): PhaseTransitionResult {
    const current = this.engine.getCurrentPhase();
    const currentIdx = PHASE_ORDER.indexOf(current);

    if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) {
      return {
        success: false,
        from: current,
        to: current,
        error: `Cannot advance from terminal or unknown phase '${current}'`,
      };
    }

    const nextPhase = PHASE_ORDER[currentIdx + 1];
    const result = this.engine.transition(nextPhase);

    if (result.success) {
      this.archiveWriter.updateManifest(this.engine.getManifest());
      if (nextPhase === 'REVIEW_GATE') {
        this.createGateSuspension();
      }
    }

    return result;
  }

  /** Respond to an active gate with a clearance decision. */
  clearGate(clearance: GateClearance): void {
    this.gateController.clearGate(clearance);
    this.archiveWriter.updateManifest(this.engine.getManifest());

    if (clearance.decision === 'redirect') {
      this.syncEngineFromGateController();
    }
  }

  /** Execute a text command through MC-1's command parser. */
  executeCommand(input: string): ParseResult {
    const result = parseCommand(input);
    if (result.ok) {
      const command = result.command.command;
      if (command === 'HOLD') {
        this.engine.transition('HOLD');
      } else if (command === 'RESUME') {
        this.engine.resume();
      } else if (command === 'ABORT') {
        this.engine.transition('ABORT');
      } else {
        const envelope = createEnvelope({
          source: 'MC-1',
          destination: 'ME-1',
          type: 'COMMAND_DISPATCH',
          payload: { ...result.command } as Record<string, unknown>,
          requires_ack: false,
        });
        this.swarmCoordinator.dispatch(envelope);
      }
    }
    return result;
  }

  /** Seal the mission archive. */
  sealArchive(): MissionArchive {
    this.archiveWriter.updateManifest(this.engine.getManifest());
    const state = this.getState();
    const outcome = state.aborted ? 'aborted' : 'completed';
    return this.archiveWriter.seal(outcome);
  }

  // --------------------------------------------------------------------------
  // CE-1 attribution interface (ICD-02)
  // --------------------------------------------------------------------------

  /**
   * Emit a LEDGER_ENTRY event through the telemetry emitter.
   *
   * Creates a valid ICD-02 event envelope and feeds it through the onEmit
   * bridge so the InvocationRecorder captures it.
   *
   * @throws If mission is not in an active phase (PLANNING, EXECUTION, INTEGRATION, REVIEW_GATE)
   * @throws If ledger is sealed
   */
  emitLedgerEntry(data: {
    contributor_id: string;
    skill_name: string;
    phase: string;
    context_weight: number;
    dependency_tree: Array<{ contributor_id: string; depth: number; decay_factor: number }>;
  }): void {
    const currentPhase = this.engine.getCurrentPhase();

    if (!ACTIVE_PHASES.has(currentPhase)) {
      throw new Error(`Cannot emit LEDGER_ENTRY in phase '${currentPhase}': mission must be in an active phase`);
    }

    if (this.ledger.isSealed()) {
      throw new Error('Cannot emit LEDGER_ENTRY: ledger is sealed');
    }

    const payload = {
      mission_id: this.missionId,
      contributor_id: data.contributor_id,
      agent_id: 'CE-1',
      skill_name: data.skill_name,
      phase: data.phase,
      timestamp: new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
      context_weight: data.context_weight,
      dependency_tree: data.dependency_tree,
    };

    // Create envelope and feed through the emitter's event recording + onEmit
    const envelope = createEnvelope({
      source: 'ME-1',
      destination: 'CE-1',
      type: 'LEDGER_ENTRY',
      payload: payload as Record<string, unknown>,
      requires_ack: false,
    });

    // Record in emitter's event log and fire onEmit (which feeds consumer + recorder)
    (this.emitter as unknown as { record(e: EventEnvelope): EventEnvelope }).record(envelope);
  }

  /**
   * Query the attribution ledger.
   */
  queryLedger(query: LedgerQuery): readonly ReturnType<AttributionLedger['query']>[number][] {
    return this.ledger.query(query);
  }

  // --------------------------------------------------------------------------
  // CE-1 attribution calculation
  // --------------------------------------------------------------------------

  /**
   * Calculate attribution weights and distribution plan.
   *
   * Must be called after mission reaches COMPLETION.
   *
   * @throws If mission is not at COMPLETION
   */
  calculateAttribution(): { weights: WeightVector; distributionPlan: CE1DistributionPlan } {
    const phase = this.engine.getCurrentPhase();
    if (phase !== 'COMPLETION') {
      throw new Error(`Cannot calculate attribution: mission is at '${phase}', expected 'COMPLETION'`);
    }

    const entries = this.ledger.getAll();
    const weights = this.weightingEngine.calculateWeights(entries);
    const distributionPlan = this.dividendCalculator.calculate(weights);

    this.attributionResult = { weights, distributionPlan };
    return { weights, distributionPlan };
  }

  // --------------------------------------------------------------------------
  // GL-1 governance evaluation (ICD-03 + ICD-04)
  // --------------------------------------------------------------------------

  /**
   * Evaluate the distribution plan against the charter.
   *
   * Must be called after calculateAttribution().
   *
   * Emits ICD-03 (GOVERNANCE_QUERY/RESPONSE) and ICD-04 (LEDGER_READ) events
   * to exercise those channels.
   *
   * @throws If attribution has not been calculated
   */
  evaluateGovernance(): EvaluationResult {
    if (!this.attributionResult) {
      throw new Error('Cannot evaluate governance: attribution has not been calculated');
    }

    const { weights, distributionPlan } = this.attributionResult;

    // Emit ICD-04 LEDGER_READ event (GL-1 reads CE-1 ledger)
    const ledgerReadEnvelope = createEnvelope({
      source: 'GL-1',
      destination: 'CE-1',
      type: 'LEDGER_READ',
      payload: {
        query: 'by_mission',
        requestor: 'GL-1',
        mission_id: this.missionId,
      } as Record<string, unknown>,
      requires_ack: false,
    });
    (this.emitter as unknown as { record(e: EventEnvelope): EventEnvelope }).record(ledgerReadEnvelope);

    // Build GL-1 compatible distribution plan from CE-1 output
    const totalAmount = 1.0;
    const tier1 = distributionPlan.tiers.find(t => t.tierName === 'direct_contributors');
    const tier2 = distributionPlan.tiers.find(t => t.tierName === 'infrastructure_commons');
    const tier3 = distributionPlan.tiers.find(t => t.tierName === 'universal_base_dividend');

    const glPlan = {
      plan_id: `plan-${this.missionId}`,
      mission_id: this.missionId,
      created_at: new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
      total_amount: totalAmount,
      tiers: {
        tier1_direct: {
          amount: tier1?.totalAllocation ?? 0,
          recipients: (tier1?.allocations ?? []).map(a => ({
            contributor_id: a.contributorId,
            share: a.amount,
          })),
        },
        tier2_infrastructure: {
          amount: tier2?.totalAllocation ?? 0,
          allocation_percent: (tier2?.totalAllocation ?? 0) * 100,
        },
        tier3_ubd: {
          amount: tier3?.totalAllocation ?? 0,
          allocation_percent: (tier3?.totalAllocation ?? 0) * 100,
          recipient_count: weights.weights.length,
        },
      },
    };

    // Emit ICD-03 GOVERNANCE_QUERY event
    // Note: requestor must be a valid AgentID (CS-1) or 'human', not MC-1
    const queryEnvelope = createEnvelope({
      source: 'MC-1',
      destination: 'GL-1',
      type: 'GOVERNANCE_QUERY',
      payload: {
        query_type: 'compliance_check',
        subject: `Distribution plan compliance for ${this.missionId}`,
        requestor: 'CS-1',
        distribution_plan_id: glPlan.plan_id,
        context: { distribution_plan: glPlan },
      } as Record<string, unknown>,
      requires_ack: true,
    });
    (this.emitter as unknown as { record(e: EventEnvelope): EventEnvelope }).record(queryEnvelope);

    // Evaluate with RulesEngine
    const evalResult = this.rulesEngine.evaluate(glPlan);

    // Log to DecisionLog
    this.decisionLog.append(
      evalResult,
      'compliance_check',
      `Distribution plan for ${this.missionId}`,
      'CS-1',
    );

    // Emit ICD-03 GOVERNANCE_RESPONSE event
    const responseEnvelope = createEnvelope({
      source: 'GL-1',
      destination: 'MC-1',
      type: 'GOVERNANCE_RESPONSE',
      payload: {
        query_id: glPlan.plan_id,
        verdict: evalResult.verdict,
        reasoning: evalResult.reasoning
          .map(s => `[${s.clause_id}] ${s.clause_title}: ${s.detail}`)
          .join('\n'),
        respondent: 'GL-1',
        cited_clauses: evalResult.cited_clauses,
      } as Record<string, unknown>,
      requires_ack: false,
    });
    (this.emitter as unknown as { record(e: EventEnvelope): EventEnvelope }).record(responseEnvelope);

    // Emit governance result as ALERT_SURFACE via MC-1 (INTG-05: presented via dashboard)
    const alertLevel = evalResult.verdict === 'COMPLIANT' ? 'nominal'
      : evalResult.verdict === 'ADVISORY' ? 'advisory'
      : 'gate';
    this.emitter.emitAlert({
      alert_level: alertLevel as 'nominal' | 'advisory' | 'gate',
      source_agent: 'GL-1',
      message: `Governance verdict: ${evalResult.verdict} for ${this.missionId}`,
      category: 'system',
    });

    return evalResult;
  }

  // --------------------------------------------------------------------------
  // Full lifecycle convenience
  // --------------------------------------------------------------------------

  /**
   * Run a complete mission lifecycle with attribution and governance.
   *
   * Advances through all phases, emits sample LEDGER_ENTRY events at
   * PLANNING/EXECUTION/INTEGRATION, clears the gate with GO, calculates
   * attribution, evaluates governance, seals the ledger, and returns
   * the complete FullStackResult.
   */
  runFullLifecycle(): FullStackResult {
    const contributors = this.config.contributors;

    // BRIEFING -> PLANNING
    this.advancePhase();
    if (contributors.length > 0) {
      this.emitLedgerEntry({
        contributor_id: contributors[0].contributor_id,
        skill_name: 'planning-review',
        phase: 'PLANNING',
        context_weight: 0.7,
        dependency_tree: [],
      });
    }

    // PLANNING -> EXECUTION
    this.advancePhase();
    if (contributors.length > 1) {
      this.emitLedgerEntry({
        contributor_id: contributors[1].contributor_id,
        skill_name: 'implementation',
        phase: 'EXECUTION',
        context_weight: 0.9,
        dependency_tree: contributors[1].dependencies
          ? contributors[1].dependencies.map(dep => ({
              contributor_id: dep,
              depth: 0,
              decay_factor: 0.5,
            }))
          : [],
      });
    }

    // EXECUTION -> INTEGRATION
    this.advancePhase();
    if (contributors.length > 2) {
      this.emitLedgerEntry({
        contributor_id: contributors[2].contributor_id,
        skill_name: 'testing',
        phase: 'INTEGRATION',
        context_weight: 0.6,
        dependency_tree: [],
      });
    }

    // INTEGRATION -> REVIEW_GATE
    this.advancePhase();

    // Clear gate with GO -> COMPLETION
    this.clearGate({
      decision: 'go',
      reasoning: 'All integration criteria verified',
      responder: 'human',
    });

    // Stop recorder before attribution
    this.recorder.stop();

    // Calculate attribution
    const { weights, distributionPlan } = this.calculateAttribution();

    // Evaluate governance (emits ICD-03 + ICD-04 events)
    const governanceVerdict = this.evaluateGovernance();

    // Seal the ledger
    const sealResult = this.sealGuard.seal(distributionPlan);
    const sealRecord = sealResult.sealRecord;

    // Seal the mission archive
    this.sealArchive();

    // Determine which ICD channels were exercised
    const eventLog = this.emitter.getEventLog();
    const exercised = new Set<string>();
    for (const event of eventLog) {
      const icd = ICD_CHANNEL_MAP[event.type];
      if (icd) exercised.add(icd);
    }

    return {
      weights,
      distributionPlan,
      governanceVerdict,
      sealRecord,
      eventLog,
      icdChannelsExercised: [...exercised].sort(),
    };
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /**
   * Create a gate suspension record in the GateController.
   */
  private createGateSuspension(): void {
    const eventLog = this.emitter.getEventLog();
    const gateSignals = eventLog.filter((e) => e.type === 'GATE_SIGNAL');
    const lastGateSignal = gateSignals[gateSignals.length - 1];

    (this.gateController as unknown as Record<string, unknown>).suspension = {
      phase: 'REVIEW_GATE',
      manifest: this.engine.getManifest(),
      suspendedAt: new Date().toISOString(),
      gateSignalId: lastGateSignal?.id ?? `gate-${Date.now()}`,
    };
  }

  /**
   * Sync engine reference after gate redirect.
   */
  private syncEngineFromGateController(): void {
    const currentPhase = this.gateController.getCurrentPhase();
    const manifest = this.gateController.getManifest();
    const newEngine = new PhaseEngine({ manifest, emitter: this.emitter });

    const targetIdx = PHASE_ORDER.indexOf(currentPhase);
    if (targetIdx > 0) {
      for (let i = 1; i <= targetIdx; i++) {
        newEngine.transition(PHASE_ORDER[i]);
      }
    }

    this.engine = newEngine;
    this.gateController = new GateController({ engine: this.engine, emitter: this.emitter });
  }
}
