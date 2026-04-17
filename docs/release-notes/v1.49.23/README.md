# v1.49.23 — Unison Language & Math Co-Processor Completion

**Released:** 2026-03-08
**Scope:** math co-processor GPU completion (cuSOLVER + cuFFT + cuRAND + SYMBEX JIT via NVRTC) plus Unison Language deep research study and derived translation chipset, dashboard math panel wired to live MCP data, and the complete PNW research collection (CAS + COL + ECO + GDN) with the Aspen creative-writing muse
**Branch:** dev → main
**Tag:** v1.49.23 (2026-03-08)
**Commits:** v1.49.22..v1.49.23 (8 commits, head `186bc838e`)
**Files changed:** 115 (+45,100 LOC, approx.)
**Predecessor:** v1.49.22 — PNW Research Series
**Successor:** v1.49.24
**Classification:** feature — closes the math co-processor's GPU surface, delivers the Unison research + chipset pipeline end-to-end, and lands the PNW research archive
**Verification:** 48 new SYMBEX JIT tests (30 translator unit + 18 GPU execution) · 16 new dashboard math-bridge tests · 77 math-coprocessor tests passing after cuSOLVER/cuFFT/cuRAND wiring · 6-agent wave pipeline produced 28,693 words across 8 Unison research documents with a full verification pass (5/5 safety gates from verified research flow into the chipset) · PNW archive staged and zipped into `www/PNW.zip` for deployment

## Summary

**The math co-processor's GPU surface closed on this release.** Before v1.49.23, only cuBLAS had a real GPU backend in `math-coprocessor/`; cuSOLVER, cuFFT, and cuRAND were stubs that fell back to CPU. Commit `12c195ca9` (`feat(math-coprocessor): add cuSOLVER, cuFFT, and cuRAND GPU paths`) wired real acceleration for solve (LU factorization), SVD, eigendecomposition, FFT/IFFT, and Monte Carlo across three chips — `chips/algebrus.py` (+234 lines), `chips/fourier.py` (+181 lines), `chips/statos.py` (+100 lines) — with a 64-bit pointer-truncation fix in the `gpu.py` memcpy wrappers (+79 lines) that had been silently corrupting large-buffer transfers. The benchmark harness (`benchmarks.py`, +241 lines) picked up GPU solve, GPU FFT, and GPU Monte Carlo timing paths alongside the existing cuBLAS benchmarks, so the five-chip architecture can now be measured against a single yardstick. Seventy-seven tests passed after the wiring landed. The "5 chips for 5 NVIDIA libraries" architecture is no longer an aspirational diagram; at v1.49.23 it is a running system.

**SYMBEX JIT compiler via NVRTC is the most architecturally significant piece in the release.** Commit `66ec33fbc` (`feat(math-coprocessor): add SYMBEX JIT compiler via NVRTC`) delivered a GPU-accelerated symbolic expression evaluator that parses Python expressions through the standard library `ast` module, translates the AST to CUDA C with a fourteen-function math vocabulary, compiles to PTX at first use via NVRTC, and caches the compiled kernel for later reuse. `jit.py` (343 lines, new) holds the `CudaTranslator` class plus the kernel cache and GPU launcher. `gpu.py` grew NVRTC compile bindings and CUDA driver API calls (module load, kernel launch). `chips/symbex.py` (+64 lines) adopted a GPU-first policy with CPU fallback and reports JIT state in its capabilities block. Forty-eight tests shipped with the compiler — thirty unit tests for the translator (precedence, nesting, type inference) and eighteen GPU execution tests that round-trip Python expressions through PTX and back. A small but load-bearing detail: `cudaFree(0)` is called at context init so the driver API has a runtime context to attach to; without it, the first JIT launch would fail. AST-based JIT is the right primitive for this problem because string-template approaches break on operator precedence and nested expressions the moment the user deviates from the happy path.

