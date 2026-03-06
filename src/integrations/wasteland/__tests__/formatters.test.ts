import { describe, it, expect } from 'vitest';
import { renderTable, renderBadge, smartFit } from '../formatters.js';

describe('renderTable', () => {
  it('output contains header names', () => {
    const result = renderTable(['ID', 'Status'], [['w-001', 'open']]);
    expect(result).toContain('ID');
    expect(result).toContain('Status');
  });

  it('output contains data row values', () => {
    const result = renderTable(['ID', 'Status'], [['w-001', 'open']]);
    expect(result).toContain('w-001');
    expect(result).toContain('open');
  });

  it('output contains a separator line (row of dashes)', () => {
    const result = renderTable(['ID', 'Status'], [['w-001', 'open']]);
    expect(result).toMatch(/[-]+/);
  });

  it('renders header and separator only when rows is empty', () => {
    const result = renderTable(['ID', 'Status'], []);
    expect(result).toContain('ID');
    expect(result).toContain('Status');
    expect(result).toMatch(/[-]+/);
    expect(result).not.toContain('w-001');
  });

  it('pads each row value to column width', () => {
    const result = renderTable(['Name'], [['Alice'], ['Bob']]);
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('adapts column width when row value is longer than header', () => {
    const longValue = 'a-very-long-identifier';
    const result = renderTable(['ID'], [[longValue]]);
    expect(result).toContain(longValue);
  });

  it('handles multiple columns and rows', () => {
    const result = renderTable(['A', 'B', 'C'], [['1', '2', '3'], ['4', '5', '6']]);
    expect(result).toContain('A');
    expect(result).toContain('1');
    expect(result).toContain('6');
  });
});

describe('renderBadge', () => {
  it('returns a non-empty string for open', () => {
    const result = renderBadge('open');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string including claimed', () => {
    const result = renderBadge('claimed');
    expect(result).toContain('claimed');
  });

  it('returns a string including validated', () => {
    const result = renderBadge('validated');
    expect(result).toContain('validated');
  });

  it('falls back gracefully for unknown status', () => {
    const result = renderBadge('unknown-status');
    expect(result).toContain('unknown-status');
  });

  it('returns a string including submitted', () => {
    const result = renderBadge('submitted');
    expect(result).toContain('submitted');
  });
});

describe('smartFit', () => {
  it('returns text unchanged when it fits within maxWidth', () => {
    const result = smartFit('short', 80);
    expect(result).toBe('short');
  });

  it('truncates with ellipsis when text exceeds maxWidth', () => {
    const result = smartFit('a very long string that exceeds the limit', 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).toContain('…');
  });

  it('returns empty string for empty input', () => {
    const result = smartFit('', 80);
    expect(result).toBe('');
  });

  it('returns text exactly at maxWidth unchanged', () => {
    const text = 'exactly10c';
    const result = smartFit(text, 10);
    expect(result).toBe(text);
  });
});
