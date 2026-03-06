# Gastown Integration Guide

## What This Is

This directory contains comprehensive documentation for integrating [steveyegge/gastown](https://github.com/steveyegge/gastown) with gsd-skill-creator. Gastown is a Go-based multi-agent workspace orchestration system. gsd-skill-creator absorbs Gastown's coordination patterns as a deployable **chipset** — a declarative configuration that teaches Claude Code (and other AI runtimes) how to orchestrate multiple agents using Gastown's empirically-tested patterns.

**Gastown is not a dependency.** It is an external project whose patterns have been extracted, translated, and encoded as skills, types, and configuration within gsd-skill-creator. You do not need Gastown installed to use the chipset. But if you *do* run Gastown alongside gsd-skill-creator, these documents explain how they interoperate and — critically — where the trust boundaries lie.

## Documents

| Document | Audience | Purpose |
|----------|----------|---------|
| [01-architecture-overview.md](01-architecture-overview.md) | Everyone | What Gastown is, what the chipset is, how they relate |
| [02-concept-mapping.md](02-concept-mapping.md) | Everyone | Complete translation table: Gastown terms → GSD terms |
| [03-trust-boundary.md](03-trust-boundary.md) | Everyone | Security model, data isolation, what never crosses the boundary |
| [04-chipset-setup.md](04-chipset-setup.md) | Operators | Step-by-step: loading, validating, and activating the chipset |
| [05-agent-topology.md](05-agent-topology.md) | Operators | Agent roles, lifecycle, topology configuration |
| [06-communication-channels.md](06-communication-channels.md) | Operators | Mail, nudge, hook, handoff — how agents talk |
| [07-dispatch-and-retirement.md](07-dispatch-and-retirement.md) | Operators | The sling dispatch pipeline and done retirement pipeline |
| [08-upstream-intelligence.md](08-upstream-intelligence.md) | Operators | Tracking Gastown releases, validating changes, safe absorption |
| [09-multi-instance.md](09-multi-instance.md) | Advanced | Running multiple Gastown chipsets for different projects |
| [10-gsd-milestone-workflow.md](10-gsd-milestone-workflow.md) | Builders | Using GSD milestones to build with Gastown orchestration |

## Quick Start

If you just want to get running:

1. Read [01-architecture-overview.md](01-architecture-overview.md) to understand the model
2. Read [03-trust-boundary.md](03-trust-boundary.md) to understand the security model
3. Follow [04-chipset-setup.md](04-chipset-setup.md) to activate the chipset
4. Use [10-gsd-milestone-workflow.md](10-gsd-milestone-workflow.md) to start building

## Key Principle

**gsd-skill-creator is your private workspace. Gastown is an external system.** The chipset is the interface between them. All data flowing from Gastown into your workspace passes through validation gates. No personal data, API keys, or private planning artifacts ever flow outward through Gastown channels. This boundary is non-negotiable and enforced at the skill level.
