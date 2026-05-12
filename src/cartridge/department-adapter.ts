/**
 * Department-chipset adapter (v1.49.636 C2).
 *
 * Maps a LEGACY `chipset.yaml` department file (the 48 chipsets under
 * `examples/chipsets/<dept>/`) to a UNIFIED `Cartridge` payload with
 * `chipsets: [{ kind: 'department' }, { kind: 'grove' }, { kind: 'college' }]`
 * where present.
 *
 * The LEGACY shape is:
 *
 *   name: <name-v1.0>
 *   version: 1.0.0
 *   description: ...
 *   skills: { <skillId>: { domain, description, triggers[], agent_affinity[] } }
 *   agents: { topology, router_agent, agents[] }
 *   teams: { <teamId>: { description, agents[], use_when } }
 *   evaluation: { ... }
 *   grove: { namespace, record_types[] }
 *   college: { department, concept_graph, ... }
 *   customization: { ... }
 *
 * The UNIFIED `Cartridge` shape is documented in `src/cartridge/types.ts`.
 *
 * v1.49.635 C2 Stage 1 HALT triage is in `.planning/cartridge-migration-cli-gap.md`.
 */

import { parse as parseYaml } from 'yaml';
import {
  CartridgeSchema,
  type Cartridge,
  type DepartmentChipset,
  type GroveChipset,
  type CollegeChipset,
} from './types.js';

/**
 * Options for `departmentLegacyToUnified`.
 */
export interface DepartmentAdapterOptions {
  /**
   * Author string for the unified Cartridge top-level field.
   * Default: `'skill-creator cartridge migrate (v1.49.636 C2)'`.
   */
  author?: string;
  /**
   * Trust band for the unified Cartridge. Default: `'system'`.
   */
  trust?: 'system' | 'user' | 'community';
  /**
   * Id for the unified Cartridge. Default: derived from `name`
   * (lowercased, with non-alphanumerics replaced by `-`).
   */
  id?: string;
}

/**
 * Error thrown when a LEGACY chipset YAML cannot be adapted because it
 * lacks a field the unified `DepartmentChipsetSchema` requires.
 */
export class DepartmentAdapterError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'DepartmentAdapterError';
  }
}

/**
 * Internal: derive a cartridge id from the legacy `name` field.
 *
 * Lowercase, replace non-alphanumeric runs with `-`, trim leading/trailing
 * dashes. `business-department-v1.0` → `business-department-v1-0`.
 */
function deriveId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the department chipset block from a LEGACY YAML record.
 *
 * Throws `DepartmentAdapterError` if the LEGACY record lacks the
 * `skills`, `agents`, or `teams` blocks (the three required
 * `DepartmentChipsetSchema` fields beyond `kind`).
 */
function buildDepartmentChipset(legacy: Record<string, unknown>): DepartmentChipset {
  if (!legacy.skills || typeof legacy.skills !== 'object') {
    throw new DepartmentAdapterError(
      'LEGACY chipset.yaml missing required "skills" block',
      'skills',
    );
  }
  if (!legacy.agents || typeof legacy.agents !== 'object') {
    throw new DepartmentAdapterError(
      'LEGACY chipset.yaml missing required "agents" block',
      'agents',
    );
  }
  if (!legacy.teams || typeof legacy.teams !== 'object') {
    throw new DepartmentAdapterError(
      'LEGACY chipset.yaml missing required "teams" block',
      'teams',
    );
  }

  const chipset: DepartmentChipset = {
    kind: 'department',
    skills: legacy.skills as DepartmentChipset['skills'],
    agents: legacy.agents as DepartmentChipset['agents'],
    teams: legacy.teams as DepartmentChipset['teams'],
  };

  if (legacy.customization && typeof legacy.customization === 'object') {
    chipset.customization = legacy.customization as DepartmentChipset['customization'];
  }

  // Carry forward the evaluation block via `passthrough` semantics — the
  // DepartmentChipsetSchema allows passthrough so the migrated cartridge
  // preserves the evaluation gate configuration without forcing it into
  // a separate EvaluationChipset entry. Future milestone may split this
  // out; for now byte-fidelity wins.
  if (legacy.evaluation && typeof legacy.evaluation === 'object') {
    (chipset as Record<string, unknown>).evaluation = legacy.evaluation;
  }

  return chipset;
}

