# Contributing to gsd-skill-creator

Thanks for taking the time to contribute. This document is the canonical guide for how work lands in this repository. It covers branch targets, the rebase workflow, cross-platform portability rules, commit conventions, and what to include in issues and pull requests.

If you're a first-time contributor, read this end-to-end once before filing anything. It will save review round-trips on both sides.

---

## Table of contents

- [Repository layout](#repository-layout)
- [Branch model](#branch-model)
- [Filing an issue](#filing-an-issue)
- [Submitting a pull request](#submitting-a-pull-request)
- [Rebasing onto dev](#rebasing-onto-dev)
- [Commit convention](#commit-convention)
- [Cross-platform portability rules](#cross-platform-portability-rules)
- [Scope discipline: one concern per PR](#scope-discipline-one-concern-per-pr)
- [Before you submit: local checks](#before-you-submit-local-checks)
- [What not to commit](#what-not-to-commit)
- [Code of conduct](#code-of-conduct)

---

## Repository layout

```
src/                 TypeScript library and CLI
src-tauri/           Rust backend (Tauri v2)
desktop/             Vite webview frontend
project-claude/      Source of project-specific Claude config (installed via node project-claude/install.cjs)
.claude/             Installed Claude config — agents, hooks, commands, skills
.planning/           GSD project state (gitignored — never commit)
docs/                Canonical documentation and release notes
www/                 Research artifacts
tests/               Vitest test suites
```

**Strict boundaries (enforced in CI):**

- `src/` never imports from `desktop/` or `@tauri-apps/api`
- `desktop/` never imports Node.js built-ins

---

## Branch model

| Branch | Role | Who pushes |
|---|---|---|
| `dev` | Primary integration branch. All feature work, bug fixes, and contributions land here first. | Contributors (via PR), maintainers |
| `main` | Human-verified release branch. Receives merges from `dev` after review. | Maintainers only |
| `v1.50`, `artemis-ii`, etc. | Long-running release or mission branches. | Release leads |

**The rule, written once:**

> **Submit PRs against `dev`, never against `main`.**

Opening a PR against `main` is not a failure — we'll ask you to retarget it. But it does slow review, so please target `dev` from the start.

If you've already pushed a branch that was forked from `main`, rebase it onto `dev` before opening the PR (see [Rebasing onto dev](#rebasing-onto-dev) below).

---

## Filing an issue

Good issues are cheap. Vague issues are expensive — they cost a round-trip to clarify before work can even start. A few minutes of extra detail at filing time saves hours later.

### Bug reports

Include, at minimum:

1. **What you were trying to do.** One sentence.
2. **What happened instead.** The actual error message or unexpected behavior, copy-pasted verbatim. Do not paraphrase error messages.
3. **How to reproduce.** Exact steps. Commands, inputs, file contents if relevant.
4. **Environment.**
   - OS and version (e.g., `macOS 14.5`, `Ubuntu 22.04`, `Windows 11 22H2`)
   - Node version (`node --version`)
   - `npm --version`
   - For Rust changes: `rustc --version`, `cargo --version`
5. **Commit SHA or version you're on.** `git rev-parse HEAD` output, or the release tag.
6. **Anything you already ruled out.** If you tried two fixes that didn't work, tell us — it prevents us from suggesting the same thing.

### Feature requests

Include:

1. **The use case.** What real workflow is this for? "I want X" is less useful than "When I'm doing Y, I need X because Z."
2. **Proposed API or UX.** Rough sketch is fine. Even pseudocode or a sample command invocation helps.
3. **Alternatives considered.** What did you try first? What existing feature is close but doesn't quite fit?

### Security issues

Do **not** open a public issue for security vulnerabilities. Email the maintainer directly or use GitHub's private vulnerability reporting.

---

## Submitting a pull request

### Before you open the PR

1. **Fork the repository** and clone your fork.
2. **Create a branch from `dev`**, not from `main`:
   ```sh
   git fetch origin
   git checkout -b fix/my-bug origin/dev
   ```
3. **Make your changes.** Keep the scope focused — one concern per PR (see [Scope discipline](#scope-discipline-one-concern-per-pr) below).
4. **Write or update tests** that cover the change.
5. **Run local checks** (see [Before you submit](#before-you-submit-local-checks)).
6. **Rebase onto the latest `dev`** if time has passed since you forked.

### Opening the PR

- **Base branch: `dev`.** Always.
- **Title:** follow the [commit convention](#commit-convention). The PR title becomes the squash-merge commit subject, so it must be valid.
- **Body:** explain *why*, not *what*. The diff shows the what. Tell the reviewer what problem you're solving and what you considered. If this fixes a filed issue, include `Fixes #NNN` so the issue auto-closes on merge.
- **Test plan:** a bulleted checklist of how you verified the change. "Ran `npm test`, 21,298 passed" is fine. "Tested on Linux, did not test on Windows/macOS" is also fine — say what you did and didn't test. We'd rather know your blind spots than guess at them.
- **Screenshots or logs** for UI changes or any change whose effect is easier to show than describe.

### After you open the PR

- A maintainer will review. Review comments are suggestions unless marked as blocking.
- If changes are requested, push additional commits to the same branch. Do not force-push unless asked — the reviewer may be re-reading the incremental diff.
- Once approved, a maintainer will merge (typically squash-merge into `dev`).

---

## Rebasing onto dev

If `dev` has moved while your PR was open, rebase onto the latest `dev` so your changes apply cleanly:

```sh
# Make sure your local dev is up to date
git fetch origin
git checkout dev
git pull --ff-only origin dev

# Rebase your feature branch onto dev
git checkout fix/my-bug
git rebase dev

# If there are conflicts, resolve them file-by-file, then:
#   git add <resolved-file>
#   git rebase --continue
# If you get stuck:
#   git rebase --abort  (returns you to pre-rebase state)

# After a successful rebase, force-push YOUR feature branch only:
git push --force-with-lease origin fix/my-bug
```

**Important:**

- `--force-with-lease` is safer than `--force`. It refuses to push if someone else pushed to your branch in the meantime.
- **Never force-push to `dev` or `main`.** Those are shared branches. Rebase-force only on your personal feature branch.
- If a rebase gets messy, it's always safe to `git rebase --abort` and ask for help in the PR comments.

### If your branch was forked from `main` by accident

```sh
git fetch origin
git rebase --onto origin/dev $(git merge-base HEAD origin/main) HEAD
git push --force-with-lease origin <your-branch>
```

This transplants your commits from on-top-of-`main` to on-top-of-`dev`.

---

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by a PreToolUse hook on `git commit` in the maintainer harness. The format:

```
<type>(<scope>): <subject>

<body: optional, explains why>
```

### Valid types

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, missing semicolons — no code logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Changes to build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Maintenance, cleanup, tooling |

### Subject line rules

- **Imperative mood:** "add thing", not "added thing" or "adds thing"
- **Lowercase first letter** after the colon
- **72 characters or fewer**
- **No trailing period**
- **Scope in parentheses** — usually the subsystem or package (e.g., `fix(discovery):`, `feat(chipset):`)

### Body

- Optional, but strongly preferred for non-trivial changes.
- Explain **why** the change is needed. The diff shows the what; a good commit message explains the motivation and the constraints.
- Wrap at 72 columns where practical.
- Reference issues with `Fixes #NNN` or `Refs #NNN`.

### Wave commit markers (advanced)

When a large refactor spans multiple logical waves but session boundaries force them into a single commit, mark the waves in the body:

```
feat(chipset): unified copper + blitter execution pipeline

Wave 1: extracted executor interface
Wave 2: migrated copper activation to executor
Wave 3: migrated blitter ops to executor
Wave 4: removed legacy dispatch paths
```

Wave numbers must be sequential. This preserves `git bisect` intent even when commit boundaries don't align with wave boundaries.

### Do not add Co-Authored-By lines

The project policy is that Co-Authored-By trailers are not added to commits, regardless of whether an AI assistant helped with the work. Please omit them. If you're using a tool that adds them automatically, strip them before committing.

---

## Cross-platform portability rules

We target **Linux, macOS, and Windows**. Code and configuration that lands on `dev` must work on all three, or explicitly gate off the platforms it doesn't support with a runtime check.

### Hard rules

1. **No hardcoded absolute paths to user directories.**
   - ❌ `C:/Users/alice/.claude/hooks/foo.js`
   - ❌ `/home/bob/projects/gsd/config.json`
   - ❌ `/Users/carol/Library/Application Support/...`
   - ✅ Resolve paths at runtime via `os.homedir()`, `os.tmpdir()`, `path.join(...)`, `process.env.XDG_*`, or equivalent platform APIs.

2. **No hardcoded absolute paths to temp files.**
   - ❌ `/tmp/security-proxy.sock`
   - ✅ `path.join(os.tmpdir(), 'security-proxy.sock')` (Node)
   - ✅ `std::env::temp_dir().join("security-proxy.sock")` (Rust)
   - `/tmp` does not exist on Windows. Windows uses `%LOCALAPPDATA%\Temp` or similar. `os.tmpdir()` and `env::temp_dir()` return the right thing on each platform.

3. **No shell-specific syntax in hooks or scripts that run on all platforms.**
   - If a hook must run everywhere, write it in Node (`.cjs`) or another cross-platform runtime. Bash scripts require WSL, Git Bash, or a Unix shell, and their parsing behavior differs between Bash 3.2 (macOS default), Bash 5+ (Linux), and Git Bash (Windows).
   - Our `project-claude/hooks/` directory contains Node ports of `validate-commit`, `session-state`, and `phase-boundary-check` specifically to avoid bash dependency.

4. **No platform-specific file permissions without guards.**
   - ❌ `fs.chmodSync(path, 0o755)` unguarded — fails silently or misleadingly on Windows (NTFS has no POSIX permission model).
   - ✅ Wrap in a platform check:
     ```js
     if (process.platform !== 'win32') {
       try { fs.chmodSync(path, 0o755); } catch { /* ignore */ }
     }
     ```
   - The existing `chmodSafe()` helper in `project-claude/install.cjs` is a reference implementation.

5. **No CRLF vs LF surprises.**
   - Use `\n` literals in code. Let git handle line-ending normalization via `.gitattributes`.
   - Tests that assert on file contents must strip or normalize line endings:
     ```js
     expect(content.replace(/\r\n/g, '\n')).toBe(expected);
     ```

6. **Locale-independent number and date formatting.**
   - ❌ `n.toLocaleString()` without a locale arg — picks up the system locale, produces different output on different machines.
   - ✅ `n.toLocaleString('en-US')` or `new Intl.NumberFormat('en-US').format(n)`.

7. **Path separator normalization when comparing paths.**
   - If your code receives a path from an untrusted source and compares it to a literal, normalize both sides:
     ```js
     const normalized = input.replace(/\\/g, '/');
     if (normalized.includes('.planning/')) { ... }
     ```
   - `path.normalize()` and `path.posix` / `path.win32` are also useful.

### Soft rules

- **Test your change on at least one platform.** Tell us in the PR body which one. If you only tested on Linux, say so — don't claim universal support you didn't verify.
- **If you can't test a platform, mark the PR as such** and ask a maintainer to test before merge.
- **Add a POSIX-only or Windows-only skip** for tests that genuinely cannot run on the other platform, using Vitest's `describe.skipIf(process.platform === 'win32', ...)` or equivalent. Don't delete platform-specific tests — gate them.

---

## Scope discipline: one concern per PR

A good pull request does **one thing**. Reviewers can evaluate it quickly, bisect can pinpoint regressions, and partial cherry-picks are unnecessary.

A bad pull request bundles three unrelated fixes together. Reviewers have to mentally separate them, and if one of the three has a blocking issue, the other two get held up with it.

### Concrete guidance

- **Windows compatibility fix and an unrelated crash fix** → two PRs, even if you found them in the same session.
- **Adding a feature and refactoring adjacent code** → two PRs. Open the refactor first; rebase the feature onto the refactor after it merges.
- **Fixing multiple instances of the same bug** → one PR is fine, as long as they're the same bug.
- **Renaming a function across 50 files** → one PR. This is one concern ("rename X to Y"), just mechanically repeated.

### When in doubt

If you're not sure whether to split, open an issue first and ask. A 30-second comment from a maintainer is cheaper than a 3-day review cycle on a PR that turns out to need splitting.

---

## Before you submit: local checks

Run these on your feature branch before pushing. The PR will get these same checks in review, so catching problems locally saves a round-trip.

```sh
# TypeScript typecheck (fast — do this after every meaningful change)
npx tsc --noEmit

# Full test suite (Vitest, 21,298 tests — takes a few minutes)
npm test

# Build
npm run build

# Rust backend (only if you touched src-tauri/)
cd src-tauri && cargo check --lib

# Dry-run the Claude config installer (only if you touched project-claude/)
node project-claude/install.cjs --dry-run
```

### Minimum bar for a PR

- `npx tsc --noEmit` is clean (zero errors)
- `npm test` is clean for suites you touched
- If you touched Rust, `cargo check` is clean
- Conventional Commits format on every commit message

### Nice-to-have

- `npm test` is clean for the *full* suite, not just the files you touched
- `cargo test` for Rust changes (slower than `cargo check`)
- Manual smoke test on a fresh clone if your change affects install or bootstrap

---

## What not to commit

These patterns are either gitignored, machine-specific, or sensitive. Don't add them to your PR.

| Path / pattern | Why |
|---|---|
| `.planning/` | GSD project state, gitignored by design. Never commit. |
| `.env`, `.env.*`, `credentials.json`, any secrets | Sensitive. Use `.env.example` for templates. |
| `node_modules/`, `target/`, `dist/`, `build/` | Build artifacts, regeneratable. |
| Absolute paths from your machine (e.g., `/home/<you>/`, `C:/Users/<you>/`) in committed config | Breaks every other contributor. |
| Large binary files (video, audio, raw datasets) | Use Git LFS or an out-of-tree storage strategy. Ask a maintainer. |
| Generated documentation or release notes from a script | These live under `docs/release-notes/` and are only committed by release tooling. |
| `.DS_Store`, `Thumbs.db`, `*.swp` | OS/editor cruft. Add to `.gitignore` if your tool creates them. |

If you accidentally stage one of these, `git reset HEAD <path>` un-stages it. If you've already committed it, use `git rm --cached <path>` and commit the removal.

---

## Code of conduct

Be respectful. Be constructive. Assume the person on the other side of the PR is trying to do good work.

Review comments are about the code, not the person. If a reviewer asks for a change, they're not criticizing your skill — they're trying to get the codebase into shape. If you disagree, push back with reasoning; disagreements in the technical review are fine and often lead to better outcomes than silent compliance.

If something in a review feels off, say so. If something in a contribution feels off, say so kindly.

Build cool things.

---

## Questions?

Open a discussion on GitHub, or file an issue tagged `question`. If you're a first-time contributor and something in this document is unclear, that's a doc bug — please tell us so we can fix it.
