/**
 * Provenance chain tracker test suite.
 *
 * Validates bidirectional queries (source->artifacts, artifact->sources),
 * chain traversal with depth limits, circular reference detection,
 * unlink operations, and index consistency verification.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ProvenanceTracker } from '../provenance-chain.js';
import type { ProvenanceEntry } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-02-25T12:00:00Z';

function makeEntry(overrides: Partial<ProvenanceEntry> = {}): ProvenanceEntry {
  return {
    artifact_type: 'skill',
    artifact_path: 'skills/electronics/ohms-law.md',
    artifact_name: "Ohm's Law Skill",
    timestamp: NOW,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let tmpDir: string;
let tracker: ProvenanceTracker;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'provenance-test-'));
  tracker = new ProvenanceTracker(tmpDir);
  await tracker.init();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProvenanceTracker', () => {
  // 1. Link and query by artifact
  it('links a citation to a skill and queries by artifact', async () => {
    await tracker.link('cite-001', makeEntry());

    const ids = await tracker.getByArtifact('skills/electronics/ohms-law.md');
    expect(ids).toContain('cite-001');
    expect(ids.length).toBe(1);
  });

  // 2. Link and query by source
  it('links a citation to a skill and queries by source', async () => {
    const entry = makeEntry();
    await tracker.link('cite-001', entry);

    const entries = await tracker.getBySource('cite-001');
    expect(entries.length).toBe(1);
    expect(entries[0].artifact_path).toBe('skills/electronics/ohms-law.md');
    expect(entries[0].artifact_name).toBe("Ohm's Law Skill");
  });

  // 3. Multiple links from one citation
  it('tracks one citation used in 3 artifacts', async () => {
    await tracker.link('cite-001', makeEntry({
      artifact_path: 'skills/a.md',
      artifact_name: 'Skill A',
    }));
    await tracker.link('cite-001', makeEntry({
      artifact_path: 'skills/b.md',
      artifact_name: 'Skill B',
    }));
    await tracker.link('cite-001', makeEntry({
      artifact_path: 'skills/c.md',
      artifact_name: 'Skill C',
    }));

    const entries = await tracker.getBySource('cite-001');
    expect(entries.length).toBe(3);
  });

  // 4. Multiple citations per artifact
  it('tracks one skill citing 5 works', async () => {
    const artifactPath = 'skills/electronics/comprehensive.md';
    for (let i = 1; i <= 5; i++) {
      await tracker.link(`cite-${i}`, makeEntry({
        artifact_path: artifactPath,
        artifact_name: 'Comprehensive Skill',
      }));
    }

    const ids = await tracker.getByArtifact(artifactPath);
    expect(ids.length).toBe(5);
    expect(ids).toContain('cite-1');
    expect(ids).toContain('cite-5');
  });

  // 5. Unlink
  it('unlinks and updates both indexes', async () => {
    const entry = makeEntry();
    await tracker.link('cite-001', entry);

    // Verify link exists
    expect((await tracker.getByArtifact(entry.artifact_path)).length).toBe(1);
    expect((await tracker.getBySource('cite-001')).length).toBe(1);

    // Unlink
    await tracker.unlink('cite-001', entry.artifact_path);

    // Both indexes empty
    expect((await tracker.getByArtifact(entry.artifact_path)).length).toBe(0);
    expect((await tracker.getBySource('cite-001')).length).toBe(0);
  });

  // 6. Chain traversal
  it('traverses chain: A cites B, B cites C', async () => {
    // Citation A is used in artifact-1
    await tracker.link('cite-A', makeEntry({
      artifact_path: 'skills/artifact-1.md',
      artifact_name: 'Artifact 1',
    }));

    // Citation B is also used in artifact-1 (co-cited with A)
    await tracker.link('cite-B', makeEntry({
      artifact_path: 'skills/artifact-1.md',
      artifact_name: 'Artifact 1',
    }));

    // Citation B is used in artifact-2
    await tracker.link('cite-B', makeEntry({
      artifact_path: 'skills/artifact-2.md',
      artifact_name: 'Artifact 2',
    }));

    // Citation C is also used in artifact-2 (co-cited with B)
    await tracker.link('cite-C', makeEntry({
      artifact_path: 'skills/artifact-2.md',
      artifact_name: 'Artifact 2',
    }));

    const chain = await tracker.getChain('cite-A', 2);
    expect(chain.root).toBe('cite-A');

    // Chain should include cite-B (co-cited in artifact-1) and cite-C (co-cited in artifact-2)
    const allCitationIds = chain.children.flatMap(c => c.citationIds);
    expect(allCitationIds).toContain('cite-B');
    expect(allCitationIds).toContain('cite-C');
  });

  // 7. Circular detection
  it('detects circular references without infinite loop', async () => {
    // A references artifact-1, B also in artifact-1
    await tracker.link('cite-A', makeEntry({
      artifact_path: 'skills/shared.md',
      artifact_name: 'Shared',
    }));
    await tracker.link('cite-B', makeEntry({
      artifact_path: 'skills/shared.md',
      artifact_name: 'Shared',
    }));

    // B references artifact-2, A also in artifact-2 (circular)
    await tracker.link('cite-B', makeEntry({
      artifact_path: 'skills/other.md',
      artifact_name: 'Other',
    }));
    await tracker.link('cite-A', makeEntry({
      artifact_path: 'skills/other.md',
      artifact_name: 'Other',
    }));

    const chain = await tracker.getChain('cite-A', 5);
    expect(chain.circular).toBe(true);
    // Should complete without hanging
  });

  // 8. Depth limit
  it('respects depth limit on chain traversal', async () => {
    // Create a chain 5 levels deep: A->1->B->2->C->3->D->4->E->5->F
    const pairs = [
      ['cite-A', 'skills/level-1.md', 'cite-B'],
      ['cite-B', 'skills/level-2.md', 'cite-C'],
      ['cite-C', 'skills/level-3.md', 'cite-D'],
      ['cite-D', 'skills/level-4.md', 'cite-E'],
      ['cite-E', 'skills/level-5.md', 'cite-F'],
    ];

    for (const [fromCite, artifact, toCite] of pairs) {
      await tracker.link(fromCite, makeEntry({
        artifact_path: artifact,
        artifact_name: `Level ${artifact}`,
      }));
      await tracker.link(toCite, makeEntry({
        artifact_path: artifact,
        artifact_name: `Level ${artifact}`,
      }));
    }

    // Depth 2: should find B and C but not D, E, F
    const chain = await tracker.getChain('cite-A', 2);
    const allIds = chain.children.flatMap(c => c.citationIds);
    expect(allIds).toContain('cite-B');
    expect(allIds).toContain('cite-C');
    expect(allIds).not.toContain('cite-D');
    expect(allIds).not.toContain('cite-E');
    expect(allIds).not.toContain('cite-F');
    expect(chain.depth).toBe(2);
  });

  // 9. Verify consistency
  it('detects orphaned entries in inconsistent state', async () => {
    await tracker.link('cite-001', makeEntry());

    // Valid state: both indexes consistent
    const validResult = await tracker.verify();
    expect(validResult.valid).toBe(true);
    expect(validResult.orphanedArtifacts.length).toBe(0);
    expect(validResult.orphanedSources.length).toBe(0);

    // Corrupt: manually write artifact index with an extra entry
    // Recreate tracker from disk to load corrupted state
    const artifactPath = path.join(tmpDir, 'by-artifact.jsonl');
    const existingContent = fs.readFileSync(artifactPath, 'utf-8').trim();
    const extraRecord = JSON.stringify({
      artifact_path: 'skills/orphan.md',
      citation_ids: ['cite-orphan'],
    });
    fs.writeFileSync(artifactPath, existingContent + '\n' + extraRecord + '\n');

    // Reload
    const corruptTracker = new ProvenanceTracker(tmpDir);
    await corruptTracker.init();

    const corruptResult = await corruptTracker.verify();
    expect(corruptResult.valid).toBe(false);
    expect(corruptResult.orphanedArtifacts.length).toBeGreaterThan(0);
  });

  // 10. Empty state
  it('returns empty results on empty state without errors', async () => {
    const ids = await tracker.getByArtifact('nonexistent/path.md');
    expect(ids).toEqual([]);

    const entries = await tracker.getBySource('nonexistent-id');
    expect(entries).toEqual([]);

    const chain = await tracker.getChain('nonexistent-id');
    expect(chain.root).toBe('nonexistent-id');
    expect(chain.children).toEqual([]);
    expect(chain.circular).toBe(false);

    const result = await tracker.verify();
    expect(result.valid).toBe(true);
  });
});
