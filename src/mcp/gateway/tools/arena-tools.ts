/**
 * Arena gateway tools — MCP interface to the Rust memory arena via
 * the ContentAddressedStore substrate (P1).
 *
 * Registers `arena.*` tools so non-Unison users can query the arena
 * directly from Claude Code, external AI tools, and any MCP client.
 * Wraps a `ContentAddressedStore` instance — the same substrate used
 * by P2's ArenaSkillStore — so tools reading and writing through the
 * MCP layer see the exact same chunks as the TypeScript skill code.
 *
 * All payloads on the wire are base64-encoded. `put` accepts either
 * `payloadBase64` (raw bytes) or `payloadText` (UTF-8 convenience).
 * `get` always returns base64; callers decode locally.
 *
 * Tools registered:
 * - `arena.put` — store bytes under a user-supplied or auto-computed hash
 * - `arena.get_by_hash` — fetch bytes by hash
 * - `arena.has_hash` — existence check
 * - `arena.list_hashes` — enumerate stored hashes
 * - `arena.count` — total indexed entries
 * - `arena.remove_by_hash` — free a chunk
 * - `arena.preload` — advisory warm-up for a set of hashes
 * - `arena.stats` — counts + index state
 *
 * Part of the P3B phase from the memory + Unison + skill-creator
 * integration plan. See `.planning/HANDOFF-UNISON-CHIPSET-EXPERIMENT.md`
 * and the design exploration in session 009.
 *
 * @module mcp/gateway/tools/arena-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { sha256Hex } from '../../../memory/content-addressed-store.js';
import type { GroveStore } from '../../../memory/grove-store.js';
import { bytesToBase64, base64ToBytes } from '../../../memory/rust-arena.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Wrap a JSON payload in the MCP content envelope. */
function jsonContent(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/** Wrap an error message in the MCP content envelope. */
function errorContent(message: string): { content: [{ type: 'text'; text: string }] } {
  return jsonContent({ ok: false, error: message });
}

/**
 * Decode the "payload inputs" block into the raw bytes to store.
 * Exactly one of `payloadBase64` / `payloadText` must be supplied.
 */
function decodePayloadInput(args: {
  payloadBase64?: string;
  payloadText?: string;
}): Uint8Array {
  const sources = [args.payloadBase64, args.payloadText].filter(
    (v) => v !== undefined,
  );
  if (sources.length !== 1) {
    throw new Error(
      'exactly one of payloadBase64 or payloadText must be provided',
    );
  }
  if (args.payloadBase64 !== undefined) {
    return base64ToBytes(args.payloadBase64);
  }
  return new TextEncoder().encode(args.payloadText!);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Register all `arena.*` tools on the given MCP server. The server
 * is expected to be an `@modelcontextprotocol/sdk` McpServer instance.
 *
 * @param server - The MCP server to attach tools to.
 * @param store - A fully-initialized `ContentAddressedStore`. Caller
 *   is responsible for calling `store.loadIndex()` (or letting the
 *   first op do it lazily) before user traffic arrives.
 */
export function registerArenaTools(
  server: McpServer,
  store: GroveStore,
): void {
  registerPutTool(server, store);
  registerGetByHashTool(server, store);
  registerHasHashTool(server, store);
  registerRemoveByHashTool(server, store);
  registerListHashesTool(server, store);
  registerCountTool(server, store);
  registerPreloadTool(server, store);
  registerStatsTool(server, store);
}

// ── arena.put ───────────────────────────────────────────────────────────────

function registerPutTool(server: McpServer, store: GroveStore): void {
  server.tool(
    'arena.put',
    'Store bytes in the content-addressed arena. Supply either a precomputed hex hash or leave it out for auto SHA-256.',
    {
      hashHex: z
        .string()
        .regex(/^[0-9a-fA-F]*$/)
        .optional()
        .describe(
          'Precomputed hex hash (1..=510 hex chars). Omit to auto-compute SHA-256 over the payload.',
        ),
      payloadBase64: z
        .string()
        .optional()
        .describe('Raw bytes, base64-encoded. Exactly one of payloadBase64 or payloadText must be set.'),
      payloadText: z
        .string()
        .optional()
        .describe('UTF-8 text payload convenience. Exactly one of payloadBase64 or payloadText must be set.'),
    },
    async (args) => {
      try {
        const bytes = decodePayloadInput(args);
        let result;
        if (args.hashHex && args.hashHex.length > 0) {
          result = await store.put(args.hashHex, bytes);
        } else {
          result = await store.putAuto(bytes);
        }
        return jsonContent({
          ok: true,
          hash: result.hash,
          chunkId: result.chunkId,
          created: result.created,
          size: bytes.length,
        });
      } catch (err) {
        return errorContent(
          `arena.put failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.get_by_hash ───────────────────────────────────────────────────────

function registerGetByHashTool(
  server: McpServer,
  store: GroveStore,
): void {
  server.tool(
    'arena.get_by_hash',
    'Fetch bytes from the content-addressed arena by hex hash. Returns base64-encoded payload.',
    {
      hashHex: z
        .string()
        .regex(/^[0-9a-fA-F]+$/)
        .describe('Hex hash to look up'),
    },
    async (args) => {
      try {
        const bytes = await store.getByHash(args.hashHex);
        if (bytes === null) {
          return jsonContent({ ok: true, found: false });
        }
        return jsonContent({
          ok: true,
          found: true,
          hash: args.hashHex.toLowerCase(),
          payloadBase64: bytesToBase64(bytes),
          size: bytes.length,
        });
      } catch (err) {
        return errorContent(
          `arena.get_by_hash failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.has_hash ──────────────────────────────────────────────────────────

function registerHasHashTool(
  server: McpServer,
  store: GroveStore,
): void {
  server.tool(
    'arena.has_hash',
    'Check whether a hash exists in the arena.',
    {
      hashHex: z
        .string()
        .regex(/^[0-9a-fA-F]+$/)
        .describe('Hex hash to check'),
    },
    async (args) => {
      try {
        const present = await store.hasHash(args.hashHex);
        return jsonContent({ ok: true, present });
      } catch (err) {
        return errorContent(
          `arena.has_hash failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.remove_by_hash ────────────────────────────────────────────────────

function registerRemoveByHashTool(
  server: McpServer,
  store: GroveStore,
): void {
  server.tool(
    'arena.remove_by_hash',
    'Free the arena chunk backing a hash. Returns whether something was removed.',
    {
      hashHex: z
        .string()
        .regex(/^[0-9a-fA-F]+$/)
        .describe('Hex hash to remove'),
    },
    async (args) => {
      try {
        const removed = await store.removeByHash(args.hashHex);
        return jsonContent({ ok: true, removed });
      } catch (err) {
        return errorContent(
          `arena.remove_by_hash failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.list_hashes ───────────────────────────────────────────────────────

function registerListHashesTool(
  server: McpServer,
  store: GroveStore,
): void {
  server.tool(
    'arena.list_hashes',
    'List every hash currently stored in the arena. Optionally limit the result count.',
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(10_000)
        .optional()
        .describe('Max hashes to return. Omit for all.'),
    },
    async (args) => {
      try {
        const all = await store.listHashes();
        const hashes = args.limit !== undefined ? all.slice(0, args.limit) : all;
        return jsonContent({
          ok: true,
          count: hashes.length,
          total: all.length,
          hashes,
        });
      } catch (err) {
        return errorContent(
          `arena.list_hashes failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.count ─────────────────────────────────────────────────────────────

function registerCountTool(server: McpServer, store: GroveStore): void {
  server.tool(
    'arena.count',
    'Return the number of stored entries.',
    {},
    async () => {
      try {
        const n = await store.count();
        return jsonContent({ ok: true, count: n });
      } catch (err) {
        return errorContent(
          `arena.count failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.preload ───────────────────────────────────────────────────────────

function registerPreloadTool(
  server: McpServer,
  store: GroveStore,
): void {
  server.tool(
    'arena.preload',
    'Advisory touch for a set of hashes. Returns the number found.',
    {
      hashes: z
        .array(z.string().regex(/^[0-9a-fA-F]+$/))
        .min(1)
        .max(1_000)
        .describe('Hex hashes to touch'),
    },
    async (args) => {
      try {
        const hits = await store.preload(args.hashes);
        return jsonContent({
          ok: true,
          hits,
          requested: args.hashes.length,
        });
      } catch (err) {
        return errorContent(
          `arena.preload failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── arena.stats ─────────────────────────────────────────────────────────────

function registerStatsTool(server: McpServer, store: GroveStore): void {
  server.tool(
    'arena.stats',
    'Return arena storage stats: entry count and index-load state.',
    {},
    async () => {
      try {
        const count = await store.count();
        return jsonContent({
          ok: true,
          count,
          indexLoaded: store.isIndexLoaded(),
        });
      } catch (err) {
        return errorContent(
          `arena.stats failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}

// ── Exports ─────────────────────────────────────────────────────────────────

/** Re-exported for tests and callers that want to compute hashes client-side. */
export { sha256Hex };
