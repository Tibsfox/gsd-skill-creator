// === Specification Extraction Heuristic ===
//
// Extracts MUST/SHALL requirements, interface definitions, invariants,
// and constraints from specification documents.

import type { PrimitiveType } from '../../core/types/mfe-types.js';
import type { ExtractionHeuristic, ExtractionPattern } from './index.js';

const patterns: ExtractionPattern[] = [
  {
    // MUST validate input, SHALL return 200
    regex: /(?:MUST|SHALL)\s+(?:NOT\s+)?(.+?)(?:\.|$)/gim,
    primitiveType: 'axiom' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // SHOULD log errors (weaker: technique/recommendation)
    regex: /(?:SHOULD)\s+(?:NOT\s+)?(.+?)(?:\.|$)/gim,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Interface: UserService
    regex: /(?:Interface|Service|Component)[.:\s]+(.+?)(?:\n|$)/gi,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Invariant: total_count >= 0
    regex: /(?:Invariant|Constraint|Precondition|Postcondition)[.:\s]+(.+?)(?=\n|$)/gi,
    primitiveType: 'axiom' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
];

export const specHeuristic: ExtractionHeuristic = {
  id: 'specification',
  contentType: 'spec',
  description: 'Extracts MUST/SHALL requirements, interfaces, invariants from specification documents',
  patterns,

  refineFormalStatement(raw: string): string {
    // Preserve RFC language precisely
    return raw.trim().slice(0, 500);
  },

  deriveComputationalForm(formalStatement: string, _type: PrimitiveType): string {
    return `Enforce: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
  },
};
