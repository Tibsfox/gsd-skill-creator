/**
 * DACP backward-compatible .msg fallback generation.
 *
 * Every DACP bundle produces a companion .msg file readable by non-DACP
 * agents through the existing Den filesystem bus. This guarantees backward
 * compatibility: removing DACP never breaks existing workflows.
 *
 * The .msg payload includes a [DACP:L{N}] marker on the first line so
 * DACP-aware agents can detect enriched bundles alongside the fallback.
 *
 * @module dacp/msg-fallback
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { formatTimestamp, encodeMessage, messageFilename } from '../den/encoder.js';
import type { BusMessage, MessageHeader, Opcode, AgentId } from '../den/types.js';
import { BundleManifestSchema } from './types.js';
import type { BundleManifest, BusOpcode } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum characters of intent markdown to include in .msg payload. */
const MAX_INTENT_CHARS = 500;

/** Default priority for .msg fallback files (ARTIFACT level). */
const DEFAULT_PRIORITY = 4;

/**
 * Map DACP opcodes to the closest Den ISA opcode.
 * EXEC maps directly. Others map to the semantically closest equivalent.
 */
const DACP_TO_DEN_OPCODE: Record<BusOpcode, Opcode> = {
  EXEC: 'EXEC',
  VERIFY: 'CMP',
  TRANSFORM: 'SEND',
  CONFIG: 'SEND',
  RESEARCH: 'QUERY',
  REPORT: 'STATUS',
  QUESTION: 'QUERY',
  PATCH: 'MOV',
  ALERT: 'STATUS',
};

/**
 * Map DACP agent names to valid Den AgentId values.
 * Falls back to 'coordinator' for unknown agents.
 */
const VALID_AGENT_IDS = new Set<string>([
  'coordinator', 'relay', 'planner', 'configurator',
  'monitor', 'dispatcher', 'verifier', 'chronicler',
  'sentinel', 'executor', 'all', 'user',
]);

// ============================================================================
// Types
// ============================================================================

/** Options for generating .msg fallback files. */
export interface MsgFallbackOptions {
  /** Override the default priority (4 = ARTIFACT). */
  priority?: number;
  /** Output directory for the .msg file. Defaults to bundle's parent directory. */
  outputDir?: string;
}

// ============================================================================
// Opcode & Agent mapping
// ============================================================================

/**
 * Map a DACP opcode to the closest Den ISA opcode.
 * Falls back to 'SEND' for unrecognized opcodes.
 */
function mapOpcode(dacpOpcode: string): Opcode {
  return DACP_TO_DEN_OPCODE[dacpOpcode as BusOpcode] ?? 'SEND';
}

/**
 * Map a DACP agent name to a valid Den AgentId.
 * Returns the name as-is if it's a valid Den agent ID, otherwise 'coordinator'.
 */
function mapAgentId(agentName: string): AgentId {
  if (VALID_AGENT_IDS.has(agentName)) {
    return agentName as AgentId;
  }
  return 'coordinator';
}

// ============================================================================
// Core conversion
// ============================================================================

/**
 * Convert a DACP bundle's manifest + intent into a standard BusMessage.
 *
 * Payload format:
 *   Line 1: [DACP:L{fidelity_level}] marker
 *   Line 2: Intent summary from manifest
 *   Line 3: ---
 *   Line 4+: First 500 chars of intent markdown (truncated if longer)
 *
 * @param manifest - Bundle manifest (validated)
 * @param intentMarkdown - Human-readable intent content
 * @param priority - Optional priority override (default: 4)
 * @returns Standard BusMessage for Den bus encoding
 */
export function bundleToMsgContent(
  manifest: BundleManifest,
  intentMarkdown: string,
  priority?: number,
): BusMessage {
  // Build payload lines
  const payloadLines: string[] = [];

  // Line 1: DACP marker
  payloadLines.push(`[DACP:L${manifest.fidelity_level}]`);

  // Line 2: Intent summary
  payloadLines.push(manifest.intent_summary);

  // Line 3: Separator
  payloadLines.push('---');

  // Line 4+: Intent markdown (truncated at MAX_INTENT_CHARS)
  let intentContent = intentMarkdown;
  if (intentContent.length > MAX_INTENT_CHARS) {
    intentContent = intentContent.slice(0, MAX_INTENT_CHARS) + '... [truncated, see .bundle/]';
  }
  // Split multiline intent into separate payload lines
  const intentLines = intentContent.split('\n');
  payloadLines.push(...intentLines);

  // Parse timestamp from provenance if available
  let timestamp: string;
  try {
    const date = new Date(manifest.provenance.assembled_at);
    if (isNaN(date.getTime())) {
      timestamp = formatTimestamp(new Date());
    } else {
      timestamp = formatTimestamp(date);
    }
  } catch {
    timestamp = formatTimestamp(new Date());
  }

  // Build header
  const header: MessageHeader = {
    timestamp,
    priority: priority ?? DEFAULT_PRIORITY,
    opcode: mapOpcode(manifest.opcode),
    src: mapAgentId(manifest.source_agent),
    dst: mapAgentId(manifest.target_agent),
    length: payloadLines.length,
  };

  return { header, payload: payloadLines };
}

/**
 * Generate a backward-compatible .msg file from a DACP bundle directory.
 *
 * Reads manifest.json and intent.md from the bundle, converts to a
 * BusMessage, encodes with the Den encoder, and writes as a sibling
 * .msg file in the same directory (or a specified output directory).
 *
 * @param bundlePath - Path to the DACP bundle directory
 * @param outputDir - Optional output directory (defaults to bundle's parent)
 * @param priority - Optional priority override
 * @returns Full path to the generated .msg file
 */
export async function generateMsgFallback(
  bundlePath: string,
  outputDir?: string,
  priority?: number,
): Promise<string> {
  // Read manifest and intent from bundle
  const manifestRaw = await readFile(join(bundlePath, 'manifest.json'), 'utf8');
  const manifest = BundleManifestSchema.parse(JSON.parse(manifestRaw));

  const intentMarkdown = await readFile(join(bundlePath, 'intent.md'), 'utf8');

  // Convert to BusMessage
  const msg = bundleToMsgContent(manifest, intentMarkdown, priority);

  // Encode to .msg format
  const encoded = encodeMessage(msg);

  // Generate filename
  const filename = messageFilename(msg.header);

  // Write .msg file
  const targetDir = outputDir ?? dirname(bundlePath);
  const msgPath = join(targetDir, filename);
  await writeFile(msgPath, encoded, 'utf8');

  return msgPath;
}
