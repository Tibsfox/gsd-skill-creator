/**
 * MetaMissionHarness -- the programmatic test harness that runs a complete
 * AMIGA meta-mission where the mission objective is to produce a skill
 * package documenting the AMIGA provisioning process itself.
 *
 * This is the "system documenting itself" exercise that proves AMIGA
 * end-to-end operation through all 6 lifecycle phases.
 *
 * Architecture:
 *   MetaMissionHarness
 *     |-- FullStackController (MC-1 + ME-1 + CE-1 + GL-1)
 *     |-- Mission brief: "Document the AMIGA provisioning process"
 *     |-- Auto-emits LEDGER_ENTRY at each active phase with provisioning docs
 *     |-- Builds SkillPackageDraft from event log + attribution results
 *
 * User interaction model (INTG-08):
 *   - issueCommand() for dashboard commands
 *   - respondToGate() for gate decisions
 *   - getDashboardView(), getMissionView(), getAlertView(), getStats() for queries
 *   - NO direct PhaseEngine, SwarmCoordinator, or internal component access
 */

import {
  FullStackController,
} from '../integration/full-stack-controller.js';
import type {
  FullStackConfig,
  FullStackResult,
  MissionControllerState,
} from '../integration/full-stack-controller.js';
import type { PhaseTransitionResult } from '../me1/phase-engine.js';
import type { MissionArchive } from '../me1/archive-writer.js';
import type { DashboardView, MissionView } from '../mc1/dashboard.js';
import type { AlertView } from '../mc1/alert-renderer.js';
import type { TelemetryStats } from '../mc1/telemetry-consumer.js';
import type { ParseResult } from '../mc1/command-parser.js';
import type { EventEnvelope } from '../message-envelope.js';

// ============================================================================
// Configuration and result types
// ============================================================================

/** Configuration for creating a MetaMissionHarness. */
export interface MetaMissionConfig {
  /** Override mission ID (default: auto-generated with timestamp). */
  mission_id?: string;
  /** Override mission name (default: 'AMIGA Provisioning Meta-Mission'). */
  name?: string;
}

/** Structured skill package draft produced by the meta-mission. */
export interface SkillPackageDraft {
  /** Skill name derived from the mission objective. */
  name: string;
  /** Description of what the skill teaches. */
  description: string;
  /** Phases documented during the mission (which phases had LEDGER_ENTRY events). */
  phases_documented: string[];
  /** Contributors who participated. */
  contributors: Array<{ id: string; role: string; entry_count: number }>;
  /** Key provisioning steps extracted from event log analysis. */
  provisioning_steps: string[];
  /** Total events in the telemetry log. */
  total_events: number;
  /** Attribution summary from CE-1. */
  attribution_summary: { total_contributors: number; total_entries: number };
  /** Governance verdict from GL-1. */
  governance_verdict: string;
}

/** Complete result from a meta-mission run. */
export interface MetaMissionResult {
  /** The skill package draft produced by the meta-mission. */
  skillPackage: SkillPackageDraft;
  /** The sealed mission archive. */
  archive: MissionArchive;
  /** Full stack result from CE-1/GL-1 pipeline. */
  fullStackResult: FullStackResult;
  /** Total phases completed (should be 6 for a complete mission). */
  phasesCompleted: number;
  /** Whether all 6 phases completed successfully. */
  success: boolean;
}

// ============================================================================
// Pre-configured contributor and agent layout
// ============================================================================

const META_MISSION_CONTRIBUTORS = [
  { contributor_id: 'contrib-mc1', name: 'MC-1 Control Surface', type: 'agent' as const },
  { contributor_id: 'contrib-me1', name: 'ME-1 Mission Environment', type: 'agent' as const },
  { contributor_id: 'contrib-ce1', name: 'CE-1 Commons Engine', type: 'agent' as const },
  { contributor_id: 'contrib-gl1', name: 'GL-1 Governance Layer', type: 'agent' as const },
];

