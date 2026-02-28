/**
 * Tests for AGC block definitions.
 *
 * Covers: type system validation, block definition schema, input/output
 * typing, category filtering, concept/doc reference integrity, and
 * block validation utility functions.
 *
 * @module agc/pack/__tests__/block-definitions
 */

import { describe, it, expect } from 'vitest';
import {
  AGC_BLOCKS,
  getBlock,
  getBlocksByCategory,
  validateBlockDefinition,
} from '../block-definitions.js';
import type {
  BlockDefinition,
  BlockInput,
  BlockOutput,
  AgcBlockType,
  ValidationResult,
} from '../types.js';

// ============================================================================
// Type system
// ============================================================================

describe('Type system', () => {
  it('BlockInput has name, type, and description fields', () => {
    const input: BlockInput = { name: 'test', type: 'word15', description: 'test input' };
    expect(input.name).toBe('test');
    expect(input.type).toBe('word15');
    expect(input.description).toBe('test input');
  });

  it('BlockOutput has name, type, and description fields', () => {
    const output: BlockOutput = { name: 'test', type: 'word15', description: 'test output' };
    expect(output.name).toBe('test');
    expect(output.type).toBe('word15');
    expect(output.description).toBe('test output');
  });

  it('BlockDefinition has all required fields', () => {
    const block: BlockDefinition = {
      block_type: 'agc-cpu',
      display_name: 'Test',
      category: 'compute',
      description: 'A test block definition that is at least fifty characters long for validation.',
      inputs: [{ name: 'in', type: 'word15', description: 'input' }],
      outputs: [{ name: 'out', type: 'word15', description: 'output' }],
      config: {},
      concept_refs: ['agc-concept-01'],
      doc_refs: ['agc-arch-001'],
    };
    expect(block.block_type).toBe('agc-cpu');
    expect(block.display_name).toBe('Test');
    expect(block.category).toBe('compute');
    expect(block.description.length).toBeGreaterThanOrEqual(50);
    expect(block.inputs).toHaveLength(1);
    expect(block.outputs).toHaveLength(1);
    expect(block.config).toBeDefined();
    expect(block.concept_refs).toHaveLength(1);
    expect(block.doc_refs).toHaveLength(1);
  });

  it('AgcBlockType is a union of 5 block types', () => {
    const types: AgcBlockType[] = [
      'agc-cpu',
      'agc-dsky',
      'agc-peripheral-bus',
      'agc-executive-monitor',
      'agc-assembly-editor',
    ];
    expect(types).toHaveLength(5);
  });
});

// ============================================================================
// Block definitions -- AGC_BLOCKS
// ============================================================================

