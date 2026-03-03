/**
 * Per-ecosystem staleness thresholds based on typical release cadence norms.
 *
 * npm moves fastest (smallest thresholds); conda packages are expected to be
 * stable and long-lived (largest thresholds).
 */

import type { Ecosystem } from '../dependency-auditor/types.js';
import type { EcosystemThresholds } from './types.js';

/** Canonical staleness thresholds for each supported ecosystem. */
export const ECOSYSTEM_THRESHOLDS: Record<Ecosystem, EcosystemThresholds> = {
  npm: {
    ecosystem: 'npm',
    agingDays: 180,
    staleDays: 365,
    abandonedDays: 730,
  },
  pypi: {
    ecosystem: 'pypi',
    agingDays: 270,
    staleDays: 547,
    abandonedDays: 1095,
  },
  conda: {
    ecosystem: 'conda',
    agingDays: 365,
    staleDays: 730,
    abandonedDays: 1460,
  },
  cargo: {
    ecosystem: 'cargo',
    agingDays: 270,
    staleDays: 547,
    abandonedDays: 1095,
  },
  rubygems: {
    ecosystem: 'rubygems',
    agingDays: 270,
    staleDays: 547,
    abandonedDays: 1095,
  },
};

/**
 * Returns thresholds for the given ecosystem.
 * Falls back to npm defaults as a safety net (should not occur in practice).
 */
export function getThresholds(ecosystem: Ecosystem): EcosystemThresholds {
  return ECOSYSTEM_THRESHOLDS[ecosystem] ?? ECOSYSTEM_THRESHOLDS.npm;
}
