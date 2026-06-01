# v1.49.937 — Lessons

No new manifest lesson. This ship is an application of an already-codified discipline plus a carried-forward candidate.

- **#10427 (failure-mode contracts: silent-vs-loud)** — applied to a wire-serialization fix. The defect was a load-bearing compute result (`eigen`) failing loudly (the client threw) because of a missing encoder. The fix preserves the loud-failure property: it makes eigen's own output explicitly JSON-safe at the source rather than installing a blanket `json.dumps` `default=` encoder that would silently encode any future genuinely-unexpected complex value. The discriminator: a forensic/observability surface may swallow; a load-bearing result must not be silently coerced into a plausible-but-unintended shape.

## Carried-forward observation candidate

- **Force-cast to a uniform dtype to stabilize a union-prone wire contract.** When a serialization fix maps a numeric payload to a richer JSON shape (`{re, im}`), and the underlying library returns *input-dependent* dtypes (scipy `eig` yields complex eigenvalues but sometimes real-dtype eigenvectors), encode element-wise only after force-casting the whole array to the widest dtype. Otherwise the consuming type is an unstable union (`Complex[]` vs `number[][]`) that varies with the input. Cost is a uniform shape (real values carry `im: 0`); benefit is a stable, predictable TS type. First instance here; a second occurrence in another op would promote it.

- **A gated live test is not CI coverage — pair it with an ungated static drift-guard.** The two new live eigen oracle cases prove the wire end-to-end but skip in CI (no Python `mcp` server). The CI-running assertion of the `{re, im}` contract is the static `normalize.test` `EIGEN_CPU` fixture (a verbatim capture of real server output). When the only runtime guard is gated, add a server-free fixture-based guard so the contract regresses loudly in CI, not just locally.
