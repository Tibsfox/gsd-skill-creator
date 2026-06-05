# v1.49.983 — Retrospective

## What went right

- **Recon reframed two of the four follow-ons before any code.** A read-only understand pass found the live retention corpus had *moved* since the v982 ship — a real `too_lax` event accrued from a session-end sweep — so item 1 flipped from "blocked" to "the guard now mechanically passes a 26:1 corpus." That turned item 1 from a no-op into a concrete hardening, and the operator chose to enforce the discipline in code (Tier 2) rather than rely on judgment.
- **The dry-run probe earned its keep.** Running the operator-gated dry-run (proposed 90→91 on `meanObservation −0.926`) produced the exact evidence that justified the balance/depth safeguard — a textbook "measure before you change the threshold."
- **GAP-7 closed cleanly with a deterministic tool.** Encoding the §3 discipline as pure regex counting (no LLM) made the check reproducible and gate-able, converting an #10461 un-gated manual checklist into a standing WARN-first surface.
- **The drift-guards did their job.** The first full-suite run surfaced 8 failures — all of them the gate's own self-consistency / parity / meta drift-guards "failing loudly until the author updates code and guard in lockstep." Following the single-count-owner convention (new v983 meta-test owns the count; v965 made agnostic) resolved them without weakening any guard.

## What went well in process

- **Understand → build → adversarial-review → ship, with the operator gating each fork.** Four genuine decisions (dry-run+harden, gate-WARN-first, delete-key for item 4, ship-5.3-first) were surfaced via a single question round before building.
- **Adversarial review found only low-severity issues, and they were fixed in code, not explained away** (per the ship-review discipline). The review reproduced every BLOCKER/MAJOR hypothesis and refuted it with evidence — the kind of negative result that builds confidence.
- A recon claim ("NASA pages are committed") was **falsified during build** (`www/` and `.planning/` are gitignored) and the gate step was honestly scoped as a local pre-tag advisory.

## What to watch

- **The trip-vocab gate step is a post-hoc local proxy.** It scans the already-generated current-degree page, which skips in clean CI; the real value is the on-demand `--mode brief`/`--mode prompt` CLI run before a dispatch. If a future ship wants a CI-enforced surface, it needs a committed artifact to scan.
- **Substring + single-token matching is intentionally permissive** (it mirrors the canonical §3.1 regex). False positives surface as WARNs only. Multi-word phrase matching was made whitespace-tolerant (`\s+`); whole-word anchoring remains a deferred option if noise appears.
- **Retention is bidirectional-capable, not balanced.** The corpus is still 26:1; Tier 2 will keep refusing `--apply` until ≥3 `too_lax` at ≥20% share accrue. Do not relax the guard or run a recurring tick before then.
- Item 4 (config migrator for explicit-`false` 5.1b installs) is the next follow-on, sequenced after this ship.
