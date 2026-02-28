/**
 * AGC dashboard widget definitions and renderers.
 *
 * Six widgets providing real-time visualization of AGC state within
 * the GSD-OS dashboard framework. Each widget connects to a block
 * output port and renders typed data as HTML strings, following the
 * pure render pattern from silicon-panel.ts and budget-gauge.ts.
 *
 * Derived from the Phase 207 simulation architecture spec:
 *   infra/packs/agc/study/simulation-architecture.yaml
 *
 * @module agc/pack/widgets
 */

import type { WidgetDefinition } from './types.js';

// ============================================================================
// Widget data types
// ============================================================================

/** Data for the register widget. */
export interface RegisterWidgetData {
  readonly registers: readonly { readonly name: string; readonly value: number }[];
}

/** Data for the memory map widget. */
export interface MemoryMapWidgetData {
  readonly banks: readonly {
    readonly id: number;
    readonly type: 'erasable' | 'fixed';
    readonly accessCount: number;
  }[];
  readonly currentAddress: number;
}

/** Data for the executive widget. */
export interface ExecutiveWidgetData {
  readonly coreSets: readonly {
    readonly id: number;
    readonly state: string;
    readonly priority: number;
    readonly jobId?: number;
  }[];
  readonly waitlistEntries?: readonly {
    readonly id: number;
    readonly fireTime: number;
    readonly taskName: string;
  }[];
  readonly alarms: readonly { readonly code: number; readonly message: string }[];
}

/** Data for the DSKY widget. */
export interface DskyWidgetData {
  readonly registers: { readonly r1: string; readonly r2: string; readonly r3: string };
  readonly verb: string;
  readonly noun: string;
  readonly prog: string;
  readonly annunciators: Record<string, boolean>;
}

/** Data for the telemetry feed widget. */
export interface TelemetryWidgetData {
  readonly entries: readonly {
    readonly timestamp: number;
    readonly channel: number;
    readonly data: number;
    readonly interpretation: string;
  }[];
}

/** Data for the instruction trace widget. */
export interface InstructionTraceData {
  readonly instructions: readonly {
    readonly address: number;
    readonly opcode: number;
    readonly mnemonic: string;
    readonly operand: string;
    readonly effect: string;
  }[];
}

// ============================================================================
// HTML escaping
// ============================================================================

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// Widget definitions
// ============================================================================

/**
 * The six AGC dashboard widget definitions.
 *
 * Each widget subscribes to data from a specific block output port,
 * updates at a configured frequency, and renders within a grid layout.
 */
export const AGC_WIDGETS: readonly WidgetDefinition[] = [
  {
    widget_id: 'agc-registers',
    display_name: 'AGC Register State',
    data_source: 'agc-cpu.register_state',
    update_frequency_ms: 100,
    layout: { width: 4, height: 3, default_position: 'top-left' },
    rendering: {
      type: 'register_grid',
      columns: ['name', 'octal_value', 'decimal_value', 'binary_bits'],
      highlight_on_change: true,
    },
    concept_refs: ['agc-concept-08'],
    description: 'Displays all CPU registers in octal and decimal. Highlights registers that changed since last cycle.',
  },
  {
    widget_id: 'agc-memory-map',
    display_name: 'AGC Memory Map',
    data_source: 'agc-memory.memory_map',
    update_frequency_ms: 500,
    layout: { width: 6, height: 4, default_position: 'center' },
    rendering: {
      type: 'heatmap',
      color_scheme: 'access_frequency',
      show_bank_boundaries: true,
      erasable_color: '#4a9eff',
      fixed_color: '#ffaa00',
    },
    concept_refs: ['agc-concept-07', 'agc-concept-09'],
    description: 'Visual heatmap of memory activity showing erasable (blue) and fixed (amber) regions with bank boundaries marked.',
  },
  {
    widget_id: 'agc-executive-state',
    display_name: 'Executive Scheduler',
    data_source: 'agc-executive-monitor.visualization_data',
    update_frequency_ms: 200,
    layout: { width: 5, height: 4, default_position: 'top-right' },
    rendering: {
      type: 'scheduler_view',
      alarm_overlay: true,
      alarm_flash: true,
    },
    concept_refs: ['agc-concept-01', 'agc-concept-02', 'agc-concept-04'],
    description: 'Flight-controller-style view of Executive state. Core set allocation grid, priority bar chart, and Waitlist countdown.',
  },
  {
    widget_id: 'agc-dsky-display',
    display_name: 'DSKY Mirror',
    data_source: 'agc-dsky.display_data',
    update_frequency_ms: 50,
    layout: { width: 3, height: 4, default_position: 'bottom-left' },
    rendering: {
      type: 'dsky_replica',
      style: 'authentic',
      font: 'seven_segment',
      background_color: '#1a1a1a',
      segment_color: '#00ff41',
      annunciator_color: '#ffaa00',
    },
    concept_refs: ['agc-concept-05', 'agc-concept-06'],
    description: 'Authentic DSKY replica with interactive keyboard. Electroluminescent green segments on dark background.',
  },
  {
    widget_id: 'agc-telemetry-feed',
    display_name: 'AGC Telemetry Feed',
    data_source: 'agc-peripheral-bus.downlink_stub',
    update_frequency_ms: 1000,
    layout: { width: 4, height: 3, default_position: 'bottom-right' },
    rendering: {
      type: 'scrolling_log',
      format: 'mission_control',
      max_lines: 50,
      auto_scroll: true,
    },
    concept_refs: ['agc-concept-12'],
    description: 'Mission Control-style telemetry feed showing all downlink data with channel identification and interpretation.',
  },
  {
    widget_id: 'agc-instruction-trace',
    display_name: 'Instruction Trace',
    data_source: 'agc-cpu.register_state',
    update_frequency_ms: 100,
    layout: { width: 4, height: 3, default_position: 'center-right' },
    rendering: {
      type: 'instruction_log',
      format: 'disassembly',
      max_lines: 30,
      highlight_branches: true,
      highlight_interrupts: true,
    },
    concept_refs: ['agc-concept-11'],
    description: 'Real-time instruction trace with disassembly showing address, opcode, mnemonic, and execution effect.',
  },
] as const;

