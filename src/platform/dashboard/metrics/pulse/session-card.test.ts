import { describe, it, expect } from 'vitest';
import { renderSessionCard } from './session-card.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = Date.now();

const validSession = {
  sessionId: 'abc-123',
  model: 'claude-opus-4-6',
  startTime: NOW - 60_000, // 1 minute ago
};

const xssSession = {
  sessionId: '<script>alert("xss")</script>',
  model: 'claude-opus-4-6',
  startTime: NOW - 120_000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderSessionCard', () => {
  // -------------------------------------------------------------------------
  // 1. Returns HTML containing the session ID
  // -------------------------------------------------------------------------
  it('returns HTML containing the session ID', () => {
    const html = renderSessionCard(validSession);

    expect(html).toContain('abc-123');
  });

  // -------------------------------------------------------------------------
  // 2. Returns HTML containing the model name
  // -------------------------------------------------------------------------
  it('returns HTML containing the model name', () => {
    const html = renderSessionCard(validSession);

    expect(html).toContain('claude-opus-4-6');
  });

  // -------------------------------------------------------------------------
  // 3. Contains a formatted start time (not raw epoch)
  // -------------------------------------------------------------------------
  it('contains a formatted start time', () => {
    const html = renderSessionCard(validSession);

    // Should not contain the raw epoch number as a standalone value
    // Should contain "Started" label with a human-readable time
    expect(html).toContain('session-start');
    expect(html).toContain('Started');
    // The formatted time should NOT be just the raw epoch ms
    expect(html).not.toMatch(new RegExp(`>${validSession.startTime}<`));
  });

  // -------------------------------------------------------------------------
  // 4. Contains a <script> block with setInterval for live duration ticking
  // -------------------------------------------------------------------------
  it('contains a script block with setInterval for live ticking', () => {
    const html = renderSessionCard(validSession);

    expect(html).toContain('<script>');
    expect(html).toContain('setInterval');
  });

  // -------------------------------------------------------------------------
  // 5. Ticking script references the startTime for computing elapsed time
  // -------------------------------------------------------------------------
  it('ticking script references the start time value', () => {
    const html = renderSessionCard(validSession);

    // The script should use the startTime to compute elapsed
    expect(html).toContain(String(validSession.startTime));
  });

  // -------------------------------------------------------------------------
  // 6. Contains data-start attribute with epoch ms value
  // -------------------------------------------------------------------------
  it('contains data-start attribute with epoch ms value', () => {
    const html = renderSessionCard(validSession);

    expect(html).toContain(`data-start="${validSession.startTime}"`);
  });

  // -------------------------------------------------------------------------
  // 7. Returns empty-state card with "No active session" when given null
  // -------------------------------------------------------------------------
  it('returns empty-state card when given null', () => {
    const html = renderSessionCard(null);

    expect(html).toContain('No active session');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('setInterval');
  });

  // -------------------------------------------------------------------------
  // 8. Escapes HTML in session ID to prevent XSS
  // -------------------------------------------------------------------------
  it('escapes HTML in session ID to prevent XSS', () => {
    const html = renderSessionCard(xssSession);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