/**
 * Build the grove chipset block from a LEGACY `grove` sub-tree, if present.
 *
 * Returns `null` when the LEGACY record has no `grove` block — the unified
 * Cartridge then omits the grove chipset entry.
 */
function buildGroveChipset(legacy: Record<string, unknown>): GroveChipset | null {
  if (!legacy.grove || typeof legacy.grove !== 'object') {
    return null;
  }
  const grove = legacy.grove as Record<string, unknown>;
  if (typeof grove.namespace !== 'string' || grove.namespace.length === 0) {
    throw new DepartmentAdapterError(
      'LEGACY grove block missing required "namespace" string',
      'grove.namespace',
    );
  }
  if (!Array.isArray(grove.record_types) || grove.record_types.length === 0) {
    throw new DepartmentAdapterError(
      'LEGACY grove block missing required non-empty "record_types" array',
      'grove.record_types',
    );
  }
  return {
    kind: 'grove',
    namespace: grove.namespace,
    record_types: grove.record_types as GroveChipset['record_types'],
  };
}

/**
 * Build the college chipset block from a LEGACY `college` sub-tree.
 *
 * Returns `null` when the LEGACY record has no `college` block.
 */
function buildCollegeChipset(legacy: Record<string, unknown>): CollegeChipset | null {
  if (!legacy.college || typeof legacy.college !== 'object') {
    return null;
  }
  const college = legacy.college as Record<string, unknown>;
  const concept_graph = (college.concept_graph as
    | { read?: boolean; write?: boolean }
    | undefined) ?? { read: false, write: false };
  return {
    kind: 'college',
    department: (college.department as string | null | undefined) ?? null,
    concept_graph: {
      read: Boolean(concept_graph.read),
      write: Boolean(concept_graph.write),
    },
    try_session_generation: Boolean(college.try_session_generation),
    learning_pathway_updates: Boolean(college.learning_pathway_updates),
    wings: Array.isArray(college.wings) ? (college.wings as string[]) : [],
  };
}

/**
 * Detect + normalize Family A `chipset:`-wrapped legacy shape (v1.49.644 C2 path a).
 *
 * Family A chipsets (`agc-educational`, `aminet-archive`,
 * `minecraft-knowledge-world`, `unison-translation`) wrap identity fields
 * inside a `chipset:` sub-tree instead of placing them at top level:
 *
 *     chipset:
 *       name: <id>
 *       version: <ver>
 *       description: <desc>
 *     skills:  [...]   # array of {name, source, ...}
 *     agents:  [...]   # array of {name, description, skills, team, model}
 *     teams:   [...]   # array of {name, description, members}
 *
 * If a `chipset:` sub-tree is detected with top-level `name` absent, the
 * adapter:
 *   1. Hoists `chipset.name/version/description` to the top level
 *   2. Normalizes `skills:[]` → `skills:{[name]:{description?, source?, ...}}`
 *   3. Wraps `agents:[]` → `{topology:'router', agents:[{name, role, ...}]}`
 *   4. Normalizes `teams:[]` → `teams:{[name]:{description, agents, ...}}`
 *
 * Returns the normalized record in-place; if no Family A shape detected,
 * returns the original record unchanged.
 *
 * Field synthesis (when source lacks required schema fields):
 *   - skill.description fallback: "Migrated from legacy skill <name>"
 *   - agent.role fallback: agent.team || 'agent'
 *   - teams[].agents derives from teams[].members
 */
