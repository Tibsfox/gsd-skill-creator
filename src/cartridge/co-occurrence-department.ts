/**
 * Mint a department-cartridge DRAFT from measured skill co-activation.
 *
 * Turns "these skills always fire together" (a JP-016 co-occurrence matrix
 * observed from the trace ledger) into a gated department-cartridge draft for
 * human review:
 *
 *   1. Keep only co-occurrence pairs backed by at least `minSupport`
 *      observations (thin, noisy pairs are dropped).
 *   2. Refuse to mint if fewer than two skills survive — a single-skill
 *      "bundle" is not a co-activation, and minting from thin data risks an
 *      empty/meaningless artifact.
 *   3. Group the surviving skills into slots via the JP-036 co-occurrence
 *      bundler (`buildCoOccurrenceBundle`).
 *   4. Project the bundle onto a LEGACY department chipset shape and package it
 *      through the department adapter (`departmentLegacyToUnified`) into a
 *      UNIFIED `Cartridge`.
 *   5. Validate the result and stamp co-activation DRAFT provenance.
 *
 * The output is a DRAFT — callers write it to disk for review and must NOT
 * auto-install it.
 *
 * KNOWN CONSTRAINT: the trace activation writers are still largely unwired
 * (Phase 646), so the live co-occurrence log is sparse. This module is
 * deliberately gated on `minSupport` and TDD'd against synthetic fixtures; the
 * hard core of *deriving* a co-occurrence matrix from the raw decision-trace
 * JSONL log is out of scope here (see deferred notes).
 *
 * @module cartridge/co-occurrence-department
 */

import { stringify as stringifyYaml } from 'yaml';
import {
  buildCoOccurrenceBundle,
  type CoOccurrenceBundle,
  type CoOccurrenceBundleOptions,
} from './co-occurrence-bundle.js';
import {
  departmentLegacyToUnified,
} from './department-adapter.js';
import { CartridgeSchema, type Cartridge } from './types.js';
import {
  validateCartridge,
  type CartridgeValidationResult,
} from './validator.js';
import type { CoOccurrenceMatrix } from '../traces/co-occurrence-schema.js';

const DEFAULT_MIN_SUPPORT = 3;
const DEFAULT_AUTHOR = 'skill-creator cartridge distill-cooccurrence';
const ROUTER_AGENT = 'co-activation-router';

/**
 * Options controlling the co-activation mint.
 */
export interface MintCoOccurrenceOptions {
  /**
   * Minimum `observationCount` a co-occurrence pair must have to count toward
   * support. Pairs below this are dropped before bundling. Default 3.
   */
  minSupport?: number;
  /** Cartridge id (sanitized to a filesystem-safe slug). Default from `name`. */
  id?: string;
  /** Human-readable cartridge name. Default `'co-activation-department'`. */
  name?: string;
  /** Cartridge description. Default derived from bundle shape. */
  description?: string;
  /** Trust band for the minted cartridge. Default `'user'`. */
  trust?: 'system' | 'user' | 'community';
  /** Author string. Default identifies the distill-cooccurrence verb. */
  author?: string;
  /** `domain:` tag applied to every minted skill. Default `'co-activation'`. */
  domain?: string;
  /** Tuning knobs forwarded to `buildCoOccurrenceBundle`. */
  bundle?: CoOccurrenceBundleOptions;
  /** createdAt override (YYYY-MM-DD) for deterministic output in tests. */
  createdAt?: string;
}

/**
 * Result of a co-activation mint. `ok:false` means the bundle was too thin to
 * mint (below `minSupport` or fewer than two co-activating skills).
 */
export type MintCoOccurrenceResult =
  | {
      ok: true;
      /** The minted UNIFIED cartridge DRAFT (not installed). */
      cartridge: Cartridge;
      /** YAML serialization of the draft, ready to write for review. */
      yaml: string;
      /** Total observationCount across the supported pairs. */
      support: number;
      /** Number of distinct co-activating skills that met min-support. */
      skillCount: number;
      /** Number of bundle slots emitted. */
      slotCount: number;
      /** The raw bundle for downstream inspection. */
      bundle: CoOccurrenceBundle;
      /** Schema + cross-chipset validation result for the draft. */
      validation: CartridgeValidationResult;
    }
  | {
      ok: false;
      /** Why the mint was refused. */
      reason: string;
      /** Total observationCount across the supported pairs (may be 0). */
      support: number;
      /** Number of distinct skills that met min-support. */
      skillCount: number;
    };

/**
 * Sanitize an opaque skill/slot id into a filesystem-safe cartridge key.
 * Mirrors `toSafeSkillName` semantics without importing the distill pipeline.
 */
function safeName(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length === 0) s = 'co-activation';
  if (!/^[a-z0-9]/.test(s)) s = `c${s}`;
  return s.slice(0, 64).replace(/-+$/, '');
}

/**
 * Assign a unique safe key, suffixing on collision so distinct source ids never
 * clobber one another after sanitization.
 */
function uniqueKey(raw: string, taken: Set<string>): string {
  const base = safeName(raw);
  let key = base;
  let n = 2;
  while (taken.has(key)) {
    key = `${base}-${n++}`;
  }
  taken.add(key);
  return key;
}

/**
 * Project a co-occurrence bundle onto a LEGACY department chipset YAML string.
 * Each surviving skill becomes a department skill; each bundle slot becomes a
 * team documenting the co-activation grouping; a single router agent
 * coordinates the department.
 */
