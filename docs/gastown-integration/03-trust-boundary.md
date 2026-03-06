# 03 — Trust Boundary & Security Model

## The Fundamental Rule

**gsd-skill-creator is your private workspace. Gastown is an external system.**

This is not a suggestion. It is an architectural constraint enforced at every layer. The relationship between gsd-skill-creator and Gastown is analogous to the relationship between your local machine and an external API: you consume data from it, you validate everything, and you never send it your secrets.

## Threat Model

### What Gastown Is

Gastown is an open-source Go project maintained by Steve Yegge. It is well-designed and well-intentioned. But from gsd-skill-creator's perspective, it is:

1. **External code** — maintained by someone outside your trust boundary
2. **A moving target** — actively developed, patterns may change without notice
3. **A potential vector** — if compromised (supply chain attack, malicious PR), upstream changes could attempt to exfiltrate data, inject malicious skills, or alter agent behavior

This is the same threat model that applies to any upstream dependency. The fact that Gastown is useful doesn't make it trusted. **Useful and trusted are different properties.**

### Lessons from OpenClaw

The OpenClaw incident demonstrated that:

- Open-source projects can be compromised through seemingly benign PRs
- Automated dependency updates can pull in malicious code
- Trust-by-default is a vulnerability, not a feature
- The cost of validation is always less than the cost of remediation

gsd-skill-creator applies these lessons to Gastown integration:

- **No automatic code execution** from upstream changes
- **Every absorption goes through validation**
- **The chipset is a snapshot, not a live link**
- **Skills are reviewed before activation**

## What Stays Inside (Never Crosses the Boundary)

These artifacts are **private to gsd-skill-creator** and must never be transmitted through Gastown communication channels, stored in Gastown-managed state, or referenced in Gastown-facing configuration:

| Category | Examples | Why |
|----------|----------|-----|
| **API keys & credentials** | `ANTHROPIC_API_KEY`, OAuth tokens, SSH keys | Obvious — credential theft |
| **Planning artifacts** | `.planning/` directory, ROADMAP.md, STATE.md | Business strategy, unshipped features |
| **Personal information** | User identity, email, real name, location | Privacy |
| **Private repository URLs** | Internal GitHub/GitLab URLs | Infrastructure exposure |
| **Memory files** | `.claude/projects/*/memory/` | Session context, user preferences |
| **Hook configurations** | `.claude/settings.json`, `.claude/hooks/` | Reveals automation surface |
| **Muse content** | `data/chipset/muses/` | Creative/strategic direction |
| **Local model configs** | Ollama endpoints, local inference settings | Infrastructure topology |
| **Billing/cost data** | Token usage, API costs, budget limits | Financial information |

### Enforcement Mechanisms

1. **Gitignore**: `.planning/`, `.claude/`, and memory files are gitignored — they never enter version control
2. **CI guard**: A CI check blocks any commit that includes `.planning/` files
3. **Skill boundaries**: Every Gastown skill has explicit "NEVER" clauses about data handling
4. **State isolation**: Gastown state lives in `.chipset/state/` — separate from `.planning/`
5. **Communication validation**: The `mail-async` skill validates message content before writing

## What Crosses the Boundary (Inbound)

Data flowing **from Gastown into gsd-skill-creator** must pass through validation:

| Data Type | Source | Validation | Gate |
|-----------|--------|------------|------|
| **Chipset YAML updates** | Upstream repo | Schema validation + token budget + topology check | `validateChipset()` |
| **Pattern changes** | Upstream commits | Diff review, semantic analysis | Upstream intelligence skill |
| **New skill definitions** | Upstream patterns | Security review, boundary check | Human approval required |
| **Agent messages** (mail/nudge) | Gastown agents | Schema validation, content sanitization | Mail validator |
| **Work item descriptions** | Gastown beads | Content validation, no executable payloads | Sling dispatch stage 1 |
| **Merge requests** | Gastown refinery | Standard git review, test gates | Refinery pipeline stages 2-3 |

### Validation Rules for Inbound Data

1. **No executable content in messages.** Mail and nudge payloads are text/JSON only. No shell commands, no script tags, no eval-able strings.
2. **No path traversal.** File paths in state must be relative to `.chipset/state/` and validated against traversal (`../`).
3. **No credential-shaped strings.** Content is scanned for patterns matching API keys, tokens, and passwords. Flagged content is quarantined.
4. **Schema conformance.** All structured data (YAML, JSON) must validate against the published schema before acceptance.
5. **Size limits.** Individual messages capped at 64KB. State files capped at 1MB. Prevents resource exhaustion.

## What Crosses the Boundary (Outbound)

Data flowing **from gsd-skill-creator to Gastown** is minimal and controlled:

| Data Type | Destination | Content | Sanitized? |
|-----------|-------------|---------|------------|
| **Work status updates** | Gastown state | Status enum only (`open`, `hooked`, etc.) | Yes — enum validated |
| **Completion signals** | Gastown mail | Bead ID + status + branch name | Yes — no context |
| **Health responses** | Gastown nudge | Acknowledgment + timestamp | Yes — no content |
| **Merge results** | Gastown refinery | Pass/fail + branch ref | Yes — no diff content |

### What Never Goes Out

- No planning context (phase names, milestone descriptions, requirements)
- No code content (diffs, file contents, test results)
- No error details (stack traces, log lines, environment variables)
- No user identity or session information
- No model names, API endpoints, or infrastructure details

## Multi-Gastown Trust

When running multiple Gastown instances (see [09-multi-instance.md](09-multi-instance.md)):

- **Each instance gets its own state directory** (`.chipset/state/{instance-id}/`)
- **Instances cannot read each other's state** (directory isolation)
- **Cross-instance communication goes through gsd-skill-creator** (never directly)
- **Each instance is independently validated** against the chipset schema
- **Compromise of one instance does not affect others** (blast radius containment)

## The Security Checklist

Before activating a Gastown chipset or absorbing upstream changes:

- [ ] Chipset YAML validates against schema (`validateChipset()`)
- [ ] Token budget is within limits (≤1.0)
- [ ] Agent topology has exactly 1 mayor, ≥1 polecat, ≥1 witness
- [ ] No skill references unknown or untrusted skill names
- [ ] Communication channels use only approved types (mail, nudge, hook, handoff)
- [ ] State directory is within `.chipset/state/` (no path traversal)
- [ ] No environment variables or credentials appear in configuration
- [ ] Upstream diff has been reviewed for suspicious patterns
- [ ] New skills have been security-reviewed before activation
- [ ] Runtime HAL detection does not expose infrastructure details