**The dashboard math panel went live in the same window.** Commit `b8f0da21b` (`feat(dashboard): wire math panel to live MCP co-processor data`) delivered `desktop/src/dashboard/math-bridge.ts` (217 lines) as the `MathBridge` class, plus 346 lines of tests across sixteen cases. The bridge polls `math.capabilities` through the `mcp_call_tool` IPC surface, transforms responses into `MathPanelData`, and listens for `mcp-trace` events to capture operation history in real time with per-chip op counts. Start, polling, trace handling, destroy lifecycle, and backend detection are each covered as named tests, and the module is wired into `desktop/src/dashboard/index.ts` so the existing dashboard registers the new panel at boot. The bridge is the first client of the MCP server configuration that landed in `6a4c8a8e2` (`chore(math-coprocessor): add MCP server to project config`), which registered `gsd-math-coprocessor` in `.mcp.json` with virtualenv Python and a `MATH_COPROCESSOR_CONFIG` env var for config passing. Cargo.lock also picked up the 1.49.21 version bump in `f931b3fe2` — a small housekeeping commit that kept the Rust side aligned with the TypeScript side before the final feature landing.

**Unison Language research shipped as a proper multi-agent wave study.** Commit `5553a9e60` (`feat(www): add Unison Language deep research study`) delivered seventeen files and 5,780 lines under `www/UNI/` — eight research documents across the language core, the type system and abilities, tooling and workflow, distributed computing, ecosystem and adoption, synthesis, verification, plus a shared schemas file and source index. Word count: 28,693 words, 28 cited sources. The study was produced by a six-agent wave pipeline with a full verification pass, matching the PNW study shape established in v1.49.22. The research browser uses a blue/steel theme (`style.css`, 220 lines) that distinguishes Unison from the PNW series' green/earth palette while keeping the same navigation layout so a reader moving between studies does not have to re-learn the interface. A full LaTeX mission pack (`mission.tex`, 918 lines, producing `mission.pdf`) ships alongside the research so the work is portable.

**The Unison translation chipset is derived directly from the research.** Commit `382d2c8af` (`feat(chipset): add Unison translation chipset derived from research`) delivered `data/chipset/unison-translation.yaml` (362 lines) with six skills, four agents (architect, workflow, cloud-specialist, translator), and a router-topology team. The six skills are backed by the five research modules plus synthesis, so every skill has a traceable provenance line back to a verified research document. Cross-language translation patterns cover Haskell, TypeScript, Rust, and Erlang/OTP equivalences — each pattern cites the research module that produced it. Safety gates are inherited from the verified research (5/5 PASS) rather than re-derived at chipset time, which is the right direction of information flow: research does the hard thinking, the chipset distills the output into executable skills. This is the second concrete instance of the research-to-chipset pipeline (after `PNW/ECO/research/silicon.yaml`), so two data points now support the hypothesis that deep research can produce a safe chipset without a separate safety-engineering pass.

**The PNW research collection landed as a complete archive.** Commit `91de95db8` (`feat(pnw): add complete PNW research collection and aspen muse`) is the largest in the window — seventy-seven files, 36,710 insertions — and stages four PNW studies at the project root: `PNW/CAS/` (Cascade Range biodiversity, ten research docs plus mission pack), `PNW/COL/` (Columbia Valley rainforest, eight research docs plus mission pack), `PNW/ECO/` (Living Systems taxonomy, fifteen research docs plus chipset), and `PNW/GDN/` (PNW Gardening, eight research docs plus browser). A series hub (`PNW/index.html`) cross-links the four studies with a shared style (`PNW/style.css`, 173 lines) and a series nav script (`PNW/series.js`). `www/PNW.zip` (≈1.9 MB) ships the archive in portable form alongside the staged directory so a downstream consumer can either browse in place or extract a self-contained copy. The commit also adds `data/chipset/muses/aspen.yaml` (63 lines) — the Aspen creative-writing muse — which joins the muse team on the experimental v1.50 arc. Aspen is intentionally small and scoped to creative writing; the muse expansion pattern here is "add one muse per release on the experimental branch, promote to main once the arc stabilizes," which preserves the ability to roll the addition back without touching the shipped muse team.

**Release-ledger batch-up closed the window.** Commit `186bc838e` (`docs(release-notes): add v1.49.21-23 notes with retrospectives and lessons learned`) landed release notes for v1.49.21, v1.49.22, and v1.49.23 together — 162 line insertions across six files including `README.md`, `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md`, and the three per-release directories. Batching three releases into one notes commit is the pattern established back at v1.49.15: the lesson is that release notes do not need to land in the same commit as the feature work, and coupling notes to a single anchor commit is more honest than ghost-editing history. Merge commits `27f6b4836` (dev → main) and `5336765f9` (dev merge with release notes) closed the window. The v1.49.23 original release notes were intentionally thin — forty-nine lines per file — because the window shipped immediately after the v1.49.22 PNW Research Series landing and the release-ledger entries were catching up rather than authoring in depth. This uplift pass restores the full-verbosity shape.

