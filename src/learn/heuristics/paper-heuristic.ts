// === Academic Paper Extraction Heuristic ===
//
// Extracts algorithms, findings, methods, hypotheses, and definitions
// from academic paper-style documents.

import type { PrimitiveType } from '../../types/mfe-types.js';
import type { ExtractionHeuristic, ExtractionPattern } from './index.js';

const patterns: ExtractionPattern[] = [
  {
    // Algorithm 1: Gradient Descent...
    regex: /(?:Algorithm\s+(\d+))[.:\s]+(.+?)(?=\n\n|Algorithm\s+\d+|$)/gis,
    primitiveType: 'algorithm' as PrimitiveType,
    nameGroup: 2,
    contentGroup: 2,
  },
  {
    // Finding: The model achieves 95% accuracy
    regex: /(?:Finding|Result|Observation)[.:\s]*(?:(\d+))?[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'theorem' as PrimitiveType,
    nameGroup: 2,
    contentGroup: 2,
  },
  {
    // Hypothesis 1: Neural networks can approximate any function
    regex: /(?:Hypothesis|Conjecture)[.:\s]*(?:(\d+))?[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'theorem' as PrimitiveType,
    nameGroup: 2,
    contentGroup: 2,
  },
  {
    // Method: We use cross-validation...
    regex: /(?:Method|Approach|Technique)[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Definition 1: A neural network is...
    regex: /(?:Definition)[.:\s]*(?:(\d+))?[.:\s]+(.+?)(?=\n\n|$)/gis,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 2,
    contentGroup: 2,
  },
];

export const paperHeuristic: ExtractionHeuristic = {
  id: 'academic-paper',
  contentType: 'paper',
  description: 'Extracts algorithms, findings, methods, hypotheses from academic papers',
  patterns,

  refineFormalStatement(raw: string): string {
    // Remove citation brackets [1,2,3]
    return raw
      .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  },

  deriveComputationalForm(formalStatement: string, type: PrimitiveType): string {
    const firstSentence = formalStatement.split(/[.!?]/)[0].trim().slice(0, 100);
    switch (type) {
      case 'algorithm':
        return `Procedure: ${firstSentence}`;
      case 'theorem':
        return `Observed: ${firstSentence}`;
      case 'technique':
        return `Apply: ${firstSentence}`;
      case 'definition':
        return `Defines: ${firstSentence}`;
      default:
        return firstSentence;
    }
  },
};
