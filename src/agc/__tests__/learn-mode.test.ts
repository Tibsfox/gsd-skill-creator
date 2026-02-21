/**
 * Learn Mode annotation tests -- annotation accuracy, modern computing
 * mappings, GSD mappings, and snapshot/event annotation.
 *
 * Phase 218, Plan 03.
 */

import { describe, it, expect } from 'vitest';
import {
  type LearnAnnotation,
  type LearnModeState,
  createLearnModeState,
  toggleLearnMode,
  getAnnotation,
  getAnnotationsForSnapshot,
  annotateScenarioEvent,
  ALL_ANNOTATIONS,
} from '../learn-mode.js';
import { createAgcState } from '../cpu.js';
import { createExecutiveState, novac, scheduleNext, jobSleep, JobState } from '../executive.js';
import { createWaitlistState, addWaitlistEntry } from '../waitlist.js';
import { createRestartState, registerRestartPoint, RestartGroup, bailout } from '../restart.js';
import { captureSnapshot, type MonitorSnapshot } from '../executive-monitor.js';
import { createApollo11Scenario, runFullScenario, type ScenarioEvent } from '../alarm-scenario.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Make a DORMANT job RUNNABLE. */
function makeRunnable(exec: ReturnType<typeof createExecutiveState>, coreSetId: number) {
  return {
    ...exec,
    coreSets: exec.coreSets.map((cs, i) =>
      i === coreSetId && cs.state === JobState.DORMANT
        ? { ...cs, state: JobState.RUNNABLE }
        : cs,
    ),
  };
}

// ─── LearnAnnotation Structure ────────────────────────────────────────────

describe('LearnAnnotation structure', () => {
  it('has all required fields', () => {
    const ann = getAnnotation('core-set');
    expect(ann).not.toBeNull();
    if (!ann) return;

    expect(ann).toHaveProperty('id');
    expect(ann).toHaveProperty('category');
    expect(ann).toHaveProperty('title');
    expect(ann).toHaveProperty('agcDescription');
    expect(ann).toHaveProperty('modernEquivalent');
    expect(ann.modernEquivalent).toHaveProperty('concept');
    expect(ann.modernEquivalent).toHaveProperty('description');
    expect(ann).toHaveProperty('gsdMapping');
    expect(ann.gsdMapping).toHaveProperty('concept');
    expect(ann.gsdMapping).toHaveProperty('description');
    expect(ann).toHaveProperty('relatedAnnotations');
  });

  it('AnnotationCategory covers SCHEDULING, MEMORY, TIMING, FAILSAFE, IO', () => {
    const categories = new Set<string>();
    for (const [, ann] of ALL_ANNOTATIONS) {
      categories.add(ann.category);
    }
    expect(categories.has('SCHEDULING')).toBe(true);
    expect(categories.has('MEMORY')).toBe(true);
    expect(categories.has('TIMING')).toBe(true);
    expect(categories.has('FAILSAFE')).toBe(true);
    expect(categories.has('IO')).toBe(true);
  });
});

// ─── Core Annotation Registry ─────────────────────────────────────────────