**The release is disproportionately architectural for its line position.** On file count (115) and insertion count (≈45,100 LOC) v1.49.23 is the largest release in the v1.49.2x sub-line, but the surface-area cost is small: most lines are in self-contained research markdown under `PNW/` and `www/UNI/`, not in the TypeScript or Rust engines. The engines picked up exactly six new code files (`jit.py`, `gpu.py`, `chips/algebrus.py` changes, `chips/fourier.py` changes, `chips/statos.py` changes, `math-bridge.ts`) with comprehensive test coverage (sixty-four new tests across SYMBEX JIT and the math bridge). The research-to-chipset pipeline at `www/UNI/` → `data/chipset/unison-translation.yaml` is the pattern the rest of 2026 will reuse; v1.49.23 is the release that proved the pattern works for a second domain after PNW ECO validated it the first time.

## Key Features

| Area | What Shipped |
|------|--------------|
| cuSOLVER GPU path | `math-coprocessor/chips/algebrus.py` (+234 lines) — LU factorization for dense solve, SVD, and eigendecomposition via NVIDIA cuSOLVER; CPU fallback preserved; 64-bit pointer fix in transfer path |
| cuFFT GPU path | `math-coprocessor/chips/fourier.py` (+181 lines) — FFT and IFFT via NVIDIA cuFFT library with configurable plan cache; CPU fallback preserved |
| cuRAND GPU path | `math-coprocessor/chips/statos.py` (+100 lines) — Monte Carlo simulation via NVIDIA cuRAND with configurable distributions; CPU fallback preserved |
| GPU driver bindings | `math-coprocessor/gpu.py` (+79 lines from cuSOLVER/cuFFT/cuRAND landing, +164 lines new from SYMBEX JIT) — NVRTC compile bindings, CUDA driver API (module load, kernel launch), memcpy wrappers with 64-bit pointer correctness |
| Benchmark expansion | `math-coprocessor/benchmarks.py` (+241 lines) — GPU solve, GPU FFT, GPU Monte Carlo timing paths alongside existing cuBLAS benchmarks |
| SYMBEX JIT compiler | `math-coprocessor/jit.py` (343 lines, new) — `CudaTranslator` covering 14 math functions, kernel cache keyed by expression hash, GPU launcher; AST-based Python → CUDA C with NVRTC runtime compilation |
| SYMBEX chip integration | `math-coprocessor/chips/symbex.py` (+64 lines) — GPU-first policy with CPU fallback, capabilities block reports JIT state |
| SYMBEX test suite | `math-coprocessor/tests/test_jit.py` (310 lines, new) — 48 tests: 30 translator unit (precedence, nesting, type inference) + 18 GPU execution (Python → PTX → result round-trip) |
| MCP server registration | `.mcp.json` (+12 lines) — `gsd-math-coprocessor` registered with virtualenv Python and `MATH_COPROCESSOR_CONFIG` env var |
| Dashboard math bridge | `desktop/src/dashboard/math-bridge.ts` (217 lines) + `math-bridge.test.ts` (346 lines, 16 tests) — polls `math.capabilities` via `mcp_call_tool`, listens for `mcp-trace`, transforms into `MathPanelData`, start/polling/destroy lifecycle |
| Dashboard wiring | `desktop/src/dashboard/index.ts` (+4 lines) — registers `MathBridge` at boot |
| Unison deep research | `www/UNI/research/` (17 files, 5,780 lines, 28,693 words, 28 sources) — language core, type system & abilities, tooling & workflow, distributed computing, ecosystem & adoption, synthesis, verification, shared schemas, source index |
| Unison mission pack | `www/UNI/mission-pack/` — `mission.tex` (918 lines), `mission.pdf`, `index.html` (302 lines) for portable distribution |
| Unison research browser | `www/UNI/` static browser — blue/steel theme (`style.css`, 220 lines), `index.html`, `mission.html`, `page.html` |
| Unison translation chipset | `data/chipset/unison-translation.yaml` (362 lines) — 6 skills, 4 agents (architect, workflow, cloud-specialist, translator), 1 team with router topology, Haskell / TypeScript / Rust / Erlang-OTP translation patterns, safety gates from verified research (5/5 PASS) |
| PNW series hub | `PNW/index.html` (300 lines) + `PNW/style.css` (173 lines) + `PNW/series.js` (38 lines) — cross-links four PNW studies with shared style |
| PNW/CAS — Cascade Range | 10 research docs (aquatic, fauna, flora, fungi, networks, publication, sources, threats, verification, zones) plus mission pack PDF |
| PNW/COL — Columbia Valley | 8 research docs (aquatic, fauna, flora, fungi, publication, schemas, synthesis, verification) plus mission pack PDF and build script |
| PNW/ECO — Living Systems | 15 research docs plus `silicon.yaml` chipset, LaTeX mission pack, fungi-index browser |
| PNW/GDN — PNW Gardening | 8 research docs (foundation, climate-microclimates, soil-management, native-plants, food-production, pest-disease-adaptation, synthesis, verification) plus mission pack |
| PNW archive | `www/PNW.zip` (≈1.9 MB) — portable self-contained copy of the four studies |
| Aspen muse | `data/chipset/muses/aspen.yaml` (63 lines) — creative-writing muse, experimental, v1.50 arc |
| Cargo.lock bump | `src-tauri/Cargo.lock` — gsd-os version to 1.49.21 |
| Release-ledger batch | `README.md`, `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md`, `docs/release-notes/v1.49.21/README.md`, `docs/release-notes/v1.49.22/README.md`, `docs/release-notes/v1.49.23/README.md` — three-release catch-up entries anchored to commit `186bc838e` |

