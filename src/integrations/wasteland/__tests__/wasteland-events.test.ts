/**
 * Tests for wasteland-events — event bus integration for wasteland operations.
 *
 * Covers:
 * - emitScanComplete
 * - emitTrustEscalation
 * - emitStampIssued
 * - emitCompletionSubmitted
 * - Custom patternsDir and ttlHours options
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the core event lifecycle before importing
vi.mock('../../../core/events/event-lifecycle.js', () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  emitScanComplete,
  emitTrustEscalation,
  emitStampIssued,
  emitCompletionSubmitted,
} from '../wasteland-events.js';
import { emitEvent } from '../../../core/events/event-lifecycle.js';

const mockedEmitEvent = vi.mocked(emitEvent);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// emitScanComplete
// ============================================================================

describe('emitScanComplete', () => {
  it('emits wasteland:scan-complete event', async () => {
    await emitScanComplete({ rigCount: 5, source: 'dolthub' });

    expect(mockedEmitEvent).toHaveBeenCalledTimes(1);
    expect(mockedEmitEvent).toHaveBeenCalledWith(
      expect.stringContaining('.hop'),
      'wasteland:scan-complete',
      'wasteland-integration',
      { ttlHours: 48 },
    );
  });

  it('uses custom patternsDir', async () => {
    await emitScanComplete({}, { patternsDir: '/tmp/events' });

    expect(mockedEmitEvent).toHaveBeenCalledWith(
      '/tmp/events',
      'wasteland:scan-complete',
      'wasteland-integration',
      expect.any(Object),
    );
  });

  it('uses custom ttlHours', async () => {
    await emitScanComplete({}, { ttlHours: 24 });

    expect(mockedEmitEvent).toHaveBeenCalledWith(
      expect.any(String),
      'wasteland:scan-complete',
      'wasteland-integration',
      { ttlHours: 24 },
    );
  });
});

// ============================================================================
// emitTrustEscalation
// ============================================================================

describe('emitTrustEscalation', () => {
  it('emits wasteland:trust-escalation event', async () => {
    await emitTrustEscalation({ handle: 'fox', fromLevel: 1, toLevel: 2 });

    expect(mockedEmitEvent).toHaveBeenCalledWith(
      expect.any(String),
      'wasteland:trust-escalation',
      'wasteland-integration',
      { ttlHours: 48 },
    );
  });
});

// ============================================================================
// emitStampIssued
// ============================================================================

describe('emitStampIssued', () => {
  it('emits wasteland:stamp-issued event', async () => {
    await emitStampIssued({ stampId: 's-001', wantedId: 'w-001', handle: 'fox' });

    expect(mockedEmitEvent).toHaveBeenCalledWith(
      expect.any(String),
      'wasteland:stamp-issued',
      'wasteland-integration',
      { ttlHours: 48 },
    );
  });
});

// ============================================================================
// emitCompletionSubmitted
// ============================================================================

describe('emitCompletionSubmitted', () => {
  it('emits wasteland:completion-submitted event', async () => {
    await emitCompletionSubmitted({ completionId: 'c-001', wantedId: 'w-001', handle: 'fox' });

    expect(mockedEmitEvent).toHaveBeenCalledWith(
      expect.any(String),
      'wasteland:completion-submitted',
      'wasteland-integration',
      { ttlHours: 48 },
    );
  });

  it('defaults to 48h TTL', async () => {
    await emitCompletionSubmitted({ completionId: 'c-002', wantedId: 'w-002', handle: 'bar' });

    const callArgs = mockedEmitEvent.mock.calls[0];
    expect(callArgs[3]).toEqual({ ttlHours: 48 });
  });
});
