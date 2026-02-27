# v1.49.5 Lessons Learned — Project Filesystem Reorganization

## LLIS Format Entries

### LL-495-01: Linux Conventions as Structural Contracts
**Category:** What Worked Well
**Observation:** Following FHS 3.0 and XDG Base Directory Specification conventions means package managers (dpkg, rpm), desktop environments (GNOME, KDE), and systemd integrate with zero custom glue code.
**Recommendation:** For any project targeting Linux distribution, adopt the Alacritty extra/ model (man pages, completions, desktop entries, systemd units) from day one. The upfront cost is low; the integration payoff is high.

### LL-495-02: Additive Before Destructive Wave Ordering
**Category:** What Worked Well
**Observation:** Wave planning correctly placed additive work (creating extra/, packaging/, xdg.ts) in Wave 1 and destructive moves (directory consolidation) in Wave 2. No import breakage occurred during creation phases because the new files existed before any old files moved.
**Recommendation:** Always schedule file/directory creation before file/directory moves in wave planning. This prevents broken imports during the transition period.

### LL-495-03: Single Orchestrator for Mechanical Work
**Category:** What Worked Well
**Observation:** A single gsd-orchestrator agent completed all 17 plans across 8 phases in one context window (~14 minutes wall clock). Multi-agent parallelism would have added coordination overhead without benefit for this type of mechanical, template-driven work.
**Recommendation:** Reserve multi-agent teams for milestones with complex judgment calls. For milestones dominated by file moves, template creation, and reference updates, a single orchestrator is more efficient.

### LL-495-04: VTM Mission Packages as Zero-Overhead Planning
**Category:** What Worked Well
**Observation:** The 13-file vision-to-mission package contained sufficient detail for the orchestrator to execute without any additional research or clarification. This is the ninth consecutive milestone consuming VTM output directly.
**Recommendation:** Continue investing in mission package quality. The time spent in vision-to-mission pays back 5-10x during execution by eliminating planning pauses.

### LL-495-05: Aspirational Targets vs. Achievable Targets
**Category:** What Could Be Improved
**Observation:** The vision document specified "<=18 visible root directories" but the achieved count was 21 visible (26 total). Some directories (node_modules/, dist/, infra/) could not be eliminated without breaking the build system or losing organizational clarity.
**Recommendation:** When setting reduction targets, enumerate the directories that genuinely cannot move (build artifacts, tool-required directories) and subtract them from the target. Set the achievable floor, not the aspirational ceiling.

### LL-495-06: Phase Artifact Completeness
**Category:** What Could Be Improved
**Observation:** The gsd-orchestrator agent completed all work but only created formal SUMMARY.md files for 3 of 8 phases. The gsd-tools `roadmap analyze` command reported 0% progress because it checks for PLAN.md/SUMMARY.md files per phase.
**Recommendation:** Either enforce SUMMARY.md creation in the orchestrator's execution loop, or update gsd-tools to also check git commits as evidence of phase completion.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Adopt Alacritty extra/ model for Linux integration from day one | High |
| 2 | Schedule additive work before destructive moves in wave plans | High |
| 3 | Use single orchestrator for mechanical milestones (<=17 plans) | Medium |
| 4 | Set achievable targets by enumerating immovable directories first | Medium |
| 5 | Fix gsd-tools to detect completion from git commits, not just SUMMARY.md | Low |

## Mission Phase Assessment

| Phase | Assessment | Notes |
|-------|-----------|-------|
| 460 Audit & Design | Excellent | DESIGN.md and moves.json provided clear source of truth |
| 461 Linux Integration | Excellent | All 10 LINUX requirements met |
| 462 Packaging | Excellent | Both Debian and RPM definitions validated |
| 463 Root Cleanup | Excellent | All 7 ROOT requirements met |
| 464 Consolidation | Excellent | All 10 CONS requirements met |
| 465 XDG Compliance | Excellent | All 6 XDG requirements met with 37 tests |
| 466 References | Excellent | Zero stale paths after sweep |
| 467 Verification | Excellent | All 6 VER requirements met, 19,222 tests green |
