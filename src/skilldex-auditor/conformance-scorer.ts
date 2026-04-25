/**
 * Skilldex Auditor — conformance scorer.
 *
 * Static structural verification of SKILL.md spec-conformance per the
 * Skilldex (arXiv:2604.16911) catalog schema and the Structural Verification
 * for EDA (arXiv:2604.18834) static-only-no-execution discipline.
 *
 * The scorer does NOT execute the skill, does NOT spawn tools, does NOT
 * require any tool-in-the-loop debug surface, and does NOT read any file
 * outside the explicit `skillPath` argument.
 *
 * @module skilldex-auditor/conformance-scorer
 */

import fs from 'node:fs';

import type { AuditFinding, SkillSpec } from './types.js';

/**
 * Required frontmatter keys from the canonical SKILL.md schema.
 *
 * These map to the Skilldex catalog entry fields used at indexing time
 * (arXiv:2604.16911 §3 "skill catalog representation").
 */
export const REQUIRED_FRONTMATTER: ReadonlyArray<string> = ['name', 'description'];

/**
 * Optional but recommended frontmatter keys. Absence emits `warn`, not `fail`.
 */
export const RECOMMENDED_FRONTMATTER: ReadonlyArray<string> = ['version'];

/**
 * Required top-level Markdown sections (heading text, case-sensitive match
 * after stripping leading `#` chars and whitespace). At least the skill's
 * primary heading must exist; the body is otherwise free-form.
 */
export const REQUIRED_HEADINGS: ReadonlyArray<string> = [];

/**
 * Parse a SKILL.md file into a structural SkillSpec.
 *
 * Pure with respect to inputs other than the one path argument.
 * On a path that does not exist, returns a SkillSpec with
 * `parseError = 'file-not-found'`.
 */
export function parseSkillFile(skillPath: string): SkillSpec {
  if (!fs.existsSync(skillPath)) {
    return {
      path: skillPath,
      hasFrontmatter: false,
      frontmatter: {},
      headings: [],
      bodyBytes: 0,
      parseError: 'file-not-found',
    };
  }
  const raw = fs.readFileSync(skillPath, 'utf8');
  return parseSkillContent(skillPath, raw);
}

/**
 * Parse already-loaded SKILL.md text. Useful in tests with in-memory fixtures.
 */
export function parseSkillContent(skillPath: string, raw: string): SkillSpec {
  const bodyBytes = Buffer.byteLength(raw, 'utf8');
  // Detect frontmatter: must start with --- on a single line.
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return {
      path: skillPath,
      hasFrontmatter: false,
      frontmatter: {},
      headings: extractHeadings(raw),
      bodyBytes,
    };
  }
  const fmBlock = fmMatch[1] ?? '';
  const body = fmMatch[2] ?? '';
  let frontmatter: Record<string, string>;
  let parseError: string | undefined;
  try {
    frontmatter = parseSimpleYaml(fmBlock);
  } catch (e) {
    frontmatter = {};
    parseError =
      e instanceof Error ? e.message : 'malformed-frontmatter';
  }
  return {
    path: skillPath,
    hasFrontmatter: parseError === undefined,
    frontmatter,
    headings: extractHeadings(body),
    bodyBytes,
    ...(parseError !== undefined ? { parseError } : {}),
  };
}

/**
 * Score a parsed SkillSpec against the conformance ruleset.
 *
 * Emits at minimum one finding per rule: pass, warn, or fail. Order is
 * deterministic (frontmatter-required → frontmatter-recommended → structure).
 */
export function scoreSpec(spec: SkillSpec): ReadonlyArray<AuditFinding> {
  const findings: AuditFinding[] = [];

  // Rule: frontmatter block must be present.
  if (!spec.hasFrontmatter) {
    findings.push({
      skillPath: spec.path,
      ruleId: 'frontmatter.present',
      severity: 'fail',
      message:
        spec.parseError === 'file-not-found'
          ? 'SKILL.md not found at given path'
          : spec.parseError !== undefined
            ? `frontmatter block malformed: ${spec.parseError}`
            : 'no YAML frontmatter block found',
      ...(spec.parseError !== undefined
        ? { detail: { parseError: spec.parseError } }
        : {}),
    });
    // Don't bail; still emit downstream findings so the caller sees full shape.
  } else {
    findings.push({
      skillPath: spec.path,
      ruleId: 'frontmatter.present',
      severity: 'pass',
      message: 'YAML frontmatter parsed',
    });
  }

  // Rule: each required key must be present and non-empty.
  for (const key of REQUIRED_FRONTMATTER) {
    const v = spec.frontmatter[key];
    if (v === undefined || v.trim().length === 0) {
      findings.push({
        skillPath: spec.path,
        ruleId: `frontmatter.${key}.required`,
        severity: 'fail',
        message: `required frontmatter field '${key}' missing or empty`,
      });
    } else {
      findings.push({
        skillPath: spec.path,
        ruleId: `frontmatter.${key}.required`,
        severity: 'pass',
        message: `frontmatter field '${key}' present`,
      });
    }
  }

  // Rule: recommended keys → warn on absence.
  for (const key of RECOMMENDED_FRONTMATTER) {
    const v = spec.frontmatter[key];
    if (v === undefined || v.trim().length === 0) {
      findings.push({
        skillPath: spec.path,
        ruleId: `frontmatter.${key}.recommended`,
        severity: 'warn',
        message: `recommended frontmatter field '${key}' missing`,
      });
    } else {
      findings.push({
        skillPath: spec.path,
        ruleId: `frontmatter.${key}.recommended`,
        severity: 'pass',
        message: `frontmatter field '${key}' present`,
      });
    }
  }

  // Rule: at least one heading present in the body.
  if (spec.hasFrontmatter && spec.headings.length === 0) {
    findings.push({
      skillPath: spec.path,
      ruleId: 'structure.headings.present',
      severity: 'warn',
      message: 'SKILL.md body has no Markdown headings',
    });
  } else if (spec.hasFrontmatter) {
    findings.push({
      skillPath: spec.path,
      ruleId: 'structure.headings.present',
      severity: 'pass',
      message: `${spec.headings.length} heading(s) found`,
      detail: { count: spec.headings.length },
    });
  }

  // Rule: any explicitly required headings (currently empty list, kept for
  // forward compatibility with the canonical Skilldex template).
  for (const required of REQUIRED_HEADINGS) {
    const present = spec.headings.includes(required);
    findings.push({
      skillPath: spec.path,
      ruleId: `structure.heading.${slug(required)}`,
      severity: present ? 'pass' : 'fail',
      message: present
        ? `required heading '${required}' present`
        : `required heading '${required}' missing`,
    });
  }

  return findings;
}

// ---------- internal helpers ----------

function extractHeadings(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m) out.push(m[2] ?? '');
  }
  return out;
}

/**
 * Tiny YAML subset parser — supports `key: value` lines, optional double-
 * quoted values, and comments starting with `#`. Throws on a non-empty line
 * that does not look like a mapping entry.
 *
 * We intentionally do NOT pull in a YAML dependency: the auditor is a leaf
 * observer and the constraint says no new deps.
 */
function parseSimpleYaml(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (line.length === 0) continue;
    if (line.trimStart().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      throw new Error(`malformed-line: ${rawLine}`);
    }
    const key = m[1] ?? '';
    let value = m[2] ?? '';
    // Strip wrapping double or single quotes.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
