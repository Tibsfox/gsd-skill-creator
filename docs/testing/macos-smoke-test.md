# macOS Smoke Test Procedure

Manual verification checklist for macOS compatibility. Run after any changes to shell scripts, hooks, or browser pages.

## 1. Shell Script Execution

- [ ] Run `scripts/bootstrap.sh` with `/bin/bash` (Bash 3.2)
- [ ] Run `scripts/check-test-density.sh src/` with `/bin/bash`
- [ ] Run hook scripts with `/bin/bash`
- [ ] Confirm no Bash 4.0+ features triggered (see `docs/testing/bash-compat-checklist.md`)

## 2. Hook Execution

- [ ] Configure hooks in Claude Code
- [ ] Run `validate-commit.sh` — exits 0 on valid conventional commit
- [ ] Run `build-check.sh` — exits 0 on clean build
- [ ] Verify no `shellcheck` warnings on hook scripts

## 3. PNW Browser Loading

- [ ] Open each PNW browser `index.html` via `file://` protocol
- [ ] Verify `page.html` loads and renders markdown content
- [ ] Verify TOC sidebar populates correctly
- [ ] Verify anchor links scroll to sections
- [ ] Verify section filter narrows visible content

## 4. Known macOS Gotchas

- **onnxruntime mutex crash** — pin to v1.20.1 in package.json
- **codesign requirements** — Tauri builds need valid signing identity or `--no-sign` for dev
- **Gatekeeper quarantine** — downloaded binaries need `xattr -d com.apple.quarantine <path>`
- **`/usr/bin/env` vs direct paths** — use `#!/usr/bin/env bash` for portability, never `#!/bin/bash` (NixOS, Homebrew)
- **`sed -i` syntax** — macOS `sed` requires `sed -i '' 's/...'`, GNU `sed` uses `sed -i 's/...'`
- **`find` options order** — macOS `find` is strict about option placement before expression
