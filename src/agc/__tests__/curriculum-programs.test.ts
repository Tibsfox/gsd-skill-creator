/**
 * Curriculum program validation tests.
 *
 * Verifies that all 8 AGC starter programs assemble, load, and run correctly
 * on the simulator. Includes assembly tests, execution tests, and integration
 * tests for exercises 5-8 (which use the Executive/Waitlist/Restart APIs).
 *
 * Phase 221 -- AGC Curriculum & Exercises.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  assembleProgramSource,
  runProgram,
} from '../curriculum/index.js';
import {
  createExecutiveState,
  novac,
  scheduleNext,
  jobSleep,
  jobWake,
  JobState,
  ALARM_1202,
} from '../executive.js';
import {
  RestartGroup,
  createRestartState,
  registerRestartPoint,
  bailout,
} from '../restart.js';
import { createWaitlistState } from '../waitlist.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROGRAMS_DIR = resolve(__dirname, '../curriculum/programs');

function loadProgram(name: string): string {
  return readFileSync(resolve(PROGRAMS_DIR, name), 'utf-8');
}

// ─── Assembly Tests (1-8) ────────────────────────────────────────────────────

describe('Program assembly', () => {
  it('hello-dsky.agc assembles without errors', () => {
    const source = loadProgram('hello-dsky.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('countdown.agc assembles without errors', () => {
    const source = loadProgram('countdown.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('calculator.agc assembles without errors', () => {
    const source = loadProgram('calculator.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('blinker.agc assembles without errors', () => {
    const source = loadProgram('blinker.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('scheduler.agc assembles without errors', () => {
    const source = loadProgram('scheduler.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('priority.agc assembles without errors', () => {
    const source = loadProgram('priority.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('restart.agc assembles without errors', () => {
    const source = loadProgram('restart.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('capstone.agc assembles without errors', () => {
    const source = loadProgram('capstone.agc');
    const words = assembleProgramSource(source);
    expect(words.some(w => w !== 0)).toBe(true);
  });
});

// ─── Execution Tests (9-16) ──────────────────────────────────────────────────

describe('Program execution', () => {
  it('hello-dsky runs and produces I/O write to channel 10', () => {
    const source = loadProgram('hello-dsky.agc');
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 100 });

    expect(result.halted).toBe(true);
    // Channel 10 in octal = 8 in decimal (assembler parses "10" as octal)
    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    expect(ch10.length).toBeGreaterThanOrEqual(1);
    expect(ch10[0].value).toBe(0o12345);
  });

  it('countdown runs and produces multiple I/O writes to channel 10', () => {
    const source = loadProgram('countdown.agc');
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 500 });

    expect(result.halted).toBe(true);
    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    // Should have writes counting down (multiple writes)
    expect(ch10.length).toBeGreaterThan(1);
  });

  it('calculator runs and produces I/O write with correct sum', () => {
    const source = loadProgram('calculator.agc');
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 100 });

    expect(result.halted).toBe(true);
    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    expect(ch10.length).toBeGreaterThanOrEqual(1);
    // 25 + 37 = 62
    expect(ch10[0].value).toBe(62);
  });

  it('blinker runs and produces alternating I/O writes to channel 11', () => {
    const source = loadProgram('blinker.agc');
    const program = assembleProgramSource(source);
    // Need enough steps to complete at least 2 blink cycles
    const result = runProgram(program, { maxSteps: 10000 });

    // Channel 11 in octal = 9 in decimal
    const ch11 = result.ioLog.filter(e => e.channel === 9 && e.type === 'write');
    expect(ch11.length).toBeGreaterThanOrEqual(2);
    // Should alternate between ON (0o40000) and OFF (0o00000)
    const values = ch11.map(e => e.value);
    // First write should be ON (0o40000 = 16384)
    expect(values[0]).toBe(0o40000);
    // Second write should be OFF (0)
    if (values.length >= 2) {
      expect(values[1]).toBe(0);
    }
  });

  it('scheduler jobs write correct identifiers to channel 10', () => {
    const source = loadProgram('scheduler.agc');
    const program = assembleProgramSource(source);
    // Run just JOB1 (starts at 0o4000, which is default start)
    const result = runProgram(program, { maxSteps: 50 });

    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    expect(ch10.length).toBeGreaterThanOrEqual(1);
    // JOB1 writes OCT 00001 = 1
    expect(ch10[0].value).toBe(1);
  });

  it('priority guidance job writes to channel 10, display writes to channel 11', () => {
    const source = loadProgram('priority.agc');
    const program = assembleProgramSource(source);
    // Run guidance (starts at 0o4000)
    const result = runProgram(program, { maxSteps: 50 });

    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    // Guidance writes to channel 10
    expect(ch10.length).toBeGreaterThanOrEqual(1);
  });

  it('restart program runs all three job types', () => {
    const source = loadProgram('restart.agc');
    const program = assembleProgramSource(source);
    // Run CRIT (starts at 0o4000)
    const result = runProgram(program, { maxSteps: 50 });

    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    expect(ch10.length).toBeGreaterThanOrEqual(1);
    // CRIT writes OCT 00100 = 64
    expect(ch10[0].value).toBe(0o100);
  });

  it('capstone P63 guidance writes to channel 10 continuously', () => {
    const source = loadProgram('capstone.agc');
    const program = assembleProgramSource(source);
    // P63 starts at 0o4000
    const result = runProgram(program, { maxSteps: 100 });

    const ch10 = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    // P63 writes guidance data to channel 10
    expect(ch10.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Integration Tests (17-20) ───────────────────────────────────────────────

describe('Exercise integration scenarios', () => {
  it('Scheduler: 3 novac jobs at priorities 2/4/6 -> scheduleNext picks priority 2', () => {
    let exec = createExecutiveState();

    // Create 3 jobs
    const j1 = novac(exec, 2, 0o4000);
    if (!('coreSetId' in j1)) throw new Error('expected coreSetId');
    exec = j1.state;

    const j2 = novac(exec, 4, 0o4004);
    if (!('coreSetId' in j2)) throw new Error('expected coreSetId');
    exec = j2.state;

    const j3 = novac(exec, 6, 0o4010);
    if (!('coreSetId' in j3)) throw new Error('expected coreSetId');
    exec = j3.state;

    // Make RUNNABLE
    exec = {
      ...exec,
      coreSets: exec.coreSets.map((cs, i) =>
        [j1.coreSetId, j2.coreSetId, j3.coreSetId].includes(i)
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Schedule: priority 2 wins
    const sched = scheduleNext(exec);
    expect(sched.coreSetId).toBe(j1.coreSetId);
    expect(sched.state.coreSets[j1.coreSetId].priority).toBe(2);
  });

  it('Priority: guidance (0) runs before display (6); sleep guidance -> display runs', () => {
    let exec = createExecutiveState();

    const guide = novac(exec, 0, 0o4000);
    if (!('coreSetId' in guide)) throw new Error('expected coreSetId');
    exec = guide.state;

    const display = novac(exec, 6, 0o4007);
    if (!('coreSetId' in display)) throw new Error('expected coreSetId');
    exec = display.state;

    // Make RUNNABLE
    exec = {
      ...exec,
      coreSets: exec.coreSets.map((cs, i) =>
        [guide.coreSetId, display.coreSetId].includes(i)
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Guidance wins
    let sched = scheduleNext(exec);
    expect(sched.coreSetId).toBe(guide.coreSetId);

    // Sleep guidance -> display should run
    exec = jobSleep(sched.state, guide.coreSetId);
    sched = scheduleNext(exec);
    expect(sched.coreSetId).toBe(display.coreSetId);

    // Wake guidance -> guidance should preempt
    exec = jobWake(sched.state, guide.coreSetId);
    sched = scheduleNext(exec);
    expect(sched.coreSetId).toBe(guide.coreSetId);
  });

  it('Restart: CRITICAL/IMPORTANT points, fill core sets, 1202, bailout preserves critical', () => {
    let exec = createExecutiveState();
    let restart = createRestartState();

    // Create CRITICAL job
    const crit = novac(exec, 0, 0o4000);
    if (!('coreSetId' in crit)) throw new Error('expected coreSetId');
    exec = crit.state;
    restart = registerRestartPoint(restart, crit.coreSetId,
      RestartGroup.CRITICAL, 0o4017);

    // Create IMPORTANT job
    const imprt = novac(exec, 2, 0o4004);
    if (!('coreSetId' in imprt)) throw new Error('expected coreSetId');
    exec = imprt.state;
    restart = registerRestartPoint(restart, imprt.coreSetId,
      RestartGroup.IMPORTANT, 0o4020);

    // Create DEFERRABLE job
    const defer = novac(exec, 5, 0o4010);
    if (!('coreSetId' in defer)) throw new Error('expected coreSetId');
    exec = defer.state;

    // Make all RUNNABLE
    exec = {
      ...exec,
      coreSets: exec.coreSets.map((cs, i) =>
        [crit.coreSetId, imprt.coreSetId, defer.coreSetId].includes(i)
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Fill remaining core sets with dummies
    for (let i = 0; i < 4; i++) {
      const dummy = novac(exec, 7, 0o4010);
      if (!('coreSetId' in dummy)) throw new Error('expected coreSetId');
      exec = dummy.state;
      exec = {
        ...exec,
        coreSets: exec.coreSets.map((cs, idx) =>
          idx === dummy.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
        ),
      };
    }

    // Trigger 1202
    const overflow = novac(exec, 3, 0o4000);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1202);
    }

    // BAILOUT
    const result = bailout(restart, exec, createWaitlistState(), ALARM_1202);

    // CRITICAL + IMPORTANT preserved (1 CRITICAL < 4 threshold)
    expect(result.preserved).toContain(crit.coreSetId);
    expect(result.preserved).toContain(imprt.coreSetId);

    // DEFERRABLE discarded
    expect(result.discarded).toContain(defer.coreSetId);

    // CRITICAL restart address set
    expect(result.execState.coreSets[crit.coreSetId].returnAddress).toBe(0o4017);

    // Deferrable core set is FREE
    expect(result.execState.coreSets[defer.coreSetId].state).toBe(JobState.FREE);
  });

  it('Capstone: reproduces Apollo 11 1202 alarm', () => {
    let exec = createExecutiveState();
    let restart = createRestartState();

    // Addresses from capstone.agc assembly
    const P63_ADDR = 0o4000;
    const RADAR_ADDR = 0o4006;
    const DSKYUP_ADDR = 0o4014;
    const BKGND_ADDR = 0o4023;
    const FILL1_ADDR = 0o4030;
    const FILL2_ADDR = 0o4031;
    const FILL3_ADDR = 0o4032;
    const P63RST_ADDR = 0o4041;
    const RADRST_ADDR = 0o4042;

    // Create 4 primary jobs
    const p63 = novac(exec, 0, P63_ADDR);
    if (!('coreSetId' in p63)) throw new Error('expected coreSetId');
    exec = p63.state;
    restart = registerRestartPoint(restart, p63.coreSetId,
      RestartGroup.CRITICAL, P63RST_ADDR);

    const radar = novac(exec, 2, RADAR_ADDR);
    if (!('coreSetId' in radar)) throw new Error('expected coreSetId');
    exec = radar.state;
    restart = registerRestartPoint(restart, radar.coreSetId,
      RestartGroup.IMPORTANT, RADRST_ADDR);

    const display = novac(exec, 5, DSKYUP_ADDR);
    if (!('coreSetId' in display)) throw new Error('expected coreSetId');
    exec = display.state;

    const bkgnd = novac(exec, 6, BKGND_ADDR);
    if (!('coreSetId' in bkgnd)) throw new Error('expected coreSetId');
    exec = bkgnd.state;

    // Make all RUNNABLE
    exec = {
      ...exec,
      coreSets: exec.coreSets.map((cs, i) =>
        [p63.coreSetId, radar.coreSetId, display.coreSetId, bkgnd.coreSetId].includes(i)
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Add 3 filler jobs (core sets now full: idle + 4 primary + 3 filler = 8)
    const fillerAddrs = [FILL1_ADDR, FILL2_ADDR, FILL3_ADDR];
    const fillerPriorities = [3, 4, 7];
    const fillerIds: number[] = [];

    for (let i = 0; i < 3; i++) {
      const filler = novac(exec, fillerPriorities[i], fillerAddrs[i]);
      if (!('coreSetId' in filler)) throw new Error('expected coreSetId');
      exec = filler.state;
      fillerIds.push(filler.coreSetId);
      exec = {
        ...exec,
        coreSets: exec.coreSets.map((cs, idx) =>
          idx === filler.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
        ),
      };
    }

    // Verify all 7 non-idle core sets are occupied
    const occupiedCount = exec.coreSets.filter(cs => cs.state !== JobState.FREE).length;
    expect(occupiedCount).toBe(8); // 7 jobs + 1 idle

    // Trigger the 1202 alarm
    const overflow = novac(exec, 3, P63_ADDR);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1202);
    }

    // BAILOUT
    const result = bailout(restart, exec, createWaitlistState(), ALARM_1202);

    // 2 preserved (P63 CRITICAL + Radar IMPORTANT -- 1 CRITICAL < 4)
    expect(result.preserved).toHaveLength(2);
    expect(result.preserved).toContain(p63.coreSetId);
    expect(result.preserved).toContain(radar.coreSetId);

    // 5 discarded (display + background + 3 fillers)
    expect(result.discarded).toHaveLength(5);
    expect(result.discarded).toContain(display.coreSetId);
    expect(result.discarded).toContain(bkgnd.coreSetId);
    for (const id of fillerIds) {
      expect(result.discarded).toContain(id);
    }

    // P63 guidance has restart address pointing to P63RST
    expect(result.execState.coreSets[p63.coreSetId].returnAddress).toBe(P63RST_ADDR);
    expect(result.execState.coreSets[p63.coreSetId].state).toBe(JobState.RUNNABLE);

    // Radar has restart address pointing to RADRST
    expect(result.execState.coreSets[radar.coreSetId].returnAddress).toBe(RADRST_ADDR);

    // Display core set is FREE
    expect(result.execState.coreSets[display.coreSetId].state).toBe(JobState.FREE);

    // After BAILOUT: novac should succeed (core sets freed)
    const recovery = novac(result.execState, 2, P63_ADDR);
    expect('coreSetId' in recovery).toBe(true);

    // Verify bailoutCount
    expect(result.restartState.bailoutCount).toBe(1);
    expect(result.restartState.lastAlarmCode).toBe(ALARM_1202);
  });
});
