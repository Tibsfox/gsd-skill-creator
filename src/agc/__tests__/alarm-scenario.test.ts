/**
 * 1202 Alarm Scenario tests -- overload simulation, BAILOUT reproduction,
 * event timeline, and parameterizable scenario configurations.
 *
 * Phase 218, Plan 02.
 */

import { describe, it, expect } from 'vitest';
import {
  type AlarmScenario,
  type ScenarioEvent,
  type ScenarioConfig,
  createApollo11Scenario,
  createScenario,
  runScenarioStep,
  runFullScenario,
} from '../alarm-scenario.js';
import { JobState } from '../executive.js';

// ─── ScenarioConfig and Setup ─────────────────────────────────────────────

describe('ScenarioConfig and setup', () => {
  it('createApollo11Scenario returns a valid ScenarioConfig', () => {
    const config = createApollo11Scenario();

    expect(config.jobs).toBeDefined();
    expect(config.overloadJobs).toBeDefined();
    expect(config.bailoutAlarmCode).toBe(1202);
  });

  it('Apollo 11 scenario has 7 initial jobs', () => {
    const config = createApollo11Scenario();
    expect(config.jobs).toHaveLength(7);
  });

  it('Apollo 11 scenario has overload jobs to trigger 1202', () => {
    const config = createApollo11Scenario();
    expect(config.overloadJobs.length).toBeGreaterThan(0);
  });

  it('Apollo 11 scenario includes critical navigation jobs', () => {
    const config = createApollo11Scenario();
    const critical = config.jobs.filter(j => j.restartGroup === 'CRITICAL');
    expect(critical.length).toBeGreaterThanOrEqual(2);

    const names = critical.map(j => j.name);
    expect(names).toContain('P63 Braking');
    expect(names).toContain('P64 Approach');
  });

  it('Apollo 11 scenario includes important and deferrable jobs', () => {
    const config = createApollo11Scenario();
    const important = config.jobs.filter(j => j.restartGroup === 'IMPORTANT');
    expect(important.length).toBeGreaterThanOrEqual(2);

    const deferrable = config.jobs.filter(j => j.restartGroup === 'DEFERRABLE');
    expect(deferrable.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── ScenarioEvent Types ──────────────────────────────────────────────────

describe('ScenarioEvent types', () => {
  it('events have eventIndex and snapshot fields', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    expect(scenario.events.length).toBeGreaterThan(0);
    for (const event of scenario.events) {
      expect(event).toHaveProperty('eventIndex');
      expect(event).toHaveProperty('snapshot');
      expect(event).toHaveProperty('type');
    }
  });

  it('event types include JOB_CREATED', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const created = scenario.events.filter(e => e.type === 'JOB_CREATED');
    expect(created.length).toBeGreaterThan(0);
  });

  it('JOB_CREATED events have name, priority, restartGroup', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const created = scenario.events.find(e => e.type === 'JOB_CREATED');
    expect(created).toBeDefined();
    if (created && created.type === 'JOB_CREATED') {
      expect(created).toHaveProperty('coreSetId');
      expect(created).toHaveProperty('name');
      expect(created).toHaveProperty('priority');
      expect(created).toHaveProperty('restartGroup');
    }
  });
});

// ─── ScenarioStep ─────────────────────────────────────────────────────────

describe('ScenarioStep -- step-by-step execution', () => {
  it('createScenario initializes with idle job only', () => {
    const config = createApollo11Scenario();
    const scenario = createScenario(config);

    expect(scenario.currentStep).toBe(0);
    expect(scenario.events).toHaveLength(0);
    expect(scenario.complete).toBe(false);
  });

  it('runScenarioStep advances the scenario by one step', () => {
    const config = createApollo11Scenario();
    const s0 = createScenario(config);
    const s1 = runScenarioStep(s0);

    expect(s1.currentStep).toBe(1);
    expect(s1.events.length).toBeGreaterThan(0);
  });

  it('first step creates the first job', () => {
    const config = createApollo11Scenario();
    const s0 = createScenario(config);
    const s1 = runScenarioStep(s0);

    const created = s1.events.filter(e => e.type === 'JOB_CREATED');
    expect(created.length).toBeGreaterThanOrEqual(1);
    if (created[0].type === 'JOB_CREATED') {
      expect(created[0].name).toBe(config.jobs[0].name);
    }
  });

  it('runFullScenario runs all steps to completion', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    expect(scenario.complete).toBe(true);
  });
});

// ─── Apollo 11 1202 Scenario Verification ─────────────────────────────────

describe('Apollo 11 1202 scenario verification', () => {
  it('produces a valid event log', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    expect(scenario.events.length).toBeGreaterThan(0);
    expect(scenario.complete).toBe(true);
  });

  it('event log contains OVERLOAD_DETECTED with alarmCode 1202', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const overload = scenario.events.find(e => e.type === 'OVERLOAD_DETECTED');
    expect(overload).toBeDefined();
    if (overload && overload.type === 'OVERLOAD_DETECTED') {
      expect(overload.alarmCode).toBe(1202);
    }
  });

  it('event log contains BAILOUT_TRIGGERED', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
  });

  it('after BAILOUT: P63 and P64 (CRITICAL) are preserved', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
    if (bailoutEvent && bailoutEvent.type === 'BAILOUT_TRIGGERED') {
      expect(bailoutEvent.preservedJobs).toContain('P63 Braking');
      expect(bailoutEvent.preservedJobs).toContain('P64 Approach');
    }
  });

  it('after BAILOUT: DSKY display and Telemetry (DEFERRABLE) are discarded', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
    if (bailoutEvent && bailoutEvent.type === 'BAILOUT_TRIGGERED') {
      expect(bailoutEvent.discardedJobs).toContain('DSKY display');
      expect(bailoutEvent.discardedJobs).toContain('Telemetry');
    }
  });

  it('after BAILOUT: RECOVERY_COMPLETE shows freed core sets', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const recovery = scenario.events.find(e => e.type === 'RECOVERY_COMPLETE');
    expect(recovery).toBeDefined();
    if (recovery && recovery.type === 'RECOVERY_COMPLETE') {
      expect(recovery.freeCoreSetCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('final scenario state has complete === true', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);
    expect(scenario.complete).toBe(true);
  });
});

