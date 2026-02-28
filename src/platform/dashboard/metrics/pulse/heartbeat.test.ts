import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHeartbeat } from './heartbeat.js';

// ---------------------------------------------------------------------------
// Time control
// ---------------------------------------------------------------------------

const NOW = 1739388000000; // Fixed epoch ms for deterministic tests

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Green indicator when lastModifiedMs is within 30 seconds of now
  // -------------------------------------------------------------------------
  it('returns green indicator when modified within 30s', () => {
    const html = renderHeartbeat(NOW - 10_000); // 10s ago

    expect(html).toContain('heartbeat-green');
  });

  // -------------------------------------------------------------------------
  // 2. Yellow indicator when lastModifiedMs is between 30s and 2m ago
  // -------------------------------------------------------------------------
  it('returns yellow indicator when modified between 30s and 2m ago', () => {
    const html = renderHeartbeat(NOW - 60_000); // 1m ago

    expect(html).toContain('heartbeat-yellow');
  });

  // -------------------------------------------------------------------------
  // 3. Gray indicator when lastModifiedMs is older than 2m
  // -------------------------------------------------------------------------
  it('returns gray indicator when modified more than 2m ago', () => {
    const html = renderHeartbeat(NOW - 180_000); // 3m ago

    expect(html).toContain('heartbeat-gray');
  });

  // -------------------------------------------------------------------------
  // 4. Shows human-readable time since last modification
  // -------------------------------------------------------------------------
  it('shows human-readable elapsed time', () => {
    // 10 seconds ago
    expect(renderHeartbeat(NOW - 10_000)).toContain('10s ago');

    // 1 minute 30 seconds ago
    expect(renderHeartbeat(NOW - 90_000)).toContain('1m 30s ago');

    // 5 minutes ago
    expect(renderHeartbeat(NOW - 300_000)).toContain('5m ago');
  });

  // -------------------------------------------------------------------------
  // 5. Gray indicator with "No activity detected" when null
  // -------------------------------------------------------------------------
  it('returns gray indicator with "No activity detected" when null', () => {
    const html = renderHeartbeat(null);

    expect(html).toContain('heartbeat-gray');
    expect(html).toContain('No activity detected');
  });

  // -------------------------------------------------------------------------
  // 6. Contains a heartbeat-dot element for the visual indicator
  // -------------------------------------------------------------------------
  it('contains a heartbeat-dot element', () => {
    const html = renderHeartbeat(NOW - 10_000);

    expect(html).toContain('heartbeat-dot');
  });

  // -------------------------------------------------------------------------
  // 7. Contains data-mtime attribute with epoch ms value
  // -------------------------------------------------------------------------
  it('contains data-mtime attribute with epoch ms value', () => {
    const mtime = NOW - 45_000;
    const html = renderHeartbeat(mtime);

    expect(html).toContain(`data-mtime="${mtime}"`);
  });

  // -------------------------------------------------------------------------
  // 8. Boundary: exactly 30000ms ago should be yellow (not green)
  // -------------------------------------------------------------------------
  it('boundary: exactly 30000ms ago is yellow', () => {
    const html = renderHeartbeat(NOW - 30_000);

    expect(html).toContain('heartbeat-yellow');
    expect(html).not.toContain('heartbeat-green');
  });

  // -------------------------------------------------------------------------
  // 9. Boundary: exactly 120000ms ago should be gray (not yellow)
  // -------------------------------------------------------------------------
  it('boundary: exactly 120000ms ago is gray', () => {
    const html = renderHeartbeat(NOW - 120_000);

    expect(html).toContain('heartbeat-gray');
    expect(html).not.toContain('heartbeat-yellow');
  });
});
