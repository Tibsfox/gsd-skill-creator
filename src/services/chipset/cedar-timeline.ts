/**
 * Cedar timeline types — content-addressed append-only event log.
 */

import type { MuseId } from './muse-schema-validator.js';

export type TimelineCategory = 'decision' | 'observation' | 'reading' | 'warning' | 'milestone';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  source: string;
  category: TimelineCategory;
  content: string;
  references: string[];
  hash: string;
}

export interface TimelineQuery {
  category?: TimelineCategory;
  source?: string;
  since?: string;
  until?: string;
  pattern?: string;
  limit?: number;
}

export interface IntegrityReport {
  totalEntries: number;
  chainValid: boolean;
  brokenLinks: string[];
  suspiciousPatterns: SuspiciousPattern[];
}

export interface SuspiciousPattern {
  type: 'voice-mismatch' | 'vocabulary-drift' | 'timing-anomaly' | 'hash-mismatch';
  severity: 'info' | 'warning' | 'alert';
  description: string;
  affectedEntries: string[];
}
