/**
 * Tests for provenance tracking -- ProvenanceHeader creation, hop accumulation,
 * immutability, serialization, and parsing.
 *
 * TDD: tests written before implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  createProvenanceHeader,
  addHop,
  getTotalHops,
  serializeProvenance,
  parseProvenance,
  ProvenanceHeaderSchema,
} from './provenance.js';

describe('createProvenanceHeader', () => {
  it('creates header with origin nodeId and nodeName', () => {
    const header = createProvenanceHeader('node-001', 'Alpha Node');
    expect(header.origin.nodeId).toBe('node-001');
    expect(header.origin.nodeName).toBe('Alpha Node');
  });

  it('creates header with empty hops array', () => {
    const header = createProvenanceHeader('node-001', 'Alpha Node');
    expect(header.hops).toEqual([]);
  });

  it('creates header with a valid ISO createdAt timestamp', () => {
    const before = new Date().toISOString();
    const header = createProvenanceHeader('node-001', 'Alpha Node');
    const after = new Date().toISOString();
    expect(header.createdAt >= before).toBe(true);
    expect(header.createdAt <= after).toBe(true);
  });

  it('validates against ProvenanceHeaderSchema', () => {
    const header = createProvenanceHeader('node-abc', 'Test Node');
    const result = ProvenanceHeaderSchema.safeParse(header);
    expect(result.success).toBe(true);
  });
});

describe('addHop', () => {
  it('appends a hop entry with nodeId and nodeName', () => {
    const header = createProvenanceHeader('origin', 'Origin Node');
    const updated = addHop(header, 'hop-1', 'Hop Node 1');
    expect(updated.hops).toHaveLength(1);
    expect(updated.hops[0].nodeId).toBe('hop-1');
    expect(updated.hops[0].nodeName).toBe('Hop Node 1');
  });

  it('assigns sequential hopIndex starting at 0', () => {
    const h0 = createProvenanceHeader('origin', 'Origin');
    const h1 = addHop(h0, 'n1', 'Node 1');
    const h2 = addHop(h1, 'n2', 'Node 2');
    const h3 = addHop(h2, 'n3', 'Node 3');
    expect(h3.hops[0].hopIndex).toBe(0);
    expect(h3.hops[1].hopIndex).toBe(1);
    expect(h3.hops[2].hopIndex).toBe(2);
  });

  it('after 3 addHop calls, totalHops is 3 and hops array has 3 entries', () => {
    const h0 = createProvenanceHeader('origin', 'Origin');
    const h1 = addHop(h0, 'n1', 'Node 1');
    const h2 = addHop(h1, 'n2', 'Node 2');
    const h3 = addHop(h2, 'n3', 'Node 3');
    expect(getTotalHops(h3)).toBe(3);
    expect(h3.hops).toHaveLength(3);
  });

  it('does NOT mutate the original header (immutable)', () => {
    const original = createProvenanceHeader('origin', 'Origin');
    const updated = addHop(original, 'n1', 'Node 1');
    // Original must remain unchanged
    expect(original.hops).toHaveLength(0);
    expect(updated.hops).toHaveLength(1);
    expect(updated).not.toBe(original);
  });

  it('each hop has an arrivedAt ISO timestamp', () => {
    const header = createProvenanceHeader('origin', 'Origin');
    const before = new Date().toISOString();
    const updated = addHop(header, 'n1', 'Node 1');
    const after = new Date().toISOString();
    const hop = updated.hops[0];
    expect(hop.arrivedAt >= before).toBe(true);
    expect(hop.arrivedAt <= after).toBe(true);
  });

  it('preserves origin when adding hops', () => {
    const header = createProvenanceHeader('origin-node', 'Origin');
    const updated = addHop(addHop(header, 'n1', 'N1'), 'n2', 'N2');
    expect(updated.origin.nodeId).toBe('origin-node');
    expect(updated.origin.nodeName).toBe('Origin');
  });
});

describe('getTotalHops', () => {
  it('returns 0 for a freshly created header', () => {
    const header = createProvenanceHeader('origin', 'Origin');
    expect(getTotalHops(header)).toBe(0);
  });

  it('returns hops.length', () => {
    let header = createProvenanceHeader('origin', 'Origin');
    header = addHop(header, 'n1', 'N1');
    header = addHop(header, 'n2', 'N2');
    expect(getTotalHops(header)).toBe(2);
  });
});

describe('serializeProvenance / parseProvenance round-trip', () => {
  it('serializes to a non-empty JSON string', () => {
    const header = createProvenanceHeader('node-a', 'Node A');
    const json = serializeProvenance(header);
    expect(typeof json).toBe('string');
    expect(json.length).toBeGreaterThan(0);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('parseProvenance returns the original header after round-trip', () => {
    const original = addHop(createProvenanceHeader('node-a', 'Node A'), 'node-b', 'Node B');
    const json = serializeProvenance(original);
    const parsed = parseProvenance(json);
    expect(parsed.origin).toEqual(original.origin);
    expect(parsed.hops).toEqual(original.hops);
    expect(parsed.createdAt).toBe(original.createdAt);
  });

  it('parseProvenance throws on invalid JSON', () => {
    expect(() => parseProvenance('not-json')).toThrow();
  });

  it('parseProvenance throws on JSON missing required fields', () => {
    const invalid = JSON.stringify({ origin: { nodeId: 'x' } }); // missing hops, createdAt
    expect(() => parseProvenance(invalid)).toThrow();
  });

  it('parseProvenance throws on null', () => {
    expect(() => parseProvenance('null')).toThrow();
  });
});