describe('AGC_BLOCKS', () => {
  it('is a readonly array of 5 BlockDefinition objects', () => {
    expect(AGC_BLOCKS).toHaveLength(5);
  });

  it('contains all 5 block types', () => {
    const types = AGC_BLOCKS.map((b) => b.block_type);
    expect(types).toContain('agc-cpu');
    expect(types).toContain('agc-dsky');
    expect(types).toContain('agc-peripheral-bus');
    expect(types).toContain('agc-executive-monitor');
    expect(types).toContain('agc-assembly-editor');
  });

  it('has no duplicate block_type values', () => {
    const types = AGC_BLOCKS.map((b) => b.block_type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every block has at least 1 input and 1 output', () => {
    for (const block of AGC_BLOCKS) {
      expect(block.inputs.length).toBeGreaterThanOrEqual(1);
      expect(block.outputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every block has a non-empty description (min 50 chars)', () => {
    for (const block of AGC_BLOCKS) {
      expect(block.description.length).toBeGreaterThanOrEqual(50);
    }
  });

  it('every block has at least 1 concept_ref and 1 doc_ref', () => {
    for (const block of AGC_BLOCKS) {
      expect(block.concept_refs.length).toBeGreaterThanOrEqual(1);
      expect(block.doc_refs.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// agc-cpu block specifics
// ============================================================================

describe('agc-cpu block', () => {
  it('has category "compute"', () => {
    const cpu = getBlock('agc-cpu');
    expect(cpu).toBeDefined();
    expect(cpu!.category).toBe('compute');
  });

  it('has inputs: instruction_bus, io_read_data, interrupt_signals, clock', () => {
    const cpu = getBlock('agc-cpu')!;
    const inputNames = cpu.inputs.map((i) => i.name);
    expect(inputNames).toContain('instruction_bus');
    expect(inputNames).toContain('io_read_data');
    expect(inputNames).toContain('interrupt_signals');
    expect(inputNames).toContain('clock');
  });

  it('has outputs: address_bus, write_data, io_write_data, io_channel_select, register_state', () => {
    const cpu = getBlock('agc-cpu')!;
    const outputNames = cpu.outputs.map((o) => o.name);
    expect(outputNames).toContain('address_bus');
    expect(outputNames).toContain('write_data');
    expect(outputNames).toContain('io_write_data');
    expect(outputNames).toContain('io_channel_select');
    expect(outputNames).toContain('register_state');
  });

  it('config includes registers array, word_size: 15, clock_mhz: 2.048', () => {
    const cpu = getBlock('agc-cpu')!;
    expect(cpu.config['registers']).toBeDefined();
    expect(Array.isArray(cpu.config['registers'])).toBe(true);
    expect(cpu.config['word_size']).toBe(15);
    expect(cpu.config['clock_mhz']).toBe(2.048);
  });
});

// ============================================================================
// agc-dsky block specifics
// ============================================================================

describe('agc-dsky block', () => {
  it('has category "interface"', () => {
    const dsky = getBlock('agc-dsky');
    expect(dsky).toBeDefined();
    expect(dsky!.category).toBe('interface');
  });

  it('has inputs: display_data, annunciator_state', () => {
    const dsky = getBlock('agc-dsky')!;
    const inputNames = dsky.inputs.map((i) => i.name);
    expect(inputNames).toContain('display_data');
    expect(inputNames).toContain('annunciator_state');
  });

  it('has outputs: key_code, operator_input', () => {
    const dsky = getBlock('agc-dsky')!;
    const outputNames = dsky.outputs.map((o) => o.name);
    expect(outputNames).toContain('key_code');
    expect(outputNames).toContain('operator_input');
  });

  it('config includes display with R1/R2/R3 registers and keyboard with 19 keys', () => {
    const dsky = getBlock('agc-dsky')!;
    const display = dsky.config['display'] as Record<string, unknown>;
    expect(display).toBeDefined();
    const registers = display['registers'] as Array<Record<string, unknown>>;
    const registerIds = registers.map((r) => r['id']);
    expect(registerIds).toContain('R1');
    expect(registerIds).toContain('R2');
    expect(registerIds).toContain('R3');

    const keyboard = dsky.config['keyboard'] as Record<string, unknown>;
    expect(keyboard).toBeDefined();
    expect(keyboard['total_keys']).toBe(19);
  });
});

// ============================================================================
// agc-peripheral-bus block specifics
// ============================================================================

describe('agc-peripheral-bus block', () => {
  it('has category "interface"', () => {
    const bus = getBlock('agc-peripheral-bus');
    expect(bus).toBeDefined();
    expect(bus!.category).toBe('interface');
  });

  it('has inputs: cpu_io_writes, peripheral_state', () => {
    const bus = getBlock('agc-peripheral-bus')!;
    const inputNames = bus.inputs.map((i) => i.name);
    expect(inputNames).toContain('cpu_io_writes');
    expect(inputNames).toContain('peripheral_state');
  });

  it('has outputs: cpu_io_reads, peripheral_commands', () => {
    const bus = getBlock('agc-peripheral-bus')!;
    const outputNames = bus.outputs.map((o) => o.name);
    expect(outputNames).toContain('cpu_io_reads');
    expect(outputNames).toContain('peripheral_commands');
  });

  it('config includes total_channels: 512 and channel_groups', () => {
    const bus = getBlock('agc-peripheral-bus')!;
    expect(bus.config['total_channels']).toBe(512);
    expect(bus.config['channel_groups']).toBeDefined();
  });
});

// ============================================================================
// agc-executive-monitor block specifics
// ============================================================================

describe('agc-executive-monitor block', () => {
  it('has category "visualization"', () => {
    const monitor = getBlock('agc-executive-monitor');
    expect(monitor).toBeDefined();
    expect(monitor!.category).toBe('visualization');
  });

  it('has inputs: cpu_state, job_queue, waitlist_queue, interrupt_state, core_set_map', () => {
    const monitor = getBlock('agc-executive-monitor')!;
    const inputNames = monitor.inputs.map((i) => i.name);
    expect(inputNames).toContain('cpu_state');
    expect(inputNames).toContain('job_queue');
    expect(inputNames).toContain('waitlist_queue');
    expect(inputNames).toContain('interrupt_state');
    expect(inputNames).toContain('core_set_map');
  });

  it('has outputs: visualization_data, alarm_events', () => {
    const monitor = getBlock('agc-executive-monitor')!;
    const outputNames = monitor.outputs.map((o) => o.name);
    expect(outputNames).toContain('visualization_data');
    expect(outputNames).toContain('alarm_events');
  });
});

// ============================================================================
// agc-assembly-editor block specifics
// ============================================================================

describe('agc-assembly-editor block', () => {
  it('has category "tools"', () => {
    const editor = getBlock('agc-assembly-editor');
    expect(editor).toBeDefined();
    expect(editor!.category).toBe('tools');
  });

  it('has inputs: source_text, rope_image', () => {
    const editor = getBlock('agc-assembly-editor')!;
    const inputNames = editor.inputs.map((i) => i.name);
    expect(inputNames).toContain('source_text');
    expect(inputNames).toContain('rope_image');
  });

  it('has outputs: assembled_binary, listing, error_diagnostics, symbol_table', () => {
    const editor = getBlock('agc-assembly-editor')!;
    const outputNames = editor.outputs.map((o) => o.name);
    expect(outputNames).toContain('assembled_binary');
    expect(outputNames).toContain('listing');
    expect(outputNames).toContain('error_diagnostics');
    expect(outputNames).toContain('symbol_table');
  });
});

// ============================================================================
// Utility functions
// ============================================================================

describe('Utility functions', () => {
  it('getBlock("agc-cpu") returns the CPU block definition', () => {
    const cpu = getBlock('agc-cpu');
    expect(cpu).toBeDefined();
    expect(cpu!.block_type).toBe('agc-cpu');
    expect(cpu!.display_name).toBe('AGC Block II CPU');
  });

  it('getBlock("nonexistent") returns undefined', () => {
    const result = getBlock('nonexistent' as AgcBlockType);
    expect(result).toBeUndefined();
  });

  it('getBlocksByCategory("interface") returns agc-dsky and agc-peripheral-bus', () => {
    const interfaceBlocks = getBlocksByCategory('interface');
    expect(interfaceBlocks).toHaveLength(2);
    const types = interfaceBlocks.map((b) => b.block_type);
    expect(types).toContain('agc-dsky');
    expect(types).toContain('agc-peripheral-bus');
  });

  it('getBlocksByCategory("compute") returns array with agc-cpu only', () => {
    const computeBlocks = getBlocksByCategory('compute');
    expect(computeBlocks).toHaveLength(1);
    expect(computeBlocks[0].block_type).toBe('agc-cpu');
  });

  it('validateBlockDefinition returns { valid: true } for valid blocks', () => {
    const cpu = getBlock('agc-cpu')!;
    const result = validateBlockDefinition(cpu);
    expect(result).toEqual({ valid: true });
  });

  it('validateBlockDefinition returns { valid: false } for blocks with no inputs', () => {
    const cpu = getBlock('agc-cpu')!;
    const invalid: BlockDefinition = { ...cpu, inputs: [] };
    const result = validateBlockDefinition(invalid);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
