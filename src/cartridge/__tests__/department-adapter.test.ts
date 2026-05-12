/**
 * Tests for `departmentLegacyToUnified` (v1.49.636 C2).
 *
 * Covers happy paths (department + grove + college present), error paths
 * (missing required fields), and content-fidelity invariants (name,
 * version, description, skills/agents/teams, grove namespace, college
 * department).
 */

import { describe, it, expect } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';
import {
  departmentLegacyToUnified,
  DepartmentAdapterError,
} from '../department-adapter.js';

function legacyMinimal(): Record<string, unknown> {
  return {
    name: 'business-department-v1.0',
    version: '1.0.0',
    description: 'A coordinated business department.',
    skills: {
      'organizational-strategy': {
        domain: 'business',
        description: 'Strategy, management, organizational design.',
        triggers: ['strategy', 'management'],
        agent_affinity: ['drucker'],
      },
    },
    agents: {
      topology: 'router',
      router_agent: 'drucker',
      agents: [
        {
          name: 'drucker',
          role: 'department chair',
          model: 'opus',
          tools: ['Read', 'Write'],
          is_capcom: true,
        },
      ],
    },
    teams: {
      'business-analysis-team': {
        description: 'Full department analysis.',
        agents: ['drucker'],
        use_when: 'multi-domain analysis.',
      },
    },
  };
}

function legacyWithGroveAndCollege(): Record<string, unknown> {
  return {
    ...legacyMinimal(),
    grove: {
      namespace: 'business-department',
      record_types: [
        { name: 'BusinessAnalysis', description: 'Diagnostic analysis.' },
      ],
    },
    college: {
      department: 'business',
      concept_graph: { read: true, write: true },
      try_session_generation: true,
      learning_pathway_updates: true,
      wings: ['Economic Organization & Markets'],
    },
    customization: {
      rename_agents: true,
      template_pattern: 'department',
    },
    evaluation: {
      pre_deploy_checks: [
        { check: 'all_skills_have_descriptions', action: 'block' },
      ],
    },
  };
}

describe('departmentLegacyToUnified — happy paths', () => {
  it('adapts a minimal department-only legacy YAML to a unified Cartridge', () => {
    const yaml = stringifyYaml(legacyMinimal());
    const out = departmentLegacyToUnified(yaml);
    expect(out.name).toBe('business-department-v1.0');
    expect(out.version).toBe('1.0.0');
    expect(out.description).toBe('A coordinated business department.');
    expect(out.chipsets).toHaveLength(1);
    expect(out.chipsets[0].kind).toBe('department');
  });

  it('produces multi-chipset assembly when grove + college present', () => {
    const yaml = stringifyYaml(legacyWithGroveAndCollege());
    const out = departmentLegacyToUnified(yaml);
    const kinds = out.chipsets.map((c) => c.kind);
    expect(kinds).toEqual(['college', 'department', 'grove']);
  });

  it('preserves identity, metadata, and skills/agents/teams fidelity', () => {
    const yaml = stringifyYaml(legacyWithGroveAndCollege());
    const out = departmentLegacyToUnified(yaml);
    const dept = out.chipsets.find((c) => c.kind === 'department');
    expect(dept).toBeDefined();
    if (dept && dept.kind === 'department') {
      expect(Object.keys(dept.skills)).toContain('organizational-strategy');
      expect(dept.skills['organizational-strategy'].description).toBe(
        'Strategy, management, organizational design.',
      );
      expect(dept.agents.topology).toBe('router');
      expect(dept.agents.router_agent).toBe('drucker');
      expect(dept.agents.agents[0].name).toBe('drucker');
      expect(dept.agents.agents[0].is_capcom).toBe(true);
      expect(Object.keys(dept.teams)).toContain('business-analysis-team');
      expect(dept.teams['business-analysis-team'].agents).toEqual(['drucker']);
      // Evaluation block propagated via passthrough.
      expect((dept as Record<string, unknown>).evaluation).toBeDefined();
    }
  });

  it('preserves grove namespace + record types verbatim', () => {
    const yaml = stringifyYaml(legacyWithGroveAndCollege());
    const out = departmentLegacyToUnified(yaml);
    const grove = out.chipsets.find((c) => c.kind === 'grove');
    expect(grove).toBeDefined();
    if (grove && grove.kind === 'grove') {
      expect(grove.namespace).toBe('business-department');
      expect(grove.record_types).toHaveLength(1);
      expect(grove.record_types[0].name).toBe('BusinessAnalysis');
    }
  });

  it('preserves college department + concept_graph + wings', () => {
    const yaml = stringifyYaml(legacyWithGroveAndCollege());
    const out = departmentLegacyToUnified(yaml);
    const college = out.chipsets.find((c) => c.kind === 'college');
    expect(college).toBeDefined();
    if (college && college.kind === 'college') {
      expect(college.department).toBe('business');
      expect(college.concept_graph.read).toBe(true);
      expect(college.concept_graph.write).toBe(true);
      expect(college.wings).toEqual(['Economic Organization & Markets']);
    }
  });

  it('derives a slugified id from the legacy name', () => {
    const yaml = stringifyYaml(legacyMinimal());
    const out = departmentLegacyToUnified(yaml);
    expect(out.id).toBe('business-department-v1-0');
  });

  it('honors explicit options.id + options.author + options.trust', () => {
    const yaml = stringifyYaml(legacyMinimal());
    const out = departmentLegacyToUnified(yaml, {
      id: 'custom-id',
      author: 'test-author',
      trust: 'user',
    });
    expect(out.id).toBe('custom-id');
    expect(out.author).toBe('test-author');
    expect(out.trust).toBe('user');
  });
});

