import { describe, it, expect } from 'vitest';
import { renderMessageCounter } from './message-counter.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validData = {
  userMessages: 15,
  assistantMessages: 12,
  toolCalls: 45,
};

const zeroData = {
  userMessages: 0,
  assistantMessages: 0,
  toolCalls: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderMessageCounter', () => {
  // -------------------------------------------------------------------------
  // 1. Shows user message count with label
  // -------------------------------------------------------------------------
  it('shows user message count with label', () => {
    const html = renderMessageCounter(validData);

    expect(html).toContain('User');
    expect(html).toContain('15');
  });

  // -------------------------------------------------------------------------
  // 2. Shows assistant message count with label
  // -------------------------------------------------------------------------
  it('shows assistant message count with label', () => {
    const html = renderMessageCounter(validData);

    expect(html).toContain('Assistant');
    expect(html).toContain('12');
  });

  // -------------------------------------------------------------------------
  // 3. Shows tool call count with label
  // -------------------------------------------------------------------------
  it('shows tool call count with label', () => {
    const html = renderMessageCounter(validData);

    expect(html).toContain('Tools');
    expect(html).toContain('45');
  });

  // -------------------------------------------------------------------------
  // 4. Shows total messages (user + assistant)
  // -------------------------------------------------------------------------
  it('shows total messages (user + assistant)', () => {
    const html = renderMessageCounter(validData);

    // 15 + 12 = 27
    expect(html).toContain('27');
  });

  // -------------------------------------------------------------------------
  // 5. Returns empty-state card with "No session data" when null
  // -------------------------------------------------------------------------
  it('returns empty-state card when given null', () => {
    const html = renderMessageCounter(null);

    expect(html).toContain('No session data');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 6. Handles zero counts gracefully
  // -------------------------------------------------------------------------
  it('handles zero counts gracefully', () => {
    const html = renderMessageCounter(zeroData);

    // Should display "0" not empty or undefined
    expect(html).toContain('0');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  // -------------------------------------------------------------------------
  // 7. Contains CSS classes for each counter type
  // -------------------------------------------------------------------------
  it('contains CSS classes for each counter type', () => {
    const html = renderMessageCounter(validData);

    expect(html).toContain('counter-user');
    expect(html).toContain('counter-assistant');
    expect(html).toContain('counter-tools');
  });
});
