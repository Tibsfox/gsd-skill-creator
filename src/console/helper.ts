/**
 * HTTP helper endpoint for browser-to-filesystem writes.
 *
 * The browser has no filesystem access. This endpoint bridges the gap,
 * accepting JSON POSTs and writing them as files to the console directory
 * under .planning/console/.
 *
 * Security:
 * - Path traversal prevention via canonicalization + allowlist
 * - Subdirectory allowlist (only inbox/pending, config, uploads)
 * - Localhost-only binding is a server-level concern (not enforced here)
 *
 * Usage:
 * ```typescript
 * const router = createHelperRouter('/path/to/project');
 * // In http.createServer handler:
 * const handled = await router.handleRequest(req, res);
 * if (!handled) { // fallback to other routes }
 * ```
 *
 * @module console/helper
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { CONSOLE_DIRS } from './types.js';
import { BridgeLogger } from './bridge-logger.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Route path this helper handles. */
const ROUTE_PATH = '/api/console/message';

/** Allowed subdirectories under .planning/console/. */
const ALLOWED_SUBDIRECTORIES = new Set([
  'inbox/pending',
  'config',
  'uploads',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Request body shape for POST /api/console/message. */
interface HelperRequestBody {
  filename: string;
  content: Record<string, unknown>;
  subdirectory?: string;
}

/** The router object returned by createHelperRouter. */
export interface HelperRouter {
  /**
   * Handle an incoming HTTP request.
   *
   * @returns true if the request was handled, false if it should be
   *          passed through to the next handler (non-matching path).
   */
  handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the full request body as a string.
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/**
 * Send a JSON response with the given status code.
 */
function jsonResponse(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
): void {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.writeHead(statusCode);
  res.end(JSON.stringify(body));
}

/**
 * Check if a filename or subdirectory contains path traversal patterns.
 * Belt-and-suspenders: catches .. before canonicalization.
 */
function containsTraversal(value: string): boolean {
  // Decode URL-encoded characters first
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // If decoding fails, check raw value
    decoded = value;
  }

  // Check for .. in both raw and decoded forms
  if (decoded.includes('..') || value.includes('..')) {
    return true;
  }

  // Check for absolute paths
  if (decoded.startsWith('/') || value.startsWith('/')) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a helper router for browser-to-filesystem writes.
 *
 * @param basePath - Project root (parent of .planning/)
 * @returns HelperRouter with handleRequest method
 */
export function createHelperRouter(basePath: string): HelperRouter {
  const consoleRoot = resolve(basePath, CONSOLE_DIRS.root);
  const logger = new BridgeLogger(basePath);

  /**
   * Safely log a bridge operation. Logger failures never propagate --
   * they are swallowed to prevent HTTP 500 responses from audit logging.
   */
  async function safeLog(
    filename: string,
    subdirectory: string,
    contentSize: number,
    status: 'success' | 'error',
    error?: string,
  ): Promise<void> {
    try {
      await logger.log({
        timestamp: new Date().toISOString(),
        filename,
        subdirectory,
        contentSize,
        status,
        ...(error !== undefined ? { error } : {}),
      });
    } catch {
      // Logger failure must not break the HTTP response
    }
  }

  return {
    async handleRequest(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<boolean> {
      // Only handle our specific route
      const url = req.url ?? '';
      const pathname = url.split('?')[0];
      if (pathname !== ROUTE_PATH) {
        return false;
      }

      // Method check -- only POST allowed
      if (req.method !== 'POST') {
        jsonResponse(res, 405, { error: 'Method not allowed' });
        return true;
      }

      // Parse body
      let body: HelperRequestBody;
      try {
        const raw = await readBody(req);
        body = JSON.parse(raw) as HelperRequestBody;
      } catch {
        jsonResponse(res, 400, { error: 'Invalid JSON' });
        return true;
      }

      // Validate required fields
      if (!body.filename || typeof body.filename !== 'string') {
        jsonResponse(res, 400, { error: 'Missing required field: filename' });
        return true;
      }
      if (!body.content || typeof body.content !== 'object') {
        jsonResponse(res, 400, { error: 'Missing required field: content' });
        return true;
      }

      // Default subdirectory
      const subdirectory = body.subdirectory ?? 'inbox/pending';

      // Subdirectory allowlist check
      if (!ALLOWED_SUBDIRECTORIES.has(subdirectory)) {
        // Also check for traversal in subdirectory
        if (containsTraversal(subdirectory)) {
          await safeLog(body.filename, subdirectory, 0, 'error', 'Path traversal rejected');
          jsonResponse(res, 403, { error: 'Path traversal rejected' });
          return true;
        }
        await safeLog(body.filename, subdirectory, 0, 'error', 'Subdirectory not allowed');
        jsonResponse(res, 403, { error: 'Subdirectory not allowed' });
        return true;
      }

      // Path traversal prevention on filename (belt-and-suspenders)
      if (containsTraversal(body.filename)) {
        await safeLog(body.filename, subdirectory, 0, 'error', 'Path traversal rejected');
        jsonResponse(res, 403, { error: 'Path traversal rejected' });
        return true;
      }

      // Canonicalize and verify final path stays within console root
      const targetDir = resolve(consoleRoot, subdirectory);
      const targetPath = resolve(targetDir, body.filename);

      if (!targetPath.startsWith(resolve(consoleRoot) + '/')) {
        await safeLog(body.filename, subdirectory, 0, 'error', 'Path traversal rejected');
        jsonResponse(res, 403, { error: 'Path traversal rejected' });
        return true;
      }

      // Write the file
      await mkdir(targetDir, { recursive: true });
      const contentStr = JSON.stringify(body.content, null, 2);
      await writeFile(targetPath, contentStr, 'utf-8');

      // Log the successful write
      await safeLog(body.filename, subdirectory, contentStr.length, 'success');

      // Return relative path from console root
      const relativePath = relative(consoleRoot, targetPath);
      jsonResponse(res, 200, { ok: true, path: relativePath });
      return true;
    },
  };
}