describe('departmentLegacyToUnified — error paths', () => {
  it('throws on missing top-level "name"', () => {
    const legacy = legacyMinimal();
    delete legacy.name;
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      DepartmentAdapterError,
    );
  });

  it('throws on missing top-level "version"', () => {
    const legacy = legacyMinimal();
    delete legacy.version;
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /version/,
    );
  });

  it('throws on missing "skills" block', () => {
    const legacy = legacyMinimal();
    delete legacy.skills;
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /skills/,
    );
  });

  it('throws on missing "agents" block', () => {
    const legacy = legacyMinimal();
    delete legacy.agents;
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /agents/,
    );
  });

  it('throws on missing "teams" block', () => {
    const legacy = legacyMinimal();
    delete legacy.teams;
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /teams/,
    );
  });

  it('throws when grove block lacks namespace', () => {
    const legacy = legacyWithGroveAndCollege();
    (legacy.grove as Record<string, unknown>).namespace = '';
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /namespace/,
    );
  });

  it('throws when grove record_types is empty', () => {
    const legacy = legacyWithGroveAndCollege();
    (legacy.grove as Record<string, unknown>).record_types = [];
    expect(() => departmentLegacyToUnified(stringifyYaml(legacy))).toThrow(
      /record_types/,
    );
  });

  it('throws on YAML that does not parse to a mapping (array root)', () => {
    expect(() => departmentLegacyToUnified('- foo\n- bar\n')).toThrow(
      /top-level mapping/,
    );
  });
});

describe('departmentLegacyToUnified — chipset ordering determinism', () => {
  it('places college before department before grove (CHIPSET_KINDS order)', () => {
    const yaml = stringifyYaml(legacyWithGroveAndCollege());
    const out = departmentLegacyToUnified(yaml);
    const indices = out.chipsets.map((c) => c.kind);
    expect(indices.indexOf('college')).toBeLessThan(indices.indexOf('department'));
    expect(indices.indexOf('department')).toBeLessThan(indices.indexOf('grove'));
  });

  it('omits grove + college chipsets when absent in legacy', () => {
    const legacy = legacyMinimal();
    const yaml = stringifyYaml(legacy);
    const out = departmentLegacyToUnified(yaml);
    expect(out.chipsets.find((c) => c.kind === 'grove')).toBeUndefined();
    expect(out.chipsets.find((c) => c.kind === 'college')).toBeUndefined();
    expect(out.chipsets.find((c) => c.kind === 'department')).toBeDefined();
  });
});

/**
 * Family A `chipset:`-wrapped legacy shape (v1.49.644 C2 path a — CF-17).
 *
 * Family A chipsets (agc-educational, aminet-archive, minecraft-knowledge-world,
 * unison-translation) nest identity under a `chipset:` sub-tree and serialize
 * skills/agents/teams as arrays. The adapter pre-normalizes these shapes via
 * `normalizeFamilyAShape` before validation.
 */
