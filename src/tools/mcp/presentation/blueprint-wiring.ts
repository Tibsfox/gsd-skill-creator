/**
 * Type-safe wiring validation engine for the Blueprint Editor.
 *
 * Enforces connection rules between block ports based on port type
 * compatibility and direction. Invalid wiring attempts produce
 * descriptive error messages for the user.
 *
 * Satisfies PRES-04 (block wiring rules enforce type-safe connections).
 *
 * @module mcp/presentation/blueprint-wiring
 */

import type { BlockPort, PortType, WiringRule, WiringValidation } from './types.js';

// ============================================================================
// Wiring Rules
// ============================================================================

/**
 * Complete set of wiring rules defining port type compatibility.
 *
 * Rules are checked in order. The first matching rule determines the outcome.
 * Unlisted combinations default to NOT ALLOWED.
 */
export const WIRING_RULES: WiringRule[] = [
  // Valid connections
  { fromPortType: 'tool-call',    toPortType: 'agent-input',   allowed: true },
  { fromPortType: 'tool-result',  toPortType: 'agent-input',   allowed: true },
  { fromPortType: 'resource-data', toPortType: 'context',      allowed: true },
  { fromPortType: 'agent-output', toPortType: 'tool-call',     allowed: true },
  { fromPortType: 'agent-output', toPortType: 'agent-input',   allowed: true },
  { fromPortType: 'tool-result',  toPortType: 'context',       allowed: true },

  // Explicitly invalid connections with descriptive reasons
  {
    fromPortType: 'resource-data',
    toPortType: 'tool-call',
    allowed: false,
    reason: 'Resources cannot be wired directly to tool inputs; use a context port instead',
  },
  {
    fromPortType: 'resource-data',
    toPortType: 'agent-input',
    allowed: false,
    reason: 'Resources cannot be wired directly to agent inputs; use a context port instead',
  },
  {
    fromPortType: 'tool-result',
    toPortType: 'resource-data',
    allowed: false,
    reason: 'Tool results are not resources; wire to an agent input or context port instead',
  },
  {
    fromPortType: 'tool-call',
    toPortType: 'resource-data',
    allowed: false,
    reason: 'Tool calls cannot produce resource data',
  },
  {
    fromPortType: 'tool-call',
    toPortType: 'context',
    allowed: false,
    reason: 'Tool calls cannot be wired to context ports; use resource-data or tool-result instead',
  },
  {
    fromPortType: 'context',
    toPortType: 'tool-call',
    allowed: false,
    reason: 'Context ports are input-only; they cannot drive tool calls',
  },
];

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate whether two ports can be wired together.
 *
 * Checks:
 * 1. Direction compatibility (must be output -> input)
 * 2. Not wiring same direction together
 * 3. Port type compatibility against WIRING_RULES
 *
 * @param fromPort - The source port (wire start).
 * @param toPort - The target port (wire end).
 * @returns Validation result with error message if invalid.
 */
export function validateWiring(fromPort: BlockPort, toPort: BlockPort): WiringValidation {
  // Direction check: must be output -> input
  if (fromPort.direction === 'output' && toPort.direction === 'output') {
    return {
      valid: false,
      error: 'Cannot wire two outputs together',
      fromPort,
      toPort,
    };
  }

  if (fromPort.direction === 'input' && toPort.direction === 'input') {
    return {
      valid: false,
      error: 'Cannot wire two inputs together',
      fromPort,
      toPort,
    };
  }

  if (fromPort.direction !== 'output' || toPort.direction !== 'input') {
    return {
      valid: false,
      error: 'Wiring must go from an output port to an input port',
      fromPort,
      toPort,
    };
  }

  // Same port type check
  if (fromPort.portType === toPort.portType) {
    return {
      valid: false,
      error: 'Cannot wire same port types together',
      fromPort,
      toPort,
    };
  }

  // Check against wiring rules
  const rule = WIRING_RULES.find(
    (r) => r.fromPortType === fromPort.portType && r.toPortType === toPort.portType,
  );

  if (rule) {
    if (rule.allowed) {
      return { valid: true, fromPort, toPort };
    }
    return {
      valid: false,
      error: rule.reason ?? `Cannot wire ${fromPort.portType} to ${toPort.portType}`,
      fromPort,
      toPort,
    };
  }

  // No explicit rule found -- default to not allowed
  return {
    valid: false,
    error: `No wiring rule allows ${fromPort.portType} to ${toPort.portType}`,
    fromPort,
    toPort,
  };
}

/**
 * Find all ports compatible with a source port from a list of candidates.
 *
 * Used for UI highlighting of valid drop targets during drag-and-wire.
 *
 * @param sourcePort - The port being dragged from.
 * @param availablePorts - Candidate ports to check compatibility against.
 * @returns Array of compatible ports.
 */
export function getCompatiblePorts(
  sourcePort: BlockPort,
  availablePorts: BlockPort[],
): BlockPort[] {
  return availablePorts.filter((candidate) => {
    const validation = validateWiring(sourcePort, candidate);
    return validation.valid;
  });
}
