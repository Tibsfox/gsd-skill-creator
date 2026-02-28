/**
 * AGC block definitions for the GSD-OS blueprint editor.
 *
 * Five blocks representing AGC subsystems: CPU, DSKY, Peripheral Bus,
 * Executive Monitor, and Assembly Editor. Each block has typed inputs,
 * outputs, configuration, and cross-references to the AGC catalog.
 *
 * Derived from the Phase 207 simulation architecture spec:
 *   infra/packs/agc/study/simulation-architecture.yaml
 *
 * @module agc/pack/block-definitions
 */

import type { BlockDefinition, AgcBlockType, ValidationResult } from './types.js';

// ============================================================================
// AGC block type constants
// ============================================================================

const AGC_BLOCK_TYPES: readonly AgcBlockType[] = [
  'agc-cpu',
  'agc-dsky',
  'agc-peripheral-bus',
  'agc-executive-monitor',
  'agc-assembly-editor',
] as const;

// ============================================================================
// Block definitions
// ============================================================================

/**
 * The five AGC block definitions for the GSD-OS blueprint editor.
 *
 * Each block represents an AGC subsystem with typed inputs, outputs,
 * configuration matching the real hardware, and cross-references to
 * the AGC study catalog for educational linking.
 */
export const AGC_BLOCKS: readonly BlockDefinition[] = [
  // ── agc-cpu ──────────────────────────────────────────────────────────────
  {
    block_type: 'agc-cpu',
    display_name: 'AGC Block II CPU',
    category: 'compute',
    description:
      'Central processing unit of the Apollo Guidance Computer. Executes the ' +
      'Block II instruction set at 2.048 MHz with a 15-bit word length. Implements ' +
      "ones' complement arithmetic, 12-bit addressing with bank switching, " +
      'and hardware interrupt support for 10 interrupt vectors.',
    inputs: [
      { name: 'instruction_bus', type: 'word15', description: '15-bit instruction word from memory' },
      { name: 'io_read_data', type: 'word15', description: 'Data from I/O channel read' },
      { name: 'interrupt_signals', type: 'interrupt_vector', description: '10 hardware interrupt lines (RUPT1-RUPT10)' },
      { name: 'clock', type: 'clock_signal', description: '2.048 MHz master clock from timing generator' },
    ],
    outputs: [
      { name: 'address_bus', type: 'address12', description: '12-bit memory address + bank select' },
      { name: 'write_data', type: 'word15', description: 'Data to write to memory' },
      { name: 'io_write_data', type: 'word15', description: 'Data for I/O channel write' },
      { name: 'io_channel_select', type: 'channel_number', description: 'I/O channel number (0-511)' },
      { name: 'register_state', type: 'register_snapshot', description: 'Current state of all registers for monitoring' },
    ],
    config: {
      registers: [
        { name: 'A', bits: 16, description: 'Accumulator (16-bit with overflow)' },
        { name: 'L', bits: 15, description: 'Lower accumulator' },
        { name: 'Q', bits: 15, description: 'Return address register' },
        { name: 'Z', bits: 12, description: 'Program counter' },
        { name: 'EBANK', bits: 3, description: 'Erasable bank selector (8 banks)' },
        { name: 'FBANK', bits: 5, description: 'Fixed bank selector (32 banks)' },
        { name: 'BB', bits: 15, description: 'Both banks register (FBANK + EBANK)' },
        { name: 'BRUPT', bits: 15, description: 'Breakpoint register' },
        { name: 'CYR', bits: 15, description: 'Cycle right shift register' },
        { name: 'SR', bits: 15, description: 'Shift right register' },
        { name: 'CYL', bits: 15, description: 'Cycle left shift register' },
        { name: 'EDOP', bits: 15, description: 'Edit polish opcode register' },
      ],
      word_size: 15,
      clock_mhz: 2.048,
      instruction_time_mct: 12,
      mct_period_us: 11.72,
    },
    concept_refs: ['agc-concept-01', 'agc-concept-08'],
    doc_refs: ['agc-arch-002', 'agc-arch-004', 'agc-arch-005'],
  },

  // ── agc-dsky ─────────────────────────────────────────────────────────────
  {
    block_type: 'agc-dsky',
    display_name: 'DSKY Display/Keyboard',
    category: 'interface',
    description:
      "Replica of the astronaut's Display and Keyboard unit. Features three " +
      '5-digit signed numeric displays (R1, R2, R3), PROG/VERB/NOUN indicators, ' +
      '11 annunciator status lights, and a 19-key keyboard. Communicates with ' +
      'the CPU via I/O channels following the VERB/NOUN command grammar.',
    inputs: [
      { name: 'display_data', type: 'relay_word', description: 'DSKY relay words from CPU via I/O channels 010-013' },
      { name: 'annunciator_state', type: 'annunciator_bits', description: '11-bit annunciator state for status lights' },
    ],
    outputs: [
      { name: 'key_code', type: 'key_scan', description: 'Keyboard scan code sent via channel 015' },
      { name: 'operator_input', type: 'verb_noun_entry', description: 'Structured VERB/NOUN input for simulation control' },
    ],
    config: {
      display: {
        registers: [
          { id: 'R1', digits: 5, signed: true, description: 'Register 1 display' },
          { id: 'R2', digits: 5, signed: true, description: 'Register 2 display' },
          { id: 'R3', digits: 5, signed: true, description: 'Register 3 display' },
        ],
        indicators: [
          { id: 'PROG', digits: 2, description: 'Program number display' },
          { id: 'VERB', digits: 2, description: 'Verb number display' },
          { id: 'NOUN', digits: 2, description: 'Noun number display' },
        ],
        annunciators: [
          { id: 'UPLINK_ACTY', description: 'Uplink activity' },
          { id: 'NO_ATT', description: 'No attitude (IMU not aligned)' },
          { id: 'STBY', description: 'Standby' },
          { id: 'KEY_REL', description: 'Keyboard release' },
          { id: 'OPR_ERR', description: 'Operator error' },
          { id: 'TEMP', description: 'Temperature warning' },
          { id: 'GIMBAL_LOCK', description: 'Gimbal lock warning' },
          { id: 'PROG_ALARM', description: 'Program alarm' },
          { id: 'RESTART', description: 'Restart occurred' },
          { id: 'TRACKER', description: 'Tracker (optics tracking)' },
          { id: 'ALT', description: 'Altitude (altitude rate display)' },
        ],
        segment_type: 'electroluminescent',
      },
      keyboard: {
        keys: {
          numeric: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
          command: ['VERB', 'NOUN', 'ENTER', 'CLR', 'PRO', 'KEY_REL', 'RSET'],
          special: ['+', '-'],
        },
        total_keys: 19,
      },
    },
    concept_refs: ['agc-concept-05', 'agc-concept-06'],
    doc_refs: ['agc-iface-002', 'agc-iface-020', 'agc-draw-007', 'agc-soft-034'],
  },

  // ── agc-peripheral-bus ───────────────────────────────────────────────────
  {
    block_type: 'agc-peripheral-bus',
    display_name: 'Peripheral I/O Bus',
    category: 'interface',
    description:
      'I/O channel abstraction layer connecting the CPU to simulated spacecraft ' +
      'peripherals. Provides a configurable channel map with stubs for IMU, ' +
      'radar, engine, and other spacecraft systems. Channels are 15-bit read/write ' +
      'registers addressed by channel number (0-511).',
    inputs: [
      { name: 'cpu_io_writes', type: 'channel_write', description: 'CPU writes to I/O channels (channel number + data)' },
      { name: 'peripheral_state', type: 'peripheral_data', description: 'External peripheral state updates (IMU angles, radar returns, etc.)' },
    ],
    outputs: [
      { name: 'cpu_io_reads', type: 'channel_read', description: 'Data for CPU I/O reads from channels' },
      { name: 'peripheral_commands', type: 'command_list', description: 'Commands dispatched to peripheral stubs' },
    ],
    config: {
      total_channels: 512,
      channel_groups: {
        dsky: { channels: [10, 11, 12, 13, 15], description: 'DSKY display output (10-13) and keyboard input (15)' },
        imu: { channels: [30, 31, 32, 33], description: 'IMU CDU angle counters (coarse/fine)' },
        hand_controller: { channels: [34, 35], description: 'Rotation and translation hand controller' },
        engine: { channels: [77], description: 'Engine on/off and trim commands' },
        radar: { channels: [50, 51, 52, 53], description: 'Landing radar and rendezvous radar data' },
        downlink: { channels: [44, 45], description: 'Telemetry downlink data' },
        uplink: { channels: [43], description: 'Ground command uplink' },
      },
    },
    concept_refs: ['agc-concept-10'],
    doc_refs: ['agc-iface-001', 'agc-iface-004', 'agc-iface-005'],
  },

  // ── agc-executive-monitor ────────────────────────────────────────────────
  {
    block_type: 'agc-executive-monitor',
    display_name: 'Executive Monitor',
    category: 'visualization',
    description:
      'Real-time visualization of the AGC Executive scheduler. Displays core set ' +
      'allocation, job priority levels, Waitlist queue, and interrupt state. ' +
      'Provides a flight-controller-style view into the scheduling decisions ' +
      'that make AGC multitasking work. Crucial for understanding why the 1202 ' +
      'alarm triggered during Apollo 11.',
    inputs: [
      { name: 'cpu_state', type: 'register_snapshot', description: 'Current CPU register state' },
      { name: 'job_queue', type: 'job_list', description: 'Executive job queue with priorities and states' },
      { name: 'waitlist_queue', type: 'waitlist_entries', description: 'Waitlist timer-deferred tasks' },
      { name: 'interrupt_state', type: 'interrupt_status', description: 'Interrupt enable/disable and pending interrupts' },
      { name: 'core_set_map', type: 'core_set_allocation', description: 'Which core sets are allocated to which jobs' },
    ],
    outputs: [
      { name: 'visualization_data', type: 'executive_viz', description: 'Structured data for dashboard visualization' },
      { name: 'alarm_events', type: 'alarm_list', description: 'Executive overflow (1202/1201) and other alarm events' },
    ],
    config: {
      core_sets: {
        total: 7,
        display_mode: 'allocation_grid',
        fields_per_set: ['job_id', 'priority', 'state', 'program_counter', 'restart_group'],
      },
      priority_display: {
        levels: 8,
        mode: 'bar_chart',
        show_running: true,
        show_queued: true,
        show_sleeping: true,
      },
      alarm_conditions: [
        { code: 1202, name: 'Executive overflow -- no core sets available', severity: 'critical' },
        { code: 1201, name: 'Executive overflow -- no VAC area available', severity: 'critical' },
        { code: 1203, name: 'Waitlist overflow', severity: 'warning' },
      ],
    },
    concept_refs: ['agc-concept-01', 'agc-concept-02', 'agc-concept-04'],
    doc_refs: ['agc-arch-016', 'agc-soft-035', 'agc-test-012'],
  },

  // ── agc-assembly-editor ──────────────────────────────────────────────────
  {
    block_type: 'agc-assembly-editor',
    display_name: 'AGC Assembly Editor',
    category: 'tools',
    description:
      'Integrated editor for writing AGC assembly language programs. Provides ' +
      'syntax highlighting, label resolution, bank assignment, and assembly to ' +
      'binary. Supports the yaYUL-compatible instruction set including basic ' +
      'instructions, extracodes, interpreter instructions, and pseudo-ops.',
    inputs: [
      { name: 'source_text', type: 'agc_assembly', description: 'AGC assembly language source code' },
      { name: 'rope_image', type: 'binary_image', description: 'Pre-assembled rope image for disassembly/loading' },
    ],
    outputs: [
      { name: 'assembled_binary', type: 'rope_image', description: 'Assembled binary ready for memory loading' },
      { name: 'listing', type: 'assembly_listing', description: 'Assembly listing with addresses, opcodes, and source' },
      { name: 'error_diagnostics', type: 'diagnostic_list', description: 'Assembly errors and warnings with source locations' },
      { name: 'symbol_table', type: 'symbol_map', description: 'Label-to-address mapping for debugger' },
    ],
    config: {
      language: {
        compatibility: 'yaYUL',
        syntax_highlighting: true,
        auto_indent: true,
        label_resolution: true,
        bank_assignment: true,
      },
      instruction_categories: {
        basic: ['TC', 'CCS', 'TCF', 'DAS', 'LXCH', 'INCR', 'ADS', 'CA', 'CS', 'INDEX', 'DXCH', 'TS', 'XCH', 'AD', 'MASK'],
        extracode: ['READ', 'WRITE', 'RAND', 'WAND', 'ROR', 'WOR', 'RXOR', 'DV', 'BZF', 'MSU', 'QXCH', 'AUG', 'DIM', 'DCA', 'DCS', 'SU', 'BZMF', 'MP'],
        interpreter: ['VXSC', 'UNIT', 'ACOS', 'ASIN', 'STODL', 'STORE', 'EXIT', 'GOTO', 'CALL', 'RETURN'],
        pseudo_ops: ['ERASE', 'EQUALS', 'SETLOC', 'BANK', 'BLOCK', 'COUNT', 'SUBRO', 'OCT', 'DEC', '2DEC'],
      },
    },
    concept_refs: ['agc-concept-09'],
    doc_refs: ['agc-soft-013', 'agc-soft-028', 'agc-test-007'],
  },
] as const;

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Look up a block definition by its block type.
 *
 * @param blockType - The block type to find.
 * @returns The matching BlockDefinition, or undefined if not found.
 */
