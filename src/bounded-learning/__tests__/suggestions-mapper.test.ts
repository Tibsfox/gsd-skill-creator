/**
 * Tests for the suggestions-to-observation mapper.
 */
import { describe, it, expect } from 'vitest';
import {
  decisionToValue,
  entriesToObservations,
  entryToObservation,
  normalizeDecision,
} from '../suggestions-mapper.js';

describe('normalizeDecision', () => {
  it('maps canonical strings to typed decisions', () => {
    expect(normalizeDecision('accepted')).toBe('accepted');
    expect(normalizeDecision('dismissed')).toBe('dismissed');
    expect(normalizeDecision('deferred')).toBe('deferred');
    expect(normalizeDecision('pending')).toBe('pending');
  });

  it('accepts common synonyms case-insensitively', () => {
    expect(normalizeDecision('ACCEPT')).toBe('accepted');
    expect(normalizeDecision('Dismiss')).toBe('dismissed');
    expect(normalizeDecision('rejected')).toBe('dismissed');
    expect(normalizeDecision('defer')).toBe('deferred');
  });

  it('defaults unknown / non-string inputs to "pending"', () => {
    expect(normalizeDecision('weird')).toBe('pending');
    expect(normalizeDecision(undefined)).toBe('pending');
    expect(normalizeDecision(null)).toBe('pending');
    expect(normalizeDecision(42)).toBe('pending');
  });
});

describe('decisionToValue', () => {
  it('maps decisions to [-1, 1]', () => {
    expect(decisionToValue('accepted')).toBe(1);
    expect(decisionToValue('dismissed')).toBe(-1);
    expect(decisionToValue('deferred')).toBe(0);
    expect(decisionToValue('pending')).toBe(0);
  });
});

describe('entryToObservation', () => {
  it('lifts a well-formed entry', () => {
    const obs = entryToObservation({
      id: 'sugg-001',
      state: 'accepted',
      decidedAt: '2026-05-26T10:00:00Z',
    });
    expect(obs.suggestionId).toBe('sugg-001');
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
    expect(obs.observedAt).toBe('2026-05-26T10:00:00Z');
  });

  it('falls back to candidate.id when top-level id is missing', () => {
    const obs = entryToObservation({
      candidate: { id: 'cand-007' },
      state: 'dismissed',
    });
    expect(obs.suggestionId).toBe('cand-007');
    expect(obs.value).toBe(-1);
  });

  it('emits a neutral observation for unknown state', () => {
    const obs = entryToObservation({ id: 'sugg-002' });
    expect(obs.decision).toBe('pending');
    expect(obs.value).toBe(0);
  });
});

describe('entriesToObservations', () => {
  it('filters out neutral observations', () => {
    const obs = entriesToObservations([
      { id: 'a', state: 'accepted' },
      { id: 'b', state: 'dismissed' },
      { id: 'c', state: 'deferred' },
      { id: 'd', state: 'pending' },
      { id: 'e' /* no state */ },
    ]);
    expect(obs).toHaveLength(2);
    expect(obs[0]?.suggestionId).toBe('a');
    expect(obs[1]?.suggestionId).toBe('b');
  });

  it('preserves order', () => {
    const obs = entriesToObservations([
      { id: 'a', state: 'dismissed' },
      { id: 'b', state: 'accepted' },
      { id: 'c', state: 'dismissed' },
    ]);
    expect(obs.map((o) => o.suggestionId)).toEqual(['a', 'b', 'c']);
  });
});
