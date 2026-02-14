/**
 * Tests for the auto-refresh script generator.
 *
 * Covers:
 * - generateRefreshScript includes setInterval for periodic refresh
 * - generateRefreshScript includes scroll position preservation via sessionStorage
 * - generateRefreshScript includes visual refresh indicator HTML
 * - generateRefreshScript respects custom interval
 */

import { describe, it, expect } from 'vitest';

import { generateRefreshScript } from './refresh.js';

describe('generateRefreshScript', () => {
  it('includes setInterval for periodic refresh', () => {
    const script = generateRefreshScript(5000);
    expect(script).toContain('setInterval');
  });

  it('uses the provided interval value', () => {
    const script = generateRefreshScript(3000);
    expect(script).toContain('3000');
  });

  it('includes scroll position preservation via sessionStorage', () => {
    const script = generateRefreshScript(5000);
    expect(script).toContain('sessionStorage');
    expect(script).toContain('scrollY');
  });

  it('includes visual refresh indicator', () => {
    const script = generateRefreshScript(5000);
    // Should contain an indicator element
    expect(script).toContain('gsd-refresh-indicator');
    // Should have some visual feedback text
    expect(script).toMatch(/refresh/i);
  });

  it('returns a string containing a script tag', () => {
    const script = generateRefreshScript(5000);
    expect(script).toContain('<script>');
    expect(script).toContain('</script>');
  });

  it('uses design system tokens for overlay colors', () => {
    const script = generateRefreshScript(5000);
    const stripped = script.replace(/var\([^)]+\)/g, 'VAR_REPLACED');
    const hexInColor = stripped.match(/color:\s*#[0-9a-fA-F]{3,8}/g);
    expect(hexInColor).toBeNull();
  });
});
