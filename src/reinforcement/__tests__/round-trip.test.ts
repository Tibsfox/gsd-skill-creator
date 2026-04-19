/**
 * MA-6 / LS-27: 1000-session round-trip fidelity test.
 *
 * Synthesises 1000 events spanning all five channels, writes them to a
 * temporary JSONL log, reads them back, and asserts ≥99.9% lossless
 * reconstruction.  Every event attribute must survive JSON.stringify →
 * appendFile → readFile → JSON.parse with zero drift.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  writeReinforcementEvents,
  readReinforcementEvents,
} from '../writer.js';
import {
  emitExplicitCorrection,
  emitOutcomeObserved,
  emitBranchResolved,
  emitSurpriseTriggered,
  emitQuintessenceUpdated,
} from '../emitters.js';
import type { ReinforcementEvent } from '../../types/reinforcement.js';

function tempPath(): string {
  return join(tmpdir(), `reinforcement-roundtrip-${randomUUID()}.jsonl`);
}

function synthesize(n: number): ReinforcementEvent[] {
  const out: ReinforcementEvent[] = [];
  for (let i = 0; i < n; i++) {
    const pick = i % 5;
    switch (pick) {
      case 0:
        out.push(
          emitExplicitCorrection({
            actor: `teach:${i}`,
            metadata: { teachEntryId: `t-${i}`, category: 'correction' },
            id: `id-${i}`,
            ts: 1000 + i,
          }),
        );
        break;
      case 1: {
        const mag = (i % 7) - 3; // −3..3 → will clamp at writer
        out.push(
          emitOutcomeObserved({
            actor: `ci:${i}`,
            metadata: { outcomeKind: i % 2 === 0 ? 'test-pass' : 'test-fail', count: i },
            magnitude: Math.max(-1, Math.min(1, mag / 3)),
            id: `id-${i}`,
            ts: 1000 + i,
          }),
        );
        break;
      }
      case 2:
        out.push(
          emitBranchResolved({
            actor: `branches:${i}`,
            metadata: {
              branchId: `b-${i}`,
              resolution: i % 3 === 0 ? 'aborted' : 'committed',
              winnerBranchId: `w-${i}`,
            },
            id: `id-${i}`,
            ts: 1000 + i,
          }),
        );
        break;
      case 3:
        out.push(
          emitSurpriseTriggered({
            actor: `umwelt:${i}`,
            metadata: { sigma: 3 + (i % 5) * 0.1, klDivergence: 1 + i * 0.001, threshold: 3 },
            id: `id-${i}`,
            ts: 1000 + i,
          }),
        );
        break;
      case 4:
        out.push(
          emitQuintessenceUpdated({
            actor: `symbiosis:${i}`,
            metadata: {
              axes: {
                selfVsNonSelf: (i % 10) / 10,
                essentialTensions: (i % 7) / 7,
                growthAndEnergyFlow: 500 + i,
                stabilityVsNovelty: (i % 3) / 3,
                fatefulEncounters: i % 5,
              },
            },
            id: `id-${i}`,
            ts: 1000 + i,
          }),
        );
        break;
    }
  }
  return out;
}

describe('round-trip fidelity over 1000 synthesised events', () => {
  it('writes and recovers every event with ≥99.9% lossless rate', async () => {
    const logPath = tempPath();
    const events = synthesize(1000);
    await writeReinforcementEvents(events, logPath);

    const recovered = await readReinforcementEvents(logPath);
    expect(recovered.length).toBe(events.length);

    // Build an id → event map from recovered, then deep-compare field-by-field.
    const byId = new Map(recovered.map((e) => [e.id, e]));
    let matched = 0;
    for (const original of events) {
      const back = byId.get(original.id);
      if (!back) continue;
      if (
        back.ts === original.ts &&
        back.channel === original.channel &&
        back.actor === original.actor &&
        back.value.magnitude === original.value.magnitude &&
        back.value.direction === original.value.direction &&
        JSON.stringify(back.metadata) === JSON.stringify(original.metadata)
      ) {
        matched++;
      }
    }
    const rate = matched / events.length;
    expect(rate).toBeGreaterThanOrEqual(0.999);
  });

  it('exercises all five channels in the fixture', async () => {
    const logPath = tempPath();
    const events = synthesize(1000);
    await writeReinforcementEvents(events, logPath);
    const recovered = await readReinforcementEvents(logPath);

    const channels = new Set(recovered.map((e) => e.channel));
    expect(channels).toEqual(
      new Set([
        'explicit_correction',
        'outcome_observed',
        'branch_resolved',
        'surprise_triggered',
        'quintessence_updated',
      ]),
    );
  });
});
