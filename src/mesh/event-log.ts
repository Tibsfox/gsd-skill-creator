/**
 * Append-only mesh event log using JSON Lines format.
 *
 * IMP-07: Uses fs.appendFile exclusively -- no overwrite possible by construction.
 * The API surface does not accept any flag or option that could enable overwrite.
 * This mirrors the v1.49.14 HealthEventWriter pattern (src/integration/health-event-writer.ts).
 *
 * File format: JSON Lines (.jsonl), one MeshEvent per line.
 * Never modifies existing records.
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MeshEvent, MeshEventType } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Input for writing a mesh event.
 * id and timestamp are generated automatically.
 */
export interface WriteMeshEventInput {
  /** ID of the node this event relates to */
  nodeId: string;
  /** What happened */
  eventType: MeshEventType;
  /** Structured context payload */
  payload: Record<string, unknown>;
}

// ─── Event builder ────────────────────────────────────────────────────────────

/**
 * Builds a MeshEvent from WriteMeshEventInput, generating id and timestamp.
 * Pure function -- no IO.
 */
export function buildMeshEvent(input: WriteMeshEventInput): MeshEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    nodeId: input.nodeId,
    eventType: input.eventType,
    payload: input.payload,
  };
}

// ─── Core functions ────────────────────────────────────────────────────────────

/**
 * Appends a MeshEvent to the event log file.
 * Creates the file (and parent dirs) if they don't exist.
 *
 * CRITICAL (IMP-07): Uses fs.appendFile -- NEVER fs.writeFile.
 * The function signature accepts no flag or option that could enable overwrite.
 * Append-only by construction.
 *
 * Returns the written event (with generated id and timestamp).
 */
export async function writeMeshEvent(
  logPath: string,
  input: WriteMeshEventInput,
): Promise<MeshEvent> {
  const event = buildMeshEvent(input);
  await fs.mkdir(dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, JSON.stringify(event) + '\n', 'utf-8');
  return event;
}

/**
 * Reads all MeshEvents from the event log file.
 * Returns [] when the file doesn't exist (ENOENT).
 * Skips corrupt lines without throwing.
 *
 * File format: JSON Lines (.jsonl), one MeshEvent per line.
 */
export async function readMeshEvents(logPath: string): Promise<MeshEvent[]> {
  let content: string;
  try {
    content = await fs.readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const events: MeshEvent[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as MeshEvent);
    } catch {
      // Skip corrupt lines without throwing
    }
  }
  return events;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/**
 * Stateful wrapper for mesh event log IO.
 * Provides a bound API surface for a specific log file path.
 *
 * All writes use fs.appendFile -- overwrite is impossible by construction (IMP-07).
 */
export class MeshEventLog {
  constructor(private readonly logPath: string) {}

  /**
   * Appends a MeshEvent to the log.
   * Returns the written event with generated id and timestamp.
   */
  write(input: WriteMeshEventInput): Promise<MeshEvent> {
    return writeMeshEvent(this.logPath, input);
  }

  /**
   * Reads all events from the log.
   * Returns [] if the log file doesn't exist.
   */
  readAll(): Promise<MeshEvent[]> {
    return readMeshEvents(this.logPath);
  }
}