// ============================================================================
// Utility
// ============================================================================

/**
 * Look up a widget definition by its widget ID.
 *
 * @param widgetId - The widget ID to find.
 * @returns The matching WidgetDefinition, or undefined if not found.
 */
export function getWidget(widgetId: string): WidgetDefinition | undefined {
  return AGC_WIDGETS.find((w) => w.widget_id === widgetId);
}

// ============================================================================
// Render functions
// ============================================================================

/**
 * Render the register widget as an HTML grid showing register names,
 * octal values, decimal values, and binary representation.
 *
 * @param data - Register widget data.
 * @returns HTML string.
 */
export function renderRegisterWidget(data: RegisterWidgetData): string {
  if (data.registers.length === 0) {
    return `<div class="agc-register-grid">
  <div class="agc-empty-state">No register data</div>
</div>`;
  }

  const rows = data.registers
    .map((reg) => {
      const octal = reg.value.toString(8).padStart(5, '0');
      const decimal = reg.value.toString(10);
      const binary = reg.value.toString(2).padStart(15, '0');
      return `    <tr>
      <td class="agc-reg-name">${escapeHtml(reg.name)}</td>
      <td class="agc-reg-octal">${octal}</td>
      <td class="agc-reg-decimal">${decimal}</td>
      <td class="agc-reg-binary">${binary}</td>
    </tr>`;
    })
    .join('\n');

  return `<div class="agc-register-grid">
  <table>
    <thead>
      <tr><th>Reg</th><th>Octal</th><th>Dec</th><th>Binary</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`;
}

/**
 * Render the memory map widget as a bank grid with color coding.
 * Erasable banks are blue (#4a9eff), fixed banks are amber (#ffaa00).
 *
 * @param data - Memory map widget data.
 * @returns HTML string.
 */
export function renderMemoryMapWidget(data: MemoryMapWidgetData): string {
  const currentOctal = data.currentAddress.toString(8).padStart(5, '0');
  const bankCells = data.banks
    .map((bank) => {
      const color = bank.type === 'erasable' ? '#4a9eff' : '#ffaa00';
      const opacity = Math.min(1, 0.3 + bank.accessCount * 0.1);
      return `    <div class="agc-bank-cell" style="background:${color};opacity:${opacity}" data-bank="${bank.id}" data-type="${bank.type}">
      <span class="agc-bank-id">${bank.id}</span>
      <span class="agc-bank-hits">${bank.accessCount}</span>
    </div>`;
    })
    .join('\n');

  return `<div class="agc-memory-map">
  <div class="agc-memory-header">
    <span class="agc-current-addr">Addr: ${currentOctal}</span>
    <span class="agc-legend"><span style="color:#4a9eff">Erasable</span> | <span style="color:#ffaa00">Fixed</span></span>
  </div>
  <div class="agc-bank-grid">
${bankCells}
  </div>
</div>`;
}

/**
 * Render the executive widget showing core set allocation, priority,
 * and alarm overlay.
 *
 * @param data - Executive widget data.
 * @returns HTML string.
 */
export function renderExecutiveWidget(data: ExecutiveWidgetData): string {
  const stateColors: Record<string, string> = {
    RUNNING: '#3fb950',
    RUNNABLE: '#4a9eff',
    SLEEPING: '#8b949e',
    FREE: '#21262d',
  };

  const coreSetsHtml = data.coreSets
    .map((cs) => {
      const color = stateColors[cs.state] ?? '#8b949e';
      return `    <div class="agc-core-set" style="border-color:${color}" data-state="${escapeHtml(cs.state)}">
      <span class="agc-cs-id">${cs.id}</span>
      <span class="agc-cs-state" style="color:${color}">${escapeHtml(cs.state)}</span>
      <span class="agc-cs-priority">P${cs.priority}</span>
    </div>`;
    })
    .join('\n');

  const alarmHtml =
    data.alarms.length > 0
      ? `  <div class="agc-alarm-overlay agc-alarm-flash">
${data.alarms.map((a) => `    <div class="agc-alarm-code">${a.code}: ${escapeHtml(a.message)}</div>`).join('\n')}
  </div>`
      : '';

  return `<div class="agc-executive-panel">
  <div class="agc-core-set-grid">
${coreSetsHtml}
  </div>
${alarmHtml}
</div>`;
}