## Retrospective

### What Worked

- **One chip per NVIDIA library was the right architectural split.** cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC have different APIs, memory models, lifecycles, and error conventions. The five-chip architecture (algebrus, arithmos, fourier, statos, symbex) maps one-to-one to those libraries, so each chip wraps exactly the surface area it can reason about without bleeding concerns into its neighbors. Shipping cuSOLVER/cuFFT/cuRAND together in `12c195ca9` showed the split was also maintenance-ergonomic: one reviewer could understand all three patches because each followed the same pattern.
- **AST-based JIT beat string-template JIT decisively.** `CudaTranslator` parses Python expressions through the standard library `ast` module, walks the tree, and emits CUDA C with correct operator precedence, correct nesting, and type inference for the fourteen supported functions. A string-template approach would have collapsed on the first parenthesized sub-expression; AST traversal handles every shape the parser accepts. Thirty unit tests on the translator and eighteen GPU execution tests passed on the first landing because the type system did the heavy lifting.
- **Research-to-chipset as a repeatable pattern is now a pattern, not a one-off.** `www/UNI/` → `data/chipset/unison-translation.yaml` is the second instance after `PNW/ECO/` → `silicon.yaml`. Both followed the same shape: six-agent wave pipeline produces research, synthesis and verification close the study, a chipset distills the verified output into skills and agents with safety gates inherited from the research rather than re-engineered. Two data points make it a pattern; one would have been an anecdote.
- **The dashboard math bridge shipped with sixteen tests and lifecycle coverage.** `start`, polling, trace handling, destroy, and backend detection are each named tests. The bridge has a `destroy` method that the dashboard calls on shutdown, and the test suite verifies the polling loop actually stops. This matters because an orphaned polling loop against a missing MCP server would spam the IPC surface; the destroy test is a safety-critical boundary test, not a cosmetic lifecycle test.
- **Batching three release notes in one commit (`186bc838e`) was more honest than ghost-editing history.** v1.49.21, v1.49.22, and v1.49.23 all got per-release directories in the same commit. This pattern, established at v1.49.15, lets release notes catch up without rewriting the commits they describe. The downside is visible in this uplift: the three entries were thin (forty-nine lines each) because the author was batching shape, not depth. The uplift pass addresses depth; the batching pattern itself is correct.
- **The 64-bit pointer fix in `gpu.py` memcpy wrappers closed a silent-corruption bug before it caused user-visible failure.** The bug was masked at small sizes because truncation to 32 bits still addressed the right page for small transfers. The fix landed alongside the cuSOLVER/cuFFT/cuRAND wiring because the new GPU paths are the first consumers that routinely move buffers large enough to trip the truncation. Finding and fixing a latent bug under the cover of a feature landing is a clean outcome.

### What Could Be Better

