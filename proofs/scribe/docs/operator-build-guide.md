# Operator build guide

Step-by-step instructions for building the SCRIBE round-trip proof
companion from a clean machine.

## Prerequisites

- Linux, macOS, or Windows-with-WSL (WSL recommended on Windows)
- ~2 GB free disk space (Mathlib + dependencies)
- ~30 minutes for the first `lake update`
- Network access to GitHub (for Mathlib clone)

## Step 1 — Install elan (Lean toolchain manager)

```bash
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y
source $HOME/.elan/env   # add to your shell rc for persistence
```

Verify:

```bash
elan --version            # should print a version string
elan toolchain list       # initially empty; `lake build` will populate
```

## Step 2 — Install the project's pinned Lean

`elan` reads `lean-toolchain` automatically. From the repo root:

```bash
cd proofs/scribe
elan show                 # should report `leanprover/lean4:v4.15.0` as the active toolchain
                          # (will install if not already cached; ~1 minute download)
```

## Step 3 — Resolve dependencies (one-time)

```bash
lake update
```

What this does:
- Clones <https://github.com/leanprover-community/mathlib4.git> at tag `v4.15.0`
- Resolves Mathlib's transitive deps (Aesop, Qq, ProofWidgets, batteries, etc.)
- Writes concrete commit SHAs to `lake-manifest.json`

Expected duration: 10-30 minutes (Mathlib is ~500 MB after clone).

After success:

```bash
git status                # should show modified lake-manifest.json
git diff lake-manifest.json
git add lake-manifest.json
git commit -m "build(proofs): populate lake-manifest after lake update"
```

The committed lockfile is what gives downstream operators reproducible
builds; without it, every clone re-resolves dependencies.

## Step 4 — Build (expect `sorry` warnings)

```bash
lake build
```

Expected output:

```
Building ScribeRoundTrip.Basic
Building ScribeRoundTrip.ToyAst
Building ScribeRoundTrip.Render
warning: ScribeRoundTrip/Render.lean:NN:NN: declaration uses 'sorry'
Building ScribeRoundTrip.Parse
warning: ScribeRoundTrip/Parse.lean:NN:NN: declaration uses 'sorry'
Building ScribeRoundTrip.Section21
warning: ScribeRoundTrip/Section21.lean:NN:NN: declaration uses 'sorry'
... (multiple warnings; ~9 total) ...
Build completed successfully (with warnings).
```

The build *succeeding* means:
- All theorem statements are well-typed
- All inductive types are well-formed
- Mathlib imports resolve correctly
- Dependencies between modules (Section23 imports Section21+Section22)
  are correctly ordered

The `sorry` warnings are EXPECTED at this stage. Each one corresponds
to a proof obligation in `docs/proof-obligations.md`. Filling them is
the proof-fill stage of CAP-047.

## Step 5 — Edit in your IDE

Recommended IDE: VS Code with the **lean4** extension by `leanprover`.

```bash
code .                    # from proofs/scribe
```

The Lean InfoView panel (Ctrl+Shift+Enter on a tactic step) shows the
current proof state, which is the operator's main feedback loop when
filling `sorry`s.

## Step 6 — (Future) Wire into pre-tag-gate

When proof obligations are sufficiently filled (specifically: P-RENDER-1,
P-RENDER-2, P-PARSE-1, P1, and at least one example like `add_roundtrips`),
the build can be added to `tools/pre-tag-gate.sh` as step 9:

```bash
# step 9 (proposed): SCRIBE proof companion build
if command -v lake >/dev/null 2>&1; then
  ( cd proofs/scribe && lake build )
else
  echo "WARN: lake not installed; skipping SCRIBE proof companion build"
fi
```

Per Doc 08 §4 §"CI integration via lake build", the build is fast enough
(~1 minute incremental) for pre-tag-gate inclusion. Until then, leave
this commented out.

**Override env var (when added):** `SC_SKIP_LEAN_GATE=1` (emergency only —
the fix is to either fill the breaking proof or accept the new `sorry`).

## Troubleshooting

### "elan: command not found"

`elan-init.sh` modifies your shell rc; reload your shell or run
`source $HOME/.elan/env` manually.

### "error: failed to download Mathlib"

Network or GitHub-rate-limit issue. Retry `lake update` after waiting
a few minutes. If persistent, try a different network or use a
GitHub access token via `LEAN_GITHUB_TOKEN`.

### "out of memory during build"

Mathlib's elaborator is RAM-hungry. Recommended: 8 GB RAM minimum;
16 GB if you're going to interactively edit large proofs.

### `lake build` succeeds but no `sorry` warnings appear

Check that the `lakefile.lean` `lean_lib` target picks up your files:

```lean
@[default_target]
lean_lib «ScribeRoundTrip» where
  globs := #[.submodules `ScribeRoundTrip]
```

If files aren't being compiled, the glob is wrong; check that all
`.lean` files are under `ScribeRoundTrip/` (not at the package root).

### "unknown declaration 'List.mergeSort'" or similar Mathlib symbols missing

You may need to add explicit imports; the scaffold imports
`ScribeRoundTrip.Basic/ToyAst/...` but does NOT yet pull in Mathlib's
`List.Sort` etc. When filling P4, add at the top of `Section21.lean`:

```lean
import Mathlib.Data.List.Sort
import Mathlib.Data.List.Count
```

(See `docs/mathlib-deps.md` for the per-obligation import list.)
