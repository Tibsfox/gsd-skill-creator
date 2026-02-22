import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  resolveTokenPath,
  generateToken,
  createTokenInfo,
  readToken,
  writeToken,
  readOrCreateToken,
  validateToken,
} from './token-manager.js';
import type { TokenInfo } from './types.js';

describe('token-manager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gateway-token-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── resolveTokenPath ───────────────────────────────────────────────────

  describe('resolveTokenPath', () => {
    it('expands ~ to home directory', () => {
      const result = resolveTokenPath('~/foo/bar');
      expect(result).not.toContain('~');
      expect(result).toContain('foo/bar');
    });

    it('resolves absolute paths unchanged', () => {
      const result = resolveTokenPath('/tmp/gateway-token');
      expect(result).toBe('/tmp/gateway-token');
    });

    it('resolves relative paths against cwd', () => {
      const result = resolveTokenPath('token.json');
      expect(result).toContain('token.json');
      expect(result.startsWith('/')).toBe(true);
    });
  });

  // ── generateToken ──────────────────────────────────────────────────────

  describe('generateToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates unique tokens each call', () => {
      const a = generateToken();
      const b = generateToken();
      expect(a).not.toBe(b);
    });
  });

  // ── createTokenInfo ────────────────────────────────────────────────────

  describe('createTokenInfo', () => {
    it('creates token info with admin scope by default', () => {
      const info = createTokenInfo();
      expect(info.token).toHaveLength(64);
      expect(info.scopes).toEqual(['admin']);
      expect(info.createdAt).toBeGreaterThan(0);
    });

    it('creates token info with specified scopes', () => {
      const info = createTokenInfo(['read']);
      expect(info.scopes).toEqual(['read']);
    });
  });

  // ── readToken / writeToken ─────────────────────────────────────────────

  describe('readToken', () => {
    it('returns null for non-existent file', async () => {
      const result = await readToken(join(tempDir, 'nonexistent'));
      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', async () => {
      const path = join(tempDir, 'bad-token');
      await writeFile(path, 'not json');
      const result = await readToken(path);
      expect(result).toBeNull();
    });

    it('returns null for JSON missing required fields', async () => {
      const path = join(tempDir, 'partial-token');
      await writeFile(path, JSON.stringify({ token: 'short' }));
      const result = await readToken(path);
      expect(result).toBeNull();
    });

    it('reads a valid token file', async () => {
      const info = createTokenInfo(['read', 'write']);
      const path = join(tempDir, 'valid-token');
      await writeFile(path, JSON.stringify(info));

      const result = await readToken(path);
      expect(result).not.toBeNull();
      expect(result!.token).toBe(info.token);
      expect(result!.scopes).toEqual(['read', 'write']);
    });
  });

  describe('writeToken', () => {
    it('writes token file with correct content', async () => {
      const info = createTokenInfo();
      const path = join(tempDir, 'written-token');
      await writeToken(path, info);

      const content = await readFile(path, 'utf-8');
      const parsed = JSON.parse(content) as TokenInfo;
      expect(parsed.token).toBe(info.token);
      expect(parsed.scopes).toEqual(info.scopes);
    });

    it('creates parent directories if needed', async () => {
      const info = createTokenInfo();
      const path = join(tempDir, 'deep', 'nested', 'token');
      await writeToken(path, info);

      const content = await readFile(path, 'utf-8');
      const parsed = JSON.parse(content) as TokenInfo;
      expect(parsed.token).toBe(info.token);
    });
  });

  // ── readOrCreateToken ──────────────────────────────────────────────────

  describe('readOrCreateToken', () => {
    it('creates a new token when file does not exist', async () => {
      const path = join(tempDir, 'new-token');
      const { tokenInfo, created } = await readOrCreateToken(path);

      expect(created).toBe(true);
      expect(tokenInfo.token).toHaveLength(64);
      expect(tokenInfo.scopes).toEqual(['admin']);

      // Verify file was written
      const content = await readFile(path, 'utf-8');
      const parsed = JSON.parse(content) as TokenInfo;
      expect(parsed.token).toBe(tokenInfo.token);
    });

    it('reads existing token when file exists', async () => {
      const existing = createTokenInfo(['read']);
      const path = join(tempDir, 'existing-token');
      await writeFile(path, JSON.stringify(existing));

      const { tokenInfo, created } = await readOrCreateToken(path);

      expect(created).toBe(false);
      expect(tokenInfo.token).toBe(existing.token);
      expect(tokenInfo.scopes).toEqual(['read']);
    });

    it('uses specified default scopes for new tokens', async () => {
      const path = join(tempDir, 'scoped-token');
      const { tokenInfo } = await readOrCreateToken(path, ['read', 'write']);

      expect(tokenInfo.scopes).toEqual(['read', 'write']);
    });
  });

  // ── validateToken ──────────────────────────────────────────────────────

  describe('validateToken', () => {
    it('returns token info for matching token', () => {
      const stored = createTokenInfo();
      const result = validateToken(stored.token, stored);
      expect(result).not.toBeNull();
      expect(result!.token).toBe(stored.token);
    });

    it('returns null for non-matching token', () => {
      const stored = createTokenInfo();
      const result = validateToken('a'.repeat(64), stored);
      expect(result).toBeNull();
    });

    it('returns null for different length token', () => {
      const stored = createTokenInfo();
      const result = validateToken('short', stored);
      expect(result).toBeNull();
    });

    it('returns null for empty token', () => {
      const stored = createTokenInfo();
      const result = validateToken('', stored);
      expect(result).toBeNull();
    });
  });
});
