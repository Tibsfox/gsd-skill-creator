/**
 * Round-trip and schema-rejection tests for the unified cartridge +
 * chipset schemas. One test per chipset kind (RT-01..RT-08), two
 * top-level cartridge round-trips (RT-09..RT-10), plus schema-rejection
 * coverage for missing required fields (VA-07..VA-08).
 *
 * Round-trip contract: parse(serialize(parse(input))) is deep-equal to
 * parse(input). We use `safeParse` + `JSON.stringify`/`JSON.parse` to force a
 * serialization boundary.
 */

import { describe, expect, it } from 'vitest';
import {
  CartridgeSchema,
  ChipsetSchema,
  ContentChipsetSchema,
  VoiceChipsetSchema,
  DepartmentChipsetSchema,
  GroveChipsetSchema,
  CollegeChipsetSchema,
  CoprocessorChipsetSchema,
  GraphicsChipsetSchema,
  MetricsChipsetSchema,
  EvaluationChipsetSchema,
  CHIPSET_KINDS,
  findChipset,
  findChipsets,
  type Cartridge,
  type Chipset,
} from '../index.js';

// ---------------------------------------------------------------------------
// Fixtures — one per chipset kind
// ---------------------------------------------------------------------------

const contentFixture = {
  kind: 'content' as const,
  deepMap: {
    concepts: [
      {
        id: 'space',
        name: 'Space Between',
        description: 'The silence that carries the signal',
        depth: 'read' as const,
        tags: ['audio', 'mesh'],
      },
    ],
    connections: [],
    entryPoints: ['space'],
    progressionPaths: [
      {
        id: 'intro',
        name: 'Introduction',
        description: 'Start here',
        steps: ['space'],
      },
    ],
  },
  story: {
    title: 'The Space Between',
    narrative: 'A muse for the mesh.',
    chapters: [
      {
        id: 'ch1',
        title: 'Opening',
        summary: 'Where we begin.',
        conceptRefs: ['space'],
      },
    ],
    throughLine: 'Silence carries the signal.',
  },
};

const voiceFixture = {
  kind: 'voice' as const,
  vocabulary: ['resonance', 'harmonic', 'threshold'],
  orientation: { angle: 1.5, magnitude: 0.7 },
  voice: { tone: 'reflective', style: 'narrative' as const },
  museAffinity: ['maple'],
};

const departmentFixture = {
  kind: 'department' as const,
  skills: {
    'rca-classical-methods': {
      domain: 'rca',
      description: 'Classical RCA — 5 Whys, Ishikawa, FMEA.',
      triggers: ['root cause', '5 whys'],
      agent_affinity: 'five-whys-facilitator',
    },
    'rca-human-factors': {
      domain: 'rca',
      description: 'Human-factors RCA — Swiss Cheese, HFACS.',
      triggers: ['human error', 'HFACS'],
      agent_affinity: ['rca-investigator', 'five-whys-facilitator'],
    },
  },
  agents: {
    topology: 'router' as const,
    router_agent: 'rca-investigator',
    agents: [
      {
        name: 'rca-investigator',
        role: 'department coordinator',
        model: 'opus',
        tools: ['Read', 'Write'],
        is_capcom: true,
      },
      {
        name: 'five-whys-facilitator',
        role: 'classical RCA facilitator',
        model: 'sonnet',
        tools: ['Read'],
      },
    ],
  },
  teams: {
    'rca-deep-team': {
      description: 'Multi-method parallel investigation.',
      agents: ['rca-investigator', 'five-whys-facilitator'],
      use_when: 'SEV1/SEV2 incidents',
    },
  },
};

const groveFixture = {
  kind: 'grove' as const,
  namespace: 'rca-department',
  record_types: [
    { name: 'RCAInvestigation', description: 'An investigation session.' },
    { name: 'RCAFinding', description: 'A single causal finding.' },
  ],
};

const collegeFixture = {
  kind: 'college' as const,
  department: 'mathematics',
  concept_graph: { read: true, write: true },
  try_session_generation: true,
  learning_pathway_updates: true,
  wings: ['algebra', 'analysis'],
};

