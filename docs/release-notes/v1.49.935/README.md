---
title: "v1.49.935 — CF4b: first coprocessor: skill consumer + CF4c algebrus.eigen verdict"
version: v1.49.935
date: 2026-06-01
summary: >
  CF4b + CF4c of the v929 carry-forward campaign. numerical-analysis becomes the
  FIRST shipped skill to declare a `coprocessor:` block (`[algebrus, statos]`),
  giving the long-dormant default-on coprocessor activation stage its first
  declared consumer. Proven two ways: an always-on unit test that round-trips the
  shipped frontmatter through the real extract -> parse chain, and a gated live
  integration test that drives the real SKILL.md through the activation pipeline
  against the live MCP server plus closed-form oracle checks. CF4c records the
  algebrus.eigen INTENTIONALLY-DIFFERENT (CPU-only by design) verdict at the op
  site; a separate eigen complex-serialization wire defect was discovered and
  deferred (CF4d). No src/ runtime change.
tags: [coprocessor, cf4b, cf4c, codify, verify-axis, skill-consumer, "#10411", eigen]
---

# v1.49.935 — CF4b: first `coprocessor:` skill consumer + CF4c eigen verdict

**Shipped:** 2026-06-01

One-line: the `numerical-analysis` example skill declares `coprocessor: [algebrus, statos]` — the first shipped consumer of the math-coprocessor chipset — proven by an always-on frontmatter round-trip test and a gated live-server integration test; CF4c records the `algebrus.eigen` CPU-only-by-design verdict.

## Why this ship

CF4b of the v929 carry-forward campaign asked for a *real* `coprocessor:` skill consumer. The math coprocessor (`src/coprocessor/` <-> the Python MCP server at `coprocessors/math/`) had a typed client, a default-on activation hook, and a live server — but **no shipped skill declared the `coprocessor:` frontmatter that drives it** (doubly dormant). `numerical-analysis` is the domain-perfect host: its content (numerical linear algebra, regression, conditioning) maps directly onto the `algebrus` and `statos` chips. CF4c folds in the `algebrus.eigen` interface-conformance verdict.

## What shipped (no src/ runtime change)

- **`examples/skills/math/numerical-analysis/SKILL.md`** — declares `coprocessor: [algebrus, statos]`, flips `modified: true`, and adds a "Coprocessor Acceleration" section documenting the integration contract *honestly*: the pre-warm stage runs under `SkillApplicator.apply()` and the tests, not the shipped `invoke` CLI.
- **`src/coprocessor/__tests__/numerical-analysis-coprocessor.test.ts`** (3, always-on) — reads the real shipped SKILL.md and round-trips its frontmatter through the production `extractCoprocessorRaw` -> `parseCoprocessorSpec` chain, asserting `{required:['algebrus','statos']}`. Mutation-proven (dropping `statos` reds the round-trip).
- **`src/coprocessor/__tests__/numerical-analysis-coprocessor.integration.test.ts`** (6, gated `COPROCESSOR_LIVE_TESTS=1`) — drives the real SKILL.md through `createCoprocessorStage` -> `activateCoprocessor` -> the live server (declared chips reachable + enabled), then checks `det`/`gemm`/`solve`/`describe`/`regression` against closed-form oracles with `['gpu','cpu']`-membership (never a pinned device).
- **CF4c verdict** in `coprocessors/math/PACKAGE.md` + `chipset.yaml`: `algebrus.eigen` is INTENTIONALLY DIFFERENT ROLE (CPU-only by design, #10411) — do not add a GPU eigen path. Plus the discovered, deferred complex-serialization wire defect (CF4d).
- Docs: `docs/cartridge/CHIPSET-TAXONOMY.md` consumer pointer + `examples/CHANGELOG.md` entry.

## Verification

- Unit 3/3 (mutation-proven), live integration 6/6 against the real MCP server (RTX 4060 Ti; `gemm` GPU-routed, others CPU — hence membership not equality). The gated test skips cleanly with the env var unset, so it is invisible to the gate and CI.
- `npm run build` exit 0; full `src/coprocessor/` dir 42 passed / 0 failed.
- A recon-first Workflow reconciled a documented tension about `eigen` (two memory claims, both true at different layers) via a live probe; a 3-lens adversarial-verify Workflow caught a real honesty overclaim (the docs implied automatic session pre-warm — corrected to *declared* consumer) before commit.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward codify/verify work). Manifest **150** (no new lesson; an instance of #10411's 3-way verdict + a carried-forward candidate on declared-vs-runtime consumers). Sixth shipped item of the v929 carry-forward campaign. Remaining: CF4a (staged cargo CI lane); CF4d (the deferred eigen wire-serialization fix).
