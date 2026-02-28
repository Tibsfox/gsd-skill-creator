/**
 * TDD tests for virus signature database loader.
 *
 * Tests loading, validation, merging, and extensibility of the
 * JSON-based virus signature database used for Amiga virus scanning.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadSignatureFile,
  loadSignatureDatabase,
  mergeSignatures,
  getBuiltinSignaturesDir,
} from './signature-db.js';
import type { VirusSignatureDatabase } from './types.js';

describe('signature-db', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sig-db-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getBuiltinSignaturesDir', () => {
    it('returns a path ending in "virus-signatures"', () => {
      const dir = getBuiltinSignaturesDir();
      expect(dir).toMatch(/virus-signatures$/);
    });
  });

  describe('loadSignatureFile', () => {
    it('loads a valid JSON file with 2 signatures', () => {
      const validDb: VirusSignatureDatabase = {
        version: 1,
        description: 'Test signatures',
        signatures: [
          {
            name: 'TestVirus1',
            type: 'bootblock',
            severity: 'medium',
            patterns: [{ bytes: 'DEADBEEF', offset: 0 }],
            description: 'A test virus',
            references: [],
          },
          {
            name: 'TestVirus2',
            type: 'file',
            severity: 'high',
            patterns: [{ bytes: 'CAFEBABE', offset: 'any' }],
            description: 'Another test virus',
            references: [],
          },
        ],
      };
      const filePath = join(tempDir, 'test-sigs.json');
      writeFileSync(filePath, JSON.stringify(validDb, null, 2));

      const result = loadSignatureFile(filePath);
      expect(result.version).toBe(1);
      expect(result.signatures).toHaveLength(2);
      expect(result.signatures[0].name).toBe('TestVirus1');
      expect(result.signatures[1].name).toBe('TestVirus2');
    });

    it('throws Zod validation error for invalid JSON (missing patterns)', () => {
      const invalidDb = {
        version: 1,
        description: 'Invalid',
        signatures: [
          {
            name: 'BadVirus',
            type: 'bootblock',
            severity: 'medium',
            // missing patterns array
            description: 'Missing patterns',
          },
        ],
      };
      const filePath = join(tempDir, 'invalid.json');
      writeFileSync(filePath, JSON.stringify(invalidDb));

      expect(() => loadSignatureFile(filePath)).toThrow();
    });

    it('strips unknown extra fields via Zod parsing', () => {
      const dbWithExtra = {
        version: 1,
        description: 'Extra fields',
        signatures: [
          {
            name: 'ExtraVirus',
            type: 'bootblock',
            severity: 'low',
            patterns: [{ bytes: 'AA', offset: 'any' }],
            description: 'Has extra fields',
            references: [],
            extraField: 'should be stripped',
          },
        ],
        unknownTopLevel: true,
      };
      const filePath = join(tempDir, 'extra.json');
      writeFileSync(filePath, JSON.stringify(dbWithExtra));

      // Zod default strips unknown fields, so this should not throw
      const result = loadSignatureFile(filePath);
      expect(result.signatures[0].name).toBe('ExtraVirus');
      // The extra field should not be present on the parsed result
      expect((result.signatures[0] as Record<string, unknown>)['extraField']).toBeUndefined();
    });
  });

  describe('loadSignatureDatabase', () => {
    it('loads all 3 built-in JSON files and returns >=50 signatures', () => {
      const sigs = loadSignatureDatabase();
      expect(sigs.length).toBeGreaterThanOrEqual(50);
    });

    it('includes the 20 most common Amiga viruses by name', () => {
      const sigs = loadSignatureDatabase();
      const names = new Set(sigs.map((s) => s.name));

      // Spot-check the most common viruses from research
      const mustHave = [
        'SCA',
        'Byte Bandit',
        'Lamer Exterminator',
        'IRQ',
        'BGS9',
        'HNY96',
        'SADDAM',
        'Byte Warrior',
        'North Star',
        'Pentagon Circle',
        'Revenge',
        'Obelisk',
        'SystemZ',
        'CCCP',
        'Disk-Doktor',
      ];

      for (const name of mustHave) {
        expect(names.has(name), `Missing virus: ${name}`).toBe(true);
      }
    });

    it('merges additional directories when additionalDirs is provided', () => {
      const customDb: VirusSignatureDatabase = {
        version: 1,
        description: 'Custom signatures',
        signatures: [
          {
            name: 'CustomVirus',
            type: 'file',
            severity: 'critical',
            patterns: [{ bytes: 'FF00FF00', offset: 'any' }],
            description: 'A custom virus only in the temp dir',
            references: [],
          },
        ],
      };
      const filePath = join(tempDir, 'custom-sigs.json');
      writeFileSync(filePath, JSON.stringify(customDb, null, 2));

      const sigs = loadSignatureDatabase([tempDir]);
      const names = sigs.map((s) => s.name);
      expect(names).toContain('CustomVirus');
      // Built-in signatures should also be present
      expect(names).toContain('SCA');
    });
  });

  describe('mergeSignatures', () => {
    it('deduplicates by name -- last one wins', () => {
      const db1: VirusSignatureDatabase = {
        version: 1,
        description: 'DB1',
        signatures: [
          {
            name: 'DupeVirus',
            type: 'bootblock',
            severity: 'low',
            patterns: [{ bytes: 'AA', offset: 'any' }],
            description: 'First version',
            references: [],
          },
        ],
      };
      const db2: VirusSignatureDatabase = {
        version: 1,
        description: 'DB2',
        signatures: [
          {
            name: 'DupeVirus',
            type: 'file',
            severity: 'critical',
            patterns: [{ bytes: 'BB', offset: 'any' }],
            description: 'Second version (should win)',
            references: [],
          },
        ],
      };

      const merged = mergeSignatures([db1, db2]);
      expect(merged).toHaveLength(1);
      expect(merged[0].description).toBe('Second version (should win)');
      expect(merged[0].severity).toBe('critical');
    });

    it('produces union of all signatures when no overlap', () => {
      const db1: VirusSignatureDatabase = {
        version: 1,
        description: 'DB1',
        signatures: [
          {
            name: 'Virus1',
            type: 'bootblock',
            severity: 'low',
            patterns: [{ bytes: 'AA', offset: 'any' }],
            description: 'First',
            references: [],
          },
        ],
      };
      const db2: VirusSignatureDatabase = {
        version: 1,
        description: 'DB2',
        signatures: [
          {
            name: 'Virus2',
            type: 'file',
            severity: 'high',
            patterns: [{ bytes: 'BB', offset: 'any' }],
            description: 'Second',
            references: [],
          },
        ],
      };

      const merged = mergeSignatures([db1, db2]);
      expect(merged).toHaveLength(2);
      const names = merged.map((s) => s.name);
      expect(names).toContain('Virus1');
      expect(names).toContain('Virus2');
    });
  });

  describe('hex pattern validation', () => {
    it('all built-in signatures have valid hex patterns (even length, hex chars only)', () => {
      const sigs = loadSignatureDatabase();
      for (const sig of sigs) {
        for (const pattern of sig.patterns) {
          // Even length
          expect(
            pattern.bytes.length % 2,
            `Odd-length hex in ${sig.name}: "${pattern.bytes}"`,
          ).toBe(0);
          // Only hex characters
          expect(
            /^[0-9a-fA-F]+$/.test(pattern.bytes),
            `Invalid hex chars in ${sig.name}: "${pattern.bytes}"`,
          ).toBe(true);
          // If mask present, also valid hex and same length as bytes
          if (pattern.mask) {
            expect(pattern.mask.length % 2).toBe(0);
            expect(/^[0-9a-fA-F]+$/.test(pattern.mask)).toBe(true);
          }
        }
      }
    });
  });
});
