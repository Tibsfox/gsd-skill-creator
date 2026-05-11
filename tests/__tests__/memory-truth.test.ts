/**
 * v1.49.634 C4.4 — MEMORY.md truth tests
 *
 * The operator-local memory file at
 *   ~/.claude/projects/-media-foxy-ai-GSD-dev-tools-gsd-skill-creator/memory/pg_credentials_location.md
 * pinned the post-v1.49.585-C08 canonical PG-credentials path
 * (`<repo-root>/.env`). v1.49.585 §4.5 deferred-batch tracking asked for a
 * test asserting the memory note still names the canonical location and
 * the `RH_ENV_FILE` override.
 *
 * The memory file lives OUTSIDE the repo (it's an agent's persistent
 * memory store, not source) and is operator-system-specific. The test
 * therefore SKIPs cleanly when the file is absent (CI / other dev
 * machines). When present, the canonical-content invariants are checked.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MEMORY_PATH = join(
  homedir(),
  '.claude',
  'projects',
  '-media-foxy-ai-GSD-dev-tools-gsd-skill-creator',
  'memory',
  'pg_credentials_location.md',
);

describe('v1.49.634 C4.4: MEMORY.md pg_credentials_location canonical content', () => {
  it('pg_credentials_location.md points at <repo-root>/.env', () => {
    if (!existsSync(MEMORY_PATH)) {
      // Operator-local memory store absent on this machine — skip rather
      // than fail. This is the CI / other-dev-machine path.
      return;
    }
    const content = readFileSync(MEMORY_PATH, 'utf8');

    // Invariant 1: canonical-file callout must name <repo-root>/.env post-C08.
    expect(content).toMatch(/<repo-root>\/\.env/);
    expect(content).toMatch(/post-v1\.49\.585 C08/);

    // Invariant 2: must mention RH_POSTGRES_URL as the primary env-var.
    expect(content).toMatch(/RH_POSTGRES_URL/);

    // Invariant 3: override env-var name RH_ENV_FILE must be documented.
    expect(content).toMatch(/RH_ENV_FILE/);

    // Invariant 4: deprecated alias ARTEMIS_REPO_ENV must still be named
    // (so operators with legacy setups can find the migration note).
    expect(content).toMatch(/ARTEMIS_REPO_ENV/);

    // Invariant 5: must NOT recommend the legacy artemis-ii worktree
    // .env path as the canonical location (post-C08 deprecation). The
    // historical-note mention is fine; what we forbid is the canonical
    // callout pointing there.
    const canonicalSection = content.split(/Historical note/i)[0];
    expect(canonicalSection).not.toMatch(/\/media\/foxy\/ai\/GSD\/dev-tools\/artemis-ii\/\.env.*canonical/);
  });
});
