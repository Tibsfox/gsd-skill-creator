import { describe, it, expect } from 'vitest';
import {
  wireCollegeObservations,
  type CollegeBridgeLike,
  type CollegeConnectorCtor,
  type CollegeConnectorLike,
  type CollegePatternSinkLike,
} from './college-observation-adapter.js';

/** A stand-in bridge that yields a fixed batch and a marker observation. */
function fakeBridge(events: unknown[], observation: Record<string, unknown>): CollegeBridgeLike {
  let buffer = [...events];
  return {
    flush() {
      const drained = buffer;
      buffer = [];
      return drained;
    },
    toSessionObservation(batch: unknown[]) {
      return { ...observation, count: batch.length };
    },
  };
}

/**
 * A faithful fake of the `.college/` CollegeObservationConnector: honors the
 * enabled gate, drains the bridge, converts, and forwards to the sink -- the
 * same contract the real connector implements. Constructed via the injected
 * `loadConnectorCtor` seam so no `.college/` module is imported.
 */
const fakeConnectorCtor: CollegeConnectorCtor = class implements CollegeConnectorLike {
  private enabled: boolean;
  constructor(
    private readonly bridge: CollegeBridgeLike,
    private readonly sink: (o: Record<string, unknown>) => void | Promise<void>,
    config: { enabled?: boolean },
  ) {
    this.enabled = config.enabled ?? false;
  }
  isEnabled() {
    return this.enabled;
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  async pump(): Promise<number> {
    if (!this.enabled) return 0;
    const events = this.bridge.flush();
    if (events.length === 0) return 0;
    await this.sink(this.bridge.toSessionObservation(events));
    return events.length;
  }
};

function recordingSink(): CollegePatternSinkLike & { calls: Array<[string, Record<string, unknown>]> } {
  const calls: Array<[string, Record<string, unknown>]> = [];
  return {
    calls,
    async append(category, data) {
      calls.push([category, data]);
    },
  };
}

describe('wireCollegeObservations', () => {
  it('is disabled by default: pump forwards nothing to the pattern sink', async () => {
    const bridge = fakeBridge([{ id: 'e1' }], { sessionId: 's1' });
    const sink = recordingSink();
    const connector = await wireCollegeObservations(bridge, sink, {}, {
      loadConnectorCtor: async () => fakeConnectorCtor,
    });

    expect(connector.isEnabled()).toBe(false);
    expect(await connector.pump()).toBe(0);
    expect(sink.calls).toHaveLength(0);
  });

  it('forwards a converted observation into the sessions collection when enabled', async () => {
    const bridge = fakeBridge([{ id: 'e1' }, { id: 'e2' }], { sessionId: 's1' });
    const sink = recordingSink();
    const connector = await wireCollegeObservations(bridge, sink, { enabled: true }, {
      loadConnectorCtor: async () => fakeConnectorCtor,
    });

    expect(await connector.pump()).toBe(2);
    expect(sink.calls).toHaveLength(1);
    const [category, observation] = sink.calls[0]!;
    expect(category).toBe('sessions');
    expect(observation).toMatchObject({ sessionId: 's1', count: 2 });
  });

  it('honors a custom pattern collection', async () => {
    const bridge = fakeBridge([{ id: 'e1' }], { sessionId: 's1' });
    const sink = recordingSink();
    const connector = await wireCollegeObservations(
      bridge,
      sink,
      { enabled: true, collection: 'events' },
      { loadConnectorCtor: async () => fakeConnectorCtor },
    );

    await connector.pump();
    expect(sink.calls[0]![0]).toBe('events');
  });

  it('respects a runtime setEnabled toggle', async () => {
    const bridge = fakeBridge([{ id: 'e1' }], { sessionId: 's1' });
    const sink = recordingSink();
    const connector = await wireCollegeObservations(bridge, sink, {}, {
      loadConnectorCtor: async () => fakeConnectorCtor,
    });

    expect(await connector.pump()).toBe(0);
    connector.setEnabled(true);
    expect(await connector.pump()).toBe(1);
    expect(sink.calls).toHaveLength(1);
  });
});
