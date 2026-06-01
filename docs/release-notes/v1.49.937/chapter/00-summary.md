# v1.49.937 — Summary

## The ship

CF4d of the v929 carry-forward campaign — the deferred eigen wire fix discovered during the v935 recon, and the campaign's **final** item. `algebrus.eigen` now returns over the typed MCP wire instead of throwing.

## The bug

`scipy.linalg.eig` always returns a complex dtype (even for real eigenvalues — `[(2+0j), (3+0j)]`), and the server's `json.dumps` had no complex encoder, so it raised `TypeError: Object of type complex is not JSON serializable`. The blanket handler rewrapped that as `{error, backend:"error"}`, and `client.ts normalizeToolResult` correctly threw. The dispatch path is pure delegation (`algebrus.eigen` chip → `cpu.eigen`), so the whole wire is fixed at the CPU fallback. No GPU eigen path exists — eigen is intentionally CPU-only (CF4c verdict).

## The fix

`cpu.eigen` force-casts **both** eigenvalues and eigenvectors to `np.complex128`, then emits JSON-safe `{re, im}` pairs via a `_to_complex_pairs` helper. The force-cast is load-bearing: eigenvectors of a symmetric input come back real-dtype, so without it the consuming type would be an unstable union. The TS client exposes a stable `EigenResult { eigenvalues: Complex[]; eigenvectors: Complex[][] }`.

## The design choice

The fix is at the data source, **not** a blanket `default=` encoder at the `json.dumps` boundary. A blanket encoder would silently encode any future genuinely-unexpected complex value instead of failing loudly — an anti-pattern per the failure-mode-contracts discipline (#10427). Eigen's output is made explicitly wire-safe (like `svd`/`fft` already are); other complex-producing ops, if any appear, still fail loudly.

## The teeth

- Live integration 8/8 against the **real** Python MCP server (real diagonal + complex rotation cases).
- **Mutation-proven:** reverting the encoder reds exactly the two live eigen tests with the verbatim original error; perturbing the `EIGEN_CPU` fixture reds only the drift-guard.
- The CI-safe `EIGEN_CPU` drift-guard in `normalize.test.ts` is the only ungated runtime assertion of the wire shape (the live test is gated/skipped in CI), so the contract has CI coverage beyond the type-level `tsc` check.

## Scope discipline

Nine files; no `src/` runtime behavior beyond the coprocessor client's typed surface; no GPU path; `det`/`inv` untouched (already wire-safe). Counter-cadence unchanged at 20; NASA 1.178; manifest 150. This ship **completes** the v929 carry-forward campaign.