describe('core annotation registry (ALL_ANNOTATIONS)', () => {
  it('contains at least 12 annotations', () => {
    expect(ALL_ANNOTATIONS.size).toBeGreaterThanOrEqual(12);
  });

  it('core-set annotation: SCHEDULING, Thread/Process Slot, Parallel Plan Slot', () => {
    const ann = ALL_ANNOTATIONS.get('core-set');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('SCHEDULING');
    expect(ann.agcDescription).toMatch(/core set/i);
    expect(ann.modernEquivalent.concept).toMatch(/thread|process/i);
    expect(ann.gsdMapping.concept).toMatch(/plan/i);
  });

  it('executive annotation: SCHEDULING, OS Process Scheduler, GSD Orchestrator', () => {
    const ann = ALL_ANNOTATIONS.get('executive');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('SCHEDULING');
    expect(ann.agcDescription).toMatch(/scheduler|priority/i);
    expect(ann.modernEquivalent.concept).toMatch(/scheduler/i);
    expect(ann.gsdMapping.concept).toMatch(/orchestrator/i);
  });

  it('waitlist annotation: TIMING, Timer Queue, Event Queue', () => {
    const ann = ALL_ANNOTATIONS.get('waitlist');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('TIMING');
    expect(ann.agcDescription).toMatch(/timer|waitlist/i);
    expect(ann.modernEquivalent.concept).toMatch(/timer/i);
    expect(ann.gsdMapping.concept).toMatch(/event|deferred|queue/i);
  });

  it('bailout annotation: FAILSAFE, Watchdog/OOM Killer, Session Recovery', () => {
    const ann = ALL_ANNOTATIONS.get('bailout');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('FAILSAFE');
    expect(ann.agcDescription).toMatch(/bailout|restart/i);
    expect(ann.modernEquivalent.concept).toMatch(/watchdog|oom/i);
    expect(ann.gsdMapping.concept).toMatch(/recovery|session/i);
  });

  it('priority-level annotation: SCHEDULING, Thread Priority, Wave Ordering', () => {
    const ann = ALL_ANNOTATIONS.get('priority-level');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('SCHEDULING');
    expect(ann.agcDescription).toMatch(/priority/i);
    expect(ann.modernEquivalent.concept).toMatch(/priority|nice/i);
    expect(ann.gsdMapping.concept).toMatch(/wave/i);
  });

  it('interrupt annotation: IO, Hardware Interrupt, Checkpoint/Gate', () => {
    const ann = ALL_ANNOTATIONS.get('interrupt');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('IO');
    expect(ann.agcDescription).toMatch(/interrupt/i);
    expect(ann.modernEquivalent.concept).toMatch(/interrupt|signal/i);
    expect(ann.gsdMapping.concept).toMatch(/checkpoint|gate/i);
  });

  it('job-state annotation: SCHEDULING, Process State, Plan Status', () => {
    const ann = ALL_ANNOTATIONS.get('job-state');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('SCHEDULING');
    expect(ann.agcDescription).toMatch(/free|dormant|runnable|running|sleeping/i);
    expect(ann.modernEquivalent.concept).toMatch(/process state/i);
    expect(ann.gsdMapping.concept).toMatch(/plan status/i);
  });

  it('restart-group annotation: FAILSAFE, Process Priority Class, Must-Have Truths', () => {
    const ann = ALL_ANNOTATIONS.get('restart-group');
    expect(ann).toBeDefined();
    if (!ann) return;

    expect(ann.category).toBe('FAILSAFE');
    expect(ann.agcDescription).toMatch(/critical|important|deferrable/i);
    expect(ann.modernEquivalent.concept).toMatch(/priority/i);
    expect(ann.gsdMapping.concept).toMatch(/must-have|truth/i);
  });

  it('has counter-timer, vac-area, context-switch, alarm-1202 annotations', () => {
    expect(ALL_ANNOTATIONS.has('counter-timer')).toBe(true);
    expect(ALL_ANNOTATIONS.has('vac-area')).toBe(true);
    expect(ALL_ANNOTATIONS.has('context-switch')).toBe(true);
    expect(ALL_ANNOTATIONS.has('alarm-1202')).toBe(true);
  });

  it('counter-timer is TIMING', () => {
    const ann = ALL_ANNOTATIONS.get('counter-timer');
    expect(ann).toBeDefined();
    if (!ann) return;
    expect(ann.category).toBe('TIMING');
  });

  it('vac-area is MEMORY', () => {
    const ann = ALL_ANNOTATIONS.get('vac-area');
    expect(ann).toBeDefined();
    if (!ann) return;
    expect(ann.category).toBe('MEMORY');
  });

  it('context-switch is SCHEDULING', () => {
    const ann = ALL_ANNOTATIONS.get('context-switch');
    expect(ann).toBeDefined();
    if (!ann) return;
    expect(ann.category).toBe('SCHEDULING');
  });

  it('alarm-1202 is FAILSAFE', () => {
    const ann = ALL_ANNOTATIONS.get('alarm-1202');
    expect(ann).toBeDefined();
    if (!ann) return;
    expect(ann.category).toBe('FAILSAFE');
  });
});

// ─── Learn Mode State and Toggle ──────────────────────────────────────────

describe('learn mode state and toggle', () => {
  it('createLearnModeState returns enabled=false', () => {
    const state = createLearnModeState();
    expect(state.enabled).toBe(false);
  });

  it('toggleLearnMode flips enabled', () => {
    const s0 = createLearnModeState();
    const s1 = toggleLearnMode(s0);
    expect(s1.enabled).toBe(true);

    const s2 = toggleLearnMode(s1);
    expect(s2.enabled).toBe(false);
  });

  it('when disabled, getAnnotationsForSnapshot returns empty array', () => {
    const disabled = createLearnModeState();
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const annotations = getAnnotationsForSnapshot(disabled, snap);
    expect(annotations).toHaveLength(0);
  });
});

// ─── Snapshot Annotation ──────────────────────────────────────────────────

