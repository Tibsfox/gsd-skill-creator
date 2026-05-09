/**
 * Unified cartridge validator.
 *
 * Two-phase validation:
 *
 *   1. Zod schema parse (already enforced by loader/parseCartridge, re-run
 *      here so validators can be invoked on hand-built objects).
 *   2. Cross-chipset consistency checks — correctness invariants that span
 *      more than one chipset and cannot be expressed at the Zod level:
 *
 *      - Department agent_affinity names must exist in the agents block of
 *        the same department chipset.
 *      - Department router_agent (if set) must exist in the agents block.
 *      - Evaluation chipset benchmark.domains_covered must be mentioned
 *        (case-insensitively) by at least one department skill description
 *        or skill key.
 *      - Community-trust cartridges cannot reference system-only chipset
 *        kinds (coprocessor, college) - those are reserved for system-trust.
 *
 * Each violation carries the offending chipset kind + field path so reports
 * are actionable without having to walk the whole cartridge in the debugger.
 */

import {
  CartridgeSchema,
  ResearchOutputCartridgeSchema,
  type Cartridge,
  type CartridgeSkillEntry,
  type DepartmentChipset,
  type EvaluationChipset,
  type ResearchOutputCartridge,
  findChipset,
  findChipsets,
} from './types.js';

export interface CartridgeValidationIssue {
  path: string;
  chipsetKind?: string;
  message: string;
}

export interface CartridgeValidationResult {
  valid: boolean;
  errors: CartridgeValidationIssue[];
  warnings: CartridgeValidationIssue[];
}

/**
 * Validate a cartridge. Returns a result object rather than throwing so
 * callers can surface all issues at once (e.g., in `skill-creator cartridge
 * eval` reports).
 *
 * Throws only if the input cannot be parsed at the Zod level AT ALL — that
 * is a different class of failure than a consistency violation.
 */
