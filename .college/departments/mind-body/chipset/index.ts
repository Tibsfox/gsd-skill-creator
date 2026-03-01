/**
 * Chipset barrel export for the Mind-Body department.
 *
 * Exports the complete chipset configuration (10 skills, 3 agents,
 * token budget) and individual agent definitions.
 *
 * @module departments/mind-body/chipset
 */

// Chipset configuration
export { chipsetConfig } from './chipset-config.js';
export type { ChipsetConfig, TokenBudget } from './chipset-config.js';

// Agent definitions
export { senseiAgent, instructorAgent, builderAgent } from './agent-definitions.js';
export type { ChipsetSkill, AgentDefinition } from './agent-definitions.js';
