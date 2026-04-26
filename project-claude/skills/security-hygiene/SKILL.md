---
name: security-hygiene
description: >
  Security hygiene for GSD's self-modifying skill and agent system.
  Use this skill whenever: creating, editing, or deleting skill files
  (.claude/skills/, .claude/commands/), modifying agent definitions
  (.claude/agents/), working with YAML configuration or chipset files,
  handling JSONL observation data (.planning/patterns/), processing
  community-contributed skills or chipsets, any file path operations
  that could involve user input, or when installing/updating
  project-claude configuration. Also activates for discussions about
  skill-creator security, trust models, or content hygiene.
user-invocable: true
version: 1.0.0
format: 2025-10-02
triggers:
  - "for discussions about skill-creator security, trust models, or content hygiene"
updated: 2026-04-25
status: ACTIVE
---

# Security Hygiene

## Security Philosophy

This is a self-modifying system. Security should work like a helpful companion, not an adversarial checkpoint — zen and the art of programming. Tools protect by default, guide by suggestion, block only when there is a real reason.

## Threat Surface

| Vector | Risk | Check |
|---|---|---|
| **Path traversal** | Skill names used in file paths could escape directory | Sanitize all skill names: alphanumeric, hyphens, underscores only. Reject `..`, `/`, `\`. |
| **YAML deserialization** | Unsafe YAML loading executes arbitrary code | Use safe parsing only (`yaml.safe_load` or equivalent). Never `yaml.load` with untrusted input. |
| **Data poisoning** | Append-only JSONL could contain injected entries | Validate entries on read: check schema, reject oversized entries, verify timestamps are monotonic. |
| **Permission bypass** | Automated workflows might skip user confirmation | **Never bypass user confirmation for skill application**, even in YOLO mode. YOLO applies to GSD workflow commands, not skill modifications. |
| **Cross-project leakage** | User-level skills might expose project-specific patterns | User-level skills must be generic. Project-specific patterns stay in project-level skills. |
| **Observation privacy** | Pattern data could leak into shared repos | `.planning/patterns/` must be in `.gitignore`. Verify on any git operation. |

## Content Hygiene Rules

When processing community-contributed content (skills, chipsets, LoRA adapters):
- Check for embedded commands or script execution
- Verify YAML does not contain unsafe tags (`!!python/object`, etc.)
- Validate that skill descriptions match their actual content
- Quarantine new community content for review before activation

## Privacy Tier Taxonomy (4-tier, OOPS-08-P03)

All telemetry, observation data, and skill artefacts are classified into one
of four privacy tiers. Telemetry writers MUST stamp every record with its
tier and MUST NOT mix tiers in a single sink.

| Tier | Name | Description | Examples |
|------|------|-------------|----------|
| **A** | **Public** | No PII, no proprietary content; safe to publish externally. | Open-source skill descriptions, public release notes, anonymised aggregate metrics. |
| **B** | **Internal** | Non-PII operational data; safe to share within the project team. | Phase activity counts, commit-type distributions, hook firing rates, build-time profiles. |
| **C** | **Sensitive** | PII, credentials, authentication tokens, individual session transcripts. | `.env` contents, OAuth tokens, individual user prompts, raw conversation logs. |
| **D** | **Restricted** | Regulated data, proprietary IP, Fox Companies content. | `.planning/fox-companies/` artefacts, `wasteland/` content, customer-identifiable records, anything subject to legal hold. |

Defaults and enforcement:

- New telemetry writers default to **Tier B** unless an explicit tier label
  is supplied at construction.
- **Tier C** data MUST be encrypted at rest and MUST be excluded from any
  artefact published outside the local repository (no `git push` of files
  containing Tier C content; no FTP sync; no inclusion in release notes).
- **Tier D** data MUST never leave the `.planning/` tree or
  `wasteland/` branch. Surface alignments in conversation only; never
  commit Tier D content to a public-facing path.
- Mixed-tier sinks are FORBIDDEN — a writer that mixes Tier A and Tier C
  records loses the ability to safely publish the Tier A subset.

Referenced by C5 W3.P6 tool-tracker (telemetry writer wiring) and the
post-tool-use observation hook.

## The Staging Layer Principle

"The user's ability to work should be reasonable. Security should also be reasonable. We strive for the clean intersection." Do not over-alert. Do not create friction for normal operations. Surface findings only when something genuinely warrants attention.
