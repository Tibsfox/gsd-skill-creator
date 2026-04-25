/**
 * FL Threat-Model Gate — YAML design-doc parser and frontmatter validator.
 *
 * Parses the YAML frontmatter from a design-doc file, extracts the
 * `fl_threat_model` block, and returns a structured `DesignDoc` suitable for
 * passing to `gatePreRollout`.
 *
 * Validates required fields against the canonical schema in
 * m4-mia-threat-model.tex § Pre-Rollout Gate Specification, and checks that
 * all three Lee et al. arXiv IDs are cited:
 *   - arXiv:2604.19891  (Data-Free MIA)
 *   - arXiv:2604.19915  (DECIFR)
 *   - arXiv:2604.20020  (FL HW Assurance Survey)
 *
 * Uses `js-yaml` (project dependency). No new deps added.
 *
 * @module fl-threat-model/yaml-validator
 */

import fs from 'node:fs';
import yaml from 'js-yaml';
import type {
  DesignDoc,
  FlThreatModelBlock,
  MitigationsSpec,
  DifferentialPrivacySpec,
  GradientClippingSpec,
  SecureAggregationSpec,
  PerClientDataCapSpec,
  DecifirAssessmentSpec,
  DoltHubDelineationSpec,
} from './types.js';

// ============================================================================
// Frontmatter extraction
// ============================================================================

/**
 * Extract YAML frontmatter from a Markdown document or standalone YAML file.
 *
 * Markdown frontmatter: text between the opening `---` (first line) and the
 * next `---` or `...` delimiter. If no frontmatter markers are found the
 * entire content is treated as YAML (useful for test fixtures).
 */
export function extractFrontmatter(content: string): string | null {
  const lines = content.split('\n');
  if (lines[0]?.trim() === '---') {
    // Find closing delimiter
    for (let i = 1; i < lines.length; i++) {
      const t = lines[i]?.trim();
      if (t === '---' || t === '...') {
        return lines.slice(1, i).join('\n');
      }
    }
    // No closing delimiter found — treat rest as frontmatter
    return lines.slice(1).join('\n');
  }
  // No frontmatter markers — try treating whole content as YAML
  return content;
}

// ============================================================================
// Type coercion helpers
// ============================================================================

function toBoolean(v: unknown, defaultVal: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return defaultVal;
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!isNaN(n)) return n;
  }
  return null;
}

function toString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  return String(v);
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => (typeof item === 'string' ? item : String(item)));
}

// ============================================================================
// Block coercers
// ============================================================================

function coerceDp(raw: unknown): DifferentialPrivacySpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    enabled: toBoolean(r['enabled'], false),
    noise_mechanism: toString(r['noise_mechanism']),
    epsilon: toNumber(r['epsilon']),
    delta: toNumber(r['delta']),
    accuracy_tradeoff_documented: toBoolean(r['accuracy_tradeoff_documented'], false),
  };
}

function coerceGc(raw: unknown): GradientClippingSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    enabled: toBoolean(r['enabled'], false),
    clipping_norm: toNumber(r['clipping_norm']),
    bias_characterised: toBoolean(r['bias_characterised'], false),
  };
}

function coerceSa(raw: unknown): SecureAggregationSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    enabled: toBoolean(r['enabled'], false),
    protocol: toString(r['protocol']),
    communication_overhead_estimated: toBoolean(
      r['communication_overhead_estimated'],
      false,
    ),
  };
}

function coerceCap(raw: unknown): PerClientDataCapSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    enabled: toBoolean(r['enabled'], false),
    cap_value: toNumber(r['cap_value']),
    cap_rationale: toString(r['cap_rationale']),
  };
}

function coerceMitigations(raw: unknown): MitigationsSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    differential_privacy: coerceDp(r['differential_privacy']),
    gradient_clipping: coerceGc(r['gradient_clipping']),
    secure_aggregation: coerceSa(r['secure_aggregation']),
    per_client_data_cap: coerceCap(r['per_client_data_cap']),
  };
}