export function validateCartridge(
  input: unknown,
): CartridgeValidationResult {
  const errors: CartridgeValidationIssue[] = [];
  const warnings: CartridgeValidationIssue[] = [];

  const parsed = CartridgeSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        path: issue.path.join('.') || '<root>',
        message: issue.message,
      });
    }
    return { valid: false, errors, warnings };
  }

  const cartridge = parsed.data;

  checkDepartmentAgentAffinity(cartridge, errors);
  checkDepartmentRouterAgent(cartridge, errors);
  checkEvaluationDomainsCovered(cartridge, errors);
  checkSkillDomainsDeclared(cartridge, warnings);
  checkTrustScope(cartridge, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Warn when a skill declares a `domain:` that is not listed in any
 * evaluation chipset's `benchmark.domains_covered`. The reverse check
 * (declared-but-not-mentioned) is already an error via
 * checkEvaluationDomainsCovered — this rule catches forgotten additions
 * to domains_covered when skills grow. Warning-level by design: the
 * forge loop wants this surfaced before commit, but existing cartridges
 * must not fail validate when this invariant is violated.
 */
function checkSkillDomainsDeclared(
  cartridge: Cartridge,
  warnings: CartridgeValidationIssue[],
): void {
  const departments = findChipsets(cartridge, 'department');
  const evals = findChipsets(cartridge, 'evaluation');
  if (departments.length === 0 || evals.length === 0) return;
  const declared = new Set<string>();
  for (const ev of evals) {
    for (const d of ev.benchmark.domains_covered) {
      declared.add(d.toLowerCase());
    }
  }
  for (const dept of departments) {
    for (const [skillKey, skill] of Object.entries(dept.skills)) {
      const domain = skill.domain;
      if (!domain) continue;
      if (!declared.has(domain.toLowerCase())) {
        warnings.push({
          chipsetKind: 'department',
          path: `chipsets[${chipsetIndex(cartridge, dept)}].skills.${skillKey}.domain`,
          message: `skill '${skillKey}' declares domain '${domain}' but no evaluation chipset lists it in benchmark.domains_covered`,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Individual rules
// ---------------------------------------------------------------------------

function checkDepartmentAgentAffinity(
  cartridge: Cartridge,
  errors: CartridgeValidationIssue[],
): void {
  const departments = findChipsets(cartridge, 'department');
  departments.forEach((dept, deptIndex) => {
    const agentNames = new Set(dept.agents.agents.map((a) => a.name));
    for (const [skillKey, skill] of Object.entries(dept.skills)) {
      for (const affinity of extractAffinities(skill)) {
        if (!agentNames.has(affinity)) {
          errors.push({
            chipsetKind: 'department',
            path: `chipsets[${chipsetIndex(cartridge, dept)}].skills.${skillKey}.agent_affinity`,
            message: `skill '${skillKey}' has agent_affinity '${affinity}' but no agent with that name is defined in department[${deptIndex}]`,
          });
        }
      }
    }
  });
}

function checkDepartmentRouterAgent(
  cartridge: Cartridge,
  errors: CartridgeValidationIssue[],
): void {
  for (const dept of findChipsets(cartridge, 'department')) {
    const router = dept.agents.router_agent;
    if (router === undefined) continue;
    const agentNames = new Set(dept.agents.agents.map((a) => a.name));
    if (!agentNames.has(router)) {
      errors.push({
        chipsetKind: 'department',
        path: `chipsets[${chipsetIndex(cartridge, dept)}].agents.router_agent`,
        message: `router_agent '${router}' is not defined in agents list`,
      });
    }
  }
}

function checkEvaluationDomainsCovered(
  cartridge: Cartridge,
  errors: CartridgeValidationIssue[],
): void {
  const evals = findChipsets(cartridge, 'evaluation');
  if (evals.length === 0) return;
  const departments = findChipsets(cartridge, 'department');

  const skillSurface = collectSkillSurface(departments);

  for (const ev of evals) {
    for (const domain of ev.benchmark.domains_covered) {
      if (!skillSurface.some((s) => s.includes(domain.toLowerCase()))) {
        errors.push({
          chipsetKind: 'evaluation',
          path: `chipsets[${chipsetIndex(cartridge, ev)}].benchmark.domains_covered`,
          message: `evaluation domain '${domain}' is not mentioned by any department skill key or description`,
        });
      }
    }
  }
}

function checkTrustScope(
  cartridge: Cartridge,
  errors: CartridgeValidationIssue[],
): void {
  if (cartridge.trust !== 'community') return;
  const systemOnly = new Set(['coprocessor', 'college']);
  cartridge.chipsets.forEach((c, i) => {
    if (systemOnly.has(c.kind)) {
      errors.push({
        chipsetKind: c.kind,
        path: `chipsets[${i}]`,
        message: `community-trust cartridges cannot contain '${c.kind}' chipsets (reserved for system trust)`,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractAffinities(skill: CartridgeSkillEntry): string[] {
  const a = skill.agent_affinity;
  if (a === undefined) return [];
  if (typeof a === 'string') return [a];
  return a;
}

function chipsetIndex(
  cartridge: Cartridge,
  target: DepartmentChipset | EvaluationChipset,
): number {
  return cartridge.chipsets.findIndex((c) => c === target);
}

/**
 * Collect every skill "surface" string (key + description, lowercased) so
 * domain-covered matches can scan a single normalized set. Fragments of
 * descriptions are sufficient — the rule is "mentioned by", not "equal to".
 */
function collectSkillSurface(departments: DepartmentChipset[]): string[] {
  const out: string[] = [];
  for (const dept of departments) {
    for (const [key, skill] of Object.entries(dept.skills)) {
      out.push(key.toLowerCase());
      if (skill.description) out.push(skill.description.toLowerCase());
      if (skill.domain) out.push(skill.domain.toLowerCase());
    }
  }
  return out;
}

/**
 * Convenience: validate and throw on first failure with a flattened error
 * string. Useful inside scripts that want fast-fail semantics.
 */
export function validateCartridgeOrThrow(input: unknown): Cartridge {
  const result = validateCartridge(input);
  if (!result.valid) {
    const lines = result.errors.map(
      (e) => `  - [${e.chipsetKind ?? 'schema'}] ${e.path}: ${e.message}`,
    );
    throw new Error(
      `cartridge validation failed with ${result.errors.length} error(s):\n${lines.join('\n')}`,
    );
  }
  return CartridgeSchema.parse(input);
}

// ============================================================================
// Research-output cartridge validation
// ============================================================================

/**
 * Validate a research-output cartridge.
 *
 * Research-output cartridges (kind: research-output) carry research deliverables
 * — taxonomies, citation indexes, native-SVG figures, data files — rather than
 * executable skill/agent bundles. The validation rules differ from standard
 * cartridges: there is no chipsets array to check, but each artifact entry must
 * carry `path`, `kind`, and `purpose` fields.
 *
 * Returns a CartridgeValidationResult with the same shape as validateCartridge()
 * so callers can use both uniformly.
 */
export function validateResearchOutputCartridge(
  input: unknown,
): CartridgeValidationResult {
  const errors: CartridgeValidationIssue[] = [];
  const warnings: CartridgeValidationIssue[] = [];

  const parsed = ResearchOutputCartridgeSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        path: issue.path.join('.') || '<root>',
        message: issue.message,
      });
    }
    return { valid: false, errors, warnings };
  }

  const cartridge = parsed.data;

  // Rule R01: every artifact must have a non-empty path, kind, and purpose.
  // (Already enforced by the Zod schema, but repeated here for clarity and
  // to allow future path-existence checks.)
  for (let i = 0; i < cartridge.artifacts.length; i++) {
    const a = cartridge.artifacts[i];
    if (!a.path || !a.kind || !a.purpose) {
      errors.push({
        path: `artifacts[${i}]`,
        message: 'artifact must have non-empty path, kind, and purpose fields',
      });
    }
  }

  // Rule R02: warn when provenance lacks a mission field (best-practice for
  // SCRIBE research cartridges; not an error because CartridgeProvenanceSchema
  // uses .passthrough() and mission is an extension field).
  const prov = cartridge.provenance as Record<string, unknown>;
  if (!prov['mission']) {
    warnings.push({
      path: 'provenance.mission',
      message: 'research-output cartridge should declare provenance.mission for traceability',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Convenience: validate a research-output cartridge and throw on failure.
 */
export function validateResearchOutputCartridgeOrThrow(
  input: unknown,
): ResearchOutputCartridge {
  const result = validateResearchOutputCartridge(input);
  if (!result.valid) {
    const lines = result.errors.map(
      (e) => `  - [research-output] ${e.path}: ${e.message}`,
    );
    throw new Error(
      `research-output cartridge validation failed with ${result.errors.length} error(s):\n${lines.join('\n')}`,
    );
  }
  return ResearchOutputCartridgeSchema.parse(input);
}
