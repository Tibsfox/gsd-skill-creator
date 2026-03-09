/**
 * Spatial Awareness — Simulated Agent Environment
 * Paula Chipset Release 2
 *
 * 5 mock agents with configurable noise and injectable anomalies.
 * Provides the test harness for all Spatial Awareness components.
 */

import type {
  AmbientSignal,
  ThreatEvent,
  ThreatLevel,
  ThreatEventType,
  FrogPhase,
  CoordinationMessage,
  SpatialModel,
  ResourceDimension,
} from './types.js';
import {
  type SensorStream,
  type SensorListener,
  createAmbientSignal,
  DefaultSensorRegistry,
} from './sensor-interface.js';

// ============================================================================
// Mock agent
// ============================================================================

export interface MockAgent {
  readonly id: string;
  readonly name: string;
  state: 'active' | 'idle' | 'blocked' | 'paused';
  contextFill: number;
  tokenBudget: number;
  errorRate: number;
  outputRate: number;
}

export function createMockAgent(name: string, index: number): MockAgent {
  return {
    id: `agent-${index}`,
    name,
    state: 'active',
    contextFill: 20 + Math.random() * 30,
    tokenBudget: 70 + Math.random() * 30,
    errorRate: Math.random() * 2,
    outputRate: 5 + Math.random() * 10,
  };
}

// ============================================================================
// Anomaly injection
// ============================================================================

export interface AnomalyConfig {
  type: ThreatEventType;
  targetAgent?: string;
  severity: ThreatLevel;
  duration: number;
  delay?: number;
}

export interface InjectedAnomaly {
  config: AnomalyConfig;
  startTime: number;
  active: boolean;
  triggered: boolean;
  event: ThreatEvent;
}

// ============================================================================
// Noise generator
// ============================================================================

export interface NoiseConfig {
  contextFillJitter: number;
  budgetDriftRate: number;
  errorRateVariance: number;
  outputRateVariance: number;
  signalNoiseRatio: number;
}

export const DEFAULT_NOISE: NoiseConfig = {
  contextFillJitter: 2,
  budgetDriftRate: 0.5,
  errorRateVariance: 1,
  outputRateVariance: 3,
  signalNoiseRatio: 10,
};

export const LOW_NOISE: NoiseConfig = {
  contextFillJitter: 0.5,
  budgetDriftRate: 0.1,
  errorRateVariance: 0.2,
  outputRateVariance: 1,
  signalNoiseRatio: 20,
};

export const HIGH_NOISE: NoiseConfig = {
  contextFillJitter: 8,
  budgetDriftRate: 2,
  errorRateVariance: 5,
  outputRateVariance: 8,
  signalNoiseRatio: 3,
};

function addNoise(value: number, variance: number): number {
  return value + (Math.random() - 0.5) * 2 * variance;
}

// ============================================================================
// Simulated environment
// ============================================================================

export class SimulatedEnvironment {
  readonly agents: MockAgent[];
  readonly sensorRegistry: DefaultSensorRegistry;
  private _noise: NoiseConfig;
  private _anomalies: InjectedAnomaly[] = [];
  private _signals: AmbientSignal[] = [];
  private _threats: ThreatEvent[] = [];
  private _messages: CoordinationMessage[] = [];
  private _running = false;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _tickCount = 0;
  private _listeners: Set<(event: SimEnvironmentEvent) => void> = new Set();

  constructor(
    agentNames = ['alpha', 'bravo', 'charlie', 'delta', 'echo'],
    noise: NoiseConfig = DEFAULT_NOISE,
  ) {
    this.agents = agentNames.map((name, i) => createMockAgent(name, i));
    this._noise = noise;
    this.sensorRegistry = new DefaultSensorRegistry();

    // Create sensor streams for each agent
    for (const agent of this.agents) {
      this.sensorRegistry.register(
        new AgentContextSensor(agent),
      );
      this.sensorRegistry.register(
        new AgentBudgetSensor(agent),
      );
      this.sensorRegistry.register(
        new AgentErrorSensor(agent),
      );
    }
  }

