import { describe, it, expect } from 'vitest';
import { validateWiring, getCompatiblePorts, WIRING_RULES } from './blueprint-wiring.js';
import type { BlockPort } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePort(overrides: Partial<BlockPort>): BlockPort {
  return {
    id: overrides.id ?? 'port-1',
    name: overrides.name ?? 'test-port',
    direction: overrides.direction ?? 'output',
    portType: overrides.portType ?? 'tool-call',
    connected: overrides.connected ?? false,
  };
}

// ---------------------------------------------------------------------------
// validateWiring (PRES-04)
// ---------------------------------------------------------------------------

describe('validateWiring', () => {
  it('allows tool-call output to agent-input', () => {
    const from = makePort({ direction: 'output', portType: 'tool-call' });
    const to = makePort({ direction: 'input', portType: 'agent-input' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('allows tool-result output to agent-input', () => {
    const from = makePort({ direction: 'output', portType: 'tool-result' });
    const to = makePort({ direction: 'input', portType: 'agent-input' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(true);
  });

  it('allows resource-data output to context input', () => {
    const from = makePort({ direction: 'output', portType: 'resource-data' });
    const to = makePort({ direction: 'input', portType: 'context' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(true);
  });

  it('allows agent-output to tool-call input', () => {
    const from = makePort({ direction: 'output', portType: 'agent-output' });
    const to = makePort({ direction: 'input', portType: 'tool-call' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(true);
  });

  it('rejects output-to-output wiring with error message', () => {
    const from = makePort({ direction: 'output', portType: 'tool-call' });
    const to = makePort({ direction: 'output', portType: 'tool-result' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot wire two outputs together');
  });

  it('rejects input-to-input wiring with error message', () => {
    const from = makePort({ direction: 'input', portType: 'agent-input' });
    const to = makePort({ direction: 'input', portType: 'context' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot wire two inputs together');
  });

  it('rejects resource-data to tool-call with descriptive error', () => {
    const from = makePort({ direction: 'output', portType: 'resource-data' });
    const to = makePort({ direction: 'input', portType: 'tool-call' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Resources cannot be wired directly to tool inputs');
    expect(result.error).toContain('context port');
  });

  it('rejects tool-result to resource-data with error message', () => {
    const from = makePort({ direction: 'output', portType: 'tool-result' });
    const to = makePort({ direction: 'input', portType: 'resource-data' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tool results are not resources');
  });

  it('returns valid: true for allowed connections', () => {
    const from = makePort({ direction: 'output', portType: 'agent-output' });
    const to = makePort({ direction: 'input', portType: 'agent-input' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(true);
    expect(result.fromPort).toEqual(from);
    expect(result.toPort).toEqual(to);
  });

  it('returns valid: false with error string for rejected connections', () => {
    const from = makePort({ direction: 'output', portType: 'tool-call' });
    const to = makePort({ direction: 'input', portType: 'context' });
    const result = validateWiring(from, to);
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getCompatiblePorts
// ---------------------------------------------------------------------------

describe('getCompatiblePorts', () => {
  it('returns only ports that pass validation', () => {
    const source = makePort({ id: 'src', direction: 'output', portType: 'tool-call' });
    const candidates = [
      makePort({ id: 'a', direction: 'input', portType: 'agent-input' }),
      makePort({ id: 'b', direction: 'input', portType: 'context' }),
      makePort({ id: 'c', direction: 'output', portType: 'tool-result' }),
    ];
    const compatible = getCompatiblePorts(source, candidates);
    // tool-call -> agent-input is valid, tool-call -> context is not, output->output is not
    expect(compatible.length).toBe(1);
    expect(compatible[0].id).toBe('a');
  });

  it('filters out incompatible direction ports', () => {
    const source = makePort({ direction: 'output', portType: 'resource-data' });
    const candidates = [
      makePort({ id: 'out1', direction: 'output', portType: 'agent-output' }),
      makePort({ id: 'out2', direction: 'output', portType: 'tool-result' }),
    ];
    const compatible = getCompatiblePorts(source, candidates);
    expect(compatible).toHaveLength(0);
  });

  it('returns empty array when no compatible ports exist', () => {
    const source = makePort({ direction: 'output', portType: 'context' });
    const candidates = [
      makePort({ id: 'a', direction: 'input', portType: 'tool-call' }),
    ];
    const compatible = getCompatiblePorts(source, candidates);
    expect(compatible).toHaveLength(0);
  });

  it('returns multiple compatible ports when available', () => {
    const source = makePort({ direction: 'output', portType: 'agent-output' });
    const candidates = [
      makePort({ id: 'a', direction: 'input', portType: 'tool-call' }),
      makePort({ id: 'b', direction: 'input', portType: 'agent-input' }),
      makePort({ id: 'c', direction: 'input', portType: 'context' }),
    ];
    const compatible = getCompatiblePorts(source, candidates);
    // agent-output -> tool-call and agent-output -> agent-input are valid
    expect(compatible.length).toBe(2);
    expect(compatible.map((p) => p.id).sort()).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// WIRING_RULES export
// ---------------------------------------------------------------------------

describe('WIRING_RULES', () => {
  it('is an array of rules', () => {
    expect(Array.isArray(WIRING_RULES)).toBe(true);
    expect(WIRING_RULES.length).toBeGreaterThan(0);
  });

  it('every rule has fromPortType, toPortType, and allowed', () => {
    for (const rule of WIRING_RULES) {
      expect(typeof rule.fromPortType).toBe('string');
      expect(typeof rule.toPortType).toBe('string');
      expect(typeof rule.allowed).toBe('boolean');
    }
  });
});
