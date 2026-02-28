// === Tutorial Extraction Heuristic ===
//
// Extracts steps, key concepts, exercises, tips, and best practices
// from tutorial-style documents.

import type { PrimitiveType } from '../../../core/types/mfe-types.js';
import type { ExtractionHeuristic, ExtractionPattern } from './index.js';

const patterns: ExtractionPattern[] = [
  {
    // Step 1: Install the dependencies
    regex: /(?:Step\s+(\d+))[.:\s]+(.+?)(?=\n\n|Step\s+\d+|$)/gis,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 2,
  },
  {
    // Key Concept: Dependency injection
    regex: /(?:Key Concept|Important|Note)[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Exercise: Build a REST API
    regex: /(?:Exercise|Practice|Try|Challenge)[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Tip: Always validate input
    regex: /(?:Tip|Best Practice|Pro Tip)[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
];

export const tutorialHeuristic: ExtractionHeuristic = {
  id: 'tutorial',
  contentType: 'tutorial',
  description: 'Extracts steps, key concepts, exercises from tutorial documents',
  patterns,

  refineFormalStatement(raw: string): string {
    return raw
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  },

  deriveComputationalForm(formalStatement: string, _type: PrimitiveType): string {
    return `Procedure: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
  },
};