  get running(): boolean { return this._running; }
  get tickCount(): number { return this._tickCount; }
  get signals(): readonly AmbientSignal[] { return this._signals; }
  get threats(): readonly ThreatEvent[] { return this._threats; }
  get messages(): readonly CoordinationMessage[] { return this._messages; }

  /** Start the simulation loop. */
  start(tickMs = 100): void {
    if (this._running) return;
    this._running = true;
    this.sensorRegistry.startAll();
    this._tickInterval = setInterval(() => this._tick(), tickMs);
  }

  /** Stop the simulation loop. */
  stop(): void {
    if (!this._running) return;
    this._running = false;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    this.sensorRegistry.stopAll();
  }

  /** Inject an anomaly into the environment. */
  injectAnomaly(config: AnomalyConfig): InjectedAnomaly {
    const event: ThreatEvent = {
      id: `threat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: config.type,
      level: config.severity,
      classification: 'UNKNOWN',
      sources: config.targetAgent ? [config.targetAgent] : this.agents.map(a => a.id),
      description: `Injected ${config.type} anomaly (${config.severity})`,
      timestamp: Date.now(),
      probeResults: [],
      resolved: false,
    };

    const anomaly: InjectedAnomaly = {
      config,
      startTime: Date.now() + (config.delay ?? 0),
      active: false,
      triggered: false,
      event,
    };

    this._anomalies.push(anomaly);
    return anomaly;
  }

  /** Set noise configuration. */
  setNoise(noise: NoiseConfig): void {
    this._noise = noise;
  }

  /** Get the current spatial model for an agent. */
  getSpatialModel(agentId: string): SpatialModel | null {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return null;

    const dimensions: ResourceDimension[] = [
      {
        name: 'context_window',
        current: agent.contextFill,
        maximum: 100,
        unit: 'percent',
        fillPercent: agent.contextFill,
        rateOfChange: 0,
      },
      {
        name: 'token_budget',
        current: agent.tokenBudget,
        maximum: 100,
        unit: 'percent',
        fillPercent: 100 - agent.tokenBudget,
        rateOfChange: -this._noise.budgetDriftRate,
      },
    ];

    const activeThreats = this._threats.filter(t => !t.resolved);
    const maxLevel = activeThreats.reduce<ThreatLevel>(
      (max, t) => {
        const order: ThreatLevel[] = ['NOMINAL', 'ELEVATED', 'HIGH', 'BLOCK'];
        return order.indexOf(t.level) > order.indexOf(max) ? t.level : max;
      },
      'NOMINAL',
    );

    return {
      agentId,
      timestamp: Date.now(),
      dimensions,
      threatLevel: maxLevel,
      activePhase: 'BASELINE' as FrogPhase,
      peerCount: this.agents.length - 1,
      peersActive: this.agents.filter(a => a.id !== agentId && a.state === 'active').length,
      peersIdle: this.agents.filter(a => a.id !== agentId && a.state === 'idle').length,
      peersBlocked: this.agents.filter(a => a.id !== agentId && a.state === 'blocked').length,
      lastAnomaly: activeThreats.length > 0
        ? activeThreats[activeThreats.length - 1].timestamp
        : null,
    };
  }

  /** Record a coordination message (for testing). */
  recordMessage(message: CoordinationMessage): void {
    this._messages.push(message);
    this._emit({ type: 'message', data: message });
  }

  /** Subscribe to environment events. */
  subscribe(listener: (event: SimEnvironmentEvent) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Reset the environment to initial state. */
  reset(): void {
    this.stop();
    this._anomalies = [];
    this._signals = [];
    this._threats = [];
    this._messages = [];
    this._tickCount = 0;
    for (const agent of this.agents) {
      agent.state = 'active';
      agent.contextFill = 20 + Math.random() * 30;
      agent.tokenBudget = 70 + Math.random() * 30;
      agent.errorRate = Math.random() * 2;
      agent.outputRate = 5 + Math.random() * 10;
    }
  }

  private _tick(): void {
    this._tickCount++;
    const now = Date.now();

    // Apply noise to agents
    for (const agent of this.agents) {
      if (agent.state === 'active') {
        agent.contextFill = Math.max(0, Math.min(100,
          addNoise(agent.contextFill + 0.1, this._noise.contextFillJitter)));
        agent.tokenBudget = Math.max(0, Math.min(100,
          agent.tokenBudget - this._noise.budgetDriftRate * 0.1));
        agent.errorRate = Math.max(0,
          addNoise(agent.errorRate, this._noise.errorRateVariance * 0.1));
        agent.outputRate = Math.max(0,
          addNoise(agent.outputRate, this._noise.outputRateVariance * 0.1));
      }
    }

    // Process anomalies
    for (const anomaly of this._anomalies) {
      if (!anomaly.triggered && !anomaly.active && now >= anomaly.startTime) {
        anomaly.active = true;
        this._threats.push(anomaly.event);
        this._applyAnomaly(anomaly);
        this._emit({ type: 'threat', data: anomaly.event });
      }
      if (anomaly.active && now >= anomaly.startTime + anomaly.config.duration) {
        anomaly.active = false;
        anomaly.event.resolved = true;
        this._emit({ type: 'threat_resolved', data: anomaly.event });
      }
    }

    this._emit({ type: 'tick', data: { tick: this._tickCount } });
  }

  private _applyAnomaly(anomaly: InjectedAnomaly): void {
    const { config } = anomaly;
    const targets = config.targetAgent
      ? this.agents.filter(a => a.id === config.targetAgent)
      : this.agents;

    for (const agent of targets) {
      switch (config.type) {
        case 'budget_spike':
          agent.tokenBudget = Math.max(0, agent.tokenBudget - 30);
          break;
        case 'error_surge':
          agent.errorRate += 20;
          break;
        case 'agent_silence':
          agent.outputRate = 0;
          agent.state = 'blocked';
          break;
        case 'resource_exhaustion':
          agent.contextFill = 95;
          agent.tokenBudget = 5;
          break;
        case 'safety_approach':
          agent.contextFill = 85;
          break;
        default:
          break;
      }
    }
  }

  private _emit(event: SimEnvironmentEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

// ============================================================================
// Environment event types
// ============================================================================

export type SimEnvironmentEvent =
  | { type: 'tick'; data: { tick: number } }
  | { type: 'threat'; data: ThreatEvent }
  | { type: 'threat_resolved'; data: ThreatEvent }
  | { type: 'message'; data: CoordinationMessage }
  | { type: 'signal'; data: AmbientSignal };

// ============================================================================
// Agent-backed sensor streams
// ============================================================================

class AgentContextSensor implements SensorStream {
  readonly id: string;
  readonly type = 'context_fill' as const;
  readonly source: string;
  private _agent: MockAgent;
  private _active = false;
  private _listeners = new Set<SensorListener>();

  constructor(agent: MockAgent) {
    this._agent = agent;
    this.id = `${agent.id}-context`;
    this.source = agent.id;
  }

  get active(): boolean { return this._active; }

  async start(): Promise<void> { this._active = true; }
  async stop(): Promise<void> { this._active = false; }

  read(): AmbientSignal | null {
    if (!this._active) return null;
    return createAmbientSignal('context_fill', this.source, this._agent.contextFill, 'percent');
  }

  subscribe(listener: SensorListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

class AgentBudgetSensor implements SensorStream {
  readonly id: string;
  readonly type = 'token_budget' as const;
  readonly source: string;
  private _agent: MockAgent;
  private _active = false;
  private _listeners = new Set<SensorListener>();

  constructor(agent: MockAgent) {
    this._agent = agent;
    this.id = `${agent.id}-budget`;
    this.source = agent.id;
  }

  get active(): boolean { return this._active; }

  async start(): Promise<void> { this._active = true; }
  async stop(): Promise<void> { this._active = false; }

  read(): AmbientSignal | null {
    if (!this._active) return null;
    return createAmbientSignal('token_budget', this.source, this._agent.tokenBudget, 'percent');
  }

  subscribe(listener: SensorListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

class AgentErrorSensor implements SensorStream {
  readonly id: string;
  readonly type = 'error_rate' as const;
  readonly source: string;
  private _agent: MockAgent;
  private _active = false;
  private _listeners = new Set<SensorListener>();

  constructor(agent: MockAgent) {
    this._agent = agent;
    this.id = `${agent.id}-errors`;
    this.source = agent.id;
  }

  get active(): boolean { return this._active; }

  async start(): Promise<void> { this._active = true; }
  async stop(): Promise<void> { this._active = false; }

  read(): AmbientSignal | null {
    if (!this._active) return null;
    return createAmbientSignal('error_rate', this.source, this._agent.errorRate, 'errors/min');
  }

  subscribe(listener: SensorListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

// ============================================================================
// Test scenario presets
// ============================================================================

export const SCENARIOS = {
  /** Normal operation — all agents healthy, low noise. */
  nominal(): SimulatedEnvironment {
    return new SimulatedEnvironment(undefined, LOW_NOISE);
  },

  /** Single agent dependency failure. */
  dependencyFailure(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'dependency_failure',
      targetAgent: 'agent-2',
      severity: 'HIGH',
      duration: 10_000,
    });
    return env;
  },

  /** Budget spike across all agents. */
  budgetSpike(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'budget_spike',
      severity: 'ELEVATED',
      duration: 5_000,
    });
    return env;
  },

  /** Agent goes silent (blocked). */
  agentSilence(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'agent_silence',
      targetAgent: 'agent-0',
      severity: 'HIGH',
      duration: 15_000,
    });
    return env;
  },

  /** Safety boundary approach. */
  safetyApproach(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'safety_approach',
      severity: 'BLOCK',
      duration: 8_000,
    });
    return env;
  },

  /** Resource exhaustion scenario. */
  resourceExhaustion(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'resource_exhaustion',
      targetAgent: 'agent-1',
      severity: 'BLOCK',
      duration: 12_000,
    });
    return env;
  },

  /** Error surge across environment. */
  errorSurge(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    env.injectAnomaly({
      type: 'error_surge',
      severity: 'ELEVATED',
      duration: 7_000,
    });
    return env;
  },

  /** Cascading failures — multiple anomalies. */
  cascadingFailure(): SimulatedEnvironment {
    const env = new SimulatedEnvironment(undefined, HIGH_NOISE);
    env.injectAnomaly({
      type: 'error_surge',
      severity: 'ELEVATED',
      duration: 15_000,
    });
    env.injectAnomaly({
      type: 'agent_silence',
      targetAgent: 'agent-3',
      severity: 'HIGH',
      duration: 10_000,
      delay: 3_000,
    });
    env.injectAnomaly({
      type: 'resource_exhaustion',
      targetAgent: 'agent-4',
      severity: 'BLOCK',
      duration: 8_000,
      delay: 6_000,
    });
    return env;
  },

  /** High noise, no actual threats — tests false positive rate. */
  noisyButSafe(): SimulatedEnvironment {
    return new SimulatedEnvironment(undefined, HIGH_NOISE);
  },

  /** Rapid successive anomalies — tests re-entry handling. */
  rapidAnomalies(): SimulatedEnvironment {
    const env = new SimulatedEnvironment();
    for (let i = 0; i < 5; i++) {
      env.injectAnomaly({
        type: 'error_surge',
        targetAgent: `agent-${i}`,
        severity: 'ELEVATED',
        duration: 2_000,
        delay: i * 1_000,
      });
    }
    return env;
  },
} as const;
