---
name: bootstrap-guide
version: 1.0.0
description: GSD-OS bootstrap sequence — Phase 0 security infrastructure and Phase 1 service startup
triggers:
  - bootstrap
  - phase 0
  - security bootstrap
  - ssh key
  - sandbox
applies_to:
  - scripts/security/bootstrap-phase0.sh
  - scripts/security/phase0-helpers.sh
  - scripts/security/generate-sandbox-profile.sh
  - scripts/security/run-in-sandbox.sh
---

# Bootstrap Guide

## Overview

GSD-OS bootstrap runs in phases. Phase 0 activates security infrastructure. Phase 1 connects Claude. Phase 0 must complete successfully before Phase 1 can start.

## Phase 0: Security Bootstrap

Before Claude connects, the security infrastructure activates in 6 steps:

1. **Sandbox dependencies** — bubblewrap (Linux) or Seatbelt (macOS) verified. Missing deps trigger guided install (apt/dnf/brew).
2. **SSH keys** — Existing keys verified with correct permissions (600 private, 644 public). No key: offered ed25519 generation.
3. **Sandbox profile** — OS-level isolation profile generated for project directory. Written to `.planning/security/sandbox-profile.json`.
4. **Credential proxy** — API keys and SSH agent forwarded through proxy. Domain allowlist initialized with defaults if not present.
5. **Sandbox activated** — `verify-sandbox.sh` runs inside the sandbox to confirm isolation. If verification fails, **bootstrap halts unconditionally** (no bypass).
6. **Security LED** — Shield indicator goes green on taskbar. IPC event emitted to `.planning/events/security.jsonl`.

Phase 0 must complete before Phase 1. The security LED is always the first LED to light up.

## Magic Level Output

| Magic Level | Phase 0 Output |
|-------------|---------------|
| 1 | Silent. Shield LED goes green. Errors still show. |
| 2 | "Security systems online." |
| 3 | "Sandbox configured. Proxy running. SSH keys verified. Security LED green." |
| 4 | Each step logged with status. Sandbox verification results shown. |
| 5 | Full diagnostic — profile details, proxy socket path, SSH agent PID, domain allowlist. |

## Script Reference

- `scripts/security/bootstrap-phase0.sh` — Main Phase 0 entry point
- `scripts/security/phase0-helpers.sh` — Logging and prompt helpers (sourced by bootstrap-phase0.sh)
- `scripts/security/generate-sandbox-profile.sh` — Generates sandbox profile via Phase 368 Rust binary
- `scripts/security/run-in-sandbox.sh` — Dispatches to bwrap (Linux) or sandbox-exec (macOS)

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GSD_MAGIC_LEVEL` | 3 | Controls output verbosity |
| `SSH_REMOTE_CONTROL` | unset | Set to "1" for Remote Control sessions |
| `SSH_AUTH_SOCK` | - | SSH agent socket (forwarded in Remote Control) |

## Remote Control Sessions

When `SSH_REMOTE_CONTROL=1`, Phase 0 skips local ssh-agent startup and requires `SSH_AUTH_SOCK` to be set and valid. SSH agent forwarding must be configured in the SSH client before connecting.

## Default Domain Allowlist

If `.planning/security/domain-allowlist.json` does not exist, Phase 0 creates it with:
- `api.anthropic.com` — Anthropic API (x-api-key header injection)
- `github.com` — Git push via SSH agent forwarding
- `registry.npmjs.org` — npm package installation (bearer token)

## Failure Modes

| Failure | Behavior |
|---------|---------|
| Sandbox dependency missing | Guided install message + halt if install declined |
| SSH key missing (user declines gen) | Continues without SSH key (proxy SSH auth unavailable) |
| Sandbox profile generation fails | Exit 1 |
| Credential proxy health check timeout | Exit 1 after 5 seconds |
| Sandbox verification fails | Exit 1 — **no bypass** (BST-07) |
| Remote Control: SSH_AUTH_SOCK missing | Exit 1 with guidance |
