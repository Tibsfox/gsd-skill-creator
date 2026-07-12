/**
 * Tests for CollegeObservationConnector -- the config-gated wiring from College
 * usage (explorations / translations) into the SessionObservation pipeline.
 */

import { describe, it, expect } from 'vitest';
import { ObservationBridge } from './observation-bridge.js';
import {
  CollegeObservationConnector,
  type BridgeSessionObservation,
} from './college-observation-connector.js';
import type { ExplorationResult } from '../college/types.js';

function makeBridge(): ObservationBridge {
  return new ObservationBridge({ sessionId: 'sess-1', activeSkills: ['college'] });
}

function fakeExploration(path: string, conceptId: string): ExplorationResult {
  return {
    path,
    concept: { id: conceptId },
    departmentId: 'culinary-arts',
  } as unknown as ExplorationResult;
}

describe('CollegeObservationConnector', () => {
  it('is disabled by default and does not drain the bridge', async () => {
    const bridge = makeBridge();
    const received: BridgeSessionObservation[] = [];
    const connector = new CollegeObservationConnector(bridge, (o) => {
      received.push(o);
    });

    bridge.onExploration(fakeExploration('culinary/maillard', 'maillard'));

    expect(connector.isEnabled()).toBe(false);
    expect(await connector.pump()).toBe(0);
    expect(received).toHaveLength(0);
    // Buffer preserved: enabling later must not lose the event.
    expect(bridge.flush()).toHaveLength(1);
  });

  it('forwards a converted SessionObservation when enabled', async () => {
    const bridge = makeBridge();
    const received: BridgeSessionObservation[] = [];
    const connector = new CollegeObservationConnector(
      bridge,
      (o) => {
        received.push(o);
      },
      { enabled: true },
    );

    bridge.onExploration(fakeExploration('culinary/maillard', 'maillard'));
    bridge.onTranslation({
      id: 'tr-1',
      concept: { id: 'exponential-decay' },
      panels: { primary: 'python' },
    });

    const forwarded = await connector.pump();

    expect(forwarded).toBe(2);
    expect(received).toHaveLength(1);
    const obs = received[0];
    expect(obs.sessionId).toBe('sess-1');
    expect(obs.metrics.toolCalls).toBe(2);
    expect(obs.topTools).toEqual(
      expect.arrayContaining(['college-explorer', 'rosetta-core']),
    );
    expect(obs.topFiles).toContain('culinary/maillard');
    expect(obs.activeSkills).toContain('college');
  });

  it('is a no-op on an empty buffer even when enabled', async () => {
    const bridge = makeBridge();
    const received: BridgeSessionObservation[] = [];
    const connector = new CollegeObservationConnector(bridge, (o) => received.push(o), {
      enabled: true,
    });

    expect(await connector.pump()).toBe(0);
    expect(received).toHaveLength(0);
  });

  it('honors setEnabled toggling at runtime', async () => {
    const bridge = makeBridge();
    let calls = 0;
    const connector = new CollegeObservationConnector(bridge, () => {
      calls += 1;
    });

    bridge.onSkillActivate('gsd-workflow', 'sess-1');
    expect(await connector.pump()).toBe(0);

    connector.setEnabled(true);
    expect(await connector.pump()).toBe(1);
    expect(calls).toBe(1);
  });
});
