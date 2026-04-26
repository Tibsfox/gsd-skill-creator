/**
 * JP-019 — ACE discretization-rate citation presence test.
 *
 * Verifies that the REFERENCES.md anchor for arXiv:2604.21179 exists
 * and records the correct finding metadata so the citation is traceable
 * from the source tree.
 *
 * @module ace/__tests__/discretization-rate-citation.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFS = readFileSync(resolve(__dirname, '../REFERENCES.md'), 'utf8');

describe('JP-019 ACE discretization-rate citation', () => {
  it('REFERENCES.md contains the arXiv:2604.21179 anchor', () => {
    expect(REFS).toContain('arXiv:2604.21179');
  });

  it('REFERENCES.md records the JP-019 finding tag', () => {
    expect(REFS).toContain('JP-019');
  });

  it('REFERENCES.md notes the discretization rate topic', () => {
    expect(REFS.toLowerCase()).toContain('discretization rate');
  });
});
