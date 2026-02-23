/**
 * Circuit File Format
 *
 * Serialization format for saving and loading circuit definitions.
 * Implemented in Phase 263 Plan 03.
 *
 * Provides save/load with checksum integrity verification and
 * circuitToComponents conversion for MNA engine consumption.
 */

import type { Component } from '../simulator/components.js';

/** A connection between component pins and circuit nodes */
export interface Connection {
  componentId: string;
  pin: string;
  node: string;
}

/** Circuit metadata */
export interface CircuitMetadata {
  name: string;
  description: string;
  author: string;
  created: number;
  modified: number;
  module?: string; // associated module ID
  lab?: string;    // associated lab ID
}

/** Complete circuit definition */
export interface CircuitDefinition {
  components: Array<{
    id: string;
    type: string;
    params: Record<string, number | string>;
  }>;
  connections: Connection[];
  metadata: CircuitMetadata;
}

/** Saved circuit file with format versioning */
export interface SavedCircuit {
  formatVersion: '1.0';
  circuit: CircuitDefinition;
  checksum: string;
}

// ============================================================================
// Checksum (FNV-1a hash for tamper detection, not cryptographic)
// ============================================================================

/**
 * Compute an FNV-1a hash of a string and return as hex.
 * Simple, fast, deterministic -- suitable for tamper detection.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Convert to unsigned 32-bit and return as hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Deterministically serialize a CircuitDefinition to JSON with sorted keys.
 */
function deterministicSerialize(def: CircuitDefinition): string {
  return JSON.stringify(def, Object.keys(def).sort());
}

// ============================================================================
// Save / Load / Convert
// ============================================================================

/**
 * Save a CircuitDefinition to a SavedCircuit with checksum integrity.
 *
 * Serializes the definition deterministically (sorted keys) and computes
 * an FNV-1a checksum for tamper detection.
 *
 * @param definition - The circuit to save
 * @returns SavedCircuit with formatVersion, circuit, and checksum
 */
export function saveCircuit(definition: CircuitDefinition): SavedCircuit {
  const json = deterministicSerialize(definition);
  const checksum = fnv1aHash(json);
  return {
    formatVersion: '1.0',
    circuit: definition,
    checksum,
  };
}

/**
 * Load a CircuitDefinition from a SavedCircuit with integrity verification.
 *
 * Validates format version, checksum integrity, and required fields.
 *
 * @param saved - The saved circuit to load
 * @returns The reconstructed CircuitDefinition
 * @throws Error if format version is unsupported, checksum mismatches, or required fields missing
 */
export function loadCircuit(saved: SavedCircuit): CircuitDefinition {
  // Validate format version
  if (saved.formatVersion !== '1.0') {
    throw new Error(`Unsupported circuit format version: ${saved.formatVersion}`);
  }

  // Validate required structure
  if (!saved.circuit) {
    throw new Error('Circuit file missing circuit definition');
  }
  if (!Array.isArray(saved.circuit.components)) {
    throw new Error('Circuit file missing components array');
  }
  if (!Array.isArray(saved.circuit.connections)) {
    throw new Error('Circuit file missing connections array');
  }
  if (!saved.circuit.metadata || !saved.circuit.metadata.name) {
    throw new Error('Circuit file missing metadata.name');
  }

  // Verify checksum integrity
  const json = deterministicSerialize(saved.circuit);
  const expectedChecksum = fnv1aHash(json);
  if (saved.checksum !== expectedChecksum) {
    throw new Error('Circuit file checksum mismatch -- file may be corrupted');
  }

  return saved.circuit;
}

/**
 * Convert a CircuitDefinition to an array of MNA-compatible Component objects.
 *
 * Maps each element in the definition to the corresponding Component type,
 * deriving node connections from the connections array.
 *
 * Pin mapping:
 *   - "+" or "1" maps to nodes[0] (positive terminal)
 *   - "-" or "2" maps to nodes[1] (negative terminal)
 *
 * @param definition - The circuit definition to convert
 * @returns Array of Component objects ready for MNA engine
 */
export function circuitToComponents(definition: CircuitDefinition): Component[] {
  return definition.components.map((elem) => {
    // Find connections for this component
    const conns = definition.connections.filter((c) => c.componentId === elem.id);

    // Derive nodes from connections using pin mapping
    let node0 = '0'; // default to ground
    let node1 = '0';
    for (const conn of conns) {
      if (conn.pin === '+' || conn.pin === '1') {
        node0 = conn.node;
      } else if (conn.pin === '-' || conn.pin === '2') {
        node1 = conn.node;
      }
    }

    const nodes: [string, string] = [node0, node1];

    switch (elem.type) {
      case 'resistor':
        return {
          id: elem.id,
          type: 'resistor' as const,
          nodes,
          resistance: elem.params.resistance as number,
        };

      case 'capacitor':
        return {
          id: elem.id,
          type: 'capacitor' as const,
          nodes,
          capacitance: elem.params.capacitance as number,
        };

      case 'inductor':
        return {
          id: elem.id,
          type: 'inductor' as const,
          nodes,
          inductance: elem.params.inductance as number,
        };

      case 'voltage-source':
        return {
          id: elem.id,
          type: 'voltage-source' as const,
          nodes,
          voltage: elem.params.voltage as number,
        };

      case 'current-source':
        return {
          id: elem.id,
          type: 'current-source' as const,
          nodes,
          current: elem.params.current as number,
        };

      case 'diode':
        return {
          id: elem.id,
          type: 'diode' as const,
          nodes,
          saturationCurrent: (elem.params.saturationCurrent as number) ?? 1e-14,
          thermalVoltage: (elem.params.thermalVoltage as number) ?? 0.026,
        };

      default:
        throw new Error(`Unknown component type: ${elem.type}`);
    }
  });
}
