// === Code/Reference Extraction Heuristic ===
//
// Extracts function signatures, class/interface definitions, design patterns,
// constraints, and API endpoints from reference documentation.

import type { PrimitiveType } from '../../../core/types/mfe-types.js';
import type { ExtractionHeuristic, ExtractionPattern } from './index.js';

const patterns: ExtractionPattern[] = [
  {
    // function createUser(name: string): User
    regex: /(?:function|method|def)\s+(\w+)\s*\(([^)]*)\)/gi,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Backtick-wrapped signatures: `createUser(name: string): User`
    regex: /`(\w+)\s*\(([^)]*)\)[^`]*`/gi,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // class UserService, interface Config, type Options
    regex: /(?:class|interface|type|struct)\s+(\w+)/gi,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Pattern: Observer
    regex: /(?:Pattern|Design Pattern)[.:\s]+(\w[\w\s]*?)(?:\n|$)/gi,
    primitiveType: 'technique' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // Constraint: All IDs must be UUIDs
    regex: /(?:Constraint|Rule|Invariant)[.:\s]+(.+?)(?:\n|$)/gi,
    primitiveType: 'axiom' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
  {
    // GET /api/users/:id - Get user by ID
    regex: /(?:(?:GET|POST|PUT|DELETE|PATCH)\s+)?(\/[\w/:{}]+)(?:\s*[-\u2014]\s*(.+))?/gi,
    primitiveType: 'definition' as PrimitiveType,
    nameGroup: 1,
    contentGroup: 1,
  },
];

export const codeHeuristic: ExtractionHeuristic = {
  id: 'code-reference',
  contentType: 'reference',
  description: 'Extracts APIs, functions, classes, patterns, constraints from code/reference documents',
  patterns,

  refineFormalStatement(raw: string): string {
    // Preserve code formatting
    return raw.trim().slice(0, 500);
  },

  deriveComputationalForm(formalStatement: string, type: PrimitiveType): string {
    const firstLine = formalStatement.split('\n')[0].trim().slice(0, 100);
    switch (type) {
      case 'definition':
        return `Defines: ${firstLine}`;
      case 'technique':
        return `Apply: ${firstLine}`;
      case 'axiom':
        return `Enforce: ${firstLine}`;
      default:
        return firstLine;
    }
  },
};
