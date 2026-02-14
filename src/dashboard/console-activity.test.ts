import { describe, it, expect } from 'vitest';
import {
  renderConsoleActivity,
  renderConsoleActivityStyles,
  renderClipboardFallbackScript,
} from './console-activity.js';
import type { ActivityEntry } from './console-activity.js';

// ---------------------------------------------------------------------------
// Helper: create a minimal ActivityEntry
// ---------------------------------------------------------------------------

function makeEntry(overrides?: Partial<ActivityEntry>): ActivityEntry {
  return {
    timestamp: '2026-02-13T16:00:00Z',
    type: 'config-write',
    summary: 'Config updated: milestone-config.json',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// renderConsoleActivity
// ---------------------------------------------------------------------------

describe('renderConsoleActivity', () => {
  it('returns HTML with .console-activity-timeline container', () => {
    const html = renderConsoleActivity([makeEntry()]);
    expect(html).toContain('class="console-activity-timeline"');
  });

  it('renders each entry as a .activity-entry with timestamp, type badge, and summary', () => {
    const entries: ActivityEntry[] = [
      makeEntry({ summary: 'Config updated: test.json' }),
      makeEntry({ type: 'upload', summary: 'File uploaded: data.csv' }),
    ];
    const html = renderConsoleActivity(entries);
    expect(html).toContain('class="activity-entry');
    expect(html).toContain('activity-time');
    expect(html).toContain('activity-badge');
    expect(html).toContain('activity-summary');
    expect(html).toContain('Config updated: test.json');
    expect(html).toContain('File uploaded: data.csv');
  });

  it('renders entries in reverse chronological order (newest first)', () => {
    const entries: ActivityEntry[] = [
      makeEntry({ timestamp: '2026-02-13T10:00:00Z', summary: 'Older entry' }),
      makeEntry({ timestamp: '2026-02-13T14:00:00Z', summary: 'Newer entry' }),
    ];
    const html = renderConsoleActivity(entries);
    const olderIdx = html.indexOf('Older entry');
    const newerIdx = html.indexOf('Newer entry');
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it('gives error entries a distinct .activity-error class', () => {
    const entries: ActivityEntry[] = [
      makeEntry({ type: 'error', summary: 'Write failed' }),
    ];
    const html = renderConsoleActivity(entries);
    expect(html).toContain('activity-error');
  });

  it('shows "No activity recorded" empty state when entries is empty', () => {
    const html = renderConsoleActivity([]);
    expect(html).toContain('console-activity-timeline');
    expect(html).toContain('No activity recorded');
    expect(html).toContain('activity-empty');
  });

  it('formats timestamps as relative time with full ISO in title attribute', () => {
    // Use a "now" that is 5 minutes after the entry timestamp
    const now = new Date('2026-02-13T16:05:00Z').getTime();
    const entries: ActivityEntry[] = [
      makeEntry({ timestamp: '2026-02-13T16:00:00Z' }),
    ];
    const html = renderConsoleActivity(entries, now);
    expect(html).toContain('title="2026-02-13T16:00:00Z"');
    expect(html).toContain('5m ago');
  });

  it('renders type badges with distinct CSS classes for each type', () => {
    const types: ActivityEntry['type'][] = [
      'config-write',
      'question-response',
      'milestone-submit',
      'upload',
      'error',
    ];
    for (const type of types) {
      const html = renderConsoleActivity([makeEntry({ type })]);
      expect(html).toContain(`badge-${type}`);
    }
  });

  it('limits to maximum 50 entries (most recent 50)', () => {
    const entries: ActivityEntry[] = [];
    for (let i = 0; i < 60; i++) {
      entries.push(
        makeEntry({
          timestamp: `2026-02-13T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
          summary: `Entry ${i}`,
        }),
      );
    }
    const html = renderConsoleActivity(entries);
    // Should only contain 50 entries max
    const entryCount = (html.match(/class="activity-entry/g) || []).length;
    expect(entryCount).toBeLessThanOrEqual(50);
    // Newest entries should be present (entry 59 is newest)
    expect(html).toContain('Entry 59');
    // Oldest entries beyond 50 should be absent (entry 0 through 9 should be dropped)
    expect(html).not.toContain('>Entry 0<');
  });

  it('renders error entry details in a .activity-details sub-div', () => {
    const entries: ActivityEntry[] = [
      makeEntry({
        type: 'error',
        summary: 'Write failed',
        details: 'Permission denied for /inbox/pending',
      }),
    ];
    const html = renderConsoleActivity(entries);
    expect(html).toContain('activity-details');
    expect(html).toContain('Permission denied for /inbox/pending');
  });
});

// ---------------------------------------------------------------------------
// renderConsoleActivityStyles
// ---------------------------------------------------------------------------

describe('renderConsoleActivityStyles', () => {
  it('returns CSS containing .console-activity-timeline, .activity-entry, .activity-badge selectors', () => {
    const css = renderConsoleActivityStyles();
    expect(css).toContain('.console-activity-timeline');
    expect(css).toContain('.activity-entry');
    expect(css).toContain('.activity-badge');
  });

  it('contains color definitions for each activity type badge', () => {
    const css = renderConsoleActivityStyles();
    expect(css).toContain('.badge-config-write');
    expect(css).toContain('.badge-question-response');
    expect(css).toContain('.badge-milestone-submit');
    expect(css).toContain('.badge-upload');
    expect(css).toContain('.badge-error');
  });

  it('uses only design system tokens for colors (no bare hex)', () => {
    const css = renderConsoleActivityStyles();
    // Strip var() fallback values -- var(--name, #hex) is acceptable
    const stripped = css.replace(/var\([^)]+\)/g, 'VAR_REPLACED');
    // After stripping var() patterns, no bare #hex should remain in color/background/border rules
    const hexInRules = stripped.match(/(?:color|background|border-\w+-color):\s*#[0-9a-fA-F]{3,8}/g);
    expect(hexInRules).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renderClipboardFallbackScript
// ---------------------------------------------------------------------------

describe('renderClipboardFallbackScript', () => {
  it('returns a script tag string', () => {
    const script = renderClipboardFallbackScript();
    expect(script).toContain('<script>');
    expect(script).toContain('</script>');
  });

  it('defines gsdClipboardFallback that calls navigator.clipboard.writeText with JSON.stringify', () => {
    const script = renderClipboardFallbackScript();
    expect(script).toContain('gsdClipboardFallback');
    expect(script).toContain('navigator.clipboard.writeText');
    expect(script).toContain('JSON.stringify');
  });

  it('shows a toast notification with .clipboard-toast class that auto-dismisses after 3 seconds', () => {
    const script = renderClipboardFallbackScript();
    expect(script).toContain('clipboard-toast');
    expect(script).toContain('3000');
  });

  it('wraps fetch to detect helper endpoint failures on /api/console/message', () => {
    const script = renderClipboardFallbackScript();
    expect(script).toContain('fetch');
    expect(script).toContain('/api/console/message');
  });

  it('shows a persistent .helper-offline banner when helper is unreachable', () => {
    const script = renderClipboardFallbackScript();
    expect(script).toContain('helper-offline');
    expect(script).toContain('Helper offline');
  });
});
