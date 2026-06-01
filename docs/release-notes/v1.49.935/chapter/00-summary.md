# v1.49.935 — Summary

## The ship

CF4b + CF4c of the v929 carry-forward campaign. The `numerical-analysis` example skill becomes the **first shipped skill to declare a `coprocessor:` block** (`[algebrus, statos]`), giving the default-on math-coprocessor activation stage its first declared consumer. Two tests prove it; CF4c records the `algebrus.eigen` CPU-only-by-design verdict. Zero `src/` runtime change.

## What the consumer proves

1. **Always-on unit test** — reads the real shipped SKILL.md and round-trips its frontmatter through the production `extractCoprocessorRaw` -> `parseCoprocessorSpec` chain (`{required:['algebrus','statos']}`). Runs under `npm test`/CI; mutation-proven (drop `statos` -> red).

2. **Gated live integration test** — drives the real SKILL.md through `createCoprocessorStage` -> `activateCoprocessor` -> the live Python MCP server (declared chips reachable + enabled), then `det`/`gemm`/`solve`/`describe`/`regression` against closed-form oracles, asserting `['gpu','cpu']`-membership rather than a pinned device (this box GPU-routes `gemm`).

## CF4c — the eigen verdict

`algebrus.eigen` is **INTENTIONALLY DIFFERENT ROLE** (CPU-only by design, #10411): it delegates unconditionally to the CPU oracle, is hard-listed in `cpu_fallback`, and is never promoted to the GPU even when cuSOLVER is present — unlike `solve`/`svd`. Do not add a GPU eigen path. Recorded at the op site (`PACKAGE.md` + `chipset.yaml`).

A **separate** defect surfaced during recon and was deferred (CF4d): `eigen` errors on every MCP-client call because `scipy.linalg.eig` returns a `complex` dtype the server's `json.dumps` can't serialize. Orthogonal to the GPU question; fixing it changes eigen's result contract, so it earns its own ship.

## The teeth

The unit test is mutation-proven (dropping a declared chip reds the round-trip). The live test asserts closed-form values (det=6, gemm=[[19,22],[43,50]], describe std=sqrt(2), regression r^2=1), not just success. A recon-first Workflow probe-confirmed every fixture shape before authoring; a 3-lens adversarial-verify Workflow caught and fixed an honesty overclaim (declared-vs-runtime consumer) before commit.

## Scope discipline

One augmented skill, two new test files, three doc edits, zero `src/` runtime change. The eigen wire fix is explicitly deferred (CF4d). Counter-cadence unchanged at 20; NASA degree unchanged at 1.178; manifest unchanged at 150.
