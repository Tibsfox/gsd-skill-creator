/**
 * AGC Block II 1202 Alarm Scenario Model.
 *
 * Reproduces the Apollo 11 Executive overload step by step: jobs accumulate,
 * core sets fill up, NOVAC fails with alarm 1202, BAILOUT discards low-priority
 * work, critical navigation jobs survive, and the system recovers.
 *
 * Each step captures a MonitorSnapshot, producing a structured event timeline
 * that the desktop visualization (Phase 222) will animate.
 *
 * Scenarios are parameterizable: different job mixes, priorities, and restart
 * groups can reproduce various failure/recovery patterns.
 *
 * Phase 218, Plan 02.
 */

import { createAgcState, type AgcState } from './cpu.js';
import {
  type ExecutiveState,
  createExecutiveState,
  novac,
  scheduleNext,
  JobState,
  CORE_SET_COUNT,
} from './executive.js';
import {
  type WaitlistState,
  createWaitlistState,
} from './waitlist.js';
import {
  type RestartState,
  RestartGroup,
  createRestartState,
  registerRestartPoint,
  bailout,
} from './restart.js';
import { type MonitorSnapshot, captureSnapshot } from './executive-monitor.js';

// ─── Types ───────────────────────────────────────────────────────────────

/** Configuration for a single job in the scenario. */
export interface ScenarioJobConfig {
  readonly name: string;
  readonly priority: number;
  readonly startAddress: number;
  readonly restartGroup: 'CRITICAL' | 'IMPORTANT' | 'DEFERRABLE';
  readonly delay?: number;
}

/** Configuration for a complete scenario. */
export interface ScenarioConfig {
  readonly jobs: readonly ScenarioJobConfig[];
  readonly overloadJobs: readonly ScenarioJobConfig[];
  readonly bailoutAlarmCode: number;
}

