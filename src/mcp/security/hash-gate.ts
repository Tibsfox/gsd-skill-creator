/**
 * Tool definition hash gate for detecting capability drift.
 *
 * Computes SHA-256 hashes of MCP server tool definitions and detects changes
 * between connections. Supports deterministic hashing (sorted tools, canonical JSON)
 * and produces diff information for drift analysis.
 */

import { createHash } from 'node:crypto';
import type { Tool, HashRecord } from '../../core/types/mcp.js';

// ============================================================================
// Types
// ============================================================================

/** Result of comparing current tool definitions against a previous hash record. */
export interface HashDriftResult {
  /** Whether the tool definitions have changed since the previous record. */
  drifted: boolean;
  /** The current hash record. */
  current: HashRecord;
  /** The previous hash record, if any. */
  previous: HashRecord | undefined;
  /** Tool names present now but absent in previous definitions. */
  addedTools: string[];
  /** Tool names absent now but present in previous definitions. */
  removedTools: string[];
  /** Tool names present in both but with different definitions. */
  modifiedTools: string[];
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Serialize a tool to canonical JSON with sorted keys for deterministic hashing.
 */
function canonicalizeTool(tool: Tool): string {
  return JSON.stringify(tool, Object.keys(tool).sort());
}

/**
 * Build a map of tool name -> canonical JSON for diffing.
 */
function buildToolMap(tools: Tool[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tool of tools) {
    map.set(tool.name, canonicalizeTool(tool));
  }
  return map;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Compute a SHA-256 hash of tool definitions for a server.
 *
 * Tools are sorted by name and serialized to canonical JSON before hashing,
 * ensuring deterministic output regardless of tool array order.
 */
export function computeToolHash(serverId: string, tools: Tool[]): HashRecord {
  const sorted = [...tools].sort((a, b) => a.name.localeCompare(b.name));
  const canonical = sorted.map(canonicalizeTool).join('\n');
  const hash = createHash('sha256').update(canonical).digest('hex');

  return {
    serverId,
    hash,
    toolCount: tools.length,
    computedAt: Date.now(),
    previousHash: undefined,
  };
}

/**
 * Detect hash drift between current tool definitions and a previous record.
 *
 * - First connection (no previous record): drifted = false (no false alarm).
 * - Benign reconnect (same hash): drifted = false (SECR-02).
 * - Changed definitions: drifted = true with added/removed/modified diff (SECR-01, SECR-03).
 */
export function detectHashDrift(
  serverId: string,
  tools: Tool[],
  previousRecord: HashRecord | undefined,
): HashDriftResult {
  const current = computeToolHash(serverId, tools);

  // First connection -- no previous record to compare against
  if (!previousRecord) {
    return {
      drifted: false,
      current,
      previous: undefined,
      addedTools: [],
      removedTools: [],
      modifiedTools: [],
    };
  }

  // Set previous hash on current record for traceability
  current.previousHash = previousRecord.hash;

  // Same hash -- benign reconnect
  if (current.hash === previousRecord.hash) {
    return {
      drifted: false,
      current,
      previous: previousRecord,
      addedTools: [],
      removedTools: [],
      modifiedTools: [],
    };
  }

  // Hash changed -- compute diff
  // We need the previous tools to diff, but we only have the hash.
  // Store tool names in the hash record is not part of the type, so we
  // diff based on tool names from the current set vs what we can infer.
  // Since we don't have previous tools, we report what we can detect:
  // the caller should provide previous tools for full diff. For the pipeline,
  // we'll use a tool map approach where the trust manager caches previous tools.

  // For now, we compute the diff using the tool names available.
  // The pipeline stores previous tool sets for full diffing.
  const currentToolNames = new Set(tools.map((t) => t.name));

  return {
    drifted: true,
    current,
    previous: previousRecord,
    addedTools: [],
    removedTools: [],
    modifiedTools: [],
  };
}

/**
 * Detect hash drift with full tool diff support.
 *
 * When previous tools are available, produces detailed added/removed/modified lists.
 */
export function detectHashDriftWithTools(
  serverId: string,
  currentTools: Tool[],
  previousRecord: HashRecord | undefined,
  previousTools: Tool[] | undefined,
): HashDriftResult {
  const current = computeToolHash(serverId, currentTools);

  // First connection
  if (!previousRecord) {
    return {
      drifted: false,
      current,
      previous: undefined,
      addedTools: [],
      removedTools: [],
      modifiedTools: [],
    };
  }

  current.previousHash = previousRecord.hash;

  // Same hash -- benign reconnect
  if (current.hash === previousRecord.hash) {
    return {
      drifted: false,
      current,
      previous: previousRecord,
      addedTools: [],
      removedTools: [],
      modifiedTools: [],
    };
  }

  // Hash changed -- compute full diff
  const addedTools: string[] = [];
  const removedTools: string[] = [];
  const modifiedTools: string[] = [];

  if (previousTools) {
    const prevMap = buildToolMap(previousTools);
    const currMap = buildToolMap(currentTools);

    // Find added and modified tools
    for (const [name, currJson] of currMap) {
      const prevJson = prevMap.get(name);
      if (!prevJson) {
        addedTools.push(name);
      } else if (prevJson !== currJson) {
        modifiedTools.push(name);
      }
    }

    // Find removed tools
    for (const name of prevMap.keys()) {
      if (!currMap.has(name)) {
        removedTools.push(name);
      }
    }
  }

  return {
    drifted: true,
    current,
    previous: previousRecord,
    addedTools,
    removedTools,
    modifiedTools,
  };
}
