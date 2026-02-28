/**
 * Gateway token manager -- reads, creates, and validates pre-shared bearer tokens.
 *
 * Tokens are stored at ~/.gsd/gateway-token as JSON containing the token string,
 * granted scopes, and creation timestamp. If the file does not exist, a new
 * cryptographically random token is generated with admin scope.
 */

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { TokenInfoSchema, type TokenInfo, type GatewayScope } from './types.js';

/**
 * Resolve a token path, expanding ~ to the user's home directory.
 */
export function resolveTokenPath(tokenPath: string): string {
  if (tokenPath.startsWith('~/') || tokenPath === '~') {
    return resolve(homedir(), tokenPath.slice(2));
  }
  return resolve(tokenPath);
}

/**
 * Generate a cryptographically random 64-character hex token (32 bytes).
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new token info object with the given scopes.
 */
export function createTokenInfo(scopes: GatewayScope[] = ['admin']): TokenInfo {
  return {
    token: generateToken(),
    scopes,
    createdAt: Date.now(),
  };
}

/**
 * Read a token from the given file path.
 * Returns null if the file does not exist or contains invalid data.
 */
export async function readToken(tokenPath: string): Promise<TokenInfo | null> {
  const resolvedPath = resolveTokenPath(tokenPath);
  try {
    const content = await readFile(resolvedPath, 'utf-8');
    const data = JSON.parse(content) as unknown;
    const result = TokenInfoSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write a token info object to the given file path.
 * Creates parent directories if they don't exist.
 */
export async function writeToken(tokenPath: string, tokenInfo: TokenInfo): Promise<void> {
  const resolvedPath = resolveTokenPath(tokenPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, JSON.stringify(tokenInfo, null, 2), { mode: 0o600 });
}

/**
 * Read an existing token or create a new one if it doesn't exist.
 * Returns the token info and whether it was newly created.
 */
export async function readOrCreateToken(
  tokenPath: string,
  defaultScopes: GatewayScope[] = ['admin'],
): Promise<{ tokenInfo: TokenInfo; created: boolean }> {
  const existing = await readToken(tokenPath);
  if (existing) {
    return { tokenInfo: existing, created: false };
  }

  const tokenInfo = createTokenInfo(defaultScopes);
  await writeToken(tokenPath, tokenInfo);
  return { tokenInfo, created: true };
}

/**
 * Validate a bearer token string against the stored token.
 * Returns the token info if valid, null if invalid.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function validateToken(bearerToken: string, storedToken: TokenInfo): TokenInfo | null {
  if (bearerToken.length !== storedToken.token.length) {
    return null;
  }

  const a = Buffer.from(bearerToken, 'utf-8');
  const b = Buffer.from(storedToken.token, 'utf-8');

  if (a.length !== b.length) {
    return null;
  }

  if (timingSafeEqual(a, b)) {
    return storedToken;
  }

  return null;
}
