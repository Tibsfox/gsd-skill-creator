/**
 * TDD tests for staging module type constants and layout.
 *
 * Covers STAGING_STATES enum, STAGING_DIRS layout, and
 * ALL_STAGING_DIRS computed directory list.
 *
 * @module staging/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  STAGING_STATES,
  STAGING_DIRS,
  ALL_STAGING_DIRS,
} from './types.js';

describe('STAGING_STATES', () => {
  it('contains exactly 5 states', () => {
    expect(STAGING_STATES).toHaveLength(5);
  });

  it('contains inbox, checking, attention, ready, aside', () => {
    expect(STAGING_STATES).toEqual([
      'inbox',
      'checking',
      'attention',
      'ready',
      'aside',
    ]);
  });
});

describe('STAGING_DIRS', () => {
  it('has root pointing to .planning/staging', () => {
    expect(STAGING_DIRS.root).toBe('.planning/staging');
  });

  it('has inbox pointing to .planning/staging/inbox', () => {
    expect(STAGING_DIRS.inbox).toBe('.planning/staging/inbox');
  });

  it('has checking pointing to .planning/staging/checking', () => {
    expect(STAGING_DIRS.checking).toBe('.planning/staging/checking');
  });

  it('has attention pointing to .planning/staging/attention', () => {
    expect(STAGING_DIRS.attention).toBe('.planning/staging/attention');
  });

  it('has ready pointing to .planning/staging/ready', () => {
    expect(STAGING_DIRS.ready).toBe('.planning/staging/ready');
  });

  it('has aside pointing to .planning/staging/aside', () => {
    expect(STAGING_DIRS.aside).toBe('.planning/staging/aside');
  });

  it('has queue pointing to .planning/staging/queue.jsonl', () => {
    expect(STAGING_DIRS.queue).toBe('.planning/staging/queue.jsonl');
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(STAGING_DIRS)).toHaveLength(7);
  });
});

describe('ALL_STAGING_DIRS', () => {
  it('contains exactly 5 directory paths (excludes queue.jsonl)', () => {
    expect(ALL_STAGING_DIRS).toHaveLength(5);
  });

  it('includes all 5 subdirectory paths from STAGING_DIRS', () => {
    expect(ALL_STAGING_DIRS).toContain(STAGING_DIRS.inbox);
    expect(ALL_STAGING_DIRS).toContain(STAGING_DIRS.checking);
    expect(ALL_STAGING_DIRS).toContain(STAGING_DIRS.attention);
    expect(ALL_STAGING_DIRS).toContain(STAGING_DIRS.ready);
    expect(ALL_STAGING_DIRS).toContain(STAGING_DIRS.aside);
  });

  it('does not include root (created implicitly by recursive mkdir)', () => {
    expect(ALL_STAGING_DIRS).not.toContain(STAGING_DIRS.root);
  });

  it('does not include queue.jsonl (it is a file, not a directory)', () => {
    expect(ALL_STAGING_DIRS).not.toContain(STAGING_DIRS.queue);
  });
});
