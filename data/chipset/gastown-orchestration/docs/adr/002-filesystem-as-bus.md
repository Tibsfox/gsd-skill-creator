# ADR-002: Filesystem as Communication Bus

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Project maintainers
**Relates to:** communication section of gastown-orchestration.yaml, state-manager.ts

## Context

Multi-agent orchestration requires inter-agent communication. Gastown implements five communication channels (mail, nudge, hook, handoff, seance) using a combination of filesystem operations and tmux session injection. GSD needs to choose a communication substrate for its chipset implementation.

Options considered:

1. **tmux injection** (Gastown's nudge/handoff approach) -- Send text directly to agent terminal sessions
2. **In-memory message queue** -- Use an IPC mechanism (pipes, sockets, shared memory)
3. **Database-backed messaging** -- Use Gastown's Dolt database for message persistence
4. **Filesystem-based messaging** -- All communication through JSON files in a shared state directory

## Decision

All inter-agent communication goes through the filesystem. Every message, hook state, nudge signal, and merge request is a JSON file in the shared state directory.

## Rationale

**Inspectability.** Filesystem state is trivially inspectable. Anyone can `cat state/hooks/polecat-a1b2c.json` to see what an agent is working on. No special tools needed for debugging. In hardware terms, every register and bus transaction is visible through a logic analyzer.

**Debuggability.** When something goes wrong, the state directory is a complete snapshot of the system. Files can be diffed, grepped, and traced. Contrast with tmux injection where messages are ephemeral and disappear from the session buffer, or in-memory queues where state is lost on crash.

**Crash recovery.** Atomic writes (temp file, fsync, rename) guarantee that every file is either the complete old value or the complete new value. A crashed agent's state is fully reconstructable from the filesystem. No journal replay, no transaction log, no quorum protocol.

**Git compatibility.** JSON files with sorted keys produce deterministic output that diffs cleanly in git. The entire state directory can be committed for versioned snapshots. This is not possible with tmux sessions or in-memory queues.

**No tmux dependency.** Gastown's nudge system depends on tmux for direct session injection. This limits portability to environments where tmux is available and creates a hard dependency on a specific terminal multiplexer. Filesystem operations work everywhere -- local machines, CI runners, containers, cloud sandboxes.

**Simplicity.** File read/write is the lowest common denominator of all computing environments. No additional dependencies, no daemon processes, no network configuration. The bus is the directory.

## Consequences

### Positive

- Zero external dependencies for communication
- Complete observability of all agent state via filesystem inspection
- Crash-recoverable state without transaction management
- Git-friendly deterministic output for version control
- Works in any environment that has a filesystem (which is all of them)
- State persists across agent restarts, context resets, and session boundaries

### Negative

- Higher latency than in-memory communication (disk I/O vs memory access)
- No built-in pub/sub or event notification -- agents must poll for changes
- Filesystem watchers (inotify) could improve responsiveness but add complexity
- File-per-message can create many small files in high-throughput scenarios
- No built-in ordering guarantee across multiple writers without additional coordination

### Mitigations

- **Latency:** For the current scale (1-30 agents), filesystem latency is negligible compared to LLM inference time. An agent waiting 10ms for a file read while the LLM takes 2-30 seconds to respond is not a bottleneck.
- **Polling:** The hook system is inherently pull-based (agents check their hook file). This matches the filesystem model naturally.
- **File count:** State files are cleaned up through the done-retirement pipeline. Completed work items transition to `merged` and can be archived.
- **Ordering:** The refinery processes merges sequentially by design. Where ordering matters, it is enforced by the processing agent, not the bus.