function bundleToDepartmentLegacyYaml(
  bundle: CoOccurrenceBundle,
  skillIds: string[],
  options: MintCoOccurrenceOptions,
): string {
  const name = options.name ?? 'co-activation-department';
  const domain = options.domain ?? 'co-activation';
  const description =
    options.description ??
    `Department minted from measured skill co-activation ` +
      `(${skillIds.length} skills across ${bundle.slots.length} slot(s)). DRAFT — review before install.`;

  // Map each skill to the slot it landed in, for descriptive fidelity.
  const slotOf = new Map<string, string>();
  for (const slot of bundle.slots) {
    for (const s of slot.skills) slotOf.set(s.skillId, slot.slotId);
  }

  const skillKeys = new Set<string>();
  const skills: Record<string, unknown> = {};
  for (const sid of skillIds) {
    const key = uniqueKey(sid, skillKeys);
    skills[key] = {
      domain,
      description:
        `Skill '${sid}' co-activates in ${slotOf.get(sid) ?? 'a shared slot'} ` +
        `(measured co-occurrence).`,
    };
  }

  const agents = {
    topology: 'router',
    router_agent: ROUTER_AGENT,
    agents: [
      {
        name: ROUTER_AGENT,
        role: 'coordinator',
      },
    ],
  };

  const teamKeys = new Set<string>();
  const teams: Record<string, unknown> = {};
  bundle.slots.forEach((slot, i) => {
    const key = uniqueKey(slot.slotId || `slot-${i}`, teamKeys);
    teams[key] = {
      description:
        `Skills that co-activate in ${slot.slotId} ` +
        `(co-occurrence score ${slot.coOccurrenceScore.toFixed(3)}).`,
      agents: [ROUTER_AGENT],
      use_when: 'these skills have historically fired together',
    };
  });

  return stringifyYaml({
    name,
    version: '0.1.0',
    description,
    skills,
    agents,
    teams,
  });
}

/**
 * Stamp co-activation DRAFT provenance onto a minted cartridge and re-validate
 * through the schema (provenance is passthrough, so the extra fields survive).
 */
function markDraftProvenance(
  cartridge: Cartridge,
  meta: {
    minSupport: number;
    support: number;
    skillCount: number;
    slotCount: number;
    createdAt?: string;
  },
): Cartridge {
  const provenance = {
    ...cartridge.provenance,
    origin: 'co-activation',
    createdAt: meta.createdAt ?? cartridge.provenance.createdAt,
    draft: true,
    coActivation: {
      minSupport: meta.minSupport,
      support: meta.support,
      skillCount: meta.skillCount,
      slotCount: meta.slotCount,
    },
  };
  return CartridgeSchema.parse({ ...cartridge, provenance });
}

/**
 * Mint a department-cartridge DRAFT from a co-occurrence matrix.
 *
 * Returns `ok:false` (rather than throwing) when the matrix is too thin to
 * mint — fewer than two skills clear `minSupport`. Callers must treat the
 * result as a DRAFT and never auto-install it.
 */
export function mintDepartmentFromCoOccurrence(
  matrix: CoOccurrenceMatrix,
  options: MintCoOccurrenceOptions = {},
): MintCoOccurrenceResult {
  const minSupport = options.minSupport ?? DEFAULT_MIN_SUPPORT;

  // 1. Keep only sufficiently-observed pairs.
  const supported = matrix.pairs.filter(
    (p) => p.observationCount >= minSupport,
  );
  const support = supported.reduce((s, p) => s + p.observationCount, 0);

  // 2. Collect the distinct co-activating skills.
  const skillSet = new Set<string>();
  for (const p of supported) {
    skillSet.add(p.event_a.skillId);
    skillSet.add(p.event_b.skillId);
  }
  const skillIds = [...skillSet].sort();

  if (skillIds.length < 2) {
    return {
      ok: false,
      reason:
        `too thin: ${skillIds.length} skill(s) met min-support=${minSupport} ` +
        `(need >= 2 co-activating skills to mint a department)`,
      support,
      skillCount: skillIds.length,
    };
  }

  // 3. Bundle the surviving skills using only the supported pairs.
  const filteredMatrix: CoOccurrenceMatrix = { ...matrix, pairs: supported };
  const bundle = buildCoOccurrenceBundle(
    skillIds,
    filteredMatrix,
    options.bundle,
  );

  // 4. Package through the department adapter.
  const legacyYaml = bundleToDepartmentLegacyYaml(bundle, skillIds, options);
  let cartridge = departmentLegacyToUnified(legacyYaml, {
    trust: options.trust ?? 'user',
    author: options.author ?? DEFAULT_AUTHOR,
    id: options.id ? safeName(options.id) : undefined,
  });

  // 5. Stamp DRAFT provenance + validate.
  cartridge = markDraftProvenance(cartridge, {
    minSupport,
    support,
    skillCount: skillIds.length,
    slotCount: bundle.slots.length,
    createdAt: options.createdAt,
  });
  const validation = validateCartridge(cartridge);

  return {
    ok: true,
    cartridge,
    yaml: stringifyYaml(cartridge),
    support,
    skillCount: skillIds.length,
    slotCount: bundle.slots.length,
    bundle,
    validation,
  };
}