/**
 * Render the DSKY widget with authentic Apollo styling.
 * Dark background (#1a1a1a), green segments (#00ff41), amber annunciators (#ffaa00).
 *
 * @param data - DSKY widget data.
 * @returns HTML string.
 */
export function renderDskyWidget(data: DskyWidgetData): string {
  const annunciatorEntries = Object.entries(data.annunciators);
  const annunciatorsHtml = annunciatorEntries
    .map(([name, active]) => {
      const color = active ? '#ffaa00' : '#333';
      return `    <div class="agc-annunciator${active ? ' agc-annunciator-active' : ''}" style="color:${color}">${escapeHtml(name)}</div>`;
    })
    .join('\n');

  return `<div class="agc-dsky-display" style="background:#1a1a1a;color:#00ff41">
  <div class="agc-dsky-indicators">
    <span class="agc-dsky-label">PROG</span><span class="agc-dsky-value seven-segment">${escapeHtml(data.prog)}</span>
    <span class="agc-dsky-label">VERB</span><span class="agc-dsky-value seven-segment">${escapeHtml(data.verb)}</span>
    <span class="agc-dsky-label">NOUN</span><span class="agc-dsky-value seven-segment">${escapeHtml(data.noun)}</span>
  </div>
  <div class="agc-dsky-registers">
    <div class="agc-dsky-reg seven-segment">${escapeHtml(data.registers.r1)}</div>
    <div class="agc-dsky-reg seven-segment">${escapeHtml(data.registers.r2)}</div>
    <div class="agc-dsky-reg seven-segment">${escapeHtml(data.registers.r3)}</div>
  </div>
  <div class="agc-dsky-annunciators">
${annunciatorsHtml}
  </div>
</div>`;
}

/**
 * Render the telemetry feed widget in Mission Control scrolling log style.
 *
 * @param data - Telemetry feed widget data.
 * @returns HTML string.
 */
export function renderTelemetryWidget(data: TelemetryWidgetData): string {
  if (data.entries.length === 0) {
    return `<div class="agc-telemetry-feed">
  <div class="agc-empty-state">No telemetry</div>
</div>`;
  }

  const rows = data.entries
    .map((entry) => {
      const channelOctal = entry.channel.toString(8).padStart(3, '0');
      const dataOctal = entry.data.toString(8).padStart(5, '0');
      return `    <tr>
      <td class="agc-telem-ts">${entry.timestamp}</td>
      <td class="agc-telem-ch">${channelOctal}</td>
      <td class="agc-telem-data">${dataOctal}</td>
      <td class="agc-telem-interp">${escapeHtml(entry.interpretation)}</td>
    </tr>`;
    })
    .join('\n');

  return `<div class="agc-telemetry-feed">
  <table>
    <thead>
      <tr><th>T</th><th>Ch</th><th>Data</th><th>Interpretation</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`;
}

/**
 * Render the instruction trace widget in disassembly style.
 * Shows address (octal), opcode (octal), mnemonic, operand, effect.
 *
 * @param data - Instruction trace widget data.
 * @returns HTML string.
 */
export function renderInstructionTraceWidget(data: InstructionTraceData): string {
  if (data.instructions.length === 0) {
    return `<div class="agc-instruction-trace">
  <div class="agc-empty-state">No instructions</div>
</div>`;
  }

  const isBranch = (mnemonic: string): boolean =>
    ['TC', 'TCF', 'BZF', 'BZMF'].includes(mnemonic);

  const rows = data.instructions
    .map((inst) => {
      const addrOctal = inst.address.toString(8).padStart(5, '0');
      const opcodeOctal = inst.opcode.toString(8).padStart(5, '0');
      const branchClass = isBranch(inst.mnemonic) ? ' agc-trace-branch' : '';
      return `    <tr class="agc-trace-row${branchClass}">
      <td class="agc-trace-addr">${addrOctal}</td>
      <td class="agc-trace-opcode">${opcodeOctal}</td>
      <td class="agc-trace-mnem">${escapeHtml(inst.mnemonic)}</td>
      <td class="agc-trace-operand">${escapeHtml(inst.operand)}</td>
      <td class="agc-trace-effect">${escapeHtml(inst.effect)}</td>
    </tr>`;
    })
    .join('\n');

  return `<div class="agc-instruction-trace">
  <table>
    <thead>
      <tr><th>Addr</th><th>Opcode</th><th>Mnem</th><th>Operand</th><th>Effect</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`;
}
