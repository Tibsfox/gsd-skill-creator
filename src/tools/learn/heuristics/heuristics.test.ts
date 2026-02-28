// === Extraction Heuristic Library Tests ===
//
// TDD RED: Tests for the pluggable heuristic library covering math, code,
// tutorial, spec, and paper domain-specific extraction patterns.

import { describe, it, expect } from 'vitest';
import {
  getHeuristic,
  registerHeuristic,
  BUILTIN_HEURISTICS,
  type ExtractionHeuristic,
  type ExtractionPattern,
} from './index.js';
import type { ContentType } from '../analyzer.js';
import type { PrimitiveType } from '../../../core/types/mfe-types.js';

// --- Helper: run a heuristic pattern against input text ---

function findMatches(
  heuristic: ExtractionHeuristic,
  input: string,
): Array<{ type: PrimitiveType; name: string; content: string }> {
  const results: Array<{ type: PrimitiveType; name: string; content: string }> = [];

  for (const pattern of heuristic.patterns) {
    // Reset regex state
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(input)) !== null) {
      const name = m[pattern.nameGroup] || '';
      const content = m[pattern.contentGroup] || '';
      results.push({
        type: pattern.primitiveType,
        name: name.trim(),
        content: content.trim(),
      });
    }
  }

  return results;
}

// === 1. Heuristic interface tests ===

describe('Heuristic registry', () => {
  it('getHeuristic("textbook") returns the math heuristic', () => {
    const h = getHeuristic('textbook');
    expect(h).not.toBeNull();
    expect(h!.contentType).toBe('textbook');
  });

  it('getHeuristic("reference") returns the code heuristic', () => {
    const h = getHeuristic('reference');
    expect(h).not.toBeNull();
    expect(h!.contentType).toBe('reference');
  });

  it('getHeuristic("unknown") returns null', () => {
    const h = getHeuristic('unknown');
    expect(h).toBeNull();
  });

  it('BUILTIN_HEURISTICS has 5 entries', () => {
    expect(BUILTIN_HEURISTICS).toHaveLength(5);
  });
});

// === 2. Math heuristic tests ===

describe('Math heuristic', () => {
  const math = getHeuristic('textbook')!;

  it('extracts definition from "Definition:" marker', () => {
    const matches = findMatches(math, 'Definition: A group is a set G with a binary operation satisfying closure.');
    const defn = matches.find(m => m.type === 'definition');
    expect(defn).toBeDefined();
    expect(defn!.content).toContain('group');
  });

  it('extracts theorem with section number from "Theorem 2.3:"', () => {
    const matches = findMatches(math, 'Theorem 2.3 (Fundamental Theorem): Every continuous function on [a,b] is integrable.');
    const thm = matches.find(m => m.type === 'theorem');
    expect(thm).toBeDefined();
  });

  it('does not extract proofs as standalone primitives', () => {
    const matches = findMatches(math, 'Proof: By contradiction, assume the opposite holds.');
    const proofs = matches.filter(m => m.content.includes('contradiction'));
    // Proofs should not be extracted as a primitive type
    expect(proofs.length).toBe(0);
  });

  it('extracts identity from "Identity:" marker', () => {
    const matches = findMatches(math, 'Identity: sin^2(x) + cos^2(x) = 1');
    const id = matches.find(m => m.type === 'identity');
    expect(id).toBeDefined();
    expect(id!.content).toContain('sin');
  });
});

// === 3. Code heuristic tests ===

describe('Code heuristic', () => {
  const code = getHeuristic('reference')!;

  it('extracts function definition from signature', () => {
    const matches = findMatches(code, '### `createUser(name: string): User`');
    const fn = matches.find(m => m.type === 'definition');
    expect(fn).toBeDefined();
    expect(fn!.name).toContain('createUser');
  });

  it('extracts technique from "Pattern:" marker', () => {
    const matches = findMatches(code, 'Pattern: Observer\nThe observer pattern enables event-driven communication.');
    const pattern = matches.find(m => m.type === 'technique');
    expect(pattern).toBeDefined();
    expect(pattern!.name || pattern!.content).toContain('Observer');
  });

  it('extracts axiom from "Constraint:" marker', () => {
    const matches = findMatches(code, 'Constraint: All IDs must be UUIDs');
    const constraint = matches.find(m => m.type === 'axiom');
    expect(constraint).toBeDefined();
  });
});