const collegeNullFixture = {
  kind: 'college' as const,
  department: null,
  concept_graph: { read: false, write: false },
  try_session_generation: false,
  learning_pathway_updates: false,
  wings: [],
};

const coprocessorFixture = {
  kind: 'coprocessor' as const,
  package: { name: 'math-coprocessor', language: 'python' },
  mcp: { config: 'mcp.json' },
  runtime: { vram_budget_mb: 8192, cuda_streams: 4 },
  chips: [
    { name: 'symbolic', function: 'CAS routing' },
    { name: 'numerical', function: 'float64 solvers' },
  ],
};

const graphicsFixture = {
  kind: 'graphics' as const,
  api: 'webgl2' as const,
  api_version: '2.0',
  shader_language: 'glsl-es' as const,
  shader_language_version: '3.00',
  shader_stages: ['vertex', 'fragment'] as ('vertex' | 'fragment')[],
  sources: [
    { stage: 'vertex' as const, path: 'shaders/basic.vert.glsl', entry_point: 'main' },
    { stage: 'fragment' as const, path: 'shaders/basic.frag.glsl', entry_point: 'main' },
  ],
  runtime: { target_fps: 60 },
  toolchain: { glslang: true },
  host: { kind: 'vite' as const, entry: 'index.html' },
};

const metricsFixture = {
  kind: 'metrics' as const,
  activation_tracking: {
    triggers: true,
    skill_loads: true,
    agent_routes: true,
    team_uses: false,
  },
  benchmarks: [
    {
      trigger_accuracy_threshold: 0.85,
      test_cases_minimum: 25,
      domains_covered: ['scaffold', 'distill'],
    },
  ],
  telemetry_sinks: ['jsonl' as const, 'grove' as const],
};

const evaluationFixture = {
  kind: 'evaluation' as const,
  pre_deploy: [
    'all_skills_have_descriptions',
    'all_agents_have_roles',
    'grove_record_types_defined',
  ],
  benchmark: {
    trigger_accuracy_threshold: 0.85,
    test_cases_minimum: 25,
    domains_covered: ['classical', 'systems-theoretic', 'causal-inference'],
  },
};

// ---------------------------------------------------------------------------
// Round-trip helper
// ---------------------------------------------------------------------------

function roundTripChipset(input: unknown): Chipset {
  const parsed = ChipsetSchema.parse(input);
  const serialized = JSON.parse(JSON.stringify(parsed));
  return ChipsetSchema.parse(serialized);
}

function roundTripCartridge(input: unknown): Cartridge {
  const parsed = CartridgeSchema.parse(input);
  const serialized = JSON.parse(JSON.stringify(parsed));
  return CartridgeSchema.parse(serialized);
}

// ---------------------------------------------------------------------------
// RT-01..RT-08 — chipset round trips
// ---------------------------------------------------------------------------

describe('unified chipset schema — round trips', () => {
  it('RT-01 content chipset round-trips losslessly', () => {
    const rt = roundTripChipset(contentFixture);
    expect(rt).toEqual(contentFixture);
    // Targeted parses verify discriminator preservation
    expect(ContentChipsetSchema.parse(rt)).toEqual(contentFixture);
  });

  it('RT-02 voice chipset round-trips losslessly', () => {
    const rt = roundTripChipset(voiceFixture);
    expect(rt).toEqual(voiceFixture);
    expect(VoiceChipsetSchema.parse(rt)).toEqual(voiceFixture);
  });

  it('RT-03 department chipset round-trips losslessly', () => {
    const rt = roundTripChipset(departmentFixture);
    expect(rt).toEqual(departmentFixture);
    expect(DepartmentChipsetSchema.parse(rt)).toEqual(departmentFixture);
  });

  it('RT-04 grove chipset round-trips losslessly', () => {
    const rt = roundTripChipset(groveFixture);
    expect(rt).toEqual(groveFixture);
    expect(GroveChipsetSchema.parse(rt)).toEqual(groveFixture);
  });

  it('RT-05 college chipset round-trips losslessly (with wings)', () => {
    const rt = roundTripChipset(collegeFixture);
    expect(rt).toEqual(collegeFixture);
    expect(CollegeChipsetSchema.parse(rt)).toEqual(collegeFixture);
  });

  it('RT-05b college chipset round-trips with null department (Category B opt-out)', () => {
    const rt = roundTripChipset(collegeNullFixture);
    expect(rt).toEqual(collegeNullFixture);
  });

  it('RT-06 coprocessor chipset round-trips losslessly', () => {
    const rt = roundTripChipset(coprocessorFixture);
    expect(rt).toEqual(coprocessorFixture);
    expect(CoprocessorChipsetSchema.parse(rt)).toEqual(coprocessorFixture);
  });

  it('RT-06b graphics chipset round-trips losslessly', () => {
    const rt = roundTripChipset(graphicsFixture);
    expect(rt).toEqual(graphicsFixture);
    expect(GraphicsChipsetSchema.parse(rt)).toEqual(graphicsFixture);
  });

  it('RT-07 metrics chipset round-trips losslessly', () => {
    const rt = roundTripChipset(metricsFixture);
    expect(rt).toEqual(metricsFixture);
    expect(MetricsChipsetSchema.parse(rt)).toEqual(metricsFixture);
  });

  it('RT-08 evaluation chipset round-trips losslessly', () => {
    const rt = roundTripChipset(evaluationFixture);
    expect(rt).toEqual(evaluationFixture);
    expect(EvaluationChipsetSchema.parse(rt)).toEqual(evaluationFixture);
  });
});

