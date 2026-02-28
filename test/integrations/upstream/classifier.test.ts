import { describe, it, expect } from 'vitest';
import {
  classifyChange,
  detectChangeType,
  assignSeverity,
  assessPatchability,
} from '../../../src/upstream/classifier';
import type {
  RawChangeEvent,
  ChannelConfig,
  ChangeType,
  Severity,
} from '../../../src/upstream/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeRawEvent(overrides: Partial<RawChangeEvent> = {}): RawChangeEvent {
  return {
    id: 'evt-test-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T12:00:00Z',
    content_hash_before: 'hash-a',
    content_hash_after: 'hash-b',
    diff_summary: 'Content changed on anthropic-docs (documentation)',
    raw_content: '<html>updated page</html>',
    ...overrides,
  };
}

function makeChannelConfig(overrides: Partial<ChannelConfig> = {}): ChannelConfig {
  return {
    name: 'anthropic-docs',
    url: 'https://docs.anthropic.com',
    type: 'documentation',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['skills', 'agents'],
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  detectChangeType                                                   */
/* ------------------------------------------------------------------ */

describe('Change Classifier', () => {
  describe('detectChangeType', () => {
    it('classifies breaking change correctly', () => {
      const result = detectChangeType(
        'BREAKING CHANGE: removed deprecated endpoint',
        'The /v1/complete endpoint has been removed.',
      );
      expect(result.type).toBe('breaking');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('classifies deprecation correctly', () => {
      const result = detectChangeType(
        'Deprecated: claude-instant-1 model will be removed',
        'The claude-instant-1 model is now deprecated.',
      );
      expect(result.type).toBe('deprecation');
    });

    it('classifies enhancement correctly', () => {
      const result = detectChangeType(
        'Added support for tool_use in streaming mode',
        'New feature: tool_use now works with streaming responses.',
      );
      expect(result.type).toBe('enhancement');
    });

    it('classifies security change correctly', () => {
      const result = detectChangeType(
        'Security: patched authentication bypass vulnerability',
        'CVE-2026-1234: Authentication bypass in API gateway.',
      );
      expect(result.type).toBe('security');
    });

    it('classifies optimization correctly', () => {
      const result = detectChangeType(
        'Performance improvement: 30% faster token generation',
        'Optimized inference pipeline for faster throughput.',
      );
      expect(result.type).toBe('optimization');
    });

    it('classifies informational correctly', () => {
      const result = detectChangeType(
        'Updated documentation formatting',
        'Minor formatting changes to the API reference.',
      );
      expect(result.type).toBe('informational');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  assignSeverity                                                   */
  /* ---------------------------------------------------------------- */

  describe('assignSeverity', () => {
    it('assigns P0 for breaking changes', () => {
      expect(assignSeverity('breaking', makeChannelConfig())).toBe('P0');
    });

    it('assigns P0 for security changes', () => {
      expect(assignSeverity('security', makeChannelConfig())).toBe('P0');
    });

    it('assigns P1 for deprecation changes', () => {
      expect(assignSeverity('deprecation', makeChannelConfig())).toBe('P1');
    });

    it('assigns P2 for enhancement changes', () => {
      expect(assignSeverity('enhancement', makeChannelConfig())).toBe('P2');
    });

    it('assigns P3 for informational changes', () => {
      expect(assignSeverity('informational', makeChannelConfig())).toBe('P3');
    });

    it('security changes always escalate regardless of channel priority', () => {
      const lowPriorityChannel = makeChannelConfig({ priority: 'P3' });
      expect(assignSeverity('security', lowPriorityChannel)).toBe('P0');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  assessPatchability                                               */
  /* ---------------------------------------------------------------- */

  describe('assessPatchability', () => {
    it('breaking+P0 is not auto-patchable', () => {
      expect(assessPatchability('breaking', 'P0')).toBe(false);
    });

    it('security+P0 is not auto-patchable', () => {
      expect(assessPatchability('security', 'P0')).toBe(false);
    });

    it('enhancement+P2 is auto-patchable', () => {
      expect(assessPatchability('enhancement', 'P2')).toBe(true);
    });

    it('optimization+P2 is auto-patchable', () => {
      expect(assessPatchability('optimization', 'P2')).toBe(true);
    });

    it('informational+P3 is auto-patchable', () => {
      expect(assessPatchability('informational', 'P3')).toBe(true);
    });

    it('deprecation+P1 is not auto-patchable', () => {
      expect(assessPatchability('deprecation', 'P1')).toBe(false);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  classifyChange (integration)                                     */
  /* ---------------------------------------------------------------- */

  describe('classifyChange', () => {
    it('produces a full ClassifiedEvent from raw input', () => {
      const event = makeRawEvent({
        diff_summary: 'BREAKING CHANGE: removed /v1/complete',
        raw_content: 'Endpoint /v1/complete has been permanently removed.',
      });
      const config = makeChannelConfig();

      const classified = classifyChange(event, config);

      expect(classified.id).toBe(event.id);
      expect(classified.channel).toBe(event.channel);
      expect(classified.change_type).toBe('breaking');
      expect(classified.severity).toBe('P0');
      expect(classified.domains).toEqual(['skills', 'agents']);
      expect(classified.auto_patchable).toBe(false);
      expect(classified.summary).toBeTruthy();
      expect(classified.confidence).toBeGreaterThan(0);
      expect(classified.confidence).toBeLessThanOrEqual(1);
    });

    it('tags relevant domains from channel config', () => {
      const event = makeRawEvent();
      const config = makeChannelConfig({ domains: ['mcp', 'protocol', 'ecosystem'] });

      const classified = classifyChange(event, config);

      expect(classified.domains).toEqual(['mcp', 'protocol', 'ecosystem']);
    });

    it('includes confidence score between 0.0 and 1.0', () => {
      const event = makeRawEvent({
        diff_summary: 'Added new model support',
        raw_content: 'New model claude-4 is now available.',
      });
      const config = makeChannelConfig();

      const classified = classifyChange(event, config);

      expect(classified.confidence).toBeGreaterThanOrEqual(0);
      expect(classified.confidence).toBeLessThanOrEqual(1);
    });
  });
});
