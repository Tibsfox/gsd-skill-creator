/**
 * Integration tests for AGC educational pack standalone operation.
 *
 * Verifies all 5 AGCI requirements end-to-end:
 *   AGCI-01: Block definitions integrate with blueprint editor
 *   AGCI-02: Chipset configuration enables AGC sessions
 *   AGCI-03: Dashboard widgets display AGC telemetry
 *   AGCI-04: Standalone pack verification
 *   AGCI-05: Virtual AGC flight software binaries
 *
 * Also verifies cross-cutting block-to-widget wiring.
 *
 * @module agc/pack/__tests__/integration
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as yaml from 'js-yaml';

import {
  AGC_BLOCKS,
  getBlock,
  getBlocksByCategory,
  validateBlockDefinition,
} from '../block-definitions.js';
import {
  AGC_WIDGETS,
  renderRegisterWidget,
  renderMemoryMapWidget,
  renderExecutiveWidget,
  renderDskyWidget,
  renderTelemetryWidget,
  renderInstructionTraceWidget,
} from '../widgets.js';
import {
  ROPE_SOURCES,
  locateRopeImage,
  validateRopeImage,
} from '../rope-loader.js';
import {
  AGC_PACK_MANIFEST,
  isPackInstalled,
} from '../manifest.js';
import type { AgcBlockType } from '../types.js';

// ============================================================================
// AGCI-01: Block definitions integrate with blueprint editor
// ============================================================================

describe('AGCI-01: Block definitions', () => {
  it('all 5 block types present in AGC_BLOCKS', () => {
    expect(AGC_BLOCKS).toHaveLength(5);
    const types = AGC_BLOCKS.map((b) => b.block_type);
    expect(types).toContain('agc-cpu');
    expect(types).toContain('agc-dsky');
    expect(types).toContain('agc-peripheral-bus');
    expect(types).toContain('agc-executive-monitor');
    expect(types).toContain('agc-assembly-editor');
  });

  it('each block inputs and outputs have unique names', () => {
    for (const block of AGC_BLOCKS) {
      const inputNames = block.inputs.map((i) => i.name);
      expect(new Set(inputNames).size).toBe(inputNames.length);
      const outputNames = block.outputs.map((o) => o.name);
      expect(new Set(outputNames).size).toBe(outputNames.length);
    }
  });

  it('block categories cover: compute, interface, visualization, tools', () => {
    const categories = new Set(AGC_BLOCKS.map((b) => b.category));
    expect(categories).toContain('compute');
    expect(categories).toContain('interface');
    expect(categories).toContain('visualization');
    expect(categories).toContain('tools');
  });

  it('all concept_refs follow pattern agc-concept-NN', () => {
    for (const block of AGC_BLOCKS) {
      for (const ref of block.concept_refs) {
        expect(ref).toMatch(/^agc-concept-\d+$/);
      }
    }
  });

  it('all doc_refs follow pattern agc-{category}-NNN', () => {
    for (const block of AGC_BLOCKS) {
      for (const ref of block.doc_refs) {
        expect(ref).toMatch(/^agc-[a-z]+-\d+$/);
      }
    }
  });

  it('validateBlockDefinition returns valid: true for every block', () => {
    for (const block of AGC_BLOCKS) {
      expect(validateBlockDefinition(block)).toEqual({ valid: true });
    }
  });

  it('getBlock returns correct block for each of the 5 types', () => {
    const types: AgcBlockType[] = [
      'agc-cpu', 'agc-dsky', 'agc-peripheral-bus',
      'agc-executive-monitor', 'agc-assembly-editor',
    ];
    for (const t of types) {
      const block = getBlock(t);
      expect(block).toBeDefined();
      expect(block!.block_type).toBe(t);
    }
  });

  it('getBlocksByCategory returns correct blocks for each category', () => {
    expect(getBlocksByCategory('compute')).toHaveLength(1);
    expect(getBlocksByCategory('interface')).toHaveLength(2);
    expect(getBlocksByCategory('visualization')).toHaveLength(1);
    expect(getBlocksByCategory('tools')).toHaveLength(1);
  });
});

// ============================================================================
// AGCI-02: Chipset configuration enables AGC sessions
// ============================================================================

describe('AGCI-02: Chipset configuration', () => {
  const chipsetPath = join(process.cwd(), '.chipset', 'agc-educational.yaml');
  let chipsetData: Record<string, unknown>;

  it('agc-educational.yaml file exists', () => {
    expect(existsSync(chipsetPath)).toBe(true);
  });

  it('chipset YAML is parseable', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    chipsetData = yaml.load(content) as Record<string, unknown>;
    expect(chipsetData).toBeDefined();
  });

  it('chipset has schema_version "1.0"', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    expect(data['schema_version']).toBe('1.0');
  });

  it('chipset skills section has exactly 5 skills', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const skills = data['skills'] as Array<Record<string, unknown>>;
    expect(skills).toHaveLength(5);
  });

  it('chipset agents section has exactly 3 agents', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const agents = data['agents'] as Array<Record<string, unknown>>;
    expect(agents).toHaveLength(3);
  });

  it('chipset teams section has exactly 1 team named agc-education', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const teams = data['teams'] as Array<Record<string, unknown>>;
    expect(teams).toHaveLength(1);
    expect(teams[0]['name']).toBe('agc-education');
  });

  it('chipset budget total_allocated is "6.0%"', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const budget = data['budget'] as Record<string, unknown>;
    expect(budget['total_allocated']).toBe('6.0%');
  });

  it('every skill referenced by an agent exists in the skills section', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const skills = data['skills'] as Array<Record<string, unknown>>;
    const skillNames = new Set(skills.map((s) => s['name']));
    const agents = data['agents'] as Array<Record<string, unknown>>;
    for (const agent of agents) {
      const agentSkills = agent['skills'] as string[];
      for (const skill of agentSkills) {
        expect(skillNames.has(skill)).toBe(true);
      }
    }
  });

  it('every agent referenced by a team exists in the agents section', () => {
    const content = readFileSync(chipsetPath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;
    const agents = data['agents'] as Array<Record<string, unknown>>;
    const agentNames = new Set(agents.map((a) => a['name']));
    const teams = data['teams'] as Array<Record<string, unknown>>;
    for (const team of teams) {
      const members = team['members'] as string[];
      for (const member of members) {
        expect(agentNames.has(member)).toBe(true);
      }
    }
  });
});

// ============================================================================
// AGCI-03: Dashboard widgets display AGC telemetry
// ============================================================================

describe('AGCI-03: Dashboard widgets', () => {
  it('all 6 widget IDs present in AGC_WIDGETS', () => {
    expect(AGC_WIDGETS).toHaveLength(6);
    const ids = AGC_WIDGETS.map((w) => w.widget_id);
    expect(ids).toContain('agc-registers');
    expect(ids).toContain('agc-memory-map');
    expect(ids).toContain('agc-executive-state');
    expect(ids).toContain('agc-dsky-display');
    expect(ids).toContain('agc-telemetry-feed');
    expect(ids).toContain('agc-instruction-trace');
  });

  it('every widget data_source references block_type.output_name format', () => {
    for (const widget of AGC_WIDGETS) {
      expect(widget.data_source).toMatch(/^[a-z-]+\.[a-z_]+$/);
    }
  });

  it('all render functions produce non-empty HTML with valid structure', () => {
    const registerHtml = renderRegisterWidget({ registers: [{ name: 'A', value: 0 }] });
    expect(registerHtml).toContain('<');
    expect(registerHtml).toContain('>');
    expect(registerHtml.length).toBeGreaterThan(10);

    const memoryHtml = renderMemoryMapWidget({
      banks: [{ id: 0, type: 'erasable', accessCount: 1 }],
      currentAddress: 0,
    });
    expect(memoryHtml).toContain('<');
    expect(memoryHtml.length).toBeGreaterThan(10);

    const execHtml = renderExecutiveWidget({
      coreSets: [{ id: 0, state: 'FREE', priority: 0 }],
      alarms: [],
    });
    expect(execHtml).toContain('<');
    expect(execHtml.length).toBeGreaterThan(10);

    const dskyHtml = renderDskyWidget({
      registers: { r1: '+00000', r2: '+00000', r3: '+00000' },
      verb: '00', noun: '00', prog: '00',
      annunciators: {},
    });
    expect(dskyHtml).toContain('<');
    expect(dskyHtml.length).toBeGreaterThan(10);

    const telemHtml = renderTelemetryWidget({
      entries: [{ timestamp: 0, channel: 0, data: 0, interpretation: 'test' }],
    });
    expect(telemHtml).toContain('<');
    expect(telemHtml.length).toBeGreaterThan(10);

    const traceHtml = renderInstructionTraceWidget({
      instructions: [{ address: 0, opcode: 0, mnemonic: 'TC', operand: '', effect: '' }],
    });
    expect(traceHtml).toContain('<');
    expect(traceHtml.length).toBeGreaterThan(10);
  });

  it('all render functions handle empty/minimal data without throwing', () => {
    expect(() => renderRegisterWidget({ registers: [] })).not.toThrow();
    expect(() => renderMemoryMapWidget({ banks: [], currentAddress: 0 })).not.toThrow();
    expect(() => renderExecutiveWidget({ coreSets: [], alarms: [] })).not.toThrow();
    expect(() => renderDskyWidget({
      registers: { r1: '', r2: '', r3: '' },
      verb: '', noun: '', prog: '',
      annunciators: {},
    })).not.toThrow();
    expect(() => renderTelemetryWidget({ entries: [] })).not.toThrow();
    expect(() => renderInstructionTraceWidget({ instructions: [] })).not.toThrow();
  });
});

// ============================================================================
// AGCI-04: Standalone pack verification
// ============================================================================

describe('AGCI-04: Standalone pack', () => {
  it('AGC_PACK_MANIFEST.standalone is true', () => {
    expect(AGC_PACK_MANIFEST.standalone).toBe(true);
  });

  it('pack barrel exports all expected symbols', async () => {
    // Verify by dynamic import from pack barrel
    const packExports = await import('../index.js');
    expect(packExports.AGC_BLOCKS).toBeDefined();
    expect(packExports.AGC_WIDGETS).toBeDefined();
    expect(packExports.AGC_PACK_MANIFEST).toBeDefined();
    expect(packExports.ROPE_SOURCES).toBeDefined();
  });

  it('isPackInstalled returns true when agc-educational.yaml exists in .chipset/', () => {
    const chipsetDir = join(process.cwd(), '.chipset');
    expect(isPackInstalled(chipsetDir)).toBe(true);
  });

  it('isPackInstalled returns false for a temp directory without the yaml', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agc-integ-'));
    try {
      expect(isPackInstalled(dir)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AGCI-05: Virtual AGC flight software binaries
// ============================================================================

describe('AGCI-05: Virtual AGC binaries', () => {
  it('ROPE_SOURCES has at least 3 entries', () => {
    expect(ROPE_SOURCES.length).toBeGreaterThanOrEqual(3);
  });

  it('all rope source URLs start with https://virtualagc.github.io/', () => {
    for (const source of ROPE_SOURCES) {
      expect(source.url).toMatch(/^https:\/\/virtualagc\.github\.io\//);
    }
  });

  it('Luminary 099 (Apollo 11 LM) is present', () => {
    const lm = ROPE_SOURCES.find((s) => s.id === 'luminary099');
    expect(lm).toBeDefined();
    expect(lm!.mission).toBe('Apollo 11');
  });

  it('Colossus 249 (Apollo 11 CM) is present', () => {
    const cm = ROPE_SOURCES.find((s) => s.id === 'colossus249');
    expect(cm).toBeDefined();
    expect(cm!.mission).toBe('Apollo 11');
  });

  it('all rope sources have wordCount of 36864', () => {
    for (const source of ROPE_SOURCES) {
      expect(source.wordCount).toBe(36864);
    }
  });

  it('locateRopeImage("luminary099") returns { found: true }', () => {
    const result = locateRopeImage('luminary099');
    expect(result.found).toBe(true);
  });

  it('validateRopeImage with correct-length array returns { valid: true }', () => {
    const words = new Array(36864).fill(0);
    expect(validateRopeImage(words)).toEqual({ valid: true });
  });
});

// ============================================================================
// Cross-cutting: block-to-widget wiring verification
// ============================================================================

describe('Block-to-widget wiring', () => {
  it('every widget data_source references a valid AGC block port or config entry', () => {
    // Map of block_type to all port names (inputs + outputs)
    // Widgets can read from output ports (register_state, visualization_data)
    // or input ports (display_data flows INTO the DSKY for rendering)
    const blockPorts = new Map<string, Set<string>>();
    for (const block of AGC_BLOCKS) {
      const ports = new Set([
        ...block.inputs.map((i) => i.name),
        ...block.outputs.map((o) => o.name),
      ]);
      blockPorts.set(block.block_type, ports);
    }

    // Known config-level data sources (not ports but valid bindings):
    // - agc-memory.memory_map: memory system output (core sim, not a pack block)
    // - agc-peripheral-bus.downlink_stub: peripheral config stub for telemetry capture
    const configSources = new Set([
      'agc-memory.memory_map',
      'agc-peripheral-bus.downlink_stub',
    ]);

    for (const widget of AGC_WIDGETS) {
      const [blockType, portName] = widget.data_source.split('.');

      // Skip config-level sources (valid but not port names)
      if (configSources.has(widget.data_source)) {
        expect(blockType).toMatch(/^agc-/);
        continue;
      }

      // For pack blocks, verify the port exists
      const ports = blockPorts.get(blockType);
      expect(ports).toBeDefined();
      expect(ports!.has(portName)).toBe(true);
    }
  });
});
