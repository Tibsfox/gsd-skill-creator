# 99 — Context: v1.49.718 Engine State Tables

## Engine state at v1.49.718 close

| Metric | Value |
|---|---|
| NASA degree | 1.168 (UNCHANGED) |
| MUS register | 1.120 (UNCHANGED) |
| ELC register | 1.120 (UNCHANGED) |
| SPS register | #117 Mountain Goat (UNCHANGED) |
| TRS register | pack-42 K_42=561 (UNCHANGED) |
| Canonical-layout gate | 169/169 canonical |
| Substrate-era missions with full canonical sibling files | 3 of 51 (v1.118 + v1.119 + v1.120) |
| Lesson #10408 candidate obs count | obs#3 cumulative |

## Operational metrics

| Component | Files | Tool uses |
|---|---|---|
| v1.120 sibling files rebuild | 13 | 32 (sub-agent) |
| Release notes | 5 | ~5 (orchestrator) |

## Sub-agent tool-use convergence

| Mission | Tool uses | Notes |
|---|---|---|
| v1.118 (v1.49.716) | 36 | High water — no in-campaign template available |
| v1.119 (v1.49.717) | 28 | Low water — direct v1.118 template available |
| v1.120 (v1.49.718) | 32 | Convergence point — v1.118 + v1.119 templates available |

Pattern suggests ~30-35 tool uses per rebuild as the stable budget.
