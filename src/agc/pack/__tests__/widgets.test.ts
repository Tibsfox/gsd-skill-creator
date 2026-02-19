/**
 * Tests for AGC dashboard widgets.
 *
 * Covers: widget definitions (IDs, data sources, layouts), and render
 * functions for all 6 widgets (register, memory map, executive, DSKY,
 * telemetry, instruction trace). Pure render pattern: data in, HTML out.
 *
 * @module agc/pack/__tests__/widgets
 */

import { describe, it, expect } from 'vitest';
import {
  AGC_WIDGETS,
  getWidget,
  renderRegisterWidget,
  renderMemoryMapWidget,
  renderExecutiveWidget,
  renderDskyWidget,
  renderTelemetryWidget,
  renderInstructionTraceWidget,
} from '../widgets.js';
import type {
  RegisterWidgetData,
  MemoryMapWidgetData,
  ExecutiveWidgetData,
  DskyWidgetData,
  TelemetryWidgetData,
  InstructionTraceData,
} from '../widgets.js';

// ============================================================================
// Widget definitions -- AGC_WIDGETS
// ============================================================================

describe('AGC_WIDGETS', () => {
  it('is a readonly array of 6 WidgetDefinition objects', () => {
    expect(AGC_WIDGETS).toHaveLength(6);
  });

  it('contains all 6 widget IDs', () => {
    const ids = AGC_WIDGETS.map((w) => w.widget_id);
    expect(ids).toContain('agc-registers');
    expect(ids).toContain('agc-memory-map');
    expect(ids).toContain('agc-executive-state');
    expect(ids).toContain('agc-dsky-display');
    expect(ids).toContain('agc-telemetry-feed');
    expect(ids).toContain('agc-instruction-trace');
  });

  it('has no duplicate widget_id values', () => {
    const ids = AGC_WIDGETS.map((w) => w.widget_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every widget has a non-empty description (min 20 chars)', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.description.length).toBeGreaterThanOrEqual(20);
    }
  });

  it('every widget has at least 1 concept_ref', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.concept_refs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all update_frequency_ms values are positive integers', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.update_frequency_ms).toBeGreaterThan(0);
      expect(Number.isInteger(widget.update_frequency_ms)).toBe(true);
    }
  });
});

// ============================================================================
// Widget data sources match block outputs
// ============================================================================

describe('Widget data sources', () => {
  it('agc-registers data_source is "agc-cpu.register_state"', () => {
    const w = getWidget('agc-registers');
    expect(w).toBeDefined();
    expect(w!.data_source).toBe('agc-cpu.register_state');
  });

  it('agc-memory-map data_source is "agc-memory.memory_map"', () => {
    const w = getWidget('agc-memory-map');
    expect(w!.data_source).toBe('agc-memory.memory_map');
  });

  it('agc-executive-state data_source is "agc-executive-monitor.visualization_data"', () => {
    const w = getWidget('agc-executive-state');
    expect(w!.data_source).toBe('agc-executive-monitor.visualization_data');
  });

  it('agc-dsky-display data_source is "agc-dsky.display_data"', () => {
    const w = getWidget('agc-dsky-display');
    expect(w!.data_source).toBe('agc-dsky.display_data');
  });

  it('agc-telemetry-feed data_source is "agc-peripheral-bus.downlink_stub"', () => {
    const w = getWidget('agc-telemetry-feed');
    expect(w!.data_source).toBe('agc-peripheral-bus.downlink_stub');
  });

  it('agc-instruction-trace data_source is "agc-cpu.register_state"', () => {
    const w = getWidget('agc-instruction-trace');
    expect(w!.data_source).toBe('agc-cpu.register_state');
  });
});

// ============================================================================
// Widget layouts
// ============================================================================

describe('Widget layouts', () => {
  it('all widgets have layout with width > 0, height > 0', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.layout.width).toBeGreaterThan(0);
      expect(widget.layout.height).toBeGreaterThan(0);
    }
  });

  it('all default_position values are non-empty strings', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.layout.default_position.length).toBeGreaterThan(0);
    }
  });

  it('getWidget("agc-registers") returns the register widget', () => {
    const w = getWidget('agc-registers');
    expect(w).toBeDefined();
    expect(w!.widget_id).toBe('agc-registers');
  });

  it('getWidget("nonexistent") returns undefined', () => {
    expect(getWidget('nonexistent')).toBeUndefined();
  });
});

// ============================================================================
// Register widget renderer
// ============================================================================

