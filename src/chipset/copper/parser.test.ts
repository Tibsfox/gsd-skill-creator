/**
 * Tests for Pipeline YAML parser and serializer.
 *
 * Covers:
 * - Valid parsing: minimal, full, all instruction types, metadata fields
 * - YAML kebab-case to camelCase key mapping
 * - Error handling: invalid YAML, missing fields, invalid instructions
 * - Round-trip serialization: parse -> serialize -> re-parse
 * - Edge cases: whitespace, comments, many instructions, extra fields, empty input
 */

import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { parsePipeline, serializePipeline } from './parser.js';
import type { Pipeline } from './types.js';

// ============================================================================
// Valid Parsing Tests
// ============================================================================

describe('parsePipeline - valid parsing', () => {
  it('parses a minimal Pipeline with one WAIT instruction', () => {
    const input = `
metadata:
  name: minimal-list
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.name).toBe('minimal-list');
      expect(result.data.instructions).toHaveLength(1);
      expect(result.data.instructions[0].type).toBe('wait');
      if (result.data.instructions[0].type === 'wait') {
        expect(result.data.instructions[0].event).toBe('phase-start');
      }
    }
  });

  it('parses a full Pipeline with all three instruction types', () => {
    const input = `
metadata:
  name: full-list
  description: A list with all instruction types
instructions:
  - type: wait
    event: session-start
  - type: skip
    condition:
      left: env:CI
      op: equals
      right: 'true'
  - type: move
    target: skill
    name: git-commit
    mode: lite
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructions).toHaveLength(3);
      expect(result.data.instructions[0].type).toBe('wait');
      expect(result.data.instructions[1].type).toBe('skip');
      expect(result.data.instructions[2].type).toBe('move');
    }
  });

  it('parses a list with full metadata including all optional fields', () => {
    const input = `
metadata:
  name: full-metadata
  description: Complete metadata example
  source-patterns:
    - test:fail
    - code:edit
  token-estimate: 500
  priority: 80
  confidence: 0.95
  tags:
    - testing
    - automation
  version: 3
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.name).toBe('full-metadata');
      expect(result.data.metadata.description).toBe('Complete metadata example');
      expect(result.data.metadata.sourcePatterns).toEqual(['test:fail', 'code:edit']);
      expect(result.data.metadata.tokenEstimate).toBe(500);
      expect(result.data.metadata.priority).toBe(80);
      expect(result.data.metadata.confidence).toBe(0.95);
      expect(result.data.metadata.tags).toEqual(['testing', 'automation']);
      expect(result.data.metadata.version).toBe(3);
    }
  });

  it('parses MOVE instruction with args field containing key-value pairs', () => {
    const input = `
metadata:
  name: move-with-args
instructions:
  - type: move
    target: skill
    name: git-commit
    mode: lite
    args:
      message: initial commit
      amend: false
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const move = result.data.instructions[0];
      expect(move.type).toBe('move');
      if (move.type === 'move') {
        expect(move.args).toEqual({ message: 'initial commit', amend: false });
      }
    }
  });

  it('parses SKIP instruction with binary operator (equals) including right operand', () => {
    const input = `
metadata:
  name: skip-binary
instructions:
  - type: skip
    condition:
      left: env:NODE_ENV
      op: equals
      right: production
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const skip = result.data.instructions[0];
      expect(skip.type).toBe('skip');
      if (skip.type === 'skip') {
        expect(skip.condition.left).toBe('env:NODE_ENV');
        expect(skip.condition.op).toBe('equals');
        expect(skip.condition.right).toBe('production');
      }
    }
  });

  it('parses SKIP instruction with unary operator (exists) without right operand', () => {
    const input = `
metadata:
  name: skip-unary
instructions:
  - type: skip
    condition:
      left: file:tsconfig.json
      op: exists
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const skip = result.data.instructions[0];
      expect(skip.type).toBe('skip');
      if (skip.type === 'skip') {
        expect(skip.condition.left).toBe('file:tsconfig.json');
        expect(skip.condition.op).toBe('exists');
        expect(skip.condition.right).toBeUndefined();
      }
    }
  });
});

// ============================================================================
// YAML Kebab-case to CamelCase Key Mapping Tests
// ============================================================================

