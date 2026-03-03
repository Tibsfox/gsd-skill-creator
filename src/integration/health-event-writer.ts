/**
 * Appends HealthEvents to the append-only health.jsonl file.
 *
 * INTG-01: All events written in append-only fashion — file grows monotonically.
 * INTG-03: Every entry includes timestamp, packageVersion, and decisionRationale.
 *
 * File format: JSON Lines (.jsonl), one HealthEvent per line.
 * Never modifies existing records.
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { HealthEvent, EventType } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WriteEventInput {
  eventType: EventType;
  packageName: string;
  ecosystem: string;
  /** Version of the package at the time of the event (INTG-03). */
  packageVersion: string;
  /** Human-readable rationale for this event (INTG-03). */
  decisionRationale: string;
  /** Structured payload — varies by eventType. */
  payload: Record<string, unknown>;
  /** Project identifier for cross-project pattern detection. */
  projectId: string;
}

// ─── Event builder ────────────────────────────────────────────────────────────

/**
 * Builds a HealthEvent from WriteEventInput, generating id and timestamp.
 */
export function buildHealthEvent(input: WriteEventInput): HealthEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...input,
  };
}

// ─── Core functions ────────────────────────────────────────────────────────────

/**
 * Appends a HealthEvent to the health.jsonl file.
 * Creates the file (and parent dirs) if they don't exist.
 * Uses fs.appendFile — never overwrites existing content.
 *
 * Returns the written event (with generated id and timestamp).
 */
export async function writeEvent(
  healthLogPath: string,
  input: WriteEventInput,
): Promise<HealthEvent> {
  const event = buildHealthEvent(input);
  await fs.mkdir(dirname(healthLogPath), { recursive: true });
  await fs.appendFile(healthLogPath, JSON.stringify(event) + '\n', 'utf-8');
  return event;
}

/**
 * Reads all HealthEvents from the health.jsonl file.
 * Returns [] when the file doesn't exist.
 * Skips corrupt lines without throwing.
 */
export async function readEvents(healthLogPath: string): Promise<HealthEvent[]> {
  let content: string;
  try {
    content = await fs.readFile(healthLogPath, 'utf-8');
  } catch {
    return [];
  }

  const events: HealthEvent[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as HealthEvent);
    } catch {
      // Skip corrupt lines without throwing
    }
  }
  return events;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for HealthEvent persistence. */
export class HealthEventWriter {
  constructor(private readonly healthLogPath: string) {}

  write(input: WriteEventInput): Promise<HealthEvent> {
    return writeEvent(this.healthLogPath, input);
  }

  readAll(): Promise<HealthEvent[]> {
    return readEvents(this.healthLogPath);
  }
}