describe("departmentLegacyToUnified — Family A 'chipset:'-wrapped legacy", () => {
  /**
   * Minimum Family A fixture. Top-level `name` is absent; identity lives in
   * the `chipset:` sub-tree. Skills/agents/teams are arrays with the Family A
   * field conventions (tools as comma-separated string; team members instead
   * of agents in team entries).
   */
  function familyAMinimal(name = 'agc-educational-analog'): Record<string, unknown> {
    return {
      schema_version: '1.0',
      chipset: {
        name,
        version: '1.0.0',
        description: 'Educational chipset for Family A adapter testing.',
      },
      skills: [
        {
          name: 'arch-reference',
          source: 'infra/packs/x/skills/arch-reference/SKILL.md',
          token_budget: '2.0%',
          priority: 70,
        },
      ],
      agents: [
        {
          name: 'simulator',
          description: 'Manages simulation execution.',
          skills: ['arch-reference'],
          team: 'education',
          model: 'opus',
          tools: 'Read, Write, Bash',
        },
      ],
      teams: [
        {
          name: 'education',
          description: 'Education team for testing.',
          topology: 'sequential',
          lead_agent: 'simulator',
          members: ['simulator'],
        },
      ],
    };
  }

  it('hoists chipset.name/version/description to top-level identity', () => {
    const yaml = stringifyYaml(familyAMinimal('my-family-a-cartridge'));
    const out = departmentLegacyToUnified(yaml);
    expect(out.name).toBe('my-family-a-cartridge');
    expect(out.version).toBe('1.0.0');
    expect(out.description).toContain('Educational chipset');
  });

  it('normalizes skills array to a map keyed by skill name', () => {
    const yaml = stringifyYaml(familyAMinimal());
    const out = departmentLegacyToUnified(yaml);
    const dept = out.chipsets.find((c) => c.kind === 'department');
    expect(dept).toBeDefined();
    const skills = (dept as { skills: Record<string, { source?: string }> }).skills;
    expect(skills['arch-reference']).toBeDefined();
    expect(skills['arch-reference'].source).toBe('infra/packs/x/skills/arch-reference/SKILL.md');
  });

  it('synthesizes description fallback for skills missing description', () => {
    const yaml = stringifyYaml(familyAMinimal());
    const out = departmentLegacyToUnified(yaml);
    const dept = out.chipsets.find((c) => c.kind === 'department');
    const sk = (dept as { skills: Record<string, { description: string }> }).skills['arch-reference'];
    expect(sk.description).toContain('Migrated from legacy skill arch-reference');
  });

  it('wraps agents array in {topology: router, agents: [...]} and splits tools string', () => {
    const yaml = stringifyYaml(familyAMinimal());
    const out = departmentLegacyToUnified(yaml);
    const dept = out.chipsets.find((c) => c.kind === 'department');
    const agentsBlock = (dept as { agents: { topology: string; agents: Array<{ tools?: string[]; role: string }> } }).agents;
    expect(agentsBlock.topology).toBe('router');
    expect(agentsBlock.agents).toHaveLength(1);
    expect(agentsBlock.agents[0].tools).toEqual(['Read', 'Write', 'Bash']);
    expect(agentsBlock.agents[0].role).toBe('education');  // fallback from `team` field
  });

  it('normalizes teams array to map and converts members → agents', () => {
    const yaml = stringifyYaml(familyAMinimal());
    const out = departmentLegacyToUnified(yaml);
    const dept = out.chipsets.find((c) => c.kind === 'department');
    const teams = (dept as { teams: Record<string, { agents: string[] }> }).teams;
    expect(teams.education).toBeDefined();
    expect(teams.education.agents).toEqual(['simulator']);
  });

  it('falls through when no chipset: sub-tree present (Family A detection is conservative)', () => {
    // legacyMinimal has top-level name; should NOT trigger Family A path.
    const legacy = legacyMinimal();
    const yaml = stringifyYaml(legacy);
    const out = departmentLegacyToUnified(yaml);
    expect(out.name).toBe('business-department-v1.0');
  });

  it('falls through when top-level name is present even with chipset: sub-tree', () => {
    const hybrid: Record<string, unknown> = {
      ...legacyMinimal(),
      chipset: { name: 'inner-name', version: '9.9.9', description: 'inner.' },
    };
    const yaml = stringifyYaml(hybrid);
    const out = departmentLegacyToUnified(yaml);
    expect(out.name).toBe('business-department-v1.0');  // top-level wins
    expect(out.version).toBe('1.0.0');
  });
});
