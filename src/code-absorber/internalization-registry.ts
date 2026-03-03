/**
 * Append-only registry for completed absorptions.
 *
 * ABSB-05: Records algorithm name, source package, verification results,
 * date absorbed, and observation period status.
 *
 * File format: JSON Lines (.jsonl), one AbsorptionRecord per line.
 * Never modifies existing records — only appends.
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { AbsorptionRecord } from './types.js';

// ─── Core functions ────────────────────────────────────────────────────────────

/**
 * Appends a new AbsorptionRecord to the registry file.
 * Creates the file (and parent dirs) if it doesn't exist.
 * Never modifies existing records.
 */
export async function appendRecord(
  registryPath: string,
  record: AbsorptionRecord,
): Promise<void> {
  await fs.mkdir(dirname(registryPath), { recursive: true });
  const line = JSON.stringify(record) + '\n';
  await fs.appendFile(registryPath, line, 'utf-8');
}

/**
 * Reads all AbsorptionRecords from the registry file.
 * Returns [] when the file doesn't exist.
 * Skips lines that fail to parse (corrupt entries).
 */
export async function readAllRecords(
  registryPath: string,
): Promise<AbsorptionRecord[]> {
  let content: string;
  try {
    content = await fs.readFile(registryPath, 'utf-8');
  } catch {
    return [];
  }

  const records: AbsorptionRecord[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as AbsorptionRecord);
    } catch {
      // Skip corrupt lines without throwing
    }
  }
  return records;
}

/**
 * Computes observation period status for an AbsorptionRecord.
 *
 * Uses floor division to compute whole elapsed days.
 * Accepts optional nowIso for deterministic testing.
 */
export function computeObservationStatus(
  record: AbsorptionRecord,
  nowIso?: string,
): { elapsedDays: number; isComplete: boolean } {
  const now = new Date(nowIso ?? new Date().toISOString());
  const absorbed = new Date(record.dateAbsorbed);
  const elapsedMs = now.getTime() - absorbed.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return {
    elapsedDays,
    isComplete: elapsedDays >= record.observationPeriodDays,
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for the internalization registry. */
export class InternalizationRegistry {
  constructor(private readonly registryPath: string) {}

  append(record: AbsorptionRecord): Promise<void> {
    return appendRecord(this.registryPath, record);
  }

  readAll(): Promise<AbsorptionRecord[]> {
    return readAllRecords(this.registryPath);
  }

  computeObservationStatus(
    record: AbsorptionRecord,
    nowIso?: string,
  ): { elapsedDays: number; isComplete: boolean } {
    return computeObservationStatus(record, nowIso);
  }
}