// ---------------------------------------------------------------------------
// RT-09..RT-10 — top-level cartridge round trips
// ---------------------------------------------------------------------------

describe('unified Cartridge schema — round trips', () => {
  const baseCartridge: Cartridge = {
    id: 'cartridge-forge',
    name: 'Cartridge Forge',
    version: '0.1.0',
    author: 'tibsfox',
    description: 'The forge that makes cartridges.',
    trust: 'system',
    provenance: {
      origin: 'tibsfox',
      createdAt: '2026-04-14T00:00:00Z',
      sourceCommits: ['52625ee44'],
      researchGrounding: ['.planning/CARTRIDGE-FORGE-BUILD-BRIEF.md'],
    },
    chipsets: [
      departmentFixture,
      groveFixture,
      metricsFixture,
      evaluationFixture,
    ],
  };

  it('RT-09 multi-chipset cartridge round-trips losslessly', () => {
    const rt = roundTripCartridge(baseCartridge);
    expect(rt).toEqual(baseCartridge);
    expect(rt.chipsets).toHaveLength(4);
  });

  it('RT-10 cartridge with dependencies + metadata + extended provenance round-trips', () => {
    const rich: Cartridge = {
      ...baseCartridge,
      id: 'cartridge-forge-rich',
      dependencies: ['math-department-v1', 'rca-department-v1'],
      metadata: {
        staging: 'dogfood',
        notes: 42,
        tags: ['forge', 'dogfood'],
      },
      provenance: {
        ...baseCartridge.provenance,
        forkOf: 'cartridge-forge',
        buildSession: 'session-cartridge-forge-001',
      },
    };
    const rt = roundTripCartridge(rich);
    expect(rt).toEqual(rich);
    expect(rt.dependencies).toEqual(['math-department-v1', 'rca-department-v1']);
    expect(rt.metadata?.staging).toBe('dogfood');
    expect(rt.provenance.forkOf).toBe('cartridge-forge');
  });

  it('supports all 9 chipset kinds in a single cartridge', () => {
    const everything: Cartridge = {
      ...baseCartridge,
      id: 'everything-cartridge',
      chipsets: [
        contentFixture,
        voiceFixture,
        departmentFixture,
        groveFixture,
        collegeFixture,
        coprocessorFixture,
        graphicsFixture,
        metricsFixture,
        evaluationFixture,
      ],
    };
    const rt = roundTripCartridge(everything);
    expect(rt.chipsets).toHaveLength(9);
    const kinds = new Set(rt.chipsets.map((c) => c.kind));
    expect(kinds).toEqual(new Set(CHIPSET_KINDS));
  });
});

// ---------------------------------------------------------------------------
// GFX-01..GFX-06 — GraphicsChipsetSchema acceptance + rejection
// ---------------------------------------------------------------------------

