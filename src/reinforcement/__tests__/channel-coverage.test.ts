/**
 * MA-6: integration coverage — every upstream module produces a canonical
 * event on the reinforcement log when exercised end-to-end.
 *
 * Uses an explicit per-test log path so the suite does not depend on the
 * VITEST suppression default.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import {
  readReinforcementEvents,
} from '../writer.js';
import {
  recordExplicitCorrection,
  recordOutcomeObserved,
  recordBranchResolved,
  recordSurpriseTriggered,
  recordQuintessenceUpdated,
} from '../channel-sources.js';
import { REINFORCEMENT_CHANNELS } from '../../types/reinforcement.js';
import { appendTeachEntry } from '../../symbiosis/teaching.js';
import { computeQuintessenceSnapshot, MockCommunitySource, MockTensionSource, MockEnergySource, MockStabilitySource, MockFatefulSource } from '../../symbiosis/quintessence.js';
import { SurpriseChannel } from '../../umwelt/prediction.js';
import { fork } from '../../branches/fork.js';
import { commit } from '../../branches/commit.js';
import { abort } from '../../branches/abort.js';

function tempPath(prefix: string): string {
  return join(tmpdir(), `reinf-cov-${prefix}-${randomUUID()}.jsonl`);
}

describe('channel coverage: all 5 channels land in the log', () => {
  it('records one of each via direct channel sources (strict logPath)', async () => {
    const logPath = tempPath('direct');

    await recordExplicitCorrection(
      { actor: 'teach', metadata: { teachEntryId: 't1' } },
      { logPath },
    );
    await recordOutcomeObserved(
      { actor: 'ci', metadata: { outcomeKind: 'test-pass' }, magnitude: 0.7 },
      { logPath },
    );
    await recordBranchResolved(
      { actor: 'branches', metadata: { branchId: 'b1', resolution: 'committed' } },
      { logPath },
    );
    await recordSurpriseTriggered(
      { actor: 'umwelt', metadata: { sigma: 4, klDivergence: 1.5, threshold: 3 } },
      { logPath },
    );
    await recordQuintessenceUpdated(
      {
        actor: 'symbiosis',
        metadata: {
          axes: {
            selfVsNonSelf: 0.5,
            essentialTensions: 0.2,
            growthAndEnergyFlow: 1000,
            stabilityVsNovelty: 0.75,
            fatefulEncounters: 2,
          },
        },
      },
      { logPath },
    );

    const events = await readReinforcementEvents(logPath);
    const channels = new Set(events.map((e) => e.channel));
    expect(channels).toEqual(new Set(REINFORCEMENT_CHANNELS));
  });
});

describe('upstream module wiring: teaching → explicit_correction', () => {
  it('appendTeachEntry emits one explicit_correction per successful append', async () => {
    const ledgerPath = join(tmpdir(), `teach-${randomUUID()}.jsonl`);
    const reinforcementLogPath = tempPath('teach');

    const r1 = appendTeachEntry('correction', 'test correction content', [], {
      ledgerPath,
      reinforcementLogPath,
    });
    const r2 = appendTeachEntry('pattern', 'observed pattern', [], {
      ledgerPath,
      reinforcementLogPath,
    });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);

    // Fire-and-forget emits — give them a microtask to drain.
    await new Promise((res) => setTimeout(res, 100));

    const events = await readReinforcementEvents(reinforcementLogPath);
    expect(events.length).toBeGreaterThanOrEqual(2);
    for (const e of events) {
      expect(e.channel).toBe('explicit_correction');
      expect(e.value.direction).toBe('negative');
    }
  });
});

describe('upstream module wiring: branches → branch_resolved (commit)', () => {
  it('commit() emits a committed branch_resolved event', async () => {
    const branchesDir = join(tmpdir(), `branches-${randomUUID()}`);
    const trunkPath = join(tmpdir(), `trunk-${randomUUID()}.md`);
    await fs.mkdir(branchesDir, { recursive: true });
    // Keep proposed diff well within the 20% refinement bound
    // (two identical bodies carry the bound trivially).
    const parentBody = '# Trunk skill\n\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nBBBBBBBBBB CCCCCCCCCC DDDDDDDDDD EEEEEEEEEE FFFFFFFFFF\n';
    const proposedBody = parentBody.replace('AAAAA', 'AAAAB');
    const forkResult = await fork({
      parentBody,
      proposedBody,
      skillName: 'test-skill',
      branchesDir,
    });
    const branchId = forkResult.manifest.id;

    const reinforcementLogPath = tempPath('branch-commit');
    const result = await commit({
      branchId,
      branchesDir,
      trunkPath,
      reinforcementLogPath,
    });
    expect(result.outcome).toBe('committed');

    const events = await readReinforcementEvents(reinforcementLogPath);
    expect(events).toHaveLength(1);
    expect(events[0].channel).toBe('branch_resolved');
    if (events[0].channel === 'branch_resolved') {
      expect(events[0].metadata.resolution).toBe('committed');
      expect(events[0].metadata.branchId).toBe(branchId);
    }
  });
});

describe('upstream module wiring: branches → branch_resolved (abort)', () => {
  it('abort() emits an aborted branch_resolved event', async () => {
    const branchesDir = join(tmpdir(), `branches-abort-${randomUUID()}`);
    await fs.mkdir(branchesDir, { recursive: true });
    const parentBody = '# Trunk\n\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nBBBBBBBBBB CCCCCCCCCC DDDDDDDDDD EEEEEEEEEE FFFFFFFFFF\n';
    const proposedBody = parentBody.replace('AAAAA', 'AAAAX');
    const forkResult = await fork({
      parentBody,
      proposedBody,
      skillName: 'test-skill',
      branchesDir,
    });
    const reinforcementLogPath = tempPath('branch-abort');
    const result = await abort({
      branchId: forkResult.manifest.id,
      branchesDir,
      reinforcementLogPath,
    });
    expect(result.finalState).toBe('aborted');

    const events = await readReinforcementEvents(reinforcementLogPath);
    expect(events).toHaveLength(1);
    expect(events[0].channel).toBe('branch_resolved');
    if (events[0].channel === 'branch_resolved') {
      expect(events[0].metadata.resolution).toBe('aborted');
    }
  });
});

describe('upstream module wiring: umwelt → surprise_triggered', () => {
  it('SurpriseChannel.record emits when sigma exceeds threshold', async () => {
    const reinforcementLogPath = tempPath('surprise');
    const ch = new SurpriseChannel({
      sigmaThreshold: 3,
      windowSize: 10,
      reinforcementLogPath,
    });

    // Seed the window with low-KL values so subsequent high KL triggers.
    for (let i = 0; i < 10; i++) ch.record(0.1, 1000 + i);
    const entry = ch.record(10, 2000);
    expect(entry.triggered).toBe(true);

    await new Promise((res) => setTimeout(res, 100));
    const events = await readReinforcementEvents(reinforcementLogPath);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].channel).toBe('surprise_triggered');
  });
});

describe('upstream module wiring: quintessence → quintessence_updated', () => {
  it('computeQuintessenceSnapshot emits exactly one event per call', async () => {
    const reinforcementLogPath = tempPath('quint');
    const sources = {
      community: new MockCommunitySource(),
      tension: new MockTensionSource(),
      energy: new MockEnergySource(),
      stability: new MockStabilitySource(),
      fateful: new MockFatefulSource(),
    };
    computeQuintessenceSnapshot(sources, { reinforcementLogPath });
    computeQuintessenceSnapshot(sources, { reinforcementLogPath });

    await new Promise((res) => setTimeout(res, 100));
    const events = await readReinforcementEvents(reinforcementLogPath);
    expect(events).toHaveLength(2);
    for (const e of events) {
      expect(e.channel).toBe('quintessence_updated');
      expect(e.value.direction).toBe('positive');
    }
  });
});
