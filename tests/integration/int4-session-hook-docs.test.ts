/**
 * INT-4 — session-observation hook docs use the VALID Claude Code schema.
 *
 * `src/hooks/session-{start,end}.ts` are the capture bridge into the adaptive-
 * learning `SessionObserver` pipeline (this project's headline feature). They
 * are NOT superseded by `tools/session-retro/observe.mjs` (a separate retro
 * tool) — verified live-firing at v1.49.1128.
 *
 * The pre-fix defect: INSTALL.md and both module headers documented the hook
 * registration with an INVALID schema — `"session_start": "node ..."` — where
 * the real Claude Code schema is the PascalCase event key `SessionStart` with a
 * value that is an array of matcher groups. Claude Code silently ignores unknown
 * event keys, so a user who followed the docs produced a settings file that
 * never fired — the flagship integration was documented-but-broken.
 *
 * This guard pins the corrected schema so the snake_case string form can't creep
 * back. It is an INDEPENDENT oracle (re-derives the schema shape from disk).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const INSTALL_MD = join(REPO, 'INSTALL.md');
const HOOK_SRC = ['session-start.ts', 'session-end.ts'].map((f) =>
  join(REPO, 'src', 'hooks', f),
);

// The exact invalid form the fix removed: a JSON key `"session_start"` /
// `"session_end"` mapping DIRECTLY to a command string. Prose mentions like
// `the legacy "session_start"/"session_end" form` (no colon+quote after) do NOT
// match, so the docs can still explain why the old form is wrong.
const INVALID_SNAKE_REGISTRATION = /"session_(start|end)"\s*:\s*"/;

describe('INT-4: session-observation hook docs use the valid Claude Code schema', () => {
  it('ANTI-VACUOUS — the two hook sources exist and bridge into SessionObserver', () => {
    for (const p of HOOK_SRC) {
      expect(existsSync(p), `${p} should exist`).toBe(true);
      expect(readFileSync(p, 'utf8'), `${p} should import SessionObserver`).toContain(
        'SessionObserver',
      );
    }
  });

  it('INSTALL.md registers the hooks with the PascalCase array schema, not the snake string form', () => {
    const md = readFileSync(INSTALL_MD, 'utf8');
    expect(md).toContain('"SessionStart"');
    expect(md).toContain('"SessionEnd"');
    // Array-of-matcher-groups shape present (a `"hooks"` array with a `"command"`).
    expect(md).toMatch(/"SessionStart"\s*:\s*\[/);
    expect(md).toMatch(/"SessionEnd"\s*:\s*\[/);
    expect(
      INVALID_SNAKE_REGISTRATION.test(md),
      'INSTALL.md must not register a hook via the invalid "session_start"/"session_end" string form',
    ).toBe(false);
  });

  it('both module headers document the valid schema, not the snake string form', () => {
    for (const p of HOOK_SRC) {
      const src = readFileSync(p, 'utf8');
      expect(src, `${p} header should show a PascalCase Session* event key`).toMatch(
        /"Session(Start|End)"\s*:\s*\[/,
      );
      expect(
        INVALID_SNAKE_REGISTRATION.test(src),
        `${p} header must not document the invalid "session_start"/"session_end" string form`,
      ).toBe(false);
    }
  });
});
