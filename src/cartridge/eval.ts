/**
 * Cartridge evaluator — runs the gates defined by a cartridge's evaluation
 * chipset against the cartridge itself.
 *
 * Gates are named strings in `evaluation.pre_deploy`. Each gate maps to a
 * deterministic check function. Unknown gate names are reported as
 * unsupported (not as failures) so that forward-compat is easy to add.
 *
 * Intended caller: `skill-creator cartridge eval <path>`.
 */

import type {
  Cartridge,
  DepartmentChipset,
  EvaluationChipset,
  GraphicsChipset,
  GroveChipset,
} from './types.js';
import { findChipset, findChipsets } from './types.js';
import { validateCartridge } from './validator.js';

export type GateOutcome = 'passed' | 'failed' | 'unsupported';

export interface GateResult {
  gate: string;
  outcome: GateOutcome;
  message?: string;
}

export interface EvalReport {
  cartridgeId: string;
  gates: GateResult[];
  passedCount: number;
  failedCount: number;
  unsupportedCount: number;
  validatorErrors: string[];
}

type GateFn = (cartridge: Cartridge) => GateResult;

const GATES: Record<string, GateFn> = {
  all_skills_have_descriptions: (c) => {
    const depts = findChipsets(c, 'department') as DepartmentChipset[];
    const missing: string[] = [];
    for (const dept of depts) {
      for (const [key, skill] of Object.entries(dept.skills ?? {})) {
        if (!skill.description || skill.description.trim() === '') {
          missing.push(key);
        }
      }
    }
    return missing.length === 0
      ? { gate: 'all_skills_have_descriptions', outcome: 'passed' }
      : {
          gate: 'all_skills_have_descriptions',
          outcome: 'failed',
          message: `skills missing description: ${missing.join(', ')}`,
        };
  },

  all_agents_have_roles: (c) => {
    const depts = findChipsets(c, 'department') as DepartmentChipset[];
    const missing: string[] = [];
    for (const dept of depts) {
      for (const agent of dept.agents?.agents ?? []) {
        if (!agent.role || agent.role.trim() === '') {
          missing.push(agent.name);
        }
      }
    }
    return missing.length === 0
      ? { gate: 'all_agents_have_roles', outcome: 'passed' }
      : {
          gate: 'all_agents_have_roles',
          outcome: 'failed',
          message: `agents missing role: ${missing.join(', ')}`,
        };
  },

  grove_record_types_defined: (c) => {
    const groves = findChipsets(c, 'grove') as GroveChipset[];
    if (groves.length === 0) {
      return {
        gate: 'grove_record_types_defined',
        outcome: 'failed',
        message: 'no grove chipset present',
      };
    }
    const empty = groves.filter((g) => g.record_types.length === 0);
    return empty.length === 0
      ? { gate: 'grove_record_types_defined', outcome: 'passed' }
      : {
          gate: 'grove_record_types_defined',
          outcome: 'failed',
          message: 'grove chipset has zero record_types',
        };
  },

  has_evaluation_chipset: (c) => {
    return findChipset(c, 'evaluation')
      ? { gate: 'has_evaluation_chipset', outcome: 'passed' }
      : {
          gate: 'has_evaluation_chipset',
          outcome: 'failed',
          message: 'no evaluation chipset present',
        };
  },

  all_graphics_sources_declare_stage: (c) => {
    const graphics = findChipsets(c, 'graphics') as GraphicsChipset[];
    if (graphics.length === 0) {
      return {
        gate: 'all_graphics_sources_declare_stage',
        outcome: 'passed',
        message: 'no graphics chipset present (gate is vacuously satisfied)',
      };
    }
    const violations: string[] = [];
    for (const gfx of graphics) {
      const declared = new Set(gfx.shader_stages);
      for (const source of gfx.sources ?? []) {
        if (!declared.has(source.stage)) {
          violations.push(
            `${source.path} (stage '${source.stage}' not in shader_stages)`,
          );
        }
      }
    }
    return violations.length === 0
      ? { gate: 'all_graphics_sources_declare_stage', outcome: 'passed' }
      : {
          gate: 'all_graphics_sources_declare_stage',
          outcome: 'failed',
          message: `shader sources reference undeclared stages: ${violations.join(', ')}`,
        };
  },
};

export function evalCartridge(cartridge: Cartridge): EvalReport {
  const evaluation = findChipset(cartridge, 'evaluation') as
    | EvaluationChipset
    | undefined;

  const gates: GateResult[] = [];

  const validator = validateCartridge(cartridge);
  const validatorErrors = validator.errors.map((e) => `${e.path}: ${e.message}`);

  if (evaluation) {
    for (const gateName of evaluation.pre_deploy) {
      const fn = GATES[gateName];
      if (!fn) {
        gates.push({
          gate: gateName,
          outcome: 'unsupported',
          message: 'no runner registered for this gate',
        });
        continue;
      }
      gates.push(fn(cartridge));
    }
  }

  const passedCount = gates.filter((g) => g.outcome === 'passed').length;
  const failedCount = gates.filter((g) => g.outcome === 'failed').length;
  const unsupportedCount = gates.filter((g) => g.outcome === 'unsupported').length;

  return {
    cartridgeId: cartridge.id,
    gates,
    passedCount,
    failedCount,
    unsupportedCount,
    validatorErrors,
  };
}

export function registeredGates(): string[] {
  return Object.keys(GATES).sort();
}
