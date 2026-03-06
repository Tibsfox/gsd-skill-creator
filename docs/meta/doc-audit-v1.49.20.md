# Documentation Audit: v1.49.20

**Audit date:** 2026-03-06
**Audited by:** doc-linter agent, Phase 462
**Total findings:** 22 (1 HIGH, 10 MEDIUM, 11 LOW)
**Resolved in v1.49.20:** 6
**Resolved in v1.49.20.1:** 16
**Open:** 0

## Summary

Phase 462 performed a comprehensive documentation audit across 158+ markdown files. Of the 22 findings identified, 6 were resolved during the v1.49.20 documentation consolidation milestone. The remaining 16 are tracked here for future resolution.

## Findings

| ID | Severity | File | Finding | Status | Resolved In |
|----|----------|------|---------|--------|-------------|
| DOCS-H01 | HIGH | GETTING-STARTED.md:207 | Wrong GitHub URL (pointed to non-existent repo) | RESOLVED | v1.49.20 |
| DOCS-M01 | MEDIUM | about.md:184-193 | Stale metrics (42 milestones, should be 65) | RESOLVED | v1.49.20.1 |
| DOCS-M02 | MEDIUM | index.md:43 | Stale milestone count (32 milestones, should be 65) | RESOLVED | v1.49.20.1 |
| DOCS-M03 | MEDIUM | CORE-CONCEPTS.md | 20+ milestones behind, missing DACP/chipsets/muses | RESOLVED | v1.49.20 |
| DOCS-M04 | MEDIUM | HOW-IT-WORKS.md | 20+ milestones behind, missing wave execution | RESOLVED | v1.49.20 |
| DOCS-M05 | MEDIUM | FEATURES.md | Missing capabilities from v1.49.13-19 | RESOLVED | v1.49.20 |
| DOCS-M06 | MEDIUM | RELEASE-HISTORY.md | Missing phase/plan counts for v1.49.15-19 | RESOLVED | v1.49.20 |
| DOCS-M07 | MEDIUM | README.md | Only described Amiga chipset, missing Gastown | RESOLVED | v1.49.20 |
| DOCS-M08 | MEDIUM | RELEASE-NOTES-v1.8.1.md:163-168 | Stale package name (dynamic-skill-creator) | RESOLVED | v1.49.20.1 |
| DOCS-M09 | MEDIUM | GETTING-STARTED.md:5,60 | Stale version output (1.2.0) and "New in v1.4" annotation | RESOLVED | v1.49.20.1 |
| DOCS-M10 | MEDIUM | GSD_and_Skill-Creator_Overview.md | Scope describes pre-v1.49 capabilities | RESOLVED | v1.49.20.1 |
| DOCS-L01 | LOW | docs/framework/ (10 files) | Placeholder text referencing "Phase 329 — WordPress Migration" | RESOLVED | v1.49.20.1 |
| DOCS-L02 | LOW | docs/foundations/ (4 files) | Placeholder text referencing "Phase 328 — Gateway Documents" | RESOLVED | v1.49.20.1 |
| DOCS-L03 | LOW | docs/principles/ (5 files) | Placeholder text referencing "Phase 328" | RESOLVED | v1.49.20.1 |
| DOCS-L04 | LOW | docs/community/ (4 files) | Placeholder text referencing "Phase 332 — Improvement Cycle" | RESOLVED | v1.49.20.1 |
| DOCS-L05 | LOW | docs/templates/ (5 files) | Placeholder text referencing "Phase 330 — Template Extraction" | RESOLVED | v1.49.20.1 |
| DOCS-L06 | LOW | docs/filesystem-contracts.md | No supersession notice (canonical is meta/filesystem-contracts.md) | RESOLVED | v1.49.20.1 |
| DOCS-L07 | LOW | docs/gastown-integration/ | No navigation links from core docs | RESOLVED | v1.49.20 |
| DOCS-L08 | LOW | docs/FEATURES.md | Missing post-v1.49.12 capabilities | RESOLVED | v1.49.20 |
| DOCS-L09 | LOW | docs/GSD_Orchestrator_Guide.md | No cross-reference to Mayor-coordinator pattern | RESOLVED | v1.49.20.1 |
| DOCS-L10 | LOW | docs/index.md:151-153 | Describes active WordPress migration (migration is inactive) | RESOLVED | v1.49.20.1 |
| DOCS-L11 | LOW | docs/runbooks/, operations-manual/, sysadmin-guide/ | Missing educational context headers (v1.33 OpenStack pack content) | RESOLVED | v1.49.20.1 |

## Resolution Guidelines

- **HIGH** findings should be resolved in the next milestone
- **MEDIUM** findings should be resolved within 2 milestones
- **LOW** findings are tracked for opportunistic resolution

## Notes

- DOCS-L01 through DOCS-L05 share a common pattern: placeholder content from planned but not-yet-executed documentation phases. These could be batch-resolved in a single documentation pass.
- DOCS-M01 and DOCS-M02 both involve stale milestone counts and could be resolved together.
- DOCS-L08 overlaps with DOCS-M05 (both reference FEATURES.md); DOCS-L08 was resolved as part of the DOCS-M05 fix.
