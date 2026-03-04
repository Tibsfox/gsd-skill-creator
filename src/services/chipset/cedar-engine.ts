/**
 * Cedar integrity engine — scribe, oracle, and sentinel.
 *
 * Maintains an append-only, content-addressed timeline.
 * Detects integrity violations and voice inconsistencies.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { TimelineEntry, TimelineQuery, IntegrityReport, SuspiciousPattern, TimelineCategory } from './cedar-timeline.js';

export class CedarEngine {
  // Stub
  record(_entry: { timestamp: string; source: string; category: TimelineCategory; content: string; references: string[] }): TimelineEntry {
    throw new Error('Not implemented');
  }

  query(_q: TimelineQuery): TimelineEntry[] {
    throw new Error('Not implemented');
  }

  verifyIntegrity(): IntegrityReport {
    throw new Error('Not implemented');
  }

  checkVoiceConsistency(_museId: MuseId, _output: string): SuspiciousPattern | null {
    throw new Error('Not implemented');
  }

  allEntries(): TimelineEntry[] {
    throw new Error('Not implemented');
  }
}
