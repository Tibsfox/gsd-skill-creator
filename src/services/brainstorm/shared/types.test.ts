/**
 * Unit tests for brainstorm session type system.
 *
 * Covers FOUND-01 (type definitions, enum schemas) and FOUND-02 (object schemas).
 * Validates that all Zod schemas accept valid values, reject invalid values,
 * and that complex object schemas enforce structural correctness.
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  AgentRoleSchema,
  SessionPhaseSchema,
  TechniqueCategorySchema,
  TechniqueIdSchema,
  PathwayIdSchema,
  HatColorSchema,
  ScamperLensSchema,
  OsbornRuleSchema,
  EnergyLevelSchema,
  SessionStatusSchema,
  MessageTypeSchema,
  IdeaSchema,
  BrainstormMessageSchema,
  SessionStateSchema,
} from './types.js';

// ============================================================================
// FOUND-01: Enum schema validation
// ============================================================================

describe('AgentRoleSchema', () => {
  it('parses valid agent role "facilitator"', () => {
    expect(AgentRoleSchema.parse('facilitator')).toBe('facilitator');
  });

  it('rejects invalid agent role "coordinator"', () => {
    expect(() => AgentRoleSchema.parse('coordinator')).toThrow();
  });

  it('parses all 8 agent roles', () => {
    const roles = ['facilitator', 'ideator', 'questioner', 'analyst', 'mapper', 'critic', 'persona', 'scribe'];
    for (const role of roles) {
      expect(AgentRoleSchema.parse(role)).toBe(role);
    }
  });
});

describe('SessionPhaseSchema', () => {
  it('parses valid phase "diverge"', () => {
    expect(SessionPhaseSchema.parse('diverge')).toBe('diverge');
  });

  it('rejects invalid phase "planning"', () => {
    expect(() => SessionPhaseSchema.parse('planning')).toThrow();
  });

  it('parses all 5 phases', () => {
    const phases = ['explore', 'diverge', 'organize', 'converge', 'act'];
    for (const phase of phases) {
      expect(SessionPhaseSchema.parse(phase)).toBe(phase);
    }
  });
});

describe('TechniqueIdSchema', () => {
  it('parses all 16 technique ids', () => {
    const techniques = [
      'freewriting', 'mind-mapping', 'rapid-ideation', 'question-brainstorming',
      'brainwriting-635', 'round-robin', 'brain-netting', 'rolestorming',
      'figure-storming', 'scamper', 'six-thinking-hats', 'starbursting',
      'five-whys', 'storyboarding', 'affinity-mapping', 'lotus-blossom',
    ];
    expect(TechniqueIdSchema.options).toHaveLength(16);
    for (const t of techniques) {
      expect(TechniqueIdSchema.parse(t)).toBe(t);
    }
  });

  it('rejects unknown technique "unknown-technique"', () => {
    expect(() => TechniqueIdSchema.parse('unknown-technique')).toThrow();
  });
});

describe('TechniqueCategorySchema', () => {
  it('parses all 4 categories', () => {
    for (const cat of ['individual', 'collaborative', 'analytical', 'visual']) {
      expect(TechniqueCategorySchema.parse(cat)).toBe(cat);
    }
  });
});

describe('PathwayIdSchema', () => {
  it('parses all 5 pathway ids', () => {
    for (const p of ['creative-exploration', 'problem-solving', 'product-innovation', 'decision-making', 'free-form']) {
      expect(PathwayIdSchema.parse(p)).toBe(p);
    }
  });
});

describe('HatColorSchema', () => {
  it('parses all 6 hat colors', () => {
    for (const c of ['white', 'red', 'black', 'yellow', 'green', 'blue']) {
      expect(HatColorSchema.parse(c)).toBe(c);
    }
  });
});

describe('ScamperLensSchema', () => {
  it('parses all 7 SCAMPER lenses', () => {
    for (const lens of ['substitute', 'combine', 'adapt', 'modify', 'put-to-another-use', 'eliminate', 'reverse']) {
      expect(ScamperLensSchema.parse(lens)).toBe(lens);
    }
  });
});

describe('OsbornRuleSchema', () => {
  it('parses all 4 Osborn rules', () => {
    for (const rule of ['quantity', 'no-criticism', 'wild-ideas', 'build-combine']) {
      expect(OsbornRuleSchema.parse(rule)).toBe(rule);
    }
  });
});

describe('EnergyLevelSchema', () => {
  it('parses all 4 energy levels', () => {
    for (const level of ['high', 'medium', 'low', 'flagging']) {
      expect(EnergyLevelSchema.parse(level)).toBe(level);
    }
  });
});

// ============================================================================
// FOUND-02: Object schema validation
// ============================================================================

describe('IdeaSchema', () => {
  const validIdea = {
    id: randomUUID(),
    content: 'A great idea for testing',
    source_agent: 'ideator' as const,
    source_technique: 'freewriting' as const,
    phase: 'diverge' as const,
    tags: ['test', 'brainstorm'],
    timestamp: Date.now(),
  };

  it('parses a valid idea with all required fields', () => {
    const result = IdeaSchema.parse(validIdea);
    expect(result.id).toBe(validIdea.id);
    expect(result.content).toBe(validIdea.content);
  });

  it('throws when required "id" field is missing', () => {
    const { id, ...noId } = validIdea;
    expect(() => IdeaSchema.parse(noId)).toThrow();
  });

  it('throws when "id" is not a valid UUID', () => {
    expect(() => IdeaSchema.parse({ ...validIdea, id: 'not-a-uuid' })).toThrow();
  });

  it('accepts all optional fields omitted', () => {
    // parent_id, perspective, cluster_id, priority, scamper_lens, hat_color are all optional
    const minimal = { ...validIdea };
    // Ensure none of the optional fields are present
    delete (minimal as Record<string, unknown>).parent_id;
    delete (minimal as Record<string, unknown>).perspective;
    delete (minimal as Record<string, unknown>).cluster_id;
    delete (minimal as Record<string, unknown>).priority;
    delete (minimal as Record<string, unknown>).scamper_lens;
    delete (minimal as Record<string, unknown>).hat_color;
    expect(() => IdeaSchema.parse(minimal)).not.toThrow();
  });

  it('accepts all optional fields populated', () => {
    const full = {
      ...validIdea,
      parent_id: randomUUID(),
      perspective: 'End user',
      cluster_id: randomUUID(),
      priority: 5,
      scamper_lens: 'combine' as const,
      hat_color: 'green' as const,
    };
    expect(() => IdeaSchema.parse(full)).not.toThrow();
  });
});

describe('BrainstormMessageSchema', () => {
  const validMessage = {
    id: randomUUID(),
    from: 'facilitator' as const,
    to: 'broadcast' as const,
    type: 'idea' as const,
    phase: 'diverge' as const,
    payload: { content: 'test' },
    timestamp: Date.now(),
    session_id: randomUUID(),
    priority: 3,
  };

  it('parses a valid brainstorm message', () => {
    const result = BrainstormMessageSchema.parse(validMessage);
    expect(result.id).toBe(validMessage.id);
    expect(result.from).toBe('facilitator');
  });

  it('throws when session_id is missing', () => {
    const { session_id, ...noSessionId } = validMessage;
    expect(() => BrainstormMessageSchema.parse(noSessionId)).toThrow();
  });

  it('accepts "system" as from value', () => {
    const msg = { ...validMessage, from: 'system' };
    expect(() => BrainstormMessageSchema.parse(msg)).not.toThrow();
  });
});

describe('SessionStateSchema round-trip', () => {
  it('survives JSON.stringify -> JSON.parse -> parse()', () => {
    const now = Date.now();
    const state = {
      id: randomUUID(),
      status: 'active' as const,
      phase: 'diverge' as const,
      problem_statement: 'How to improve testing?',
      active_technique: 'freewriting' as const,
      active_pathway: null,
      technique_queue: ['mind-mapping' as const],
      active_agents: ['facilitator' as const, 'ideator' as const],
      ideas: [],
      questions: [],
      clusters: [],
      evaluations: [],
      action_items: [],
      timer: {
        technique_timer: { remaining_ms: 300000, total_ms: 600000 },
        session_timer: { elapsed_ms: 120000 },
        is_paused: false,
      },
      energy_level: 'high' as const,
      rules_active: ['quantity' as const, 'no-criticism' as const],
      metadata: {
        created_at: now,
        updated_at: now,
        total_ideas: 0,
        total_questions: 0,
        techniques_used: ['freewriting' as const],
        phase_history: [{ phase: 'explore' as const, entered_at: now - 60000, exited_at: now }],
      },
    };

    const serialized = JSON.stringify(state);
    const deserialized = JSON.parse(serialized);
    expect(() => SessionStateSchema.parse(deserialized)).not.toThrow();
  });
});
