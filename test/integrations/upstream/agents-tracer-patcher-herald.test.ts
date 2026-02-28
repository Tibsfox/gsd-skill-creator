import { describe, it, expect, vi } from 'vitest';
import { loadAgentConfig } from '../../../src/integrations/upstream/agents/index';

const TRACER_YAML = `
name: upstream-tracer
model: sonnet
description: >
  Traces the impact of classified upstream changes across the local codebase.
  Builds dependency graphs, identifies directly and transitively affected
  components, and produces ImpactManifests with blast-radius estimates.
tools:
  - Read
  - Grep
  - Glob
budget_tokens: 20000
trigger_contexts:
  - impact tracing
  - dependency analysis
  - blast radius estimation
`;

const PATCHER_YAML = `
name: upstream-patcher
model: sonnet
description: >
  Generates and applies patches to skills and agents affected by upstream
  changes. Enforces safety constraints including the 20% content change
  bound, automatic backup creation before modification, and rollback
  capability on validation failure. All patches require validation before
  finalization.
tools:
  - Read
  - Write
  - Edit
  - Bash
budget_tokens: 25000
trigger_contexts:
  - patch generation
  - skill update
  - auto-remediation
`;

const HERALD_YAML = `
name: upstream-herald
model: opus
description: >
  Composes intelligence briefings from classified changes, applied patches,
  and pending decisions. Generates flash alerts for P0 events, session
  briefings for active work, and weekly/monthly digests. Routes briefings
  to the dashboard and terminal panel.
tools:
  - Read
  - Write
budget_tokens: 15000
trigger_contexts:
  - briefing generation
  - dashboard alerts
  - intelligence reporting
`;

describe('TRACER Agent Definition', () => {
  it('TRACER uses sonnet model', () => {
    const readFile = vi.fn().mockReturnValue(TRACER_YAML);
    const config = loadAgentConfig('tracer', readFile);
    expect(config.model).toBe('sonnet');
  });

  it('TRACER has Read, Grep, Glob tools', () => {
    const readFile = vi.fn().mockReturnValue(TRACER_YAML);
    const config = loadAgentConfig('tracer', readFile);
    expect(config.tools).toEqual(['Read', 'Grep', 'Glob']);
  });

  it('TRACER has token budget <= 20K', () => {
    const readFile = vi.fn().mockReturnValue(TRACER_YAML);
    const config = loadAgentConfig('tracer', readFile);
    expect(config.budget_tokens).toBeLessThanOrEqual(20000);
    expect(config.budget_tokens).toBeGreaterThan(0);
  });

  it('TRACER description mentions impact tracing', () => {
    const readFile = vi.fn().mockReturnValue(TRACER_YAML);
    const config = loadAgentConfig('tracer', readFile);
    expect(config.description.toLowerCase()).toContain('impact');
  });
});

describe('PATCHER Agent Definition', () => {
  it('PATCHER uses sonnet model', () => {
    const readFile = vi.fn().mockReturnValue(PATCHER_YAML);
    const config = loadAgentConfig('patcher', readFile);
    expect(config.model).toBe('sonnet');
  });

  it('PATCHER has Read, Write, Edit, Bash tools', () => {
    const readFile = vi.fn().mockReturnValue(PATCHER_YAML);
    const config = loadAgentConfig('patcher', readFile);
    expect(config.tools).toEqual(['Read', 'Write', 'Edit', 'Bash']);
  });

  it('PATCHER description mentions safety constraints (20% bound, backup, rollback)', () => {
    const readFile = vi.fn().mockReturnValue(PATCHER_YAML);
    const config = loadAgentConfig('patcher', readFile);
    const desc = config.description.toLowerCase();
    expect(desc).toContain('20%');
    expect(desc).toContain('backup');
    expect(desc).toContain('rollback');
  });

  it('PATCHER has token budget <= 25K', () => {
    const readFile = vi.fn().mockReturnValue(PATCHER_YAML);
    const config = loadAgentConfig('patcher', readFile);
    expect(config.budget_tokens).toBeLessThanOrEqual(25000);
    expect(config.budget_tokens).toBeGreaterThan(0);
  });
});

describe('HERALD Agent Definition', () => {
  it('HERALD uses opus model', () => {
    const readFile = vi.fn().mockReturnValue(HERALD_YAML);
    const config = loadAgentConfig('herald', readFile);
    expect(config.model).toBe('opus');
  });

  it('HERALD has Read, Write tools', () => {
    const readFile = vi.fn().mockReturnValue(HERALD_YAML);
    const config = loadAgentConfig('herald', readFile);
    expect(config.tools).toEqual(['Read', 'Write']);
  });

  it('HERALD has token budget <= 15K', () => {
    const readFile = vi.fn().mockReturnValue(HERALD_YAML);
    const config = loadAgentConfig('herald', readFile);
    expect(config.budget_tokens).toBeLessThanOrEqual(15000);
    expect(config.budget_tokens).toBeGreaterThan(0);
  });
});

describe('All three agents have valid definitions', () => {
  it('all descriptions trigger on appropriate upstream contexts', () => {
    const readTracer = vi.fn().mockReturnValue(TRACER_YAML);
    const readPatcher = vi.fn().mockReturnValue(PATCHER_YAML);
    const readHerald = vi.fn().mockReturnValue(HERALD_YAML);

    const tracer = loadAgentConfig('tracer', readTracer);
    const patcher = loadAgentConfig('patcher', readPatcher);
    const herald = loadAgentConfig('herald', readHerald);

    expect(tracer.trigger_contexts).toContain('impact tracing');
    expect(patcher.trigger_contexts).toContain('patch generation');
    expect(herald.trigger_contexts).toContain('briefing generation');
  });
});
