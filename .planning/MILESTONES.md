# Milestones

## v1.49.8 Cooking With Claude (Shipped: 2026-03-01)

**Phases completed:** 11 phases, 45 plans | **Commits:** 89 | **Files:** 207 changed (+24,541 lines) | **New code:** 17,964 LOC TypeScript in `.college/`

**Key accomplishments:**
- Rosetta Core translation engine with 9 language panels (Python, C++, Java, Lisp, Pascal, Fortran, Perl, ALGOL, Unison) spanning systems, heritage, and frontier families
- College Structure with progressive disclosure (summary <3K, active <12K, deep 50K+), department/wing/concept hierarchy, try-sessions, and cross-reference resolution
- Calibration Engine with universal Observe→Compare→Adjust→Record feedback loop, domain-pluggable models, bounded 20% adjustment, delta persistence, and profile synthesis
- Cooking Department: 7 wings (food science, thermodynamics, nutrition, technique, baking science, food safety, home economics) with 30+ concepts grounded in peer-reviewed science
- Safety Warden with three enforcement modes (annotate/gate/redirect), absolute temperature floors (poultry 165F, ground meat 160F, whole cuts 145F), allergen flagging, danger zone tracking
- Mathematics Department seeded from "The Space Between" with 7 concepts positioned on the Complex Plane of Experience
- 650 tests passing across 49 files, 94.78% statement coverage, all 14 safety-critical tests passing with zero tolerance
- Integration bridge: observation pipeline, token budget enforcement (2-5% ceiling), chipset adapter for panel-to-engine routing
- Foxfood: system built itself — GSD workflow mapped to Rosetta Core, development mapped to Calibration, project organization mapped to College Structure

---

## v1.49.7 Optional tmux with Graceful Degradation (Shipped: 2026-03-01)

**Key accomplishments:**
- Make tmux fully optional across entire stack (Rust, TypeScript, shell scripts, packaging)
- Cross-platform detection: `command -v` on Unix, `where.exe` on Windows
- Desktop terminal falls back to raw PTY when tmux unavailable
- Bootstrap flow handles optional service failures gracefully
- Fix FileWatcher deps from [Tmux] to [] (corrects Rust/TS divergence)
- 5 Rust tests updated for corrected graph structure

## v1.49.6 Cross-Platform Hardening & Native Dep Cleanup (Shipped: 2026-03-01)

**Key accomplishments:**
- Pin onnxruntime-node to 1.20.1 (pre-mutex-bug), override sharp to empty package
- Replace `natural` with hand-rolled TF-IDF and Naive Bayes (~250 lines total, zero deps)
- Add `fastest-levenshtein` (746 bytes) for fuzzy matching
- Shell compatibility fixes for macOS Bash 3.2
- Cherry-pick fresh-clone test fixes from PR #21

## v1.49.5 Project Filesystem Reorganization (Shipped: 2026-02-27)

**Key accomplishments:**
- Project filesystem reorganization

---

**4 milestones shipped (v1.49.5-v1.49.8) on this branch**
