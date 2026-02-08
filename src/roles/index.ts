/**
 * Barrel exports for the roles module.
 *
 * Exposes:
 * - Types and schemas: RoleDefinitionSchema, RoleDefinition
 * - Parser: parseRoleYaml, parseRoleFile
 * - Injector: formatConstraintsSection, injectConstraints
 */

// Types and schemas
export { RoleDefinitionSchema } from './types.js';
export type { RoleDefinition } from './types.js';

// Parser
export { parseRoleYaml, parseRoleFile } from './role-parser.js';

// Injector
export { formatConstraintsSection, injectConstraints } from './role-injector.js';