- **The SYMBEX kernel cache has no eviction policy.** The JIT cache in `jit.py` grows unbounded — every new expression shape adds a cached PTX kernel and keeps it. For long-running sessions or high-expression-variety workloads the cache will eventually consume more memory than the GPU can spare. An LRU eviction with a configurable high-water mark is the right fix; it did not land in v1.49.23.
- **The Unison translation chipset is reference material, not an executable translator.** `data/chipset/unison-translation.yaml` ships translation *maps* for Haskell/TypeScript/Rust/Erlang equivalences — not actual code translators. A reader looking at the chipset can learn what a Unison ability becomes in Haskell monad-transformer style, but the chipset does not compile anything. Building executable translation is a separate milestone that v1.49.23 scoped out deliberately.
- **The v1.49.23 release notes shipped thin at landing time.** Forty-nine lines per release in the batch commit is not enough density to meet A-grade on the completeness scorer. The pattern of batching release notes is correct; the depth deficit comes from treating batched notes as "short form" when they should be full-form with batching-anchor acknowledgement. This uplift pass restores the shape; future batched-notes commits should land at full depth from the start.
- **The Aspen muse is experimental with no usage evidence yet.** Aspen joins the muse team on the v1.50 experimental arc, which is the documented pattern for muse additions. The downside is that `data/chipset/muses/aspen.yaml` ships before any session has exercised it — the first usage data will only appear after v1.49.23 is in downstream hands. The experimental arc is the right mechanism, but "experimental" should be explicit in the muse manifest so consumers know to treat Aspen differently from the established muses.
- **PNW archive size bloats the repository by ≈1.9 MB for a redundant copy.** `www/PNW.zip` duplicates the four staged directories in zip form. The staged directories are browsable; the zip is portable. Keeping both costs 1.9 MB, which is small in absolute terms but large enough to be visible in `git clone` timings. A cleaner approach would generate the zip at build time rather than ship both in the repository; the current shape was expedient rather than minimal.

## Lessons Learned

