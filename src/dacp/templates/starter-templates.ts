/**
 * Five starter bundle templates for common GSD handoff patterns.
 *
 * Each template specifies a default fidelity level, data schema refs,
 * code script refs, and test fixture refs appropriate to its handoff type.
 * The loadStarterTemplates() function registers all templates into a registry.
 *
 * @module dacp/templates/starter-templates
 */

import type { BundleTemplate } from '../types.js';
import type { BundleTemplateRegistry } from './registry.js';

// ============================================================================
// Template definitions
// ============================================================================

/**
 * Skill handoff template (Fidelity 2: markdown + schema).
 * Orchestrator hands off a skill invocation to an executor agent.
 * Skills are self-contained so no code scripts are needed.
 */
const skillHandoff: BundleTemplate = {
  id: 'skill-handoff-v1',
  name: 'Skill Handoff',
  handoff_type: 'orchestrator->executor:skill-handoff',
  description:
    'Orchestrator hands off a skill invocation to an executor agent with structured parameters and context.',
  default_fidelity: 2,
  data_schema_refs: ['skill-context-schema'],
  code_script_refs: [],
  test_fixture_refs: ['skill-handoff-fixture'],
};

/**
 * Phase transition template (Fidelity 2: markdown + schema).
 * Planner hands off phase execution context to an executor agent.
 * Executor determines own scripts, so no code scripts included.
 */
const phaseTransition: BundleTemplate = {
  id: 'phase-transition-v1',
  name: 'Phase Transition',
  handoff_type: 'planner->executor:phase-transition',
  description:
    'Planner hands off phase execution context to an executor agent with task list and dependencies.',
  default_fidelity: 2,
  data_schema_refs: ['phase-context-schema'],
  code_script_refs: [],
  test_fixture_refs: ['phase-transition-fixture'],
};

/**
 * Agent spawn template (Fidelity 3: full bundle).
 * Spawning agents needs complete scaffolding for determinism,
 * including a config validation script.
 */
const agentSpawn: BundleTemplate = {
  id: 'agent-spawn-v1',
  name: 'Agent Spawn',
  handoff_type: 'orchestrator->agent:agent-spawn',
  description:
    'Orchestrator spawns a new agent with full configuration bundle including role, tools, and constraints.',
  default_fidelity: 3,
  data_schema_refs: ['agent-config-schema'],
  code_script_refs: ['validate-agent-config'],
  test_fixture_refs: ['agent-spawn-fixture'],
};

/**
 * Verification request template (Fidelity 3: full bundle).
 * Verification needs test commands and expected outcomes,
 * so both run-tests and type-check scripts are included.
 */
const verificationRequest: BundleTemplate = {
  id: 'verification-request-v1',
  name: 'Verification Request',
  handoff_type: 'executor->verifier:verification-request',
  description:
    'Executor requests verification of completed work with test commands and expected outcomes.',
  default_fidelity: 3,
  data_schema_refs: ['verification-context-schema'],
  code_script_refs: ['run-tests', 'type-check'],
  test_fixture_refs: ['verification-request-fixture'],
};

/**
 * Error escalation template (Fidelity 1: markdown + data).
 * Errors are mostly descriptive with structured metadata.
 * Orchestrator decides remediation, so no code scripts needed.
 */
const errorEscalation: BundleTemplate = {
  id: 'error-escalation-v1',
  name: 'Error Escalation',
  handoff_type: 'agent->orchestrator:error-escalation',
  description:
    'Agent escalates an error to the orchestrator with structured error context and attempted fixes.',
  default_fidelity: 1,
  data_schema_refs: ['error-context-schema'],
  code_script_refs: [],
  test_fixture_refs: ['error-escalation-fixture'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All five starter templates as a readonly array.
 */
export const STARTER_TEMPLATES: readonly BundleTemplate[] = [
  skillHandoff,
  phaseTransition,
  agentSpawn,
  verificationRequest,
  errorEscalation,
] as const;

/**
 * Register all starter templates into a BundleTemplateRegistry.
 * Throws if any template id already exists in the registry (duplicate detection).
 */
export function loadStarterTemplates(registry: BundleTemplateRegistry): void {
  for (const template of STARTER_TEMPLATES) {
    registry.register(template);
  }
}