const META_MISSION_AGENTS = [
  { agent_id: 'MC-1', role: 'control-surface' },
  { agent_id: 'ME-1', role: 'mission-environment' },
  { agent_id: 'ME-2', role: 'phase-engine' },
  { agent_id: 'ME-3', role: 'telemetry' },
  { agent_id: 'CE-1', role: 'commons-engine' },
  { agent_id: 'GL-1', role: 'governance' },
];

const META_MISSION_TEAMS = [
  { team_id: 'CS', agent_ids: ['MC-1'] },
  { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'] },
  { team_id: 'CE', agent_ids: ['CE-1'] },
  { team_id: 'GL', agent_ids: ['GL-1'] },
];

/** Map contributor IDs to descriptive roles for the skill package. */
const CONTRIBUTOR_ROLES: Record<string, string> = {
  'contrib-mc1': 'control-surface',
  'contrib-me1': 'mission-environment',
  'contrib-ce1': 'commons-engine',
  'contrib-gl1': 'governance',
};

// ============================================================================
// Provisioning documentation definitions per phase
// ============================================================================

interface ProvisioningStep {
  contributor_id: string;
  skill_name: string;
  phase: string;
  context_weight: number;
}

/** LEDGER_ENTRY events to emit at each active phase. */
const PROVISIONING_STEPS: Record<string, ProvisioningStep[]> = {
  PLANNING: [
    {
      contributor_id: 'contrib-me1',
      skill_name: 'manifest-creation',
      phase: 'PLANNING',
      context_weight: 0.8,
    },
  ],
  EXECUTION: [
    {
      contributor_id: 'contrib-mc1',
      skill_name: 'dashboard-wiring',
      phase: 'EXECUTION',
      context_weight: 0.9,
    },
    {
      contributor_id: 'contrib-ce1',
      skill_name: 'attribution-setup',
      phase: 'EXECUTION',
      context_weight: 0.7,
    },
  ],
  INTEGRATION: [
    {
      contributor_id: 'contrib-gl1',
      skill_name: 'governance-evaluation',
      phase: 'INTEGRATION',
      context_weight: 0.85,
    },
  ],
};

// ============================================================================
// MetaMissionHarness
// ============================================================================

/**
 * Programmatic test harness running a complete AMIGA meta-mission.
 *
 * Wraps FullStackController with a pre-configured meta-mission brief
 * targeting AMIGA provisioning documentation as the mission objective.
 * The user interacts only through dashboard commands and gate responses.
 */
export class MetaMissionHarness {
  private readonly controller: FullStackController;
  private readonly missionId: string;
  private completed = false;

  constructor(config?: MetaMissionConfig) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const seq = String(now.getTime() % 1000).padStart(3, '0');
    this.missionId = config?.mission_id ?? `mission-${dateStr}-${seq}`;

    const fullStackConfig: FullStackConfig = {
      mission_id: this.missionId,
      name: config?.name ?? 'AMIGA Provisioning Meta-Mission',
      description:
        'Document the AMIGA provisioning process by running a meta-mission through the complete AMIGA stack',
      skills: [{ skill_id: 'amiga-provisioning', version: '1.0.0' }],
      agents: META_MISSION_AGENTS,
      teams: META_MISSION_TEAMS,
      // CE-1 is infrastructure: shared attribution engine serving all contributors
      infrastructureContributorIds: ['contrib-ce1'],
      contributors: META_MISSION_CONTRIBUTORS,
    };

    this.controller = new FullStackController(fullStackConfig);
  }

  // --------------------------------------------------------------------------
  // State queries (delegated to FullStackController)
  // --------------------------------------------------------------------------

  /** Get the current controller state. */
  getState(): MissionControllerState {
    return this.controller.getState();
  }

  /** Get the MC-1 dashboard view. */
  getDashboardView(): DashboardView {
    return this.controller.getDashboardView();
  }

  /** Get the MC-1 mission view for this mission. */
  getMissionView(): MissionView | undefined {
    return this.controller.getMissionView();
  }

  /** Get the MC-1 alert view. */
  getAlertView(): AlertView {
    return this.controller.getAlertView();
  }

  /** Get telemetry consumption stats. */
  getStats(): TelemetryStats {
    return this.controller.getStats();
  }

  /** Get the complete event log. */
  getEventLog(): readonly EventEnvelope[] {
    return this.controller.getEventLog();
  }

  // --------------------------------------------------------------------------
  // User interaction methods (INTG-08 control surface API)
  // --------------------------------------------------------------------------

  /**
   * Issue a dashboard command (the primary user interaction method).
   *
   * Delegates to FullStackController.executeCommand().
   */
  issueCommand(input: string): ParseResult {
    return this.controller.executeCommand(input);
  }

  /**
   * Respond to an active gate (the secondary user interaction method).
   *
   * @throws If not currently at a gate
   */
  respondToGate(
    decision: 'go' | 'no_go' | 'redirect',
    reasoning: string,
    redirectTarget?: string,
  ): void {
    if (!this.controller.getState().suspended) {
      throw new Error('Cannot respond to gate: not currently suspended at a gate');
    }

    this.controller.clearGate({
      decision,
      reasoning,
      responder: 'human',
      ...(redirectTarget !== undefined ? { redirectTarget } : {}),
    });
  }

  // --------------------------------------------------------------------------
  // Harness control methods
  // --------------------------------------------------------------------------

  /**
   * Advance one phase (for manual stepping / testing).
   *
   * Internally calls controller.advancePhase() AND emits provisioning
   * LEDGER_ENTRY events at the appropriate phases. This is the harness-
   * internal mechanism, not exposed in a real mission scenario.
   */
  stepPhase(): PhaseTransitionResult {
    const result = this.controller.advancePhase();

    if (result.success) {
      // Emit provisioning LEDGER_ENTRY events for the new phase
      this.emitProvisioningEntries(result.to);
    }

    return result;
  }

  /**
   * Run the complete meta-mission autonomously through all 6 phases.
   *
   * 1. BRIEFING -> PLANNING (emit manifest-creation LEDGER_ENTRY)
   * 2. PLANNING -> EXECUTION (emit dashboard-wiring + attribution-setup)
   * 3. EXECUTION -> INTEGRATION (emit governance-evaluation)
   * 4. INTEGRATION -> REVIEW_GATE (gate suspends)
   * 5. Auto-clear gate with GO
   * 6. Verify COMPLETION
   * 7. Calculate attribution, evaluate governance, seal archive
   * 8. Build SkillPackageDraft
   *
   * @throws If mission has already been completed
   * @returns MetaMissionResult with skill package, archive, and full stack result
   */
  runMetaMission(): MetaMissionResult {
    if (this.completed) {
      throw new Error('Meta-mission has already been completed');
    }

    // Step 1: BRIEFING -> PLANNING
    this.stepPhase();

    // Step 2: PLANNING -> EXECUTION
    this.stepPhase();

    // Step 3: EXECUTION -> INTEGRATION
    this.stepPhase();

    // Step 4: INTEGRATION -> REVIEW_GATE
    this.stepPhase();

    // Step 5: Auto-clear gate with GO
    this.respondToGate('go', 'Meta-mission review: all phases completed successfully');

    // Verify COMPLETION
    const state = this.controller.getState();
    if (state.phase !== 'COMPLETION') {
      throw new Error(`Expected COMPLETION but got ${state.phase}`);
    }

    // Step 6: Calculate attribution
    const { weights, distributionPlan } = this.controller.calculateAttribution();

    // Step 7: Evaluate governance
    const governanceVerdict = this.controller.evaluateGovernance();

    // Step 8: Seal the archive
    const archive = this.controller.sealArchive();

    // Step 9: Build skill package draft
    const skillPackage = this.buildSkillPackageDraft(governanceVerdict.verdict);

    this.completed = true;

    const fullStackResult: FullStackResult = {
      weights,
      distributionPlan,
      governanceVerdict,
      sealRecord: { contentHash: archive.integrity_hash, sealed: true } as unknown as FullStackResult['sealRecord'],
      eventLog: this.controller.getEventLog(),
      icdChannelsExercised: this.detectICDChannels(),
    };

    return {
      skillPackage,
      archive,
      fullStackResult,
      phasesCompleted: 6,
      success: true,
    };
  }

  /**
   * Build a SkillPackageDraft from the current event log and attribution data.
   *
   * Can be called after manual stepping through the mission for testing.
   */
  buildSkillPackageDraft(governanceVerdict?: string): SkillPackageDraft {
    const events = this.controller.getEventLog();

    // Find LEDGER_ENTRY events
    const ledgerEntries = events.filter((e) => e.type === 'LEDGER_ENTRY');

    // Extract phases that had LEDGER_ENTRY events
    const phasesDocumented = new Set<string>();
    for (const entry of ledgerEntries) {
      const payload = entry.payload as Record<string, unknown>;
      if (typeof payload.phase === 'string') {
        phasesDocumented.add(payload.phase);
      }
    }

    // Map contributors to entry counts
    const contributorEntries = new Map<string, number>();
    for (const entry of ledgerEntries) {
      const payload = entry.payload as Record<string, unknown>;
      const contribId = payload.contributor_id as string;
      contributorEntries.set(
        contribId,
        (contributorEntries.get(contribId) ?? 0) + 1,
      );
    }

    // Build contributor list from pre-configured contributors
    const contributors = META_MISSION_CONTRIBUTORS.map((c) => ({
      id: c.contributor_id,
      role: CONTRIBUTOR_ROLES[c.contributor_id] ?? 'unknown',
      entry_count: contributorEntries.get(c.contributor_id) ?? 0,
    }));

    // Extract provisioning steps from LEDGER_ENTRY skill_name fields
    const provisioningSteps: string[] = [];
    for (const entry of ledgerEntries) {
      const payload = entry.payload as Record<string, unknown>;
      if (typeof payload.skill_name === 'string') {
        provisioningSteps.push(payload.skill_name);
      }
    }

    return {
      name: 'amiga-provisioning',
      description:
        'Reusable workflow for provisioning AMIGA mission environments from briefing through governance evaluation',
      phases_documented: [...phasesDocumented],
      contributors,
      provisioning_steps: provisioningSteps,
      total_events: events.length,
      attribution_summary: {
        total_contributors: contributors.length,
        total_entries: ledgerEntries.length,
      },
      governance_verdict: governanceVerdict ?? 'UNKNOWN',
    };
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /**
   * Emit provisioning LEDGER_ENTRY events for the given phase.
   *
   * Each active phase (PLANNING, EXECUTION, INTEGRATION) has predefined
   * documentation entries that record the provisioning process.
   */
  private emitProvisioningEntries(phase: string): void {
    const steps = PROVISIONING_STEPS[phase];
    if (!steps) return;

    for (const step of steps) {
      this.controller.emitLedgerEntry({
        contributor_id: step.contributor_id,
        skill_name: step.skill_name,
        phase: step.phase,
        context_weight: step.context_weight,
        dependency_tree: [],
      });
    }
  }

  /** Detect which ICD channels were exercised from the event log. */
  private detectICDChannels(): string[] {
    const ICD_MAP: Record<string, string> = {
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

    const events = this.controller.getEventLog();
    const channels = new Set<string>();
    for (const event of events) {
      const icd = ICD_MAP[event.type];
      if (icd) channels.add(icd);
    }
    return [...channels].sort();
  }
}