/** Discriminated union for scenario events. */
export type ScenarioEvent =
  | { readonly type: 'JOB_CREATED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly coreSetId: number; readonly name: string; readonly priority: number; readonly restartGroup: string }
  | { readonly type: 'JOB_SCHEDULED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly coreSetId: number; readonly name: string; readonly priority: number }
  | { readonly type: 'OVERLOAD_DETECTED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly alarmCode: number; readonly failedJob: string }
  | { readonly type: 'BAILOUT_TRIGGERED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly alarmCode: number; readonly preservedJobs: readonly string[]; readonly discardedJobs: readonly string[] }
  | { readonly type: 'JOB_DISCARDED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly coreSetId: number; readonly name: string; readonly priority: number; readonly reason: string }
  | { readonly type: 'JOB_PRESERVED'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly coreSetId: number; readonly name: string; readonly priority: number; readonly restartGroup: string }
  | { readonly type: 'RECOVERY_COMPLETE'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly freeCoreSetCount: number; readonly activeJobCount: number }
  | { readonly type: 'PREEMPTION'; readonly eventIndex: number; readonly snapshot: MonitorSnapshot; readonly preemptedJob: string; readonly preemptingJob: string; readonly reason: string };

/** Complete scenario state. */
export interface AlarmScenario {
  readonly config: ScenarioConfig;
  readonly currentStep: number;
  readonly events: readonly ScenarioEvent[];
  readonly execState: ExecutiveState;
  readonly waitlistState: WaitlistState;
  readonly restartState: RestartState;
  readonly agcState: AgcState;
  readonly complete: boolean;
  readonly jobNames: ReadonlyMap<number, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Map restart group string to RestartGroup enum. */
function toRestartGroup(group: 'CRITICAL' | 'IMPORTANT' | 'DEFERRABLE'): RestartGroup {
  switch (group) {
    case 'CRITICAL': return RestartGroup.CRITICAL;
    case 'IMPORTANT': return RestartGroup.IMPORTANT;
    case 'DEFERRABLE': return RestartGroup.DEFERRABLE;
  }
}

/** Make a DORMANT job RUNNABLE in the Executive state. */
function makeRunnable(exec: ExecutiveState, coreSetId: number): ExecutiveState {
  return {
    ...exec,
    coreSets: exec.coreSets.map((cs, i) =>
      i === coreSetId && cs.state === JobState.DORMANT
        ? { ...cs, state: JobState.RUNNABLE }
        : cs,
    ),
  };
}

/** Get the currently RUNNING core set's name from the jobNames map. */
function getRunningJobName(exec: ExecutiveState, jobNames: ReadonlyMap<number, string>): string {
  const runningCs = exec.coreSets.findIndex(cs => cs.state === JobState.RUNNING);
  if (runningCs === -1) return 'unknown';
  if (runningCs === 0) return 'Idle';
  return jobNames.get(runningCs) ?? `CoreSet${runningCs}`;
}

/** Count FREE core sets (excluding core set 0 = idle). */
function countFreeSets(exec: ExecutiveState): number {
  return exec.coreSets.filter((cs, i) => i > 0 && cs.state === JobState.FREE).length;
}

/** Count non-FREE, non-idle core sets. */
function countActiveJobs(exec: ExecutiveState): number {
  return exec.coreSets.filter((cs, i) => i > 0 && cs.state !== JobState.FREE).length;
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Create the pre-configured Apollo 11 lunar descent scenario.
 *
 * 7 initial jobs matching the real Apollo 11 job mix during powered descent:
 * - P63 Braking and P64 Approach: CRITICAL guidance (priority 1)
 * - Attitude DAP and Navigation: IMPORTANT flight control (priority 2)
 * - DSKY display, Radar processing, Telemetry: DEFERRABLE background (priority 4-5)
 *
 * 2 overload jobs (rendezvous radar tasks) that push past 7 core sets,
 * triggering the famous 1202 alarm.
 */
export function createApollo11Scenario(): ScenarioConfig {
  return {
    jobs: [
      { name: 'P63 Braking', priority: 1, startAddress: 0o4100, restartGroup: 'CRITICAL' },
      { name: 'P64 Approach', priority: 1, startAddress: 0o4200, restartGroup: 'CRITICAL' },
      { name: 'Attitude DAP', priority: 2, startAddress: 0o4300, restartGroup: 'IMPORTANT' },
      { name: 'Navigation', priority: 2, startAddress: 0o4400, restartGroup: 'IMPORTANT' },
      { name: 'DSKY display', priority: 5, startAddress: 0o4500, restartGroup: 'DEFERRABLE' },
      { name: 'Radar processing', priority: 4, startAddress: 0o4600, restartGroup: 'DEFERRABLE' },
      { name: 'Telemetry', priority: 5, startAddress: 0o4700, restartGroup: 'DEFERRABLE' },
    ],
    overloadJobs: [
      { name: 'Rendezvous Radar 1', priority: 6, startAddress: 0o5000, restartGroup: 'DEFERRABLE' },
      { name: 'Rendezvous Radar 2', priority: 6, startAddress: 0o5100, restartGroup: 'DEFERRABLE' },
    ],
    bailoutAlarmCode: 1202,
  };
}

/**
 * Initialize a fresh scenario from the given configuration.
 *
 * Starts with an AGC state containing only the idle job (core set 0).
 */
export function createScenario(config: ScenarioConfig): AlarmScenario {
  return {
    config,
    currentStep: 0,
    events: [],
    execState: createExecutiveState(),
    waitlistState: createWaitlistState(),
    restartState: createRestartState(),
    agcState: createAgcState(),
    complete: false,
    jobNames: new Map(),
  };
}

/**
 * Advance the scenario by one step.
 *
 * Phase A (steps 0..jobs.length-1): Create each job, register restart point,
 *   schedule, detect preemption.
 * Phase B (steps jobs.length..): Attempt overload jobs, detect alarm, BAILOUT.
 * Phase C (no overload jobs): Mark complete after all jobs created.
 */
export function runScenarioStep(scenario: AlarmScenario): AlarmScenario {
  if (scenario.complete) return scenario;

  const { config, currentStep } = scenario;
  let { execState, waitlistState, restartState, agcState, events, jobNames } = scenario;
  const mutableJobNames = new Map(jobNames);
  const newEvents: ScenarioEvent[] = [...events];
  let nextEventIndex = newEvents.length;

  const totalJobs = config.jobs.length;

  // Phase A: Create initial jobs
  if (currentStep < totalJobs) {
    const jobConfig = config.jobs[currentStep];

    // Record running job BEFORE scheduling
    const prevRunningName = getRunningJobName(execState, mutableJobNames);
    const prevRunningPriority = execState.coreSets[execState.runningCoreSet]?.priority ?? 8;

    // Create job via novac
    const result = novac(execState, jobConfig.priority, jobConfig.startAddress);
    if ('alarm' in result) {
      // Unexpected alarm during Phase A -- shouldn't happen with <= 7 jobs
      return { ...scenario, currentStep: currentStep + 1 };
    }

    execState = result.state;
    const coreSetId = result.coreSetId;
    mutableJobNames.set(coreSetId, jobConfig.name);

    // Register restart point
    restartState = registerRestartPoint(
      restartState,
      coreSetId,
      toRestartGroup(jobConfig.restartGroup),
      jobConfig.startAddress,
    );

    // Activate job (DORMANT -> RUNNABLE)
    execState = makeRunnable(execState, coreSetId);

    // Schedule to determine which job runs
    const schedResult = scheduleNext(execState);
    execState = schedResult.state;

    // Capture snapshot for JOB_CREATED event
    const snapshot = captureSnapshot(agcState, execState, waitlistState, restartState);

    newEvents.push({
      type: 'JOB_CREATED',
      eventIndex: nextEventIndex++,
      snapshot,
      coreSetId,
      name: jobConfig.name,
      priority: jobConfig.priority,
      restartGroup: jobConfig.restartGroup,
    });

    // Check for preemption: did the new job preempt the previously running job?
    if (jobConfig.priority < prevRunningPriority) {
      const preemptSnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
      newEvents.push({
        type: 'PREEMPTION',
        eventIndex: nextEventIndex++,
        snapshot: preemptSnapshot,
        preemptedJob: prevRunningName,
        preemptingJob: jobConfig.name,
        reason: `Priority ${jobConfig.priority} job preempts priority ${prevRunningPriority} job`,
      });
    }

    // Check if Phase A is done and no overload jobs
    const isLastJob = currentStep === totalJobs - 1;
    const noOverload = config.overloadJobs.length === 0;

    return {
      ...scenario,
      currentStep: currentStep + 1,
      events: newEvents,
      execState,
      waitlistState,
      restartState,
      agcState,
      jobNames: mutableJobNames,
      complete: isLastJob && noOverload,
    };
  }

  // Phase B: Attempt overload jobs
  const overloadStep = currentStep - totalJobs;
  if (overloadStep < config.overloadJobs.length) {
    const overloadConfig = config.overloadJobs[overloadStep];

    // Activate all DORMANT jobs before attempting overload
    // (ensure all existing jobs are RUNNABLE so they occupy core sets)
    for (let i = 1; i < CORE_SET_COUNT; i++) {
      if (execState.coreSets[i].state === JobState.DORMANT) {
        execState = makeRunnable(execState, i);
      }
    }

    // Attempt to create the overload job
    const result = novac(execState, overloadConfig.priority, overloadConfig.startAddress);

    if ('alarm' in result) {
      // Overload detected -- alarm 1202
      execState = result.state;

      const overloadSnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
      newEvents.push({
        type: 'OVERLOAD_DETECTED',
        eventIndex: nextEventIndex++,
        snapshot: overloadSnapshot,
        alarmCode: result.alarm,
        failedJob: overloadConfig.name,
      });

      // Execute BAILOUT
      const bailoutResult = bailout(
        restartState,
        execState,
        waitlistState,
        config.bailoutAlarmCode,
      );

      execState = bailoutResult.execState;
      waitlistState = bailoutResult.waitlistState;
      restartState = bailoutResult.restartState;

      // Emit JOB_PRESERVED and JOB_DISCARDED events
      for (const csId of bailoutResult.preserved) {
        const name = mutableJobNames.get(csId) ?? `CoreSet${csId}`;
        const cs = execState.coreSets[csId];
        const rp = restartState.restartPoints.get(csId);
        const groupStr = rp
          ? rp.group === RestartGroup.CRITICAL ? 'CRITICAL'
          : rp.group === RestartGroup.IMPORTANT ? 'IMPORTANT'
          : 'DEFERRABLE'
          : 'UNKNOWN';

        const preserveSnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
        newEvents.push({
          type: 'JOB_PRESERVED',
          eventIndex: nextEventIndex++,
          snapshot: preserveSnapshot,
          coreSetId: csId,
          name,
          priority: cs.priority,
          restartGroup: groupStr,
        });
      }

      for (const csId of bailoutResult.discarded) {
        const name = mutableJobNames.get(csId) ?? `CoreSet${csId}`;
        const discardSnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
        newEvents.push({
          type: 'JOB_DISCARDED',
          eventIndex: nextEventIndex++,
          snapshot: discardSnapshot,
          coreSetId: csId,
          name,
          priority: 0, // already freed
          reason: 'BAILOUT: deferrable job discarded to free resources',
        });
        mutableJobNames.delete(csId);
      }

      // Emit BAILOUT_TRIGGERED with summary
      const preservedNames = bailoutResult.preserved.map(
        csId => mutableJobNames.get(csId) ?? `CoreSet${csId}`,
      );
      const discardedNames = bailoutResult.discarded.map(
        csId => jobNames.get(csId) ?? `CoreSet${csId}`,  // use original names before deletion
      );

      const bailoutSnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
      newEvents.push({
        type: 'BAILOUT_TRIGGERED',
        eventIndex: nextEventIndex++,
        snapshot: bailoutSnapshot,
        alarmCode: config.bailoutAlarmCode,
        preservedJobs: preservedNames,
        discardedJobs: discardedNames,
      });

      // Emit RECOVERY_COMPLETE
      const freeCount = countFreeSets(execState);
      const activeCount = countActiveJobs(execState);

      const recoverySnapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
      newEvents.push({
        type: 'RECOVERY_COMPLETE',
        eventIndex: nextEventIndex++,
        snapshot: recoverySnapshot,
        freeCoreSetCount: freeCount,
        activeJobCount: activeCount,
      });

      return {
        ...scenario,
        currentStep: currentStep + 1,
        events: newEvents,
        execState,
        waitlistState,
        restartState,
        agcState,
        jobNames: mutableJobNames,
        complete: true,
      };
    }

    // Job created successfully (not yet at overload)
    execState = result.state;
    const coreSetId = result.coreSetId;
    mutableJobNames.set(coreSetId, overloadConfig.name);

    // Register restart point
    restartState = registerRestartPoint(
      restartState,
      coreSetId,
      toRestartGroup(overloadConfig.restartGroup),
      overloadConfig.startAddress,
    );

    // Activate and schedule
    execState = makeRunnable(execState, coreSetId);
    const schedResult = scheduleNext(execState);
    execState = schedResult.state;

    const snapshot = captureSnapshot(agcState, execState, waitlistState, restartState);
    newEvents.push({
      type: 'JOB_CREATED',
      eventIndex: nextEventIndex++,
      snapshot,
      coreSetId,
      name: overloadConfig.name,
      priority: overloadConfig.priority,
      restartGroup: overloadConfig.restartGroup,
    });

    // Check if all overload jobs are done without alarm
    const isLastOverload = overloadStep === config.overloadJobs.length - 1;

    return {
      ...scenario,
      currentStep: currentStep + 1,
      events: newEvents,
      execState,
      waitlistState,
      restartState,
      agcState,
      jobNames: mutableJobNames,
      complete: isLastOverload,
    };
  }

  // Shouldn't get here, but mark complete
  return { ...scenario, complete: true };
}

/**
 * Run all scenario steps to completion.
 *
 * Returns the final scenario state with the complete event log.
 */
export function runFullScenario(config: ScenarioConfig): AlarmScenario {
  let scenario = createScenario(config);
  while (!scenario.complete) {
    scenario = runScenarioStep(scenario);
  }
  return scenario;
}
