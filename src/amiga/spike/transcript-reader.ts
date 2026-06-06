/**
 * Transcript reader for the AMIGA revive consumer.
 *
 * Distils Claude Code session transcripts (~/.claude/projects/<slug>/*.jsonl)
 * into the ordered tool-use stream the SessionEventBridge projects onto the
 * AMIGA mission-event vocabulary. Extracted from tools/spike-amiga-revive.mjs
 * so both the first-class CLI command (`skill-creator amiga`) and the legacy
 * runner share one implementation.
 *
 * Read-only: never writes.
 *
 * @module
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { ensureAllowed } from '../../security/loader-context.js';
import type { LoaderContext } from '../../security/loader-context.js';
import type { TranscriptSession, ToolUse } from './session-event-bridge.js';

/** Tier-E LoaderContext source identifier for this reader. */
const SOURCE = 'amiga/transcript-reader';

/**
 * Derive the Claude Code projects dir for a working directory. Claude Code
 * slugs the absolute cwd by replacing every '/' with '-' (the leading slash
 * becomes a leading dash) and stores that session's transcripts under
 * `~/.claude/projects/<slug>/`.
 */
export function defaultProjectsDir(
  cwd: string = process.cwd(),
  home: string = homedir(),
): string {
  const slug = cwd.replace(/\//g, '-');
  return join(home, '.claude', 'projects', slug);
}

/**
 * List every *.jsonl transcript in a projects dir, largest-first. The one
 * LoaderContext gate on the directory covers the readdir + the per-file stat
 * sweep, all scoped under `dir` (one-gate-covers-transitive-internals).
 */
export function listTranscripts(dir: string, ctx?: LoaderContext): string[] {
  ensureAllowed(ctx, SOURCE, 'read-dir', dir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => join(dir, f))
    .map((f) => ({ f, size: statSync(f).size }))
    .sort((a, b) => b.size - a.size)
    .map((x) => x.f);
}

/** The largest transcript in a dir, or undefined if the dir holds none. */
export function largestTranscript(dir: string, ctx?: LoaderContext): string | undefined {
  return listTranscripts(dir, ctx)[0];
}

/**
 * Distil a transcript JSONL into an ordered tool-use stream. Mirrors the
 * extraction the spike runner performs: ordered
 * `message.content[].{type:'tool_use', name}` blocks, ISO-Z `timestamp`s
 * (first → mission start, last → mission end), and the `sessionId`.
 */
export function readTranscript(path: string, ctx?: LoaderContext): TranscriptSession {
  ensureAllowed(ctx, SOURCE, 'read-file', path);
  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  const tools: ToolUse[] = [];
  let sessionId = 'unknown';
  let firstMs: number | null = null;
  let lastMs: number | null = null;

  for (const line of lines) {
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (typeof entry.sessionId === 'string') sessionId = entry.sessionId;
    if (typeof entry.timestamp === 'string') {
      const ms = Date.parse(entry.timestamp);
      if (!Number.isNaN(ms)) {
        if (firstMs === null) firstMs = ms;
        lastMs = ms;
      }
    }
    const message = entry.message as { content?: unknown } | undefined;
    const content = message?.content;
    if (Array.isArray(content)) {
      for (const block of content as Array<Record<string, unknown>>) {
        if (block && block.type === 'tool_use' && typeof block.name === 'string') {
          tools.push({ tool: block.name, ts: entry.timestamp as string | undefined });
        }
      }
    }
  }

  const startMs = firstMs ?? Date.now();
  const endMs = lastMs ?? startMs;
  return { sessionId, startMs, endMs, tools };
}
