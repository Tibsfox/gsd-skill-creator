/**
 * Tauri capability-ACL reconciliation drift-guard.
 *
 * v1.49.1030 (audit 2026-06-09 §3.3 / §10 ship 4): src-tauri/build.rs
 * passed only 23 commands to `tauri_build::AppManifest` while lib.rs
 * registered 116 via `generate_handler!` — the other 93 were ACL-orphaned
 * and runtime-unreachable ("Command X not allowed by ACL"), including
 * commands the desktop actively invokes (keystore_*, mcp_*,
 * intelligence_*, atlas_*, arena_*, send_chat_message). Nothing
 * reconciled the lists, so they drifted for ~140 milestones.
 *
 * This test pins the three-way invariant the ship established:
 *
 *   lib.rs generate_handler! set
 *     == build.rs AppManifest set
 *     == capabilities/default.json `allow-*` set (kebab-cased)
 *
 * Adding a Tauri command now requires touching all three files in the
 * same change, or this test names the missing entries. Runs in the
 * default vitest project (and therefore gate step 1 + every CI leg),
 * which the cargo lane alone cannot guarantee — the ACL gap was a
 * build-time configuration hole, invisible to `cargo test`.
 *
 * Source parsing is deliberately structural (regex over committed source
 * text, like process-context-audit.test.ts) — no Rust toolchain needed.
 *
 * @module security/acl-reconciliation-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const LIB_RS = resolve(ROOT, 'src-tauri', 'src', 'lib.rs');
const BUILD_RS = resolve(ROOT, 'src-tauri', 'build.rs');
const DEFAULT_CAPABILITY = resolve(
  ROOT,
  'src-tauri',
  'capabilities',
  'default.json',
);

/** Commands registered with the Tauri runtime in lib.rs. */
function registeredCommands(): string[] {
  const src = readFileSync(LIB_RS, 'utf8');
  const handler = src.match(/generate_handler!\[([\s\S]*?)\]/);
  if (!handler) throw new Error('generate_handler! block not found in lib.rs');
  // Entries are Rust paths like `commands::services::start_service,` —
  // the command name Tauri registers is the final path segment.
  const entries = handler[1].match(/[A-Za-z_0-9]+(?:::[A-Za-z_0-9]+)+\s*,/g) ?? [];
  return entries.map((e) =>
    e.replace(/\s*,$/, '').split('::').pop() as string,
  );
}

/** Commands declared to tauri_build::AppManifest in build.rs. */
function manifestedCommands(): string[] {
  const src = readFileSync(BUILD_RS, 'utf8');
  const block = src.match(/\.commands\(&\[([\s\S]*?)\]\)/);
  if (!block) throw new Error('AppManifest .commands(&[...]) not found in build.rs');
  return (block[1].match(/"([a-z_0-9]+)"/g) ?? []).map((s) => s.slice(1, -1));
}

/** Non-core `allow-*` permission identifiers in the default capability. */
function permittedCommands(): string[] {
  const cap = JSON.parse(readFileSync(DEFAULT_CAPABILITY, 'utf8')) as {
    permissions: string[];
  };
  return cap.permissions
    .filter((p) => !p.startsWith('core:'))
    .map((p) => {
      if (!p.startsWith('allow-')) {
        throw new Error(
          `Unexpected non-core, non-allow permission in default.json: ${p}`,
        );
      }
      // Tauri kebab-cases command names for permission identifiers.
      return p.slice('allow-'.length).replace(/-/g, '_');
    });
}

function diff(a: string[], b: string[]): string[] {
  const bs = new Set(b);
  return a.filter((x) => !bs.has(x)).sort();
}

describe('Tauri ACL reconciliation (lib.rs == build.rs == default capability)', () => {
  const registered = registeredCommands();
  const manifested = manifestedCommands();
  const permitted = permittedCommands();

  it('parses a plausible command count from each source', () => {
    // 98 at v1.49.1030 — bound loosely so legitimate growth/shrink does
    // not trip this, while an empty parse (regex rot) fails loudly.
    expect(registered.length).toBeGreaterThan(50);
    expect(manifested.length).toBeGreaterThan(50);
    expect(permitted.length).toBeGreaterThan(50);
  });

  it('has no duplicate command registrations or permissions', () => {
    expect(registered.length).toBe(new Set(registered).size);
    expect(manifested.length).toBe(new Set(manifested).size);
    expect(permitted.length).toBe(new Set(permitted).size);
  });

  it('every registered command is in the build.rs AppManifest (else ACL-orphaned at runtime)', () => {
    expect(diff(registered, manifested)).toEqual([]);
  });

  it('every AppManifest command is registered (else stale manifest entry)', () => {
    expect(diff(manifested, registered)).toEqual([]);
  });

  it('every manifested command is permitted in capabilities/default.json', () => {
    expect(diff(manifested, permitted)).toEqual([]);
  });

  it('every default-capability permission is backed by a manifested command', () => {
    expect(diff(permitted, manifested)).toEqual([]);
  });
});
