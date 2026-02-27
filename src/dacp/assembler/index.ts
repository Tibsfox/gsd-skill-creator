/**
 * DACP assembler module.
 *
 * Re-exports the assembler core engine and catalog query.
 *
 * @module dacp/assembler
 */

export { DACPAssembler } from './assembler.js';
export type { AssemblyRequest, AssemblyResult } from './assembler.js';
export { CatalogQuery } from './catalog-query.js';
export { formatRationale, formatAssemblyLog } from './rationale.js';
export type { AssemblyLogInput } from './rationale.js';