describe('GraphicsChipsetSchema', () => {
  it('GFX-01 accepts all four Khronos APIs with round-trip parity', () => {
    const apis = [
      { api: 'opengl' as const, shader_language: 'glsl' as const, av: '4.6', sv: '4.60' },
      { api: 'opengl-es' as const, shader_language: 'glsl-es' as const, av: '3.2', sv: '3.20' },
      { api: 'webgl' as const, shader_language: 'glsl-es' as const, av: '1.0', sv: '1.00' },
      { api: 'webgl2' as const, shader_language: 'glsl-es' as const, av: '2.0', sv: '3.00' },
      { api: 'vulkan' as const, shader_language: 'spirv' as const, av: '1.4', sv: '1.6' },
    ];
    for (const spec of apis) {
      const fixture = {
        kind: 'graphics' as const,
        api: spec.api,
        api_version: spec.av,
        shader_language: spec.shader_language,
        shader_language_version: spec.sv,
        shader_stages: ['vertex', 'fragment'] as ('vertex' | 'fragment')[],
      };
      const rt = roundTripChipset(fixture);
      expect(rt).toEqual(fixture);
      expect(GraphicsChipsetSchema.parse(rt).api).toBe(spec.api);
    }
  });

  it('GFX-02 rejects malformed api_version string', () => {
    const bad = {
      ...graphicsFixture,
      api_version: 'four-point-six',
    };
    expect(GraphicsChipsetSchema.safeParse(bad).success).toBe(false);
  });

  it('GFX-03 requires at least one shader stage', () => {
    const bad = {
      ...graphicsFixture,
      shader_stages: [] as const,
    };
    expect(GraphicsChipsetSchema.safeParse(bad).success).toBe(false);
  });

  it('GFX-04 accepts a graphics chipset without any sources', () => {
    const minimal = {
      kind: 'graphics' as const,
      api: 'vulkan' as const,
      api_version: '1.4',
      shader_language: 'spirv' as const,
      shader_language_version: '1.6',
      shader_stages: ['vertex', 'fragment'] as ('vertex' | 'fragment')[],
    };
    expect(GraphicsChipsetSchema.safeParse(minimal).success).toBe(true);
  });

  it('GFX-05 schema accepts sources[].stage outside declared shader_stages (eval gate enforces this, not schema)', () => {
    // The schema validates each source.stage is a valid shader stage enum
    // value. Cross-field consistency (source stage must appear in
    // shader_stages) is intentionally an EVAL gate, not a Zod constraint.
    const schemaLegalButEvalIllegal = {
      ...graphicsFixture,
      shader_stages: ['vertex'] as const,
      sources: [
        { stage: 'vertex' as const, path: 'v.glsl', entry_point: 'main' },
        { stage: 'fragment' as const, path: 'f.glsl', entry_point: 'main' },
      ],
    };
    expect(GraphicsChipsetSchema.safeParse(schemaLegalButEvalIllegal).success).toBe(true);
  });

  it('GFX-06 rejects invalid shader stage enum', () => {
    const bad = {
      ...graphicsFixture,
      shader_stages: ['vertex', 'ray-generation'] as const,
    };
    expect(GraphicsChipsetSchema.safeParse(bad).success).toBe(false);
  });

  it('GFX-07 entry_point defaults to "main"', () => {
    const withoutEntry = {
      kind: 'graphics' as const,
      api: 'webgl2' as const,
      api_version: '2.0',
      shader_language: 'glsl-es' as const,
      shader_language_version: '3.00',
      shader_stages: ['vertex'] as const,
      sources: [{ stage: 'vertex' as const, path: 'v.glsl' }],
    };
    const parsed = GraphicsChipsetSchema.parse(withoutEntry);
    expect(parsed.sources?.[0]?.entry_point).toBe('main');
  });
});

// ---------------------------------------------------------------------------
// VA-07..VA-08 — schema rejection (missing required fields)
// ---------------------------------------------------------------------------

