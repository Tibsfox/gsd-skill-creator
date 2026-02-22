import { describe, it, expect } from 'vitest';
import {
  filterTraceEvents,
  renderLatencySparkline,
  renderTraceEntry,
  renderTracePanel,
  renderTracePanelStyles,
} from './trace-panel.js';
import type { TraceEvent } from '../../types/mcp.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<TraceEvent> = {}): TraceEvent {
  return {
    id: overrides.id ?? 'evt-1',
    timestamp: overrides.timestamp ?? 1700000000000,
    serverId: overrides.serverId ?? 'server-a',
    method: overrides.method ?? 'tools/call:read-file',
    direction: overrides.direction ?? 'outgoing',
    latencyMs: overrides.latencyMs,
    payload: overrides.payload,
    error: overrides.error,
  };
}

// ---------------------------------------------------------------------------
// filterTraceEvents (PRES-05)
// ---------------------------------------------------------------------------

describe('filterTraceEvents', () => {
  const events = [
    makeEvent({ id: '1', serverId: 'server-a', method: 'tools/call:read-file', direction: 'outgoing', latencyMs: 10 }),
    makeEvent({ id: '2', serverId: 'server-b', method: 'tools/call:write-file', direction: 'incoming', latencyMs: 80 }),
    makeEvent({ id: '3', serverId: 'server-a', method: 'resources/list', direction: 'outgoing', latencyMs: 5 }),
    makeEvent({ id: '4', serverId: 'server-b', method: 'tools/call:search', direction: 'incoming', latencyMs: 250 }),
  ];

  it('returns all events when no filter provided', () => {
    const result = filterTraceEvents(events, {});
    expect(result).toHaveLength(4);
  });

  it('filters by serverId', () => {
    const result = filterTraceEvents(events, { serverId: 'server-a' });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.serverId === 'server-a')).toBe(true);
  });

  it('filters by toolName (substring match on method)', () => {
    const result = filterTraceEvents(events, { toolName: 'read-file' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by direction', () => {
    const result = filterTraceEvents(events, { direction: 'incoming' });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.direction === 'incoming')).toBe(true);
  });

  it('filters by minimum latency', () => {
    const result = filterTraceEvents(events, { minLatencyMs: 50 });
    expect(result).toHaveLength(2);
    expect(result.every((e) => (e.latencyMs ?? 0) >= 50)).toBe(true);
  });

  it('combines multiple filters', () => {
    const result = filterTraceEvents(events, { serverId: 'server-b', direction: 'incoming' });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.serverId === 'server-b' && e.direction === 'incoming')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// renderLatencySparkline
// ---------------------------------------------------------------------------

describe('renderLatencySparkline', () => {
  it('returns empty string for empty array', () => {
    expect(renderLatencySparkline([])).toBe('');
  });

  it('returns SVG element with polyline for latency data', () => {
    const svg = renderLatencySparkline([10, 20, 30, 15]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('polyline');
    expect(svg).toContain('points=');
  });

  it('uses green color for low average latency (< 50ms)', () => {
    const svg = renderLatencySparkline([10, 20, 30]);
    expect(svg).toContain('#3fb950');
  });

  it('uses yellow color for medium latency (50-200ms)', () => {
    const svg = renderLatencySparkline([100, 120, 80]);
    expect(svg).toContain('#d29922');
  });

  it('uses red color for high latency (> 200ms)', () => {
    const svg = renderLatencySparkline([300, 400, 250]);
    expect(svg).toContain('#f85149');
  });
});

// ---------------------------------------------------------------------------
// renderTraceEntry
// ---------------------------------------------------------------------------

describe('renderTraceEntry', () => {
  it('renders timestamp in HH:MM:SS format', () => {
    // Timestamp for a known time
    const event = makeEvent({ timestamp: new Date('2026-02-22T10:30:45.123Z').getTime() });
    const html = renderTraceEntry(event);
    // Should contain time components (exact format depends on local timezone, just check structure)
    expect(html).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
  });

  it('shows outgoing direction arrow for outgoing events', () => {
    const html = renderTraceEntry(makeEvent({ direction: 'outgoing' }));
    expect(html).toContain('\u2192'); // right arrow
    expect(html).toContain('bp-trace-dir-outgoing');
  });

  it('shows incoming direction arrow for incoming events', () => {
    const html = renderTraceEntry(makeEvent({ direction: 'incoming' }));
    expect(html).toContain('\u2190'); // left arrow
    expect(html).toContain('bp-trace-dir-incoming');
  });

  it('displays server ID and method', () => {
    const html = renderTraceEntry(makeEvent({ serverId: 'my-server', method: 'tools/list' }));
    expect(html).toContain('my-server');
    expect(html).toContain('tools/list');
  });

  it('shows latency badge when latencyMs present', () => {
    const html = renderTraceEntry(makeEvent({ direction: 'incoming', latencyMs: 42 }));
    expect(html).toContain('42ms');
    expect(html).toContain('bp-trace-latency');
  });

  it('shows error indicator when error present', () => {
    const html = renderTraceEntry(makeEvent({ error: 'Connection timeout' }));
    expect(html).toContain('bp-trace-error');
    expect(html).toContain('\u26A0');
  });

  it('includes data-trace-id attribute', () => {
    const html = renderTraceEntry(makeEvent({ id: 'trace-42' }));
    expect(html).toContain('data-trace-id="trace-42"');
  });
});

// ---------------------------------------------------------------------------
// renderTracePanel
// ---------------------------------------------------------------------------

describe('renderTracePanel', () => {
  it('shows event count in header', () => {
    const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' }), makeEvent({ id: '3' })];
    const html = renderTracePanel(events);
    expect(html).toContain('3 events');
  });

  it('renders sparkline from event latencies', () => {
    const events = [
      makeEvent({ id: '1', latencyMs: 10, direction: 'incoming' }),
      makeEvent({ id: '2', latencyMs: 20, direction: 'incoming' }),
    ];
    const html = renderTracePanel(events);
    expect(html).toContain('<svg');
    expect(html).toContain('polyline');
  });

  it('renders entries in reverse chronological order', () => {
    const events = [
      makeEvent({ id: 'old', timestamp: 1000 }),
      makeEvent({ id: 'new', timestamp: 2000 }),
    ];
    const html = renderTracePanel(events);
    const oldIdx = html.indexOf('data-trace-id="old"');
    const newIdx = html.indexOf('data-trace-id="new"');
    expect(newIdx).toBeLessThan(oldIdx);
  });

  it('shows empty state message for no events', () => {
    const html = renderTracePanel([]);
    expect(html).toContain('No trace events recorded');
  });

  it('applies filter when provided', () => {
    const events = [
      makeEvent({ id: '1', serverId: 'server-a' }),
      makeEvent({ id: '2', serverId: 'server-b' }),
    ];
    const html = renderTracePanel(events, { serverId: 'server-a' });
    expect(html).toContain('1 events');
    expect(html).toContain('data-trace-id="1"');
    expect(html).not.toContain('data-trace-id="2"');
  });
});

// ---------------------------------------------------------------------------
// renderTracePanelStyles
// ---------------------------------------------------------------------------

describe('renderTracePanelStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderTracePanelStyles();
    expect(css.length).toBeGreaterThan(100);
    expect(css).toContain('.bp-trace-panel');
  });
});
