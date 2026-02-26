// === Math/Textbook Extraction Heuristic ===
//
// Extracts definitions, theorems, algorithms, identities, and lemmas
// from mathematical/textbook-style documents.

import type { PrimitiveType } from '../../types/mfe-types.js';
import type { ExtractionHeuristic, ExtractionPattern } from './index.js';

const patterns: ExtractionPattern[] = [
  {
    // Definition: A group is a set G with...
    regex: /(?:Definition|Def\.)\s*(?:\d+(?:\.\d+)*)?[.:\s]+(.+?)(?=\n\n|\n(?:Definition|Def\.|Theorem|Thm\.|Lemma|Proof|Corollary|Algorithm|Identity)|$)/gis,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Theorem 2.3 (Fundamental Theorem): ...
    regex: /(?:Theorem|Thm\.)\s*(?:\d+(?:\.\d+)*)?(?:\s*\(([^)]+)\))?[.:\s]+(.+?)(?=\n\n|\n(?:Definition|Def\.|Theorem|Thm\.|Lemma|Proof|Corollary)|$)/gis,
    primitiveType: 'theorem' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 2,
  },
  {
    // Algorithm 1: Gaussian Elimination...
    regex: /(?:Algorithm)\s*(?:\d+(?:\.\d+)*)?[.:\s]+(.+?)(?=\n\n|\n(?:Algorithm|Definition|Theorem)|$)/gis,
    primitiveType: 'algorithm' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Identity: sin^2(x) + cos^2(x) = 1
    regex: /(?:Identity)[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'identity' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Lemma 3.1: ... (treated as theorem)
    regex: /(?:Lemma)\s*(?:\d+(?:\.\d+)*)?[.:\s]+(.+?)(?=\n\n|\n(?:Definition|Theorem|Proof|Lemma)|$)/gis,
    primitiveType: 'theorem' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
];

export const mathHeuristic: ExtractionHeuristic = {
  id: 'math-textbook',
  contentType: 'textbook',
  description: 'Extracts definitions, theorems, algorithms, identities from mathematical/textbook documents',
  patterns,

  refineFormalStatement(raw: string): string {
    return raw
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  },

  deriveComputationalForm(formalStatement: string, type: PrimitiveType): string {
    const firstSentence = formalStatement.split(/[.!?]/)[0].trim().slice(0, 100);
    switch (type) {
      case 'definition':
        return `Defines: ${firstSentence}`;
      case 'theorem':
        return `Given: preconditions, Then: ${firstSentence}`;
      case 'algorithm':
        return `Input: ..., Output: ..., Steps: ${firstSentence}`;
      case 'identity':
        return formalStatement.trim().slice(0, 200);
      default:
        return firstSentence;
    }
  },
};
