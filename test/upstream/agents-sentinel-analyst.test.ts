import { describe, it, expect, vi } from 'vitest';
import yaml from 'js-yaml';
import { loadAgentConfig, type AgentYaml } from '../../src/upstream/agents/index';

const SENTINEL_YAML = `
name: upstream-sentinel
model: haiku
description: >
  Monitors Anthropic public channels for content changes via hash comparison.
  Fetches page content, computes hashes, and emits RawChangeEvents when diffs
  are detected.
tools:
  - Read
  - Bash
  - WebFetch
budget_tokens: 8000
trigger_contexts:
  - channel monitoring
  - content fetching
`;

const ANALYST_YAML = `
name: upstream-analyst
model: sonnet
description: >
  Classifies raw change events by type, severity, and affected domains.
  Assesses auto-patchability and produces ClassifiedEvents with confidence
  scores.
tools:
  - Read
  - Grep
budget_tokens: 12000
trigger_contexts:
  - change classification
  - severity assessment
`;

describe('SENTINEL Agent Definition', () => {
  it('SENTINEL agent YAML is valid and parseable', () => {
    const readFile = vi.fn().mockReturnValue(SENTINEL_YAML);
    const config = loadAgentConfig('sentinel', readFile);
    expect(config).toBeDefined();
    expect(config.name).toBe('upstream-sentinel');
  });

  it('SENTINEL specifies haiku model', () => {
    const readFile = vi.fn().mockReturnValue(SENTINEL_YAML);
    const config = loadAgentConfig('sentinel', readFile);
    expect(config.model).toBe('haiku');
  });

  it('SENTINEL has correct tool permissions (Read, Bash, WebFetch)', () => {
    const readFile = vi.fn().mockReturnValue(SENTINEL_YAML);
    const config = loadAgentConfig('sentinel', readFile);
    expect(config.tools).toEqual(['Read', 'Bash', 'WebFetch']);
  });

  it('SENTINEL has token budget <= 8K', () => {
    const readFile = vi.fn().mockReturnValue(SENTINEL_YAML);
    const config = loadAgentConfig('sentinel', readFile);
    expect(config.budget_tokens).toBeLessThanOrEqual(8000);
    expect(config.budget_tokens).toBeGreaterThan(0);
  });
});

describe('ANALYST Agent Definition', () => {
  it('ANALYST agent YAML is valid and parseable', () => {
    const readFile = vi.fn().mockReturnValue(ANALYST_YAML);
    const config = loadAgentConfig('analyst', readFile);
    expect(config).toBeDefined();
    expect(config.name).toBe('upstream-analyst');
  });

  it('ANALYST specifies sonnet model', () => {
    const readFile = vi.fn().mockReturnValue(ANALYST_YAML);
    const config = loadAgentConfig('analyst', readFile);
    expect(config.model).toBe('sonnet');
  });

  it('ANALYST has correct tool permissions (Read, Grep)', () => {
    const readFile = vi.fn().mockReturnValue(ANALYST_YAML);
    const config = loadAgentConfig('analyst', readFile);
    expect(config.tools).toEqual(['Read', 'Grep']);
  });
});

describe('Agent YAML validation', () => {
  it('both agents have description fields', () => {
    const readSentinel = vi.fn().mockReturnValue(SENTINEL_YAML);
    const readAnalyst = vi.fn().mockReturnValue(ANALYST_YAML);
    const sentinel = loadAgentConfig('sentinel', readSentinel);
    const analyst = loadAgentConfig('analyst', readAnalyst);
    expect(sentinel.description).toBeTruthy();
    expect(typeof sentinel.description).toBe('string');
    expect(analyst.description).toBeTruthy();
    expect(typeof analyst.description).toBe('string');
  });
});
