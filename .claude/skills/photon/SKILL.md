---
name: photon
description: >
  Layer 0 DSP measurement protocol. Fires single-quantum measurements along defined
  paths (file, git state, directory tree, test suite), computes SHA-256 fingerprints,
  and returns binary echoes: same or different. No reasoning, no repair, no payload
  beyond signal and hash. ~50-120 tokens per firing. Use this skill whenever: verifying
  file/tree state before commits, checking for drift between operations, establishing
  measurement baselines, canary checks on test suites.
user-invocable: false
---

# Photon

## Philosophy

Photon is Layer 0 of the DSP error correction stack — below hooks (L1), checkpoint assertions (L2), and quick-scan (L3). It answers one question: "did this thing change?" at minimal cost.

The concept maps to physics: single quantum, fastest mover, single shot along a path, returns only echoes (presence/absence of difference). A photon carries no payload — just the signal.

---

## Path Types (PHOT-01)

| Type | Target | Operation | Use Case |
|------|--------|-----------|----------|
| `file` | Absolute file path | `readFile(target)` | Single file fingerprint |
| `glob` | Directory path | Sorted file listing | Pattern-matched file set |
| `git-status` | Repo directory | `git status --porcelain` | Working tree state |
| `git-hash` | Repo directory | `git rev-parse HEAD` | Commit pointer |
| `test-suite` | Shell command | Execute, hash output | Test canary |
| `tree` | Directory path | Sorted recursive listing | Directory structure |

Each path type maps to exactly one read operation. No path type performs writes.

---

## Firing Sequence (PHOT-02)

1. **Parse** — Validate path against PhotonPathSchema (Zod)
2. **Read** — Execute the single read operation for the path type
3. **Hash** — SHA-256 of the content string
4. **Compare** — Hash vs expectedHash
5. **Echo** — Return `{ signal, hash, pathType, target, timestamp }`

If `expectedHash` is null, this is a baseline measurement. Signal is `same` and the actual hash is returned for future comparison.

If the path is unreachable (file missing, command fails), hash is null and signal is `different`. Absence IS difference.

---

## Echo Protocol (PHOT-03)

Every firing returns exactly one echo:

```
{ signal: 'same' | 'different', hash: string | null, pathType, target, timestamp }
```

- `same` — content hash matches expected hash (or baseline measurement)
- `different` — content hash does not match, OR path is unreachable
- `null` hash — path was unreachable (file missing, command failed, directory gone)

No additional data. No explanations. No recommendations. The echo is the complete response.

---

## Token Budget (PHOT-04)

| Component | Tokens |
|-----------|--------|
| Path parsing + validation | ~5-10 |
| Read operation | ~10-30 |
| Hash computation | ~5 |
| Comparison + echo | ~10-20 |
| Schema validation | ~10-15 |
| **Total per firing** | **~50-120** |

Batch firings scale linearly: N paths = N × (50-120) tokens.

Compare to quick-scan (Layer 3): 300-600 tokens per commit. Photon is 3-6x cheaper per measurement.

---

## Use Cases

- **Pre-commit fingerprint** — Fire on source files before commit, compare after. Did the commit change what was expected?
- **Drift guard** — Fire on config files between operations. Has anything moved?
- **Test canary** — Fire on test suite output. Did tests change their behavior?
- **Tree watch** — Fire on directory trees. Were files added or removed?
- **Baseline capture** — Fire with null expectedHash to establish initial state.

---

## Anti-Patterns

- **No chaining** — Do not use one photon's echo to decide whether to fire another. Each firing is independent.
- **No content analysis** — Photon does not read, interpret, or analyze content. It hashes and compares.
- **No reasoning on echoes** — The consumer of echoes decides what to do. Photon only measures.
- **No repair** — Photon does not fix differences. It reports them.
- **No aggregation** — Use PhotonBatch for multiple measurements. Do not manually aggregate echoes.

---

## Auto-Activation

Photon activates when:
- Establishing measurement baselines for files, trees, or git state
- Checking for drift between sequential operations
- Verifying state before/after commits
- Running lightweight canary checks

Does not activate during planning, documentation, or conversational tasks.
