import { describe, it, expect } from 'vitest';
import type { MemoryType as CanonicalMemoryType } from './types.js';
import type { MemoryType as TagMemoryType } from './tag-types.js';
import { MemoryTypeSchema as TagMemoryTypeSchema } from './tag-types.js';

// MEM-3: several MemoryType taxonomies coexist by design (the canonical 6-type
// store taxonomy, the 4-type auto-memory tag subset, and the 9-type survey-shed
// taxonomy). The two that are meant to agree with the canonical union are the
// tag-types subset and the memory-tools MCP enum. Guard the tag-types subset
// against silent drift — both at compile time and at runtime.

/** Compile-time: `Sub` must be assignable to `Super`, else resolves to `never`. */
type AssertSubset<Sub, Super> = [Sub] extends [Super] ? true : never;

// If a tag-types value ever leaves the canonical union, this fails to typecheck.
const _tagIsSubsetOfCanonical: AssertSubset<TagMemoryType, CanonicalMemoryType> = true;
void _tagIsSubsetOfCanonical;

describe('MemoryType taxonomy drift guard (MEM-3)', () => {
  it('every tag-types MemoryType value is a canonical MemoryType', () => {
    // The canonical 6-type set from src/memory/types.ts.
    const canonical: CanonicalMemoryType[] = [
      'user', 'feedback', 'project', 'reference', 'episodic', 'semantic',
    ];
    for (const t of TagMemoryTypeSchema.options) {
      expect(canonical).toContain(t);
    }
  });
});