export function getBlock(blockType: AgcBlockType): BlockDefinition | undefined {
  return AGC_BLOCKS.find((b) => b.block_type === blockType);
}

/**
 * Filter block definitions by category.
 *
 * @param category - The category to filter by (e.g. 'compute', 'interface').
 * @returns Array of BlockDefinitions in the given category.
 */
export function getBlocksByCategory(category: string): BlockDefinition[] {
  return AGC_BLOCKS.filter((b) => b.category === category);
}

/**
 * Validate a block definition for structural integrity.
 *
 * Checks: non-empty inputs, non-empty outputs, description >= 50 chars,
 * non-empty concept_refs, non-empty doc_refs, valid block_type.
 *
 * @param block - The block definition to validate.
 * @returns ValidationResult indicating valid or invalid with error messages.
 */
export function validateBlockDefinition(block: BlockDefinition): ValidationResult {
  const errors: string[] = [];

  if (block.inputs.length === 0) {
    errors.push('Block must have at least 1 input');
  }

  if (block.outputs.length === 0) {
    errors.push('Block must have at least 1 output');
  }

  if (block.description.length < 50) {
    errors.push(`Description must be at least 50 characters (got ${block.description.length})`);
  }

  if (block.concept_refs.length === 0) {
    errors.push('Block must have at least 1 concept_ref');
  }

  if (block.doc_refs.length === 0) {
    errors.push('Block must have at least 1 doc_ref');
  }

  if (!AGC_BLOCK_TYPES.includes(block.block_type)) {
    errors.push(`Invalid block_type: ${block.block_type}`);
  }

  if (errors.length === 0) {
    return { valid: true };
  }

  return { valid: false, errors };
}
