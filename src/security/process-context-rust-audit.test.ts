/**
 * Rust ProcessContext chokepoint audit (v1.49.1032).
 *
 * Sibling of `process-context-audit.test.ts` (TS surface) and
 * `acl-reconciliation-audit.test.ts` (the house pattern for auditing RUST
 * sources from vitest: structural regex over committed source text — no
 * Rust toolchain needed). Runs in the default vitest project and therefore
 * pre-tag-gate + every CI leg; the cargo lane is CI-only and cannot gate.
 *
 * Enforces, over every `src-tauri/src/**\/*.rs` file (line comments
 * stripped — `intelligence/atlas.rs` + `intelligence/server.rs` document
 * zero-spawn invariants in comments that would otherwise read as spawns):
 *
 *   1. Any file containing `Command::new(` / `CommandBuilder::new(` must be
 *      in SPAWNER_ROSTER with its exact spawn-site count — a NEW spawner
 *      file or a new site in a rostered file fails until the roster is
 *      updated AND the site is gated.
 *   2. Every rostered file calls `ensure_process_allowed(` at least as many
 *      times as it has spawn sites (1:1 gate-per-site discipline; the lone
 *      sanctioned exception, shutdown.rs's hoisted-above-loop gate, still
 *      satisfies >= because the gate count equals the site count).
 *   3. Roster entries must exist and still spawn (stale-entry inverse
 *      check, mirroring the TS audit's v838 detector).
 *   4. The chokepoint module exists and is barrel-exported.
 *
 * Files that legitimately must never spawn can carry the role-boundary
 * marker `Role: NOT a process spawner` in a comment — but note rule 1
 * triggers on CODE tokens only, so a comment-level invariant (atlas.rs
 * style) needs no marker.
 *
 * @module security/process-context-rust-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const RUST_SRC = join(ROOT, 'src-tauri', 'src');

/**
 * Every Rust file with child-process spawn sites, with its exact
 * comment-stripped spawn-site count. Wired 1:1 at v1.49.1032 — the Rust
 * surface starts at the end-state the TS KNOWN_UNWIRED list took ~70 ships
 * to chip down to. Update BOTH the count and the gate calls when adding a
 * spawn site.
 */
const SPAWNER_ROSTER: Readonly<Record<string, number>> = {
  'src-tauri/src/claude/monitor.rs': 1,
  'src-tauri/src/claude/session.rs': 5,
  'src-tauri/src/commands/dashboard.rs': 1,
  'src-tauri/src/commands/pty.rs': 1,
  'src-tauri/src/commands/security.rs': 1,
  'src-tauri/src/intelligence/atlas_sidecar.rs': 1,
  'src-tauri/src/lib.rs': 1,
  'src-tauri/src/mcp_host/connection.rs': 1,
  'src-tauri/src/security/agent_isolation.rs': 2,
  'src-tauri/src/security/sandbox.rs': 4,
  'src-tauri/src/services/shutdown.rs': 3,
  'src-tauri/src/tmux/detector.rs': 3,
  'src-tauri/src/tmux/session.rs': 4,
};

// std::process::Command, tokio::process::Command, and portable-pty's
// CommandBuilder all funnel through these two constructor tokens.
const SPAWN_TOKEN_REGEX = /\b(?:Command|CommandBuilder)::new\s*\(/g;
const GATE_TOKEN_REGEX = /\bensure_process_allowed\s*\(/g;
const ROLE_BOUNDARY_REGEX = /Role:\s*NOT\s+a\s+process\s+spawner/i;

/** The chokepoint definition itself — out of scope for the sweep. */
const CHOKEPOINT_MODULE = 'src-tauri/src/security/process_context.rs';

/**
 * Strip `//`-to-end-of-line comments (covers `//`, `///`, `//!`) with
 * double-quoted-string awareness, so a `//` inside a string literal
 * (`"http://example.com"`) never truncates the line and undercounts spawn
 * sites (step P v1.49.1032 finding). Deliberately NOT a char-literal lexer:
 * `'` also introduces lifetimes (`&'static str`), and a `//` cannot occur
 * inside a one-char literal. Unrecognized exotic forms (raw strings with
 * hashes) fail toward KEEPING content — over-counting fails loudly, only
 * undercounting can hide an ungated spawn.
 */
function stripLineComments(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      let inString = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
          if (ch === '\\') i++;
          else if (ch === '"') inString = false;
        } else if (ch === '"') {
          inString = true;
        } else if (ch === '/' && line[i + 1] === '/') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');
}

function findRustFiles(): string[] {
  const out: string[] = [];
  const stack = [RUST_SRC];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!st.isFile() || !name.endsWith('.rs')) continue;
      out.push(full);
    }
  }
  return out.sort();
}

