/**
 * Circuit File Format
 *
 * Serialization format for saving and loading circuit definitions.
 * To be implemented in Phase 263.
 */

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