describe('unified schema — rejection of missing required fields', () => {
  it('VA-07 top-level Cartridge rejects missing required fields', () => {
    const bad = {
      id: 'x',
      name: 'x',
      // version missing
      author: 'x',
      description: 'x',
      trust: 'system',
      provenance: { origin: 'x', createdAt: '2026-04-14T00:00:00Z' },
      chipsets: [groveFixture],
    };
    expect(CartridgeSchema.safeParse(bad).success).toBe(false);
  });

  it('VA-07b Cartridge rejects empty chipsets array', () => {
    const bad = {
      id: 'x',
      name: 'x',
      version: '1.0.0',
      author: 'x',
      description: 'x',
      trust: 'system',
      provenance: { origin: 'x', createdAt: '2026-04-14T00:00:00Z' },
      chipsets: [],
    };
    expect(CartridgeSchema.safeParse(bad).success).toBe(false);
  });

  it('VA-07c Cartridge rejects invalid trust value', () => {
    const bad = {
      id: 'x',
      name: 'x',
      version: '1.0.0',
      author: 'x',
      description: 'x',
      trust: 'root',
      provenance: { origin: 'x', createdAt: '2026-04-14T00:00:00Z' },
      chipsets: [groveFixture],
    };
    expect(CartridgeSchema.safeParse(bad).success).toBe(false);
  });

  it('VA-08 each chipset kind rejects its own missing required fields', () => {
    expect(
      ContentChipsetSchema.safeParse({ kind: 'content' }).success,
    ).toBe(false);
    expect(
      VoiceChipsetSchema.safeParse({ kind: 'voice', vocabulary: [] }).success,
    ).toBe(false);
    expect(
      DepartmentChipsetSchema.safeParse({ kind: 'department', skills: {} })
        .success,
    ).toBe(false);
    expect(
      GroveChipsetSchema.safeParse({ kind: 'grove', namespace: 'x' }).success,
    ).toBe(false);
    expect(
      GroveChipsetSchema.safeParse({
        kind: 'grove',
        namespace: 'x',
        record_types: [],
      }).success,
    ).toBe(false);
    expect(
      CollegeChipsetSchema.safeParse({ kind: 'college' }).success,
    ).toBe(false);
    expect(
      CoprocessorChipsetSchema.safeParse({ kind: 'coprocessor' }).success,
    ).toBe(false);
    expect(
      GraphicsChipsetSchema.safeParse({ kind: 'graphics' }).success,
    ).toBe(false);
    expect(
      MetricsChipsetSchema.safeParse({ kind: 'metrics' }).success,
    ).toBe(false);
    expect(
      EvaluationChipsetSchema.safeParse({ kind: 'evaluation' }).success,
    ).toBe(false);
  });

  it('ChipsetSchema discriminated union rejects unknown kind', () => {
    expect(
      ChipsetSchema.safeParse({ kind: 'telepathy' as never, foo: 1 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Helper coverage
// ---------------------------------------------------------------------------

describe('findChipset / findChipsets helpers', () => {
  const cart: Cartridge = {
    id: 'multi',
    name: 'Multi',
    version: '1.0.0',
    author: 'tibsfox',
    description: 'has multiple groves',
    trust: 'system',
    provenance: { origin: 'tibsfox', createdAt: '2026-04-14T00:00:00Z' },
    chipsets: [
      groveFixture,
      { ...groveFixture, namespace: 'second-grove' },
      evaluationFixture,
    ],
  };

  it('findChipset returns the first matching chipset', () => {
    const g = findChipset(cart, 'grove');
    expect(g?.namespace).toBe('rca-department');
  });

  it('findChipset returns undefined for missing kind', () => {
    expect(findChipset(cart, 'content')).toBeUndefined();
  });

  it('findChipsets returns every matching chipset in order', () => {
    const all = findChipsets(cart, 'grove');
    expect(all).toHaveLength(2);
    expect(all[1]?.namespace).toBe('second-grove');
  });

  it('CHIPSET_KINDS covers exactly the 9 kinds in the discriminated union', () => {
    expect(CHIPSET_KINDS).toHaveLength(9);
    expect(new Set(CHIPSET_KINDS)).toEqual(
      new Set([
        'content',
        'voice',
        'department',
        'grove',
        'college',
        'coprocessor',
        'graphics',
        'metrics',
        'evaluation',
      ]),
    );
  });
});
