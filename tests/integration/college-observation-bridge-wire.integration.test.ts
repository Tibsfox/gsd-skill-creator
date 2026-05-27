/**
 * T1.3 application-boundary wire — integration test (v1.49.829).
 *
 * v1.49.823 added the `SkillActivationObserver` duck-typed interface in
 * `src/dashboard/activity-tab-toggle.ts` and made `ObservationBridge` in
 * `.college/integration/observation-bridge.ts` structurally satisfy it. The
 * pieces existed but were never instantiated together — neither rootdir
 * (src/ or .college/) can import the other directly per their tsconfigs.
 *
 * This test is the application-boundary wire: it lives in `tests/integration/`
 * which has visibility into BOTH rootdirs. It instantiates a real
 * `ObservationBridge`, passes it to `translateSessionEvent` as the duck-typed
 * `SkillActivationObserver`, pumps real `SessionEvent`s through, and verifies
 * the cross-rootdir flow:
 *
 *   src/ SessionEvent → translateSessionEvent → .college/ ObservationBridge
 *      → bridge.flush() → bridge.toSessionObservation() → SessionObservationCompat
 *
 * Closes T1.3 GAP-2's "application-boundary wire" branch by proving the
 * duck-typed interface contract carries the runtime payload end-to-end.
 */

import { describe, expect, it } from 'vitest';
import {
  translateSessionEvent,
  type SessionEvent,
  type SkillActivationObserver,
} from '../../src/dashboard/activity-tab-toggle.js';
import { ObservationBridge } from '../../.college/integration/observation-bridge.js';

function makeEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
  return {
    type: 'skill-activate',
    entityId: 'session-1',
    entityName: 'gsd-debug',
    domain: 'workflow',
    timestamp: '2026-05-27T17:00:00Z',
    ...overrides,
  };
}

describe('T1.3 application-boundary wire — ObservationBridge ↔ translateSessionEvent', () => {
  it('ObservationBridge structurally satisfies SkillActivationObserver', () => {
    const bridge = new ObservationBridge({ sessionId: 'session-1' });
    // Compile-time check: assignable to the duck-typed interface.
    const observer: SkillActivationObserver = bridge;
    expect(typeof observer.onSkillActivate).toBe('function');
  });

  it('routes a skill-activate SessionEvent through translateSessionEvent into ObservationBridge', () => {
    const bridge = new ObservationBridge({ sessionId: 'session-1' });

    const feedEntry = translateSessionEvent(
      makeEvent({ entityId: 'session-1', entityName: 'gsd-debug' }),
      bridge,
    );

    // FeedEntry side: translation worked.
    expect(feedEntry.entityType).toBe('skill');
    expect(feedEntry.description).toContain('gsd-debug');

    // Bridge side: event was buffered.
    const buffered = bridge.flush();
    expect(buffered).toHaveLength(1);
    expect(buffered[0].type).toBe('skill-activation');
    expect(buffered[0].conceptId).toBe('gsd-debug');
    expect(buffered[0].sessionId).toBe('session-1');
  });

  it('does NOT route non-skill-activate events into the bridge', () => {
    const bridge = new ObservationBridge({ sessionId: 'session-1' });

    translateSessionEvent(makeEvent({ type: 'agent-start' }), bridge);
    translateSessionEvent(makeEvent({ type: 'plan-complete' }), bridge);
    translateSessionEvent(makeEvent({ type: 'skill-deactivate' }), bridge);

    expect(bridge.flush()).toHaveLength(0);
  });

  it('produces a SessionObservation from buffered skill-activation events', () => {
    const bridge = new ObservationBridge({ sessionId: 'session-99', activeSkills: ['gsd', 'college'] });

    translateSessionEvent(
      makeEvent({ entityId: 'session-99', entityName: 'skill-alpha' }),
      bridge,
    );
    translateSessionEvent(
      makeEvent({ entityId: 'session-99', entityName: 'skill-beta' }),
      bridge,
    );

    const events = bridge.flush();
    const observation = bridge.toSessionObservation(events);

    expect(observation.sessionId).toBe('session-99');
    expect(observation.metrics.toolCalls).toBe(2);
    expect(observation.topTools).toContain('skill-activate');
    expect(observation.activeSkills).toEqual(['gsd', 'college']);
  });

  it('routes events through a listener registered on the bridge', () => {
    const bridge = new ObservationBridge({ sessionId: 'session-1' });
    const received: string[] = [];
    bridge.addListener((event) => {
      if (event.type === 'skill-activation') received.push(event.conceptId);
    });

    translateSessionEvent(
      makeEvent({ entityId: 'session-1', entityName: 'first-skill' }),
      bridge,
    );
    translateSessionEvent(
      makeEvent({ entityId: 'session-1', entityName: 'second-skill' }),
      bridge,
    );

    expect(received).toEqual(['first-skill', 'second-skill']);
  });
});
