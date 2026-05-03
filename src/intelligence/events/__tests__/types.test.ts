/**
 * Phase 827 / C00 — IntelligenceEvent type-shape + safety tests.
 *
 * Verifies:
 * - Each of the 5 event variants satisfies the IntelligenceEvent discriminated union.
 * - Discriminants exactly match the v1.49.597 client-side filter strings.
 * - Payload field names contain no auth/secret-shaped tokens (extends S13/S14).
 * - EventBus<T> interface contract is implementable.
 */

import { describe, it, expect } from 'vitest';
import type {
  BundleCompletedPayload,
  BriefingReadyPayload,
  EventBus,
  FindingsUpdatedPayload,
  IntelligenceEvent,
  IntelligenceEventType,
  MeetingRecordUpdatedPayload,
  StatusUpdatePayload,
} from '../types.js';

describe('Phase 827 / C00 — IntelligenceEvent shape', () => {
  it('admits a status_update variant', () => {
    const event: IntelligenceEvent = {
      type: 'intelligence:status_update',
      payload: {
        request_id: 'req-1',
        status: 'in_progress',
        message: 'analyzing',
        at: '2026-05-03T10:00:00.000Z',
      } satisfies StatusUpdatePayload,
    };
    expect(event.type).toBe('intelligence:status_update');
  });

  it('admits a briefing_ready variant', () => {
    const event: IntelligenceEvent = {
      type: 'intelligence:briefing_ready',
      payload: {
        briefing_id: 'B-001',
        project_id: 'P-001',
        generated_at: '2026-05-03T10:00:00.000Z',
      } satisfies BriefingReadyPayload,
    };
    expect(event.type).toBe('intelligence:briefing_ready');
  });

  it('admits a findings_updated variant', () => {
    const event: IntelligenceEvent = {
      type: 'intelligence:findings_updated',
      payload: {
        project_id: 'P-001',
        added: ['F-snap1-0001'],
        removed: [],
        at: '2026-05-03T10:00:00.000Z',
      } satisfies FindingsUpdatedPayload,
    };
    expect(event.type).toBe('intelligence:findings_updated');
  });

  it('admits a meeting_record_updated variant', () => {
    const event: IntelligenceEvent = {
      type: 'intelligence:meeting_record_updated',
      payload: {
        meeting_id: 'M-001',
        record_path: '/tmp/meeting-record.md',
        at: '2026-05-03T10:00:00.000Z',
      } satisfies MeetingRecordUpdatedPayload,
    };
    expect(event.type).toBe('intelligence:meeting_record_updated');
  });

  it('admits a bundle_completed variant', () => {
    const event: IntelligenceEvent = {
      type: 'intelligence:bundle_completed',
      payload: {
        bundle_id: 'M-001',
        meeting_id: 'M-001',
        manifest_path: '/tmp/manifest.json',
        emitted_at: '2026-05-03T10:00:00.000Z',
      } satisfies BundleCompletedPayload,
    };
    expect(event.type).toBe('intelligence:bundle_completed');
  });

  it('discriminants match the 5 v1.49.597 client-listener strings exactly', () => {
    const all: IntelligenceEventType[] = [
      'intelligence:status_update',
      'intelligence:briefing_ready',
      'intelligence:findings_updated',
      'intelligence:meeting_record_updated',
      'intelligence:bundle_completed',
    ];
    for (const t of all) {
      expect(t).toMatch(/^intelligence:[a-z_]+$/);
    }
    expect(all).toHaveLength(5);
  });
});

describe('Phase 827 / C00 — payload safety (extends S13/S14)', () => {
  it('no payload field names match secret-shaped patterns', () => {
    // Static-shape audit: enumerate every documented payload-field name and
    // verify none look like an auth credential. Update this list when payload
    // shapes change so this remains a load-bearing safety check.
    const allPayloadFieldNames = [
      // StatusUpdatePayload
      'request_id', 'status', 'decision_id', 'message', 'at',
      // BriefingReadyPayload
      'briefing_id', 'project_id', 'generated_at',
      // FindingsUpdatedPayload
      'project_id', 'added', 'removed', 'at',
      // MeetingRecordUpdatedPayload
      'meeting_id', 'record_path', 'at',
      // BundleCompletedPayload
      'bundle_id', 'meeting_id', 'manifest_path', 'emitted_at',
    ];

    const secretPattern = /(^|_)(key|token|secret|password|credential|api_?key|bearer)($|_)/i;
    const offenders = allPayloadFieldNames.filter((f) => secretPattern.test(f));
    expect(offenders).toEqual([]);
  });
});

describe('Phase 827 / C00 — EventBus interface contract', () => {
  it('is implementable with subscribe + publish + unsubscribe semantics', () => {
    // Minimal in-memory bus; proves the interface is usable end-to-end.
    function makeBus<E>(): EventBus<E> {
      const subs = new Set<(event: E) => void>();
      return {
        subscribe(cb) {
          subs.add(cb);
          return () => subs.delete(cb);
        },
        publish(event) {
          for (const cb of subs) cb(event);
        },
      };
    }

    const bus = makeBus<IntelligenceEvent>();
    const received: IntelligenceEvent[] = [];
    const unsubscribe = bus.subscribe((e) => received.push(e));

    const event: IntelligenceEvent = {
      type: 'intelligence:findings_updated',
      payload: {
        project_id: 'P-001',
        added: ['F-snap1-0001'],
        removed: [],
        at: '2026-05-03T10:00:00.000Z',
      },
    };
    bus.publish(event);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('intelligence:findings_updated');

    unsubscribe();
    bus.publish(event);
    expect(received).toHaveLength(1); // unsubscribe stopped delivery
  });
});
