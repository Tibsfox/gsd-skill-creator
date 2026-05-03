/**
 * Intelligence Dashboard barrel.
 *
 * Re-exports the shared TypeScript contracts (types.ts) and the KB stub
 * (kb/stub.ts) for downstream Wave 1 components to consume.
 */

export * from './types.js';
export { IntelligenceKBStub } from './kb/stub.js';