- **GPU library diversity forces per-chip backends.** cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC are five NVIDIA libraries with five APIs. A single "GPU chip" abstraction would leak implementation details from the library with the most awkward API into every other chip's interface. The five-chip architecture in `math-coprocessor/chips/` accepts the complexity at the chip boundary rather than forcing it into a shared surface, and the result is that each chip is implementable and testable by a single author working on a single library's documentation.
- **AST-based JIT compilation is the right primitive for symbolic math.** String manipulation breaks the moment the user nests a parenthesized expression or uses a function that wasn't in the template library. `CudaTranslator` in `jit.py` walks the Python AST, which is the same tree the Python interpreter uses — anything the interpreter can parse, the translator can see. Operator precedence, associativity, and nested call sites are handled by the AST structure itself rather than by regex or token tricks.
- **NVRTC runtime compilation plus a kernel cache is self-contained by design.** No ahead-of-time CUDA compilation, no separate build step, no `nvcc` in the deployment environment. A user who has the NVIDIA driver and cuRAND/cuFFT/cuSOLVER available at runtime has everything the SYMBEX chip needs. The kernel cache keyed by expression hash means the compile cost is paid once per unique expression per process lifetime, which in practice amortizes to zero for workloads with repeated structure.
- **Research-to-chipset is a pattern, not a coincidence.** The same pipeline that produced `PNW/ECO/silicon.yaml` produced `data/chipset/unison-translation.yaml`: deep research documents, synthesis, verification, chipset derivation. Each of the six skills in the Unison chipset cites the research module it was distilled from, so a reviewer can audit the derivation. Safety gates inherited from verified research (5/5 PASS) flow into the chipset without a separate safety-engineering pass because the research is where the safety reasoning lived.
- **The research browser theme should differ from its sibling studies.** Unison ships blue/steel, PNW ships green/earth. The difference is not cosmetic — a reader moving between the two studies can orient on which archive they are in at a glance, without reading the URL bar. The navigation layout is intentionally shared so the reader doesn't re-learn the interface; only the palette changes. This is a small detail that pays outsized legibility dividends once the site has four or five parallel research archives.
- **Six-agent wave pipelines produce research at a sustainable rate.** 28,693 words of Unison research shipped in one window alongside the math-coprocessor GPU wiring, the dashboard bridge, and the PNW archive. Six parallel agents, each responsible for one module, is the configuration that the pipeline has been producing at consistently since v1.49.17. Any smaller and the modules can't be independent; any larger and orchestration overhead dominates.
- **Dashboard bridges should own their lifecycle, not lean on the host.** `MathBridge` has `start` and `destroy` methods and the destroy tests assert that the polling loop actually stops. A bridge that depends on process exit to stop polling is a bridge that will leak when the dashboard is torn down and rebuilt — common in hot-reload development workflows. Explicit lifecycle methods are cheap to ship and expensive to retrofit.
- **Latent bugs surface under feature landings that exercise them.** The 64-bit pointer truncation in `gpu.py` memcpy wrappers was present before v1.49.23 and undetected because the only active GPU path (cuBLAS) didn't move large enough buffers to trip the truncation. The cuSOLVER/cuFFT/cuRAND landing added the first routine consumers of large transfers and the bug surfaced immediately. Features are load-tests for the code they depend on; a feature landing is a better bug-finding vehicle than a synthetic stress test because it exercises real call patterns.
- **Batching release notes to a single anchor commit beats ghost-editing history.** `186bc838e` added v1.49.21, v1.49.22, and v1.49.23 notes together. The alternative — editing each release's commit to include its own notes — rewrites history, breaks tag pointers, and desynchronizes with any consumer that has fetched the tags already. Anchor commits are an append-only ledger entry; rewriting history is a migration. The project standardized on anchor commits at v1.49.15 and the pattern has held.
- **Experimental muse additions should follow the v1.50 arc explicitly.** Aspen joins as a creative-writing muse on an explicitly experimental branch, not as a direct integration into the main muse team. The arc pattern preserves the ability to roll the addition back by dropping the experimental muse without touching the promoted ones. "Experimental" should be a first-class attribute of the muse manifest so consumers can opt in or out; Aspen ships as experimental, and the next refinement should make that status machine-readable.
- **Portable archive distribution is worth the redundancy cost for research.** `www/PNW.zip` exists alongside the staged directories because a downstream consumer may want to distribute the research without pulling the full repository. The 1.9 MB cost is small compared to the friction of "here is a git clone instruction, but only of this subdirectory." Research archives benefit from zip-availability in a way that source code does not; the tradeoff calculus differs by artifact type.
- **Release-note depth is part of the release, not an afterthought.** The v1.49.23 notes shipped thin because the batching commit treated depth as optional. This uplift pass demonstrates the cost: the scorer rated the thin version F, and restoring full-form notes required re-reading `git log --stat`, the chapter files, and each commit body. Writing full-depth notes at landing time is cheaper than uplifting later, and the information is fresher. The rubric exists to prevent this specific deferred-cost trap.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.22](../v1.49.22/) | Predecessor — PNW Research Series; established the six-agent wave pipeline that v1.49.23 reused for Unison |
| [v1.49.21](../v1.49.21/) | Predecessor-predecessor — Image to Mission Pipeline; types-first discipline that carried through to the JIT translator schemas |
| [v1.49.20.1](../v1.49.20.1/) | Documentation Reflections; set up the release-ledger batching pattern v1.49.23 reuses |
| [v1.49.20](../v1.49.20/) | Documentation Consolidation; first pass of the consolidation work this batch continues |
| [v1.49.17](../v1.49.17/) | Types-first cartridge format discipline — precedent for the AST-based translator schemas in `jit.py` |
| [v1.49.15](../v1.49.15/) | Three-release README catch-up precedent that `186bc838e` follows |
| [v1.49.12](../v1.49.12/) | Heritage skills pack — pack-shape content that the PNW mission packs mirror |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — scaling pattern the chipset derivation inherits |
| [v1.49.9](../v1.49.9/) | "Teaching reference IS the research" pattern — directly applied by the Unison research browser |
| [v1.49.8](../v1.49.8/) | Earlier instance of absorbing source documents directly into pack content |
| [v1.49.0](../v1.49.0/) | Parent mega-release where the math-coprocessor surface first appeared |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — the `SkillPosition (theta,r)` surface the Unison chipset plugs into |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — 451 primitives across 10 domains the math co-processor extends with GPU paths |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — ASIC chipset precedent for the Unison translation chipset topology |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack-shape template the PNW research inherits |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG pattern the chipset provenance chain follows |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri shell that hosts the dashboard math panel |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop the chipset activation path extends at the Apply step |
| `math-coprocessor/jit.py` | SYMBEX JIT compiler — `CudaTranslator` + kernel cache + GPU launcher |
| `math-coprocessor/gpu.py` | NVRTC bindings + CUDA driver API + memcpy wrappers with 64-bit pointer fix |
| `math-coprocessor/chips/symbex.py` | GPU-first symbolic expression chip with CPU fallback |
| `math-coprocessor/chips/algebrus.py` | cuSOLVER GPU path for solve, SVD, eigendecomposition |
| `math-coprocessor/chips/fourier.py` | cuFFT GPU path for FFT/IFFT |
| `math-coprocessor/chips/statos.py` | cuRAND GPU path for Monte Carlo |
| `math-coprocessor/benchmarks.py` | GPU solve / FFT / Monte Carlo timing harness |
| `desktop/src/dashboard/math-bridge.ts` | MCP-wired dashboard bridge with polling + trace listener + destroy lifecycle |
| `data/chipset/unison-translation.yaml` | Six-skill, four-agent chipset derived from verified Unison research |
| `data/chipset/muses/aspen.yaml` | Experimental creative-writing muse (v1.50 arc) |
| `www/UNI/` | Unison deep research archive — 17 files, 5,780 lines, 28,693 words, 28 sources |
| `PNW/` (CAS, COL, ECO, GDN) | Complete PNW research collection staged at project root |
| `www/PNW.zip` | Portable PNW archive, ≈1.9 MB |
| `.mcp.json` | Project MCP registration for `gsd-math-coprocessor` |
| `docs/release-notes/v1.49.23/chapter/00-summary.md` | Short-form summary captured at batch-notes time |
| `docs/release-notes/v1.49.23/chapter/03-retrospective.md` | Short-form retrospective entries captured at batch-notes time |
| `docs/release-notes/v1.49.23/chapter/04-lessons.md` | Six lessons extracted at landing (classification: rule-based + LLM tiebreaker on #4) |
| `docs/release-notes/v1.49.23/chapter/99-context.md` | Release context and dedication slots (thin; populated during uplift) |

## Engine Position

v1.49.23 closes the math co-processor's GPU surface and ships the second instance of the research-to-chipset pipeline, positioning the project mid-way between v1.49.0's foundational line and the v1.50 release target three weeks later. The five-chip architecture (`algebrus`, `arithmos`, `fourier`, `statos`, `symbex`) is now a running system with real GPU backends across cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC; the dashboard panel is live against that system through a tested MCP bridge; and the Unison study + chipset pair demonstrates the research-to-chipset pipeline works outside the PNW ECO domain. Looking forward to v1.50, the remaining math-coprocessor work is not adding new backends but polishing the existing ones — the SYMBEX kernel cache needs eviction, the Aspen muse needs first-session data, and the Unison chipset maps need a follow-on "actually executable translator" milestone if cross-language translation is to become a shipped feature rather than a reference. On line metrics (115 files, ≈45,100 LOC) this is the largest release in the v1.49.2x line, but most lines are in research markdown and the engine code additions are modest and well-tested. The architectural footprint — five GPU libraries wired, JIT compiler shipped, second research-to-chipset instance — is disproportionately large for the release's window position, which matches the pattern seen at v1.49.17 (types-first cartridge format) and v1.49.21 (image-to-mission pipeline): a disproportionate number of mid-sub-line releases ship the architectural shapes that later releases extend rather than restructure.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.22..v1.49.23) | 8 |
| Files changed | 115 |
| Lines inserted (approx.) | ≈45,100 |
| New GPU library backends | 3 (cuSOLVER, cuFFT, cuRAND); NVRTC via SYMBEX JIT |
| Math-coprocessor chips with GPU path | 5 of 5 (algebrus, arithmos, fourier, statos, symbex) |
| New SYMBEX JIT tests | 48 (30 translator unit + 18 GPU execution) |
| New dashboard math-bridge tests | 16 |
| Math-coprocessor tests total (post-landing) | 77 |
| Unison research documents | 8 core + shared schemas + source index = 10 files |
| Unison research word count | 28,693 |
| Unison research sources cited | 28 |
| Unison chipset skills | 6 |
| Unison chipset agents | 4 (architect, workflow, cloud-specialist, translator) |
| Unison chipset teams | 1 (router topology) |
| Unison translation target languages | 4 (Haskell, TypeScript, Rust, Erlang/OTP) |
| Unison safety gates inherited | 5/5 PASS |
| PNW studies staged | 4 (CAS, COL, ECO, GDN) |
| PNW research docs total | 41 across four studies |
| PNW archive size | ≈1.9 MB (`www/PNW.zip`) |
| New muses | 1 (Aspen, experimental v1.50 arc) |
| Release-note entries batched | 3 (v1.49.21, v1.49.22, v1.49.23) |

## Files

- `math-coprocessor/jit.py` (343 lines, new) — `CudaTranslator`, kernel cache, GPU launcher; AST → CUDA C with NVRTC runtime compile
- `math-coprocessor/gpu.py` (+164 lines for JIT, +79 for cuSOLVER/cuFFT/cuRAND) — NVRTC bindings, CUDA driver API, memcpy wrappers with 64-bit pointer correctness
- `math-coprocessor/chips/symbex.py` (+64 lines) — GPU-first with CPU fallback; capabilities reports JIT state
- `math-coprocessor/chips/algebrus.py` (+234 lines) — cuSOLVER LU solve, SVD, eigendecomposition
- `math-coprocessor/chips/fourier.py` (+181 lines) — cuFFT FFT/IFFT with plan cache
- `math-coprocessor/chips/statos.py` (+100 lines) — cuRAND Monte Carlo with configurable distributions
- `math-coprocessor/benchmarks.py` (+241 lines) — GPU solve / FFT / Monte Carlo timing paths
- `math-coprocessor/tests/test_jit.py` (310 lines, new) — 48 tests covering translator and GPU execution
- `math-coprocessor/tests/test_integration.py` (small change, +/-1 line) — alignment with new capabilities block
- `desktop/src/dashboard/math-bridge.ts` (217 lines, new) — `MathBridge` class with polling, trace listener, destroy lifecycle
- `desktop/src/dashboard/math-bridge.test.ts` (346 lines, new) — 16 tests (start, polling, trace, destroy, backend detection)
- `desktop/src/dashboard/index.ts` (+4 lines) — registers `MathBridge` at boot
- `.mcp.json` (+12 lines) — `gsd-math-coprocessor` registration with virtualenv Python and `MATH_COPROCESSOR_CONFIG` env var
- `src-tauri/Cargo.lock` — gsd-os version bumped to 1.49.21
- `www/UNI/research/00-shared-schemas.md`, `00-source-index.md`, `00-document-template.md` — scaffolding for the Unison study (936 lines total)
- `www/UNI/research/01-language-core.md` through `05-ecosystem-adoption.md` (2,295 lines) — five core research modules
- `www/UNI/research/06-synthesis.md` (272 lines) + `07-verification.md` (331 lines) — synthesis and verification closure
- `www/UNI/index.html`, `mission.html`, `page.html`, `style.css` — static research browser, blue/steel theme
- `www/UNI/mission-pack/index.html`, `mission.tex` (918 lines), `mission.pdf` — LaTeX mission pack
- `data/chipset/unison-translation.yaml` (362 lines) — 6 skills, 4 agents, 1 team, Haskell/TypeScript/Rust/Erlang patterns, inherited 5/5 safety gates
- `PNW/CAS/` (Cascade Range) — `index.html`, `mission.html`, `page.html`, `style.css` plus 10 research docs and mission-pack PDF
- `PNW/COL/` (Columbia Valley) — `index.html`, `mission.html`, `page.html`, `style.css`, `build.sh` plus 8 research docs and mission-pack PDFs
- `PNW/ECO/` (Living Systems) — `index.html`, `mission.html`, `page.html`, `style.css` plus 15 research docs, `silicon.yaml`, `pnw-ecosystem.chipset.yaml`, LaTeX mission packs
- `PNW/GDN/` (PNW Gardening) — `README.md`, `index.html`, `mission.html`, `page.html`, `style.css` plus 8 research docs and mission-pack PDF
- `PNW/index.html` (300 lines), `PNW/style.css` (173 lines), `PNW/series.js` (38 lines) — series hub and cross-linking
- `www/PNW.zip` (≈1.9 MB) — portable archive of the four PNW studies
- `data/chipset/muses/aspen.yaml` (63 lines) — Aspen creative-writing muse, experimental v1.50 arc
- `README.md`, `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md` — release-ledger entries anchored to commit `186bc838e`

Aggregate: 115 files changed, approximately 45,100 insertions across 8 commits spanning v1.49.22..v1.49.23.