function normalizeFamilyAShape(legacy: Record<string, unknown>): Record<string, unknown> {
  const inner = legacy.chipset as Record<string, unknown> | undefined;
  if (!inner || typeof inner !== 'object' || Array.isArray(inner)) {
    return legacy;  // No `chipset:` sub-tree → not Family A
  }
  if (typeof legacy.name === 'string' && legacy.name.length > 0) {
    return legacy;  // Top-level name already present → not Family A
  }

  const normalized: Record<string, unknown> = { ...legacy };
  // 1. Hoist identity
  if (typeof inner.name === 'string') normalized.name = inner.name;
  if (typeof inner.version === 'string') normalized.version = inner.version;
  if (typeof inner.description === 'string') normalized.description = inner.description;

  // 2. Normalize skills array → map
  if (Array.isArray(legacy.skills)) {
    const skillsMap: Record<string, Record<string, unknown>> = {};
    for (const s of legacy.skills as Array<Record<string, unknown>>) {
      const skillName = typeof s.name === 'string' ? s.name : null;
      if (!skillName) continue;
      const { name: _omit, ...rest } = s;
      skillsMap[skillName] = {
        description:
          typeof rest.description === 'string'
            ? rest.description
            : `Migrated from legacy skill ${skillName}`,
        ...rest,
      };
    }
    normalized.skills = skillsMap;
  }

  // 3. Wrap agents array → {topology, agents}
  if (Array.isArray(legacy.agents)) {
    const wrappedAgents = (legacy.agents as Array<Record<string, unknown>>).map((a) => {
      const out: Record<string, unknown> = { ...a };
      // Field synthesis: required `role`
      out.role =
        typeof a.role === 'string' && a.role.length > 0
          ? a.role
          : typeof a.team === 'string' && a.team.length > 0
            ? a.team
            : 'agent';
      // Family A serializes `tools` as a comma-separated string; schema wants string[]
      if (typeof a.tools === 'string') {
        out.tools = (a.tools as string)
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
      return out;
    });
    normalized.agents = {
      topology: 'router',
      agents: wrappedAgents,
    };
  }

  // 4. Normalize teams array → map
  if (Array.isArray(legacy.teams)) {
    const teamsMap: Record<string, Record<string, unknown>> = {};
    for (const t of legacy.teams as Array<Record<string, unknown>>) {
      const teamName = typeof t.name === 'string' ? t.name : null;
      if (!teamName) continue;
      const { name: _omit, members, ...rest } = t;
      teamsMap[teamName] = {
        ...rest,
        description:
          typeof rest.description === 'string'
            ? rest.description
            : `Migrated from legacy team ${teamName}`,
        agents: Array.isArray(members) ? members : Array.isArray(rest.agents) ? rest.agents : [],
      };
    }
    normalized.teams = teamsMap;
  }

  return normalized;
}

/**
 * Adapt a LEGACY `chipset.yaml` YAML string to a UNIFIED `Cartridge`
 * with `kind: 'department'` + optional `kind: 'grove'` + optional
 * `kind: 'college'` chipsets.
 *
 * Throws `DepartmentAdapterError` if the LEGACY YAML is missing a
 * REQUIRED field (`name`, `version`, `description`, `skills`, `agents`,
 * `teams`). Optional fields (`grove`, `college`, `customization`,
 * `evaluation`) are propagated when present.
 *
 * v1.49.644 C2 path a: Family A `chipset:`-wrapped legacy shapes are
 * pre-normalized via `normalizeFamilyAShape` before validation.
 */
export function departmentLegacyToUnified(
  legacyYaml: string,
  options: DepartmentAdapterOptions = {},
): Cartridge {
  const parsed = parseYaml(legacyYaml);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DepartmentAdapterError(
      'LEGACY chipset.yaml must parse to a top-level mapping',
      '<root>',
    );
  }
  const legacy = normalizeFamilyAShape(parsed as Record<string, unknown>);

  // Required top-level fields.
  for (const required of ['name', 'version', 'description'] as const) {
    if (typeof legacy[required] !== 'string' || (legacy[required] as string).length === 0) {
      throw new DepartmentAdapterError(
        `LEGACY chipset.yaml missing required "${required}" string`,
        required,
      );
    }
  }

  const name = legacy.name as string;
  const version = legacy.version as string;
  const description = legacy.description as string;

  // Build chipsets in CHIPSET_KINDS order (college, department, grove)
  // for deterministic output.
  const chipsets: Cartridge['chipsets'] = [];
  const college = buildCollegeChipset(legacy);
  if (college) chipsets.push(college);
  chipsets.push(buildDepartmentChipset(legacy));
  const grove = buildGroveChipset(legacy);
  if (grove) chipsets.push(grove);

  const cartridge: Cartridge = {
    id: options.id ?? deriveId(name),
    name,
    version,
    description,
    author: options.author ?? 'skill-creator cartridge migrate (v1.49.636 C2)',
    trust: options.trust ?? 'system',
    provenance: {
      origin: 'migration',
      createdAt: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for determinism on date axis only
      migrated_from: 'legacy-department-chipset',
    } as Cartridge['provenance'],
    chipsets,
  };

  // Self-validate via Zod to catch any drift between the adapter and the
  // unified schema. Throws `ZodError` on mismatch.
  return CartridgeSchema.parse(cartridge);
}