describe('renderRegisterWidget', () => {
  const data: RegisterWidgetData = {
    registers: [{ name: 'A', value: 0o12345 }],
  };

  it('returns an HTML string', () => {
    const html = renderRegisterWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-register-grid" CSS class', () => {
    const html = renderRegisterWidget(data);
    expect(html).toContain('agc-register-grid');
  });

  it('output contains register name "A"', () => {
    const html = renderRegisterWidget(data);
    expect(html).toContain('A');
  });

  it('output contains octal display of the value', () => {
    const html = renderRegisterWidget(data);
    expect(html).toContain('12345');
  });

  it('empty registers array produces valid HTML with empty state message', () => {
    const html = renderRegisterWidget({ registers: [] });
    expect(html).toContain('No register data');
  });
});

// ============================================================================
// Memory map widget renderer
// ============================================================================

describe('renderMemoryMapWidget', () => {
  const data: MemoryMapWidgetData = {
    banks: [{ id: 0, type: 'erasable', accessCount: 5 }],
    currentAddress: 0o400,
  };

  it('returns an HTML string', () => {
    const html = renderMemoryMapWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-memory-map" CSS class', () => {
    const html = renderMemoryMapWidget(data);
    expect(html).toContain('agc-memory-map');
  });

  it('output distinguishes erasable (blue) and fixed (amber) regions', () => {
    const mixedData: MemoryMapWidgetData = {
      banks: [
        { id: 0, type: 'erasable', accessCount: 5 },
        { id: 1, type: 'fixed', accessCount: 3 },
      ],
      currentAddress: 0o400,
    };
    const html = renderMemoryMapWidget(mixedData);
    expect(html).toContain('#4a9eff');
    expect(html).toContain('#ffaa00');
  });
});

// ============================================================================
// Executive widget renderer
// ============================================================================

describe('renderExecutiveWidget', () => {
  const data: ExecutiveWidgetData = {
    coreSets: [{ id: 0, state: 'RUNNING', priority: 7 }],
    alarms: [],
  };

  it('returns an HTML string', () => {
    const html = renderExecutiveWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-executive-panel" CSS class', () => {
    const html = renderExecutiveWidget(data);
    expect(html).toContain('agc-executive-panel');
  });

  it('output displays core set state and priority', () => {
    const html = renderExecutiveWidget(data);
    expect(html).toContain('RUNNING');
    expect(html).toContain('7');
  });

  it('when alarms are present, output contains alarm code', () => {
    const alarmData: ExecutiveWidgetData = {
      coreSets: [{ id: 0, state: 'RUNNING', priority: 7 }],
      alarms: [{ code: 1202, message: 'Executive overflow' }],
    };
    const html = renderExecutiveWidget(alarmData);
    expect(html).toContain('1202');
  });
});

// ============================================================================
// DSKY widget renderer
// ============================================================================

describe('renderDskyWidget', () => {
  const data: DskyWidgetData = {
    registers: { r1: '+12345', r2: '-00001', r3: '+00000' },
    verb: '06',
    noun: '62',
    prog: '11',
    annunciators: { COMP_ACTY: true },
  };

  it('returns an HTML string', () => {
    const html = renderDskyWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-dsky-display" CSS class', () => {
    const html = renderDskyWidget(data);
    expect(html).toContain('agc-dsky-display');
  });

  it('output contains seven-segment-style digits', () => {
    const html = renderDskyWidget(data);
    expect(html).toContain('seven-segment');
  });

  it('output contains annunciator indicators', () => {
    const html = renderDskyWidget(data);
    expect(html).toContain('COMP_ACTY');
  });
});

// ============================================================================
// Telemetry feed renderer
// ============================================================================

describe('renderTelemetryWidget', () => {
  const data: TelemetryWidgetData = {
    entries: [
      { timestamp: 100, channel: 44, data: 0o12345, interpretation: 'downlink data' },
    ],
  };

  it('returns an HTML string', () => {
    const html = renderTelemetryWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-telemetry-feed" CSS class', () => {
    const html = renderTelemetryWidget(data);
    expect(html).toContain('agc-telemetry-feed');
  });

  it('empty entries produces valid HTML with "No telemetry" message', () => {
    const html = renderTelemetryWidget({ entries: [] });
    expect(html).toContain('No telemetry');
  });
});

// ============================================================================
// Instruction trace renderer
// ============================================================================

describe('renderInstructionTraceWidget', () => {
  const data: InstructionTraceData = {
    instructions: [
      { address: 0o4000, opcode: 0o10000, mnemonic: 'TC', operand: 'VERB', effect: 'Jump to VERB' },
    ],
  };

  it('returns an HTML string', () => {
    const html = renderInstructionTraceWidget(data);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('output contains "agc-instruction-trace" CSS class', () => {
    const html = renderInstructionTraceWidget(data);
    expect(html).toContain('agc-instruction-trace');
  });

  it('output contains address in octal and mnemonic', () => {
    const html = renderInstructionTraceWidget(data);
    expect(html).toContain('4000');
    expect(html).toContain('TC');
  });
});
