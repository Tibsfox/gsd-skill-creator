/**
 * Type barrel exports for the GSD Skill Creator.
 *
 * Re-exports security types for v1.38 SSH Agent Security milestone.
 * Other type modules are imported directly by path as they predate
 * this barrel file.
 *
 * @module types
 */

export {
  DomainCredentialSchema,
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
} from './security.js';

export type {
  DomainCredential,
  SecurityEvent,
  SandboxProfile,
  ProxyConfig,
  AgentIsolationState,
} from './security.js';
