import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  assemblePulseSection,
  renderSessionCard,
  renderCommitFeed,
  renderHeartbeat,
  renderMessageCounter,
} from './index.js';
import type { PulseSectionData } from './index.js';
import type { GitCommitMetric } from '../../collectors/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1739388000000;

function makeCommit(overrides: Partial<GitCommitMetric> = {}): GitCommitMetric {
  return {
    hash: 'abc1234',
    type: 'feat',
    scope: 'auth',
    phase: 96,
    subject: 'add login endpoint',
    timestamp: '2026-02-12T19:00:00Z',
    author: 'Alice',
    filesChanged: 2,
    insertions: 10,
    deletions: 3,
    files: ['src/auth.ts', 'src/auth.test.ts'],
    ...overrides,
  };
}

const fullData: PulseSectionData = {
  activeSession: {
    sessionId: 'sess-001',
    model: 'claude-opus-4-6',
    startTime: NOW - 60_000,
  },
  commits: [makeCommit()],
  lastModifiedMs: NOW - 10_000,
  messageData: {
    userMessages: 5,
    assistantMessages: 3,
    toolCalls: 20,
  },
};

const emptyData: PulseSectionData = {
  activeSession: null,
  commits: [],
  lastModifiedMs: null,
  messageData: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assemblePulseSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Contains session card content when activeSession is provided
  // -------------------------------------------------------------------------
  it('contains session card content when activeSession is provided', () => {
    const html = assemblePulseSection(fullData);

    expect(html).toContain('session-card');
    expect(html).toContain('sess-001');
  });

  // -------------------------------------------------------------------------
  // 2. Contains commit feed content when commits are provided
  // -------------------------------------------------------------------------
  it('contains commit feed content when commits are provided', () => {
    const html = assemblePulseSection(fullData);

    expect(html).toContain('commit-feed');
    expect(html).toContain('abc1234');
  });

  // -------------------------------------------------------------------------
  // 3. Contains heartbeat content when lastModifiedMs is provided
  // -------------------------------------------------------------------------
  it('contains heartbeat content when lastModifiedMs is provided', () => {
    const html = assemblePulseSection(fullData);

    expect(html).toContain('heartbeat');
    expect(html).toContain('heartbeat-green');
  });

  // -------------------------------------------------------------------------
  // 4. Contains message counter content when session data is provided
  // -------------------------------------------------------------------------
  it('contains message counter content when messageData is provided', () => {
    const html = assemblePulseSection(fullData);

    expect(html).toContain('message-counter');
    expect(html).toContain('counter-user');
  });

  // -------------------------------------------------------------------------
  // 5. Wrapped in section.pulse-section container
  // -------------------------------------------------------------------------
  it('wraps all content in section.pulse-section container', () => {
    const html = assemblePulseSection(fullData);

    expect(html).toMatch(/<section class="pulse-section">/);
    expect(html).toMatch(/<\/section>$/);
  });

  // -------------------------------------------------------------------------
  // 6. Handles all-null/empty inputs gracefully
  // -------------------------------------------------------------------------
  it('handles all-null/empty inputs gracefully', () => {
    const html = assemblePulseSection(emptyData);

    // Should render empty states for all four components
    expect(html).toContain('No active session');
    expect(html).toContain('No recent commits');
    expect(html).toContain('No activity detected');
    expect(html).toContain('No session data');
  });

  // -------------------------------------------------------------------------
  // 7. Barrel re-exports all four renderers
  // -------------------------------------------------------------------------
  it('barrel re-exports all four renderers', () => {
    expect(typeof renderSessionCard).toBe('function');
    expect(typeof renderCommitFeed).toBe('function');
    expect(typeof renderHeartbeat).toBe('function');
    expect(typeof renderMessageCounter).toBe('function');
  });
});
