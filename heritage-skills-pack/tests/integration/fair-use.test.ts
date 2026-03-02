/**
 * Fair Use Compliance Integration Tests
 *
 * Tests FU-01 through FU-04. All 4 are MANDATORY.
 *
 * Source: foxfire-heritage-mission-v2--05-test-plan-phase1.md §6
 *
 * CRITICAL API NOTES applied:
 * - BibliographyEngine.formatCitation(work, style) takes a CanonicalWork object
 * - BibliographyEngine.generateFairUseNotice(work) takes a CanonicalWork object
 * - getWorksByRoom(room) returns CanonicalWork[] from all catalogs
 * - getWorksByTradition(tradition) returns CanonicalWorkWithNationContext[]
 * - No verbatim text API exists — this is a structural invariant test
 */

import { createRequire } from 'module';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { BibliographyEngine } from '../../canonical-works/bibliography-engine.js';
import {
  loadFoxfireCatalog,
  getWorksByRoom,
  loadFairUseNotice,
} from '../../canonical-works/index.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const engine = new BibliographyEngine();

// ─── Fair Use Compliance (FU-01 through FU-04) ───────────────────────────────

describe('Fair Use Compliance', () => {
  it('FU-01: canonical works system provides metadata only — no verbatim chapter text API exists', () => {
    // The fair use invariant: getWorksByRoom/getWorksByTradition return catalog METADATA,
    // not the actual book content. Verify this structurally.
    const foxfireWorks = loadFoxfireCatalog();

    // Each canonical work should have: id, title, authors, purchaseLinks, tradition
    // It should NOT have: fullText, chapterContent, verbatimContent
    for (const work of foxfireWorks) {
      const asAny = work as Record<string, unknown>;
      expect(asAny.fullText).toBeUndefined();
      expect(asAny.chapterContent).toBeUndefined();
      expect(asAny.verbatimContent).toBeUndefined();
    }

    // The fair-use-notices JSON must have a "no reproduction" statement
    const fairUseNotice = loadFairUseNotice('appalachian');
    // noticeTemplate or additionalNotes must indicate no verbatim reproduction
    const fullContent = JSON.stringify(fairUseNotice);
    expect(
      /not.{0,20}reproduc|educational|transformative|verbatim/i.test(fullContent),
    ).toBe(true);
  });

  it('FU-02: every canonical work has required attribution fields (author, title, year, purchase link)', () => {
    const foxfireWorks = loadFoxfireCatalog();
    expect(foxfireWorks.length).toBeGreaterThan(0);

    for (const work of foxfireWorks) {
      // Required attribution fields must be present
      expect(work.id, `work.id missing`).toBeTruthy();
      expect(work.title, `work.title missing for ${work.id}`).toBeTruthy();
      expect(work.authors, `work.authors missing for ${work.id}`).toBeInstanceOf(Array);
      expect(work.authors.length, `work.authors empty for ${work.id}`).toBeGreaterThan(0);
      expect(work.purchaseLinks, `work.purchaseLinks missing for ${work.id}`).toBeInstanceOf(Array);
      expect(
        work.purchaseLinks.length,
        `work.purchaseLinks empty for ${work.id}`,
      ).toBeGreaterThan(0);

      // All works must have a formatted citation (no throw for incomplete data)
      expect(() => engine.formatCitation(work, 'chicago')).not.toThrow();
      const citation = engine.formatCitation(work, 'chicago');
      expect(citation.length).toBeGreaterThan(0);
    }
  });

  it('FU-03: priority-1 purchase link is creator-direct for all Foxfire works (foxfire.org)', () => {
    const foxfireWorks = loadFoxfireCatalog();
    expect(foxfireWorks.length).toBeGreaterThan(0);

    for (const work of foxfireWorks) {
      const priority1 = work.purchaseLinks.find(l => l.priority === 1);
      expect(priority1, `No priority-1 link for work: ${work.id}`).toBeDefined();
      expect(
        priority1!.isCreatorDirect,
        `Priority-1 link is not creator-direct for ${work.id}`,
      ).toBe(true);
      // Creator-direct must be foxfire.org domain
      expect(priority1!.url.toLowerCase()).toMatch(/foxfire/);
    }

    // Validate using BibliographyEngine's validateCreatorFirstLink method
    for (const work of foxfireWorks) {
      const isCreatorFirst = engine.validateCreatorFirstLink(work);
      expect(isCreatorFirst, `validateCreatorFirstLink failed for ${work.id}`).toBe(true);
    }
  });

  it('FU-04: try session steps in rooms 01-05 do not reproduce verbatim Foxfire text', () => {
    // Fair use: content teaches skills through original description, not by reproducing
    // copyrighted book content.
    // Heuristic: no step instruction > 500 chars that also contains "Foxfire" verbatim.
    const violations: string[] = [];

    const roomsDir = join(__dirname, '../../skill-hall/rooms');
    const roomFolderPrefixes = ['01-', '02-', '03-', '04-', '05-'];

    for (const prefix of roomFolderPrefixes) {
      // Find the room folder matching this prefix
      let roomFolder: string | undefined;
      try {
        const allFolders = readdirSync(roomsDir);
        roomFolder = allFolders.find(f => f.startsWith(prefix));
      } catch {
        continue;
      }
      if (!roomFolder) continue;

      const trySessionsDir = join(roomsDir, roomFolder, 'try-sessions');
      let sessionFiles: string[];
      try {
        sessionFiles = readdirSync(trySessionsDir).filter(f => f.endsWith('.json'));
      } catch {
        continue;
      }

      for (const sessionFile of sessionFiles) {
        const sessionPath = join(trySessionsDir, sessionFile);
        let sessionData: Record<string, unknown>;
        try {
          sessionData = JSON.parse(readFileSync(sessionPath, 'utf-8')) as Record<string, unknown>;
        } catch {
          continue;
        }

        const steps = sessionData.steps as Array<{ instruction?: string }> | undefined;
        if (!Array.isArray(steps)) continue;

        for (const step of steps) {
          const instruction = step.instruction ?? '';
          if (instruction.length > 500 && /foxfire/i.test(instruction)) {
            violations.push(
              `${roomFolder}/${sessionFile}: instruction length ${instruction.length} contains "Foxfire"`,
            );
          }
        }
      }
    }

    // All try session steps must pass the fair use heuristic
    expect(
      violations,
      `Fair Use violations found in try sessions:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});