function coerceDecifr(raw: unknown): DecifirAssessmentSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    attack_class_enumerated: toBoolean(r['attack_class_enumerated'], false),
    secure_aggregation_as_primary_countermeasure: toBoolean(
      r['secure_aggregation_as_primary_countermeasure'],
      false,
    ),
  };
}

function coerceDolthub(raw: unknown): DoltHubDelineationSpec {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    static_skill_sharing_permitted: toBoolean(r['static_skill_sharing_permitted'], true),
    federated_training_status: toString(r['federated_training_status']),
    unblock_conditions_documented: toBoolean(r['unblock_conditions_documented'], false),
  };
}

function coerceFlThreatModelBlock(raw: unknown): FlThreatModelBlock {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    version: toString(r['version']),
    mandatory_sources: toStringArray(r['mandatory_sources']),
    mitigations: coerceMitigations(r['mitigations']),
    decifr_assessment: coerceDecifr(r['decifr_assessment']),
    dolthub_delineation: coerceDolthub(r['dolthub_delineation']),
  };
}

// ============================================================================
// Parse result
// ============================================================================

export interface ParseResult {
  readonly doc: DesignDoc;
  /** True if frontmatter was successfully parsed (even if fl_threat_model was absent). */
  readonly parsed: boolean;
  /** Non-null if a YAML or I/O parse error occurred. */
  readonly parseError?: string;
}

/**
 * Parse a design-doc string (YAML frontmatter or raw YAML) into a DesignDoc.
 *
 * @param content  Raw file content.
 * @param sourcePath  Optional source path for diagnostics.
 */
export function parseDesignDocContent(
  content: string,
  sourcePath?: string,
): ParseResult {
  const frontmatterText = extractFrontmatter(content);
  if (frontmatterText === null) {
    return {
      doc: { sourcePath, fl_threat_model: undefined },
      parsed: false,
      parseError: 'Could not extract frontmatter',
    };
  }

  let rawParsed: unknown;
  try {
    rawParsed = yaml.load(frontmatterText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      doc: { sourcePath, fl_threat_model: undefined },
      parsed: false,
      parseError: `YAML parse error: ${msg}`,
    };
  }

  if (!rawParsed || typeof rawParsed !== 'object') {
    return {
      doc: { sourcePath, fl_threat_model: undefined },
      parsed: true,
    };
  }

  const rawObj = rawParsed as Record<string, unknown>;
  const rawBlock = rawObj['fl_threat_model'];

  const doc: DesignDoc = {
    sourcePath,
    fl_threat_model:
      rawBlock !== undefined && rawBlock !== null
        ? coerceFlThreatModelBlock(rawBlock)
        : undefined,
  };

  return { doc, parsed: true };
}

/**
 * Load a design-doc file from disk and parse it.
 *
 * @param filePath  Absolute or relative path to the design-doc file.
 */
export function loadDesignDoc(filePath: string): ParseResult {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      doc: { sourcePath: filePath, fl_threat_model: undefined },
      parsed: false,
      parseError: `File read error: ${msg}`,
    };
  }
  return parseDesignDocContent(content, filePath);
}

// ============================================================================
// Cite-presence check (used by gate for condition 2)
// ============================================================================

/** The three required Lee et al. arXiv IDs. */
export const REQUIRED_ARXIV_IDS = [
  '2604.19891',
  '2604.19915',
  '2604.20020',
] as const;

/**
 * Check whether all three Lee et al. arXiv IDs are cited in `mandatory_sources`.
 *
 * Accepts bare IDs, "arXiv:XXXX.XXXXX", and cite-key forms like
 * "eess26_2604.19891".
 *
 * @returns Missing IDs (empty array if all present).
 */
export function findMissingCites(sources: string[]): string[] {
  return REQUIRED_ARXIV_IDS.filter(
    (id) => !sources.some((s) => s.includes(id)),
  );
}