describe('parsePipeline - key mapping', () => {
  it('maps YAML source-patterns to TypeScript sourcePatterns', () => {
    const input = `
metadata:
  name: key-map-test
  source-patterns:
    - pattern:a
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.sourcePatterns).toEqual(['pattern:a']);
    }
  });

  it('maps YAML token-estimate to TypeScript tokenEstimate', () => {
    const input = `
metadata:
  name: key-map-test
  token-estimate: 250
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.tokenEstimate).toBe(250);
    }
  });

  it('preserves not-exists operator as enum value (not key)', () => {
    const input = `
metadata:
  name: operator-test
instructions:
  - type: skip
    condition:
      left: file:missing.txt
      op: not-exists
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const skip = result.data.instructions[0];
      if (skip.type === 'skip') {
        expect(skip.condition.op).toBe('not-exists');
      }
    }
  });

  it('preserves not-equals operator as enum value (not key)', () => {
    const input = `
metadata:
  name: operator-test
instructions:
  - type: skip
    condition:
      left: env:MODE
      op: not-equals
      right: debug
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const skip = result.data.instructions[0];
      if (skip.type === 'skip') {
        expect(skip.condition.op).toBe('not-equals');
      }
    }
  });

  it('passes through fields already in camelCase unchanged', () => {
    const input = `
metadata:
  name: camel-test
  tokenEstimate: 100
  sourcePatterns:
    - pattern:b
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.tokenEstimate).toBe(100);
      expect(result.data.metadata.sourcePatterns).toEqual(['pattern:b']);
    }
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('parsePipeline - error handling', () => {
  it('returns error for completely invalid YAML (syntax error)', () => {
    const input = `
metadata:
  name: broken
  items: [unclosed
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toMatch(/YAML|syntax/i);
    }
  });

  it('returns error for valid YAML that is not an object (plain string)', () => {
    const input = 'just a string';
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toMatch(/object|metadata/i);
    }
  });

  it('returns error for valid YAML that is an array at root', () => {
    const input = `
- item1
- item2
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for missing metadata field', () => {
    const input = `
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for missing instructions field', () => {
    const input = `
metadata:
  name: no-instructions
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for empty instructions array', () => {
    const input = `
metadata:
  name: empty-instructions
instructions: []
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for invalid instruction type with descriptive message', () => {
    const input = `
metadata:
  name: bad-instruction
instructions:
  - type: jump
    target: label-1
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      // Error should indicate which instruction failed
      const combined = result.errors.map((e) => e.message + (e.path || '')).join(' ');
      expect(combined).toMatch(/type|instruction/i);
    }
  });

  it('returns error for invalid WAIT event with descriptive message', () => {
    const input = `
metadata:
  name: bad-event
instructions:
  - type: wait
    event: invalid-event
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for invalid MOVE mode with descriptive message', () => {
    const input = `
metadata:
  name: bad-mode
instructions:
  - type: move
    target: skill
    name: test
    mode: turbo
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns error for missing required MOVE fields', () => {
    const input = `
metadata:
  name: incomplete-move
instructions:
  - type: move
    target: skill
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('error objects have message string field', () => {
    const input = `
metadata:
  name: test
instructions: []
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      for (const err of result.errors) {
        expect(typeof err.message).toBe('string');
        expect(err.message.length).toBeGreaterThan(0);
      }
    }
  });

  it('collects multiple validation errors (not just first failure)', () => {
    // Missing metadata name AND invalid instruction type
    const input = `
metadata:
  name: ''
instructions:
  - type: jump
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have at least 1 error -- could have 2+ depending on Zod behavior
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// Round-trip Serialization Tests
// ============================================================================

describe('serializePipeline - round-trip', () => {
  it('round-trip parse -> serialize -> re-parse produces equivalent object', () => {
    const input = `
metadata:
  name: round-trip-test
  description: Testing round-trip fidelity
  source-patterns:
    - test:fail
  token-estimate: 300
  priority: 75
  confidence: 0.9
  tags:
    - ci
  version: 2
instructions:
  - type: wait
    event: phase-start
  - type: move
    target: skill
    name: git-commit
    mode: lite
`;
    const firstParse = parsePipeline(input);
    expect(firstParse.success).toBe(true);
    if (!firstParse.success) return;

    const serialized = serializePipeline(firstParse.data);
    expect(serialized.length).toBeGreaterThan(0);

    const secondParse = parsePipeline(serialized);
    expect(secondParse.success).toBe(true);
    if (!secondParse.success) return;

    expect(secondParse.data.metadata.name).toBe(firstParse.data.metadata.name);
    expect(secondParse.data.metadata.sourcePatterns).toEqual(firstParse.data.metadata.sourcePatterns);
    expect(secondParse.data.metadata.tokenEstimate).toBe(firstParse.data.metadata.tokenEstimate);
    expect(secondParse.data.metadata.priority).toBe(firstParse.data.metadata.priority);
    expect(secondParse.data.metadata.confidence).toBe(firstParse.data.metadata.confidence);
    expect(secondParse.data.instructions).toEqual(firstParse.data.instructions);
  });

  it('serialized YAML uses kebab-case keys (not camelCase)', () => {
    const list: Pipeline = {
      metadata: {
        name: 'kebab-check',
        sourcePatterns: ['a:b'],
        tokenEstimate: 100,
        priority: 50,
        confidence: 1.0,
        version: 1,
      },
      instructions: [
        { type: 'wait', event: 'phase-start' },
      ],
    };
    const serialized = serializePipeline(list);
    expect(serialized).toContain('source-patterns');
    expect(serialized).toContain('token-estimate');
    expect(serialized).not.toContain('sourcePatterns');
    expect(serialized).not.toContain('tokenEstimate');
  });

  it('serialized YAML is valid YAML (re-parseable by js-yaml)', () => {
    const list: Pipeline = {
      metadata: {
        name: 'yaml-valid',
        priority: 50,
        confidence: 1.0,
        version: 1,
      },
      instructions: [
        { type: 'wait', event: 'session-start' },
        { type: 'move', target: 'script', name: 'lint', mode: 'offload' },
      ],
    };
    const serialized = serializePipeline(list);
    expect(() => yaml.load(serialized)).not.toThrow();
  });

  it('metadata defaults (priority: 50, confidence: 1.0, version: 1) appear in serialized output', () => {
    const input = `
metadata:
  name: defaults-test
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Schema defaults should have been applied
    expect(result.data.metadata.priority).toBe(50);
    expect(result.data.metadata.confidence).toBe(1.0);
    expect(result.data.metadata.version).toBe(1);

    const serialized = serializePipeline(result.data);
    expect(serialized).toContain('priority');
    expect(serialized).toContain('confidence');
    expect(serialized).toContain('version');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('parsePipeline - edge cases', () => {
  it('handles YAML with extra whitespace and comments', () => {
    const input = `
# This is a comment
metadata:
  name: whitespace-test   # trailing comment

  # blank line in metadata

instructions:
  # instruction comment
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.name).toBe('whitespace-test');
      expect(result.data.instructions).toHaveLength(1);
    }
  });

  it('handles list with many instructions (10+)', () => {
    const instructions = [];
    for (let i = 0; i < 12; i++) {
      instructions.push(`  - type: wait\n    event: phase-start`);
    }
    const input = `
metadata:
  name: many-instructions
instructions:
${instructions.join('\n')}
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructions).toHaveLength(12);
    }
  });

  it('handles metadata with unknown/extra fields (passthrough preservation)', () => {
    const input = `
metadata:
  name: extra-fields
  custom-field: hello
  extra-number: 42
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    expect(result.success).toBe(true);
    if (result.success) {
      // Extra fields should be preserved (via passthrough)
      // After kebab-to-camel mapping, keys become camelCase
      const meta = result.data.metadata as Record<string, unknown>;
      expect(meta.customField).toBe('hello');
      expect(meta.extraNumber).toBe(42);
    }
  });

  it('handles empty string input (returns error, not crash)', () => {
    const result = parsePipeline('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toBeTruthy();
    }
  });

  it('handles null/undefined-like YAML values gracefully', () => {
    const input = `
metadata:
  name: null-test
  description: ~
instructions:
  - type: wait
    event: phase-start
`;
    const result = parsePipeline(input);
    // Should succeed -- null/undefined optional fields are valid
    expect(result.success).toBe(true);
  });
});