function countMatches(content: string, regex: RegExp): number {
  return (content.match(regex) ?? []).length;
}

describe('Rust ProcessContext chokepoint audit', () => {
  const files = findRustFiles();

  it('discovers a non-empty set of Rust files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('comment stripper is string-aware (step P v1.49.1032 finding)', () => {
    // `//` inside a string literal must not truncate the line.
    const inString = 'let url = "http://example.com"; Command::new("ls");';
    expect(countMatches(stripLineComments(inString), SPAWN_TOKEN_REGEX)).toBe(1);
    // Real comments still strip, including after a string.
    const trailing = 'let x = "a"; // Command::new("ls") in a comment';
    expect(countMatches(stripLineComments(trailing), SPAWN_TOKEN_REGEX)).toBe(0);
    // Escaped quote inside a string does not end string mode.
    const escaped = 'let s = "a\\" // not a comment"; Command::new("ls");';
    expect(countMatches(stripLineComments(escaped), SPAWN_TOKEN_REGEX)).toBe(1);
    // Doc comments strip.
    expect(stripLineComments('/// Command::new docs')).toBe('');
  });

  it('chokepoint module exists and is barrel-exported from security/mod.rs', () => {
    const modulePath = join(ROOT, CHOKEPOINT_MODULE);
    const moduleSrc = readFileSync(modulePath, 'utf8');
    expect(moduleSrc).toMatch(/pub fn ensure_process_allowed/);
    expect(moduleSrc).toMatch(/pub struct ProcessContextDenied/);

    const barrel = readFileSync(join(ROOT, 'src-tauri', 'src', 'security', 'mod.rs'), 'utf8');
    expect(barrel).toMatch(/pub mod process_context;/);
  });

  it.each(files.map((f) => [relative(ROOT, f).split('\\').join('/'), f]))(
    'enforces gate-per-spawn-site on %s',
    (label, absPath) => {
      if (label === CHOKEPOINT_MODULE) return;

      const code = stripLineComments(readFileSync(absPath, 'utf8'));
      const spawnSites = countMatches(code, SPAWN_TOKEN_REGEX);
      const expected = SPAWNER_ROSTER[label];

      if (spawnSites === 0) {
        if (expected !== undefined) {
          throw new Error(
            `${label}: in SPAWNER_ROSTER (expecting ${expected} spawn sites) but has none — ` +
              `stale roster entry; remove it from process-context-rust-audit.test.ts.`,
          );
        }
        return;
      }

      if (expected === undefined) {
        if (ROLE_BOUNDARY_REGEX.test(readFileSync(absPath, 'utf8'))) return;
        throw new Error(
          `${label}: contains ${spawnSites} Command::new/CommandBuilder::new site(s) but is ` +
            `not in SPAWNER_ROSTER. Gate each site with ensure_process_allowed(source, op, ` +
            `target, argv) BEFORE the spawn (see src-tauri/src/security/process_context.rs ` +
            `header for the denial-propagation discipline), then add the file + count to the ` +
            `roster in src/security/process-context-rust-audit.test.ts.`,
        );
      }

      if (spawnSites !== expected) {
        throw new Error(
          `${label}: spawn-site count drifted — roster pins ${expected}, found ${spawnSites}. ` +
            `Gate any new site BEFORE the spawn and update the roster count.`,
        );
      }

      const gates = countMatches(code, GATE_TOKEN_REGEX);
      if (gates < spawnSites) {
        throw new Error(
          `${label}: ${spawnSites} spawn site(s) but only ${gates} ensure_process_allowed ` +
            `call(s) — every Command::new/CommandBuilder::new needs a gate hoisted before it.`,
        );
      }
    },
  );

  it('zero-spawn structural invariants hold for atlas.rs and server.rs (code tokens)', () => {
    for (const label of [
      'src-tauri/src/intelligence/atlas.rs',
      'src-tauri/src/intelligence/server.rs',
    ]) {
      const code = stripLineComments(readFileSync(join(ROOT, label), 'utf8'));
      expect(countMatches(code, SPAWN_TOKEN_REGEX), `${label} must stay spawn-free`).toBe(0);
    }
  });

  it('cargo test module for the chokepoint is registered', () => {
    const testsMod = readFileSync(
      join(ROOT, 'src-tauri', 'src', 'security', 'tests', 'mod.rs'),
      'utf8',
    );
    expect(testsMod).toMatch(/mod process_context_tests;/);
  });
});