describe('snapshot annotation', () => {
  const enabled: LearnModeState = { enabled: true };

  it('initial state: includes executive and core-set', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const annotations = getAnnotationsForSnapshot(enabled, snap);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('executive');
    expect(ids).toContain('core-set');
  });

  it('with waitlist entries: includes waitlist annotation', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    let wl = createWaitlistState();
    const rs = createRestartState();

    const addResult = addWaitlistEntry(wl, 100, 0o5000);
    if ('alarm' in addResult) throw new Error('unexpected alarm');
    wl = addResult.state;

    const snap = captureSnapshot(agc, exec, wl, rs);
    const annotations = getAnnotationsForSnapshot(enabled, snap);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('waitlist');
  });

  it('after BAILOUT: includes bailout, restart-group, alarm-1202', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    let rs = createRestartState();

    // Create and register 2 jobs
    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected');
    exec = r1.state;
    rs = registerRestartPoint(rs, r1.coreSetId, RestartGroup.CRITICAL, 0o4100);

    const r2 = novac(exec, 5, 0o4500);
    if ('alarm' in r2) throw new Error('unexpected');
    exec = r2.state;
    rs = registerRestartPoint(rs, r2.coreSetId, RestartGroup.DEFERRABLE, 0o4500);

    // BAILOUT
    const bailoutResult = bailout(rs, exec, wl, 1202);
    exec = bailoutResult.execState;
    rs = bailoutResult.restartState;

    const snap = captureSnapshot(agc, exec, bailoutResult.waitlistState, rs);
    const annotations = getAnnotationsForSnapshot(enabled, snap);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('bailout');
    expect(ids).toContain('restart-group');
    expect(ids).toContain('alarm-1202');
  });

  it('with high-priority jobs: includes priority-level', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected');
    exec = r1.state;
    exec = makeRunnable(exec, r1.coreSetId);
    const sched = scheduleNext(exec);
    exec = sched.state;

    const snap = captureSnapshot(agc, exec, wl, rs);
    const annotations = getAnnotationsForSnapshot(enabled, snap);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('priority-level');
  });

  it('with sleeping jobs: includes job-state', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const r1 = novac(exec, 3, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected');
    exec = r1.state;
    exec = jobSleep(exec, r1.coreSetId);

    const snap = captureSnapshot(agc, exec, wl, rs);
    const annotations = getAnnotationsForSnapshot(enabled, snap);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('job-state');
  });
});

// ─── Scenario Event Annotation ────────────────────────────────────────────

describe('scenario event annotation', () => {
  const enabled: LearnModeState = { enabled: true };

  it('JOB_CREATED: returns core-set, executive, priority-level', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const created = scenario.events.find(e => e.type === 'JOB_CREATED');
    expect(created).toBeDefined();
    if (!created) return;

    const annotations = annotateScenarioEvent(enabled, created);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('core-set');
    expect(ids).toContain('executive');
    expect(ids).toContain('priority-level');
  });

  it('OVERLOAD_DETECTED: returns alarm-1202, core-set', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const overload = scenario.events.find(e => e.type === 'OVERLOAD_DETECTED');
    expect(overload).toBeDefined();
    if (!overload) return;

    const annotations = annotateScenarioEvent(enabled, overload);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('alarm-1202');
    expect(ids).toContain('core-set');
  });

  it('BAILOUT_TRIGGERED: returns bailout, restart-group', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const bailoutEvent = scenario.events.find(e => e.type === 'BAILOUT_TRIGGERED');
    expect(bailoutEvent).toBeDefined();
    if (!bailoutEvent) return;

    const annotations = annotateScenarioEvent(enabled, bailoutEvent);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('bailout');
    expect(ids).toContain('restart-group');
  });

  it('JOB_PRESERVED: returns restart-group, priority-level', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const preserved = scenario.events.find(e => e.type === 'JOB_PRESERVED');
    expect(preserved).toBeDefined();
    if (!preserved) return;

    const annotations = annotateScenarioEvent(enabled, preserved);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('restart-group');
    expect(ids).toContain('priority-level');
  });

  it('JOB_DISCARDED: returns bailout, restart-group', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const discarded = scenario.events.find(e => e.type === 'JOB_DISCARDED');
    expect(discarded).toBeDefined();
    if (!discarded) return;

    const annotations = annotateScenarioEvent(enabled, discarded);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('bailout');
    expect(ids).toContain('restart-group');
  });

  it('RECOVERY_COMPLETE: returns executive, bailout', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const recovery = scenario.events.find(e => e.type === 'RECOVERY_COMPLETE');
    expect(recovery).toBeDefined();
    if (!recovery) return;

    const annotations = annotateScenarioEvent(enabled, recovery);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('executive');
    expect(ids).toContain('bailout');
  });

  it('PREEMPTION: returns priority-level, executive', () => {
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const preemption = scenario.events.find(e => e.type === 'PREEMPTION');
    expect(preemption).toBeDefined();
    if (!preemption) return;

    const annotations = annotateScenarioEvent(enabled, preemption);
    const ids = annotations.map(a => a.id);

    expect(ids).toContain('priority-level');
    expect(ids).toContain('executive');
  });

  it('when disabled, annotateScenarioEvent returns empty array', () => {
    const disabled = createLearnModeState();
    const config = createApollo11Scenario();
    const scenario = runFullScenario(config);

    const firstEvent = scenario.events[0];
    const annotations = annotateScenarioEvent(disabled, firstEvent);
    expect(annotations).toHaveLength(0);
  });
});

// ─── Annotation Retrieval ─────────────────────────────────────────────────

describe('annotation retrieval', () => {
  it('getAnnotation returns annotation by ID', () => {
    const ann = getAnnotation('core-set');
    expect(ann).not.toBeNull();
    if (!ann) return;

    expect(ann.id).toBe('core-set');
    expect(ann.title).toBeDefined();
    expect(ann.agcDescription.length).toBeGreaterThan(0);
  });

  it('getAnnotation returns null for nonexistent ID', () => {
    const ann = getAnnotation('nonexistent');
    expect(ann).toBeNull();
  });
});
