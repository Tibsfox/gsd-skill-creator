// Domain-prefixed identifier types for topology-encoding entity naming

/**
 * Single-letter domain prefix encoding entity role.
 * F=Frontend, B=Backend, T=Testing, I=Infrastructure, O=Observation, S=Silicon
 */
export type DomainPrefix = 'F' | 'B' | 'T' | 'I' | 'O' | 'S';

/**
 * Full domain name corresponding to a prefix.
 */
export type DomainName = 'frontend' | 'backend' | 'testing' | 'infrastructure' | 'observation' | 'silicon';

/**
 * Agent identifier: domain prefix + sequential number (e.g., F-1, B-3)
 */
export type AgentId = `${DomainPrefix}-${number}`;

/**
 * Skill identifier: agent ID + dot + abbreviation (e.g., F-1.rcp)
 */
export type SkillId = `${AgentId}.${string}`;

/**
 * Adapter identifier: agent ID + colon + abbreviation (e.g., F-1:rcp)
 */
export type AdapterId = `${AgentId}:${string}`;

/**
 * Maps domain names to their single-letter prefixes.
 */
export const DOMAIN_PREFIX_MAP: Record<DomainName, DomainPrefix> = {
  frontend: 'F',
  backend: 'B',
  testing: 'T',
  infrastructure: 'I',
  observation: 'O',
  silicon: 'S',
};

/**
 * Maps single-letter prefixes back to domain names.
 */
export const REVERSE_PREFIX_MAP: Record<DomainPrefix, DomainName> = {
  F: 'frontend',
  B: 'backend',
  T: 'testing',
  I: 'infrastructure',
  O: 'observation',
  S: 'silicon',
};

/**
 * Keywords for inferring domain from descriptions.
 * Used by inferDomain() for keyword-scoring classification.
 */
export const DOMAIN_KEYWORDS: Record<DomainName, readonly string[]> = {
  frontend: ['ui', 'component', 'css', 'html', 'react', 'vue', 'svelte', 'layout', 'style', 'render', 'browser', 'dom', 'jsx', 'tsx'],
  backend: ['api', 'server', 'route', 'endpoint', 'database', 'query', 'rest', 'graphql', 'middleware', 'auth', 'crud'],
  testing: ['test', 'spec', 'assert', 'mock', 'fixture', 'coverage', 'vitest', 'jest', 'expect', 'tdd'],
  infrastructure: ['deploy', 'ci', 'docker', 'config', 'env', 'build', 'bundle', 'pipeline', 'devops', 'terraform'],
  observation: ['log', 'metric', 'monitor', 'trace', 'observe', 'alert', 'dashboard', 'telemetry', 'audit'],
  silicon: ['gpu', 'vram', 'model', 'inference', 'adapter', 'lora', 'quantize', 'tensor', 'cuda', 'ml'],
};
