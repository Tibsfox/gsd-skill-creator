/**
 * Cross-Reference Network -- barrel export.
 *
 * @module cross-references
 */

export { ALL_XREF_EDGES } from './dependency-graph-xrefs.js';
export type { XRefEdge } from './dependency-graph-xrefs.js';
export { XRefRegistry } from './xref-registry.js';
export { DepChainValidator, DepChainValidationError } from './dep-chain-validator.js';
export type { DepChainError, DepChainValidationResult } from './dep-chain-validator.js';
