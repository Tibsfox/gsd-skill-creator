# Gastown Origin: Runtime HAL

## Where This Comes From

The runtime-hal skill is a direct adaptation of Gastown's `internal/runtime/runtime.go` package. In the original Go codebase, this package handles runtime detection and provider abstraction so that the rest of the Gastown binary (convoy management, sling dispatch, mail delivery, GUPP enforcement) operates identically regardless of whether it is running inside Claude Code, Codex, or an unknown environment.

## Chipset Mapping: BIOS/UEFI Firmware

In the chipset hardware metaphor, the Runtime HAL maps to the **BIOS/UEFI firmware layer**. Real firmware runs before the operating system loads: it probes the hardware bus, identifies which peripherals are present (GPU, NIC, storage controllers), initializes them, and exposes a uniform interface through ACPI tables and hardware abstraction. The operating system never needs to know the specific hardware vendor -- it reads the abstraction layer.

The Runtime HAL does the same for AI coding assistant runtimes:

| Firmware Function | HAL Function |
|-------------------|-------------|
| Hardware probe (PCI bus scan) | Provider detection cascade (env -> filesystem -> process) |
| Peripheral capability table | Provider capabilities matrix |
| Boot device selection | Startup strategy selection |
| Interrupt routing table | GUPP strategy and nudge interval configuration |
| Fallback to safe mode | Unknown provider with polling defaults |

## Key Gastown Source Files

| File | What the HAL Adapts |
|------|-------------------|
| `internal/runtime/runtime.go` | Provider detection, capability exposure, strategy selection |
| `internal/runtime/claude.go` | Claude Code provider: hook injection, CLAUDE_SESSION_ID detection |
| `internal/runtime/codex.go` | Codex provider: startup fallback via gt prime, GT_SESSION_ID |
| `internal/runtime/fallback.go` | Generic provider: polling strategy, graceful degradation |
| `internal/cmd/prime.go` | Uses runtime detection to select startup injection method |

## The Detection Cascade

Gastown's `runtime.go` implements a detection cascade that prioritizes the most specific signal:

1. **GT_RUNTIME env var** -- explicit override, used in CI and containers
2. **CLAUDE_SESSION_ID env var** -- Claude Code sets this for active sessions
3. **Filesystem probe** -- `.claude/settings.json` indicates Claude Code workspace
4. **Process tree scan** -- look for known runtime binaries in parent processes
5. **Fallback** -- assume unknown, select polling, degrade gracefully

This cascade exists because no single detection method is reliable across all deployment contexts. Environment variables can be unset in containers, filesystem paths can differ in CI, and process trees can be opaque behind orchestrators. The cascade ensures at least one signal is found, and `unknown` is always a safe terminal state.

## What Changed From Gastown

1. **Language:** Go interfaces to TypeScript type declarations
2. **Detection execution:** Go function calls to documented detection steps (skills are documentation, not executable code)
3. **Provider files:** Separate `.go` files per provider become separate `.md` files in `providers/`
4. **Capabilities:** Cursor added as a fourth named provider (Gastown only knew Claude and Codex)
5. **GUPP strategies:** `prompt_preamble` added for Cursor's command palette integration
6. **Configuration:** Go struct fields become environment variable overrides (`GT_STALL_THRESHOLD`, etc.)
7. **Scope:** Gastown's runtime package is imported by many Go packages; the HAL skill is consumed by other skills through its documented interface

## Design Decision: Detection Caching

Gastown's `runtime.go` runs detection once and caches the result in a package-level variable. The HAL follows the same pattern: detection runs once at activation time and the result is reused for the lifetime of the session. Re-detection mid-session would be incorrect (the runtime cannot change while an agent is active) and expensive (process tree scanning is not free).

## Design Decision: No Runtime-Specific Code Outside HAL

In Gastown, any code that needs to know the runtime imports `internal/runtime` and calls its interface methods. No other package checks `CLAUDE_SESSION_ID` or probes the process tree directly. The HAL enforces the same boundary: no skill outside `runtime-hal` should perform runtime detection. This ensures that adding a new provider requires changes only in the HAL and its provider docs, not across the entire chipset.