// === 4. Tutorial heuristic tests ===

describe('Tutorial heuristic', () => {
  const tutorial = getHeuristic('tutorial')!;

  it('extracts technique from "Step 1:" marker', () => {
    const matches = findMatches(tutorial, 'Step 1: Install the dependencies using npm.');
    const step = matches.find(m => m.type === 'technique');
    expect(step).toBeDefined();
  });

  it('extracts definition from "Key Concept:" marker', () => {
    const matches = findMatches(tutorial, 'Key Concept: Dependency injection allows decoupling of components.');
    const concept = matches.find(m => m.type === 'definition');
    expect(concept).toBeDefined();
    expect(concept!.content).toContain('injection');
  });

  it('extracts technique from "Exercise:" marker', () => {
    const matches = findMatches(tutorial, 'Exercise: Build a REST API using Express.');
    const exercise = matches.find(m => m.type === 'technique');
    expect(exercise).toBeDefined();
  });
});

// === 5. Spec heuristic tests ===

describe('Spec heuristic', () => {
  const spec = getHeuristic('spec')!;

  it('extracts axiom from "MUST" requirement', () => {
    const matches = findMatches(spec, 'The system MUST validate all input before processing.');
    const req = matches.find(m => m.type === 'axiom');
    expect(req).toBeDefined();
  });

  it('extracts definition from "Interface:" marker', () => {
    const matches = findMatches(spec, 'Interface: UserService\n  - getUser(id)');
    const iface = matches.find(m => m.type === 'definition');
    expect(iface).toBeDefined();
  });

  it('extracts axiom from "Invariant:" marker', () => {
    const matches = findMatches(spec, 'Invariant: total_count >= 0');
    const inv = matches.find(m => m.type === 'axiom');
    expect(inv).toBeDefined();
  });
});

// === 6. Paper heuristic tests ===

describe('Paper heuristic', () => {
  const paper = getHeuristic('paper')!;

  it('extracts algorithm from "Algorithm 1:" marker', () => {
    const matches = findMatches(paper, 'Algorithm 1: Gradient Descent minimizes loss by iterating in the negative gradient direction.');
    const algo = matches.find(m => m.type === 'algorithm');
    expect(algo).toBeDefined();
    expect(algo!.content).toContain('Gradient Descent');
  });

  it('extracts theorem from "Finding:" marker', () => {
    const matches = findMatches(paper, 'Finding: The model achieves 95% accuracy on the test set.');
    const finding = matches.find(m => m.type === 'theorem');
    expect(finding).toBeDefined();
  });

  it('extracts technique from "Method:" marker', () => {
    const matches = findMatches(paper, 'Method: We use cross-validation with stratified sampling.');
    const method = matches.find(m => m.type === 'technique');
    expect(method).toBeDefined();
  });
});

// === 7. Extensibility test ===

describe('Extensibility', () => {
  it('registerHeuristic adds custom heuristic to registry', () => {
    const custom: ExtractionHeuristic = {
      id: 'custom-legal',
      contentType: 'unknown' as ContentType, // Using unknown as a slot
      description: 'Custom legal document extractor',
      patterns: [{
        regex: /(?:Clause)\s+(\d+)[.:\s]+(.+?)(?=\n|$)/gi,
        primitiveType: 'axiom' as PrimitiveType,
        nameGroup: 1,
        contentGroup: 2,
      }],
      refineFormalStatement: (raw: string) => raw.trim(),
      deriveComputationalForm: (_fs: string, _type: PrimitiveType) => 'Enforce: clause',
    };

    // Register with a custom content type identifier
    // We test that after registration, getHeuristic returns it
    // Use a cast to register under a non-standard ContentType for testing
    const customType = 'legal' as ContentType;
    const heuristicWithType = { ...custom, contentType: customType };
    registerHeuristic(heuristicWithType);

    const retrieved = getHeuristic(customType);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe('custom-legal');
  });
});
