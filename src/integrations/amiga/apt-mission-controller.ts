/**
 * APT Mission Controller
 * 
 * Wires APT (Agent Process Task) execution into MC-1 (Mission Control 1)
 * with mission clock for phased execution.
 * 
 * Architecture:
 * - Mission Clock: Phases, gates, waves (time-aware execution)
 * - APT Team: Parallel agents (Foxy, Lex, Cedar, Hemlock, Sam)
 * - MC-1 Wiring: TelemetryEmitter → Dashboard live updates
 * - Phase Synchronization: Wave-based checkpoint system
 */

export interface MissionClockConfig {
  mission_id: string;
  start_time: number;
  wave_durations: Record<string, number>; // ms per wave
  gate_checkpoints: string[]; // phase gates requiring validation
  phase_order: string[];
}

export interface APTTeamConfig {
  team_name: string;
  members: Array<{
    agent_name: string;
    role: string; // 'coordinator', 'executor', 'observer', 'validator'
    position: { real: number; imaginary: number }; // complex plane
  }>;
}

export interface MissionPhase {
  id: string;
  wave: number;
  name: string;
  start_time: number;
  expected_duration: number;
  status: 'pending' | 'in_progress' | 'gated' | 'complete' | 'blocked';
  tasks: string[];
  gate_result?: { passed: boolean; reason?: string };
}

/**
 * MissionController coordinates APT execution with MC-1 telemetry
 */
export class APTMissionController {
  private clock: MissionClockConfig;
  private team: APTTeamConfig;
  private phases: Map<string, MissionPhase> = new Map();
  private telemetryEmitter: any; // Injected from MC-1
  
  constructor(clockConfig: MissionClockConfig, teamConfig: APTTeamConfig) {
    this.clock = clockConfig;
    this.team = teamConfig;
    this.initializePhases();
  }

  private initializePhases(): void {
    let cumulativeTime = this.clock.start_time;
    
    this.clock.phase_order.forEach((phaseName, idx) => {
      const duration = this.clock.wave_durations[phaseName] || 0;
      const phase: MissionPhase = {
        id: `phase-${idx}`,
        wave: idx,
        name: phaseName,
        start_time: cumulativeTime,
        expected_duration: duration,
        status: 'pending',
        tasks: []
      };
      this.phases.set(phase.id, phase);
      cumulativeTime += duration;
    });
  }

  /**
   * Start the mission clock and begin phase execution
   */
  async startMissionClock(): Promise<void> {
    const startedAt = Date.now();
    
    // Emit mission start event to MC-1
    this.telemetryEmitter?.emit('mission:started', {
      mission_id: this.clock.mission_id,
      team_name: this.team.team_name,
      phase_count: this.clock.phase_order.length,
      total_duration_ms: Array.from(this.phases.values()).reduce(
        (sum, p) => sum + p.expected_duration, 0
      ),
      started_at: startedAt
    });

    // Execute phases in sequence with checkpoint gates
    for (const [phaseId, phase] of this.phases) {
      await this.executePhase(phase);
      
      // Check gate before proceeding
      if (this.clock.gate_checkpoints.includes(phase.name)) {
        const gateResult = await this.validateGate(phase);
        phase.gate_result = gateResult;
        
        if (!gateResult.passed) {
          phase.status = 'blocked';
          this.telemetryEmitter?.emit('mission:gate-failed', {
            phase_id: phaseId,
            phase_name: phase.name,
            reason: gateResult.reason
          });
          throw new Error(`Gate validation failed for phase: ${phase.name}`);
        }
      }
    }
  }

  /**
   * Execute a single phase with APT team
   */
  private async executePhase(phase: MissionPhase): Promise<void> {
    phase.status = 'in_progress';
    const phaseStartTime = Date.now();

    this.telemetryEmitter?.emit('phase:started', {
      phase_id: phase.id,
      phase_name: phase.name,
      wave: phase.wave,
      expected_duration_ms: phase.expected_duration,
      team_members: this.team.members.map(m => m.agent_name)
    });

    // Spawn APT team for this phase
    const agentPromises = this.team.members.map(member =>
      this.spawnAgentForPhase(member, phase)
    );

    try {
      await Promise.all(agentPromises);
      
      const phaseElapsedTime = Date.now() - phaseStartTime;
      phase.status = 'complete';
      
      this.telemetryEmitter?.emit('phase:completed', {
        phase_id: phase.id,
        phase_name: phase.name,
        elapsed_ms: phaseElapsedTime,
        expected_ms: phase.expected_duration
      });
    } catch (error) {
      phase.status = 'blocked';
      this.telemetryEmitter?.emit('phase:failed', {
        phase_id: phase.id,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Spawn agent for phase execution (position-aware task assignment)
   */
  private async spawnAgentForPhase(member: any, phase: MissionPhase): Promise<void> {
    // Route task to agent based on complex plane position
    const taskRoute = this.routeTaskByPosition(member.position, phase);
    
    this.telemetryEmitter?.emit('agent:spawned', {
      agent_name: member.agent_name,
      role: member.role,
      phase_id: phase.id,
      task_route: taskRoute
    });

    // Agent executes and reports back
    // (In real implementation, this would spawn actual agent process)
  }

  /**
   * Route task to agent based on complex plane position
   */
  private routeTaskByPosition(
    position: { real: number; imaginary: number },
    phase: MissionPhase
  ): string {
    // lex-hemlock (real axis): quality gates, validation
    if (position.real > 0.5) {
      return `${phase.name}:quality-validation`;
    }
    // foxy-cedar (imaginary): creative insight, narrative
    if (position.imaginary > 0.5) {
      return `${phase.name}:insight-generation`;
    }
    // moderate (center): coordination, observation
    return `${phase.name}:coordination`;
  }

  /**
   * Validate gate checkpoint before next phase
   */
  private async validateGate(phase: MissionPhase): Promise<{ passed: boolean; reason?: string }> {
    // Check if all agents completed their tasks
    // Check if outputs meet quality criteria
    // Emit gate validation event
    
    this.telemetryEmitter?.emit('gate:validating', {
      phase_id: phase.id,
      phase_name: phase.name
    });

    return { passed: true }; // Placeholder
  }

  /**
   * Get current mission status for MC-1 dashboard
   */
  getMissionStatus() {
    const allPhases = Array.from(this.phases.values());
    const completed = allPhases.filter(p => p.status === 'complete').length;
    const inProgress = allPhases.filter(p => p.status === 'in_progress').length;
    const blocked = allPhases.filter(p => p.status === 'blocked').length;

    return {
      mission_id: this.clock.mission_id,
      team_name: this.team.team_name,
      phase_progress: { completed, inProgress, blocked, total: allPhases.length },
      phases: allPhases.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        wave: p.wave,
        gate_result: p.gate_result
      }))
    };
  }

  /**
   * Inject telemetry emitter from MC-1
   */
  setTelemetryEmitter(emitter: any): void {
    this.telemetryEmitter = emitter;
  }
}