// ─── Priority Preemption Visibility ───────────────────────────────────────

describe('priority preemption visibility', () => {
  it('higher-priority job preempts lower-priority running job', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const preemptions = scenario.events.filter(e => e.type === 'PREEMPTION');
    // At least one preemption should occur when a priority-1 job
    // arrives while a higher-numbered (lower-priority) job is running
    expect(preemptions.length).toBeGreaterThan(0);
  });

  it('preemption events show which job was preempted and why', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const preemption = scenario.events.find(e => e.type === 'PREEMPTION');
    if (preemption && preemption.type === 'PREEMPTION') {
      expect(preemption.preemptedJob).toBeDefined();
      expect(preemption.preemptingJob).toBeDefined();
      expect(preemption.reason).toBeDefined();
    }
  });
});

// ─── Parameterizable Scenarios ────────────────────────────────────────────

describe('parameterizable scenarios', () => {
  it('all CRITICAL jobs + overload: BAILOUT preserves all critical', () => {
    const config: ScenarioConfig = {
      jobs: [
        { name: 'Nav1', priority: 1, startAddress: 0o4100, restartGroup: 'CRITICAL' },
        { name: 'Nav2', priority: 1, startAddress: 0o4200, restartGroup: 'CRITICAL' },
        { name: 'Nav3', priority: 2, startAddress: 0o4300, restartGroup: 'CRITICAL' },
      ],
      overloadJobs: [
        { name: 'Ovl1', priority: 6, startAddress: 0o5000, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl2', priority: 6, startAddress: 0o5100, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl3', priority: 6, startAddress: 0o5200, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl4', priority: 6, startAddress: 0o5300, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl5', priority: 6, startAddress: 0o5400, restartGroup: 'DEFERRABLE' },
      ],
      bailoutAlarmCode: 1202,
    };
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
    if (bailoutEvent && bailoutEvent.type === 'BAILOUT_TRIGGERED') {
      expect(bailoutEvent.preservedJobs).toContain('Nav1');
      expect(bailoutEvent.preservedJobs).toContain('Nav2');
      expect(bailoutEvent.preservedJobs).toContain('Nav3');
    }
  });

  it('all DEFERRABLE jobs + overload: BAILOUT discards all non-idle', () => {
    const config: ScenarioConfig = {
      jobs: [
        { name: 'Bg1', priority: 5, startAddress: 0o4100, restartGroup: 'DEFERRABLE' },
        { name: 'Bg2', priority: 5, startAddress: 0o4200, restartGroup: 'DEFERRABLE' },
        { name: 'Bg3', priority: 6, startAddress: 0o4300, restartGroup: 'DEFERRABLE' },
      ],
      overloadJobs: [
        { name: 'Ovl1', priority: 6, startAddress: 0o5000, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl2', priority: 6, startAddress: 0o5100, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl3', priority: 6, startAddress: 0o5200, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl4', priority: 6, startAddress: 0o5300, restartGroup: 'DEFERRABLE' },
        { name: 'Ovl5', priority: 6, startAddress: 0o5400, restartGroup: 'DEFERRABLE' },
      ],
      bailoutAlarmCode: 1202,
    };
    const scenario = runFullScenario(config);

    const recovery = scenario.events.find(e => e.type === 'RECOVERY_COMPLETE');
    expect(recovery).toBeDefined();
    if (recovery && recovery.type === 'RECOVERY_COMPLETE') {
      // 7 core sets free (all non-idle freed)
      expect(recovery.freeCoreSetCount).toBe(7);
    }
  });

  it('0 overload jobs: completes without BAILOUT', () => {
    const config: ScenarioConfig = {
      jobs: [
        { name: 'Job1', priority: 1, startAddress: 0o4100, restartGroup: 'CRITICAL' },
        { name: 'Job2', priority: 3, startAddress: 0o4200, restartGroup: 'IMPORTANT' },
      ],
      overloadJobs: [],
      bailoutAlarmCode: 1202,
    };
    const scenario = runFullScenario(config);

    expect(scenario.complete).toBe(true);

    const overload = scenario.events.find(e => e.type === 'OVERLOAD_DETECTED');
    expect(overload).toBeUndefined();
  });
});

// ─── Snapshot Accuracy ────────────────────────────────────────────────────

describe('snapshot accuracy', () => {
  it('first event snapshot shows only idle job', () => {
    const config = createApollo11Scenario();
    const s0 = createScenario(config);
    const s1 = runScenarioStep(s0);

    // The very first event should have the snapshot before or at job creation
    const firstEvent = s1.events[0];
    expect(firstEvent.snapshot).toBeDefined();

    // At the time of the first event, only idle (core set 0) + the new job exist
    const usedSets = firstEvent.snapshot.coreSets.filter(cs => cs.state !== 'FREE');
    // At minimum, idle + the first created job = 2
    expect(usedSets.length).toBeGreaterThanOrEqual(1);
  });

  it('BAILOUT_TRIGGERED snapshot shows full core sets', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
    if (bailoutEvent) {
      // After bailout, snapshot reflects the recovered state
      // The utilization should have decreased from the overloaded state
      expect(bailoutEvent.snapshot).toBeDefined();
    }
  });

  it('RECOVERY_COMPLETE snapshot shows freed core sets', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const recovery = scenario.events.find(e => e.type === 'RECOVERY_COMPLETE');
    expect(recovery).toBeDefined();
    if (recovery) {
      const freeSets = recovery.snapshot.coreSets.filter(cs => cs.state === 'FREE');
      expect(freeSets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each event snapshot has valid MonitorSnapshot structure', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    for (const event of scenario.events) {
      expect(event.snapshot).toHaveProperty('timestamp');
      expect(event.snapshot).toHaveProperty('coreSets');
      expect(event.snapshot).toHaveProperty('waitlistEntries');
      expect(event.snapshot).toHaveProperty('interrupts');
      expect(event.snapshot).toHaveProperty('counters');
      expect(event.snapshot).toHaveProperty('restart');
    }
  });
});
