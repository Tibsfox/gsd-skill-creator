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
