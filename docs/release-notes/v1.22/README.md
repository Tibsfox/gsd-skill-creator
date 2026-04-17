# v1.22 — Minecraft Knowledge World

**Released:** 2026-02-19
**Scope:** milestone release — local cloud infrastructure, Minecraft Java Edition Knowledge World server, platform portability, Amiga emulation, chipset formalization, and operational maturity
**Branch:** dev → main
**Tag:** v1.22 (2026-02-18T16:26:28-08:00) — "Minecraft Knowledge World"
**Predecessor:** v1.21 — GSD-OS Desktop Foundation
**Successor:** v1.23 — Project AMIGA
**Classification:** milestone — 30-phase infrastructure-plus-content release that formalized the chipset model for the first time
**Phases:** 169-198 (30 phases) · **Plans:** 37 · **Requirements:** 73
**Commits:** 108 commits across the phase window (`v1.21..v1.22`); final 5 commits `2fddd2f59..d54185e6b` cover the chipset assembly and milestone archival

## Summary

**v1.22 is the release where the project's multi-agent architecture became formally specified rather than tribal.** The headline artifact is a Minecraft Java Edition Knowledge World server running on Fabric over a locally-provisioned CentOS Stream 9 VM, but the load-bearing deliverable is the chipset formalization in phases 191-194: twenty SKILL.md files, ten agent definitions, five teams, four topology types, and the first unified `minecraft-knowledge-world.yaml` configuration that maps intent through team, agent, and skill to a running action. Everything built in phases 169-190 — the PXE boot server, the kickstart pipeline, the hypervisor-agnostic VM abstraction, the Fabric server deployment, the Syncmatica mod stack, the Amiga Corner, the curated content library, the themed districts, the schematic templates — becomes the substrate that the chipset names and routes. Operational maturity in phases 195-198 then closes the loop: RCON-quiesced backups with 24/7/4 rotation, Prometheus monitoring with nine alert rules, a golden image lifecycle targeting sub-five-minute rebuilds from clone, and four operational runbooks covering server maintenance, backup and restore, monitoring, and incident response. Thirty phases, thirty-seven plans, seventy-three requirements, one hundred and eight commits — the scope is large enough to be its own project, and it shipped as one release because the phases were decomposed in a way that let every subsystem land on its own timeline without blocking the others.

**Chipset formalization converted an ad-hoc skill collection into a routed system with measurable budgets.** Before v1.22, skills and agents in this codebase were loaded by proximity — whichever file was adjacent to the current work got attention — and teams were an aspirational concept in the ROADMAP. Phase 194-01 changed that: `.chipset/minecraft-knowledge-world.yaml` assembled twenty skills with real token budgets pulled from their `infra/skills/*.md` frontmatter, wired ten agents into five teams with explicit topology metadata, mapped twenty routing rules from actual trigger intent patterns, and declared a dependency-respecting load order across seven priority levels. The total allocated budget came in at 31.5 percent, broken down as seven percent for infrastructure, seven and a half for operations, seven and a half for platform, five for Amiga, and four and a half for creative — well under the forty percent ceiling, with eight and a half percent headroom left for trigger bursts. The JSON-Schema draft-07 definition at `.chipset/schema/chipset-schema.yaml` makes the shape validatable, and the bash-only validation script at `scripts/validate-chipset.sh` runs nine independent checks (sections present, counts consistent, references resolve, dependencies acyclic, budget-under-ceiling, orphans absent) against any chipset YAML. This is the pattern every later chipset in the project inherits.

**The four topology types are engineering assertions about how teams should coordinate, not naming conventions.** Pipeline topology sequences work through an ordered chain — infra boot provisions the VM, platform abstraction wraps it, Minecraft server deploys on top. Map-reduce fans work out to parallel workers and reduces the results — useful for the platform team's hardware discovery across heterogeneous nodes. Swarm coordinates peers without a leader — the operations team's monitoring agents work this way, each watching its own slice and gossiping findings. Leader-worker directs delegated work from one coordinator — the creative team's schematic builders take tasks from a single curator. Phase 193-01 shipped three supporting YAML files that make the topologies enforceable rather than descriptive: `resource-locks.yaml` declares exclusive file ownership for each of the five teams with zero overlaps, `sync-points.yaml` lists six cross-team dependency chains with explicit execution ordering, and `message-bus.yaml` specifies the filesystem communication channels under `.planning/artifacts/`. A fix commit in the same phase — `2bc178b43` — resolved a bidirectional cycle in the inter-team links by removing `mc-platform->mc-infra` from the platform team's `outputTo` (the stage-level dependency was already captured in `sync-points.yaml`) and clearing `mc-infra.inputFrom` accordingly. The resulting graph is acyclic: infra → platform → amiga → creative → ops. Cycle checking is now part of what the validator script does.

**Hypervisor-agnostic VM provisioning turned an otherwise vendor-locked substrate into a portable one.** Phases 181-183 built a distribution abstraction layer that handles `dnf` (Fedora and CentOS), `apt` (Debian and Ubuntu), and `pacman` (Arch) under one unified package-management interface, then sat a multi-hypervisor VM abstraction on top that speaks KVM/libvirt, VMware Workstation, and VirtualBox. A container fallback handles environments that do not expose hardware virtualization extensions, so the same chipset can run on a laptop without VT-x in a constrained mode. Hardware discovery is comprehensive — CPU, memory, GPU, storage, network interface controllers, and virtualization extensions each get their own probe — so the chipset knows what it has before it tries to allocate. This layer is tedious work, but it is what makes the release's claim of "local cloud infrastructure" honest rather than aspirational: the PXE server, kickstart pipeline, and Fabric deployment all sit on top of the abstraction, and a user whose hardware happens to be Arch plus VirtualBox gets the same workflow as one on CentOS plus KVM.

**Amiga Corner with legally curated content set a precedent for every hobbyist-adjacent subsystem the project has shipped since.** Phases 184-186 integrated the FS-UAE emulator with AROS as the default ROM — AROS is the open-source Amiga-compatible operating system, which means the Corner works out of the box without requiring users to source a copyrighted Kickstart ROM from a third party. Four application profiles ship prebuilt: Deluxe Paint for pixel art, OctaMED for multi-track music, ProTracker for four-channel modules, and Personal Paint for animation. An IFF/ILBM image format converter and a MOD/MED audio format converter handle round-tripping between Amiga formats and modern equivalents. The curated fifty-item content collection is restricted entirely to public domain, Creative Commons, and explicit-freeware works — every item in the manifest at `infra/teams/amiga-content-manifest.yaml` has a verifiable license, and the legal guide at `docs/amiga-legal-guide.md` walks contributors through how to verify new additions. This rigor is what prevents the kind of quiet-liability accumulation that kills long-lived hobbyist projects.

**The themed district layout inside the Minecraft world is where infrastructure becomes pedagogy.** The four districts — Computing History, Networking, Architecture, and Creative Workshop — each map a domain the project wants learners to internalize through spatial construction rather than symbolic explanation. Ten schematic templates in the library at `infra/knowledge-world/schematics/` cover tangible builds: a visible pipeline for a guided "Visualize a Pipeline" walkthrough, a tool-evolution walkthrough tracing computing's arc, a pixel art gallery, a demo-scene exhibit for Amiga's cultural context. The curriculum pipeline at `infra/knowledge-world/curriculum/` translates educational objectives into build instructions, validation assertions, and orientation signage. The spawn area hosts a tutorial path that introduces mechanics before the districts open up. This subsystem is acknowledged in the retrospective as underspecified in its curriculum mapping — the districts exist and the schematics build, but the per-objective lesson plans are sketched rather than exhaustive — and that acknowledgment is the kind of truthful bookkeeping that lets v1.22's retrospective stay honest rather than promotional.

**Operational maturity at v1.22 is what makes the knowledge world a product rather than a demo.** RCON-quiesced backups call `/save-off` before snapshotting and `/save-on` after, so the world file is captured in a consistent state and not mid-chunk-write. The 24/7/4 rotation (twenty-four hourly, seven daily, four weekly) gives cheap coverage of short-horizon regressions and long-horizon drift without unbounded storage growth. Prometheus monitoring with nine alert rules — server unreachable, TPS below 15, player count anomalies, disk usage high, memory pressure high, backup age stale, RCON unresponsive, Fabric classloader errors, and world-save latency — gives the operator a real signal path rather than a dashboard-only view. The golden image lifecycle is the load-bearing operational claim: a clone-based rebuild runs in under five minutes, a from-scratch rebuild in under twenty. When you can rebuild infrastructure in that window, you stop being afraid of breaking it, and experimentation becomes cheap. The four runbooks — server maintenance, backup and restore, monitoring, and incident response — preserve the knowledge so the builder does not become a single point of failure.

**v1.22 set the bookkeeping precedent that every subsequent multi-subsystem release in the project inherits.** The 30-phase count was unusually large for the project at this point in its history, and the risk was always that scope would outrun discipline: requirements would drift, plans would collapse into narrative, verification would get deferred. The retrospective chapter in `chapter/03-retrospective.md` is honest about where this risk partially materialized — test counts were not reported at release time (a gap that v1.42's coverage-v8 integration later addressed at the tooling level), the Fabric/Syncmatica/Litematica third-party dependency chain was shipped without a written version-pinning policy, and the district-to-curriculum mapping stayed sketched rather than exhaustive. The retrospective does not bury these gaps; it surfaces them so the next release can plan against them. This is the pattern the v1.22 chapter files institutionalize: `chapter/00-summary.md` (navigation), `chapter/03-retrospective.md` (what worked, what could be better), `chapter/04-lessons.md` (seven classified lessons with apply-status tracking). The lesson tracker's entries for v1.22 — four of which are already marked applied (`v1.27` Inter-team ICD specifications, `v1.42` test coverage, `v1.48` operational runbook formalization) — demonstrate that a retrospective with numbered lessons is not ceremony; it is work product that subsequent releases actually consume.

## Key Features

| Area | What Shipped |
|------|--------------|
| PXE boot server (Phases 169-171) | DHCP and TFTP configured for network-booted installations; boot menu points at CentOS Stream 9 kickstart payloads; firewall zones managed via `firewalld` |
| Kickstart automation (Phases 172-173) | Unattended CentOS Stream 9 provisioning via signed kickstart file; partitioning, network bridge setup, and first-boot package stage captured in one artifact |
| Hypervisor-agnostic VM abstraction (Phases 174-175, 181-183) | Unified `create`, `start`, `stop`, `snapshot`, `clone`, `delete` interface over KVM/libvirt, VMware Workstation, and VirtualBox; container fallback for environments without hardware virtualization |
| Comprehensive hardware discovery (Phase 181) | Probes CPU, memory, GPU, storage, NIC, and virtualization extensions before allocation; results cached for the chipset to consume |
| Distribution abstraction layer (Phase 182) | Single package-management interface covering `dnf` (Fedora/CentOS), `apt` (Debian/Ubuntu), and `pacman` (Arch) |
| Minecraft Java Edition server (Phases 176-178) | Fabric mod loader with Syncmatica for real-time Litematica schematic sharing; automated deployment pipeline from bare VM to running server |
| Themed district layout (Phases 179, 189-190) | Four districts — Computing History, Networking, Architecture, Creative Workshop; spawn area with tutorial path; Amiga Corner exhibit; 10 schematic templates in `infra/knowledge-world/schematics/` |
| Educational curriculum pipeline (Phase 189) | "Visualize a Pipeline" guided build; tool-evolution walkthrough; System Architecture as Buildings methodology; validation suite |
| FS-UAE Amiga emulator (Phases 184-186) | AROS ROM default (no copyright issues); application profiles for Deluxe Paint, OctaMED, ProTracker, Personal Paint; IFF/ILBM + MOD/MED converters |
| Legally curated Amiga content (Phase 185) | 50-item manifest restricted to public domain, Creative Commons, and freeware; legal guide for ROM acquisition and software distribution |
| Chipset skills (Phase 191) | 20 formalized SKILL.md files across infrastructure foundation, platform, amiga, creative, and knowledge-world domains (`infra/skills/`) |
| Chipset agents (Phase 192) | 10 agent definitions assigned to the five teams; agent inventory; infra + platform + amiga + creative + ops coverage (`infra/teams/`) |
| Team topologies + coordination (Phase 193) | 5 team definition JSON files; `resource-locks.yaml` exclusive file ownership; `sync-points.yaml` 6 cross-team dependency chains; `message-bus.yaml` filesystem channels; bidirectional cycle fix (`2bc178b43`) |
| Chipset assembly + validation (Phase 194) | `.chipset/minecraft-knowledge-world.yaml` 20 skills + 10 agents + 5 teams + 20 routing rules; JSON-Schema draft-07 at `.chipset/schema/chipset-schema.yaml`; `scripts/validate-chipset.sh` 9-check validator |
| Automated RCON-quiesced backups (Phase 195) | Shared RCON library; `/save-off` → snapshot → `/save-on` flow; 24/7/4 rotation (24 hourly + 7 daily + 4 weekly); world-restore script with integrity verification |
| Prometheus monitoring (Phase 196) | Exporter configs; custom Minecraft metrics collector; 9 alert rules; health check extended to 12 checks |
| Golden image lifecycle (Phase 197) | Rapid rebuild orchestrator with version manifest; <5 min from clone, <20 min from scratch; 65-assertion test suite |
| Operational runbooks (Phase 198) | Four runbooks: server maintenance, backup and restore, monitoring, incident response; day-1 deployment and day-2 operations documents |

## Retrospective

### What Worked

- **30 phases decomposed so no subsystem blocked another.** PXE, kickstart, hypervisor abstraction, Minecraft server, Amiga emulation, chipset formalization, and operational maturity all landed inside one release window because the plan boundaries were drawn along data-flow edges, not timeline estimates. A slip in the Amiga content curation did not block the chipset assembly; a fix in the inter-team cycle did not block the monitoring work.
- **Hypervisor-agnostic VM provisioning as a first-class abstraction rather than a convenience.** Supporting KVM/libvirt, VMware Workstation, and VirtualBox behind one interface — with a container fallback for non-virtualized environments — meant the infrastructure layer did not lock users into a single vendor. The distribution abstraction (`dnf`/`apt`/`pacman`) shipped at the same time, so platform portability is end-to-end, not just one hop.
- **Chipset formalization with four explicit topology types.** The `.chipset/minecraft-knowledge-world.yaml` assembly wired 20 skills with real token budgets, 10 agents across 5 teams, and 20 routing rules pulled from actual trigger intents. The pipeline / map-reduce / swarm / leader-worker topology choice is enforceable via `resource-locks.yaml` + `sync-points.yaml` + `message-bus.yaml`, not just descriptive. This is the pattern every later chipset inherits.
- **Bash-only validator with nine independent checks.** `scripts/validate-chipset.sh` runs on any host with bash and yq, so validation is not gated on Node, Python, or any dev-loop language. It catches orphan skills, cycle dependencies, over-budget allocations, and broken references before the chipset loads at runtime. The fix at `2bc178b43` (bidirectional mc-platform ↔ mc-infra cycle) was caught by exactly this pattern.
- **Legally curated Amiga content from day one.** AROS ROM as default, 50-item manifest restricted to public domain / CC / freeware, and a written legal guide for future contributions. This prevents the quiet-liability accumulation that kills hobbyist-adjacent projects at scale.
- **Operational maturity shipped inside the same release as the features it observes.** RCON-quiesced backups, Prometheus with 9 alert rules, a golden image lifecycle under 5 minutes from clone, and four runbooks — all in the same window as the server itself. Features and operations did not desync.

### What Could Be Better

- **No test count reported at release time.** This is the only release in the v1.16-v1.32 range without an explicit test-coverage number. PXE boot, firewall zone management, and VM lifecycle operations are exactly the kind of work that benefits most from regression coverage, and the gap was visible in later audits. v1.42's `@vitest/coverage-v8` integration addressed the tooling gap retroactively; a per-release coverage figure should have been captured at the time.
- **Third-party mod chain shipped without a written pinning strategy.** Fabric, Syncmatica, and Litematica each have their own release cadences, and v1.22 did not publish a version-pinning policy, an update-window cadence, or an upstream-break playbook. The chipset references versions implicitly in the server deployment, but there is no document a future maintainer can pick up and enact.
- **Themed district layout is sketched, not fully mapped.** The four districts and ten schematic templates exist, but the per-objective curriculum mapping — what a learner is expected to construct, what success looks like, how an instructor validates completion — is present only in outline form. The pipeline build at `infra/knowledge-world/curriculum/` sets the pattern; the remaining districts did not yet fill it in.
- **Team ICD specs are structured but not yet fully validated by test.** Resource locks, sync points, and the message bus are declared in YAML and cross-referenced in the team JSON, but the coordination contracts do not yet have end-to-end integration tests that exercise a full cross-team message flow. The cycle fix at `2bc178b43` was caught by the validator; a cycle that emerges only during live coordination would not be.

## Lessons Learned

1. **A chipset is the object that makes a skill collection routable.** Twenty skills in a directory are an inventory; twenty skills wired into a YAML with trigger intents, token budgets, team assignments, and topology declarations are a routed system. The v1.22 chipset moved this project from "we have skills" to "we have a chipset with budgets under a ceiling." Every later release inherits the pattern, and the pattern is only useful because it is validatable.
2. **Topology is an assertion about coordination, not a name.** Calling a team "pipeline" means work flows sequentially; "map-reduce" means fan-out-then-reduce; "swarm" means peer gossip without a leader; "leader-worker" means directed delegation. The four types are enforceable because `resource-locks.yaml` and `sync-points.yaml` translate them into concrete file ownership and execution ordering. A topology type without enforcement is a naming convention; with enforcement, it is an invariant.
3. **Golden image rebuild under five minutes changes the operational posture.** When rebuild is cheap, infrastructure becomes disposable, experimentation gets cheap, and fear of breaking things drops to near zero. The five-minute target is load-bearing — not because five is magic, but because it is well under the threshold where an operator decides "it's easier to fix in place than rebuild." The from-scratch twenty-minute path is the backstop when the clone baseline itself has drifted.
4. **Operational runbooks are product artifacts, not internal documentation.** Server maintenance, backup and restore, monitoring, and incident response each got their own runbook at release time, not after. The runbooks convert knowledge out of the builder's head into artifacts a second operator can execute. This is the literal difference between a project that runs only as long as its author does, and a product that survives handover.
5. **Inter-team coordination contracts prevent the "I thought you were sending field X" class of bug.** The ICD spec pattern — resource locks (who writes what), sync points (who waits for whom), message bus (what channel, what schema) — turns informal assumptions into validated declarations. v1.22 shipped the pattern for five teams; later releases (v1.27 Foundational Knowledge Packs) formalized the contracts at the ecosystem level using the same shape.
6. **Distribution abstraction is tedious but enables everything above it.** Unifying `dnf`, `apt`, and `pacman` under one interface is unsexy engineering. It is also the prerequisite for any claim of platform portability. Skipping it would have pushed the platform-lock problem up into every downstream subsystem; doing it once at the infrastructure layer meant the hypervisor abstraction, the VM lifecycle operations, and the Minecraft deployment all inherit portability for free.
7. **Cycle detection belongs in the validator, not in the review step.** The bidirectional mc-platform ↔ mc-infra link at `2bc178b43` was caught because `scripts/validate-chipset.sh` runs a dependency-acyclicity check. A cycle that only shows up at runtime is a debugging session; a cycle that shows up in the validator is a ten-second fix. Every future team coordination graph should inherit the check.
8. **Legal rigor from day one prevents liability accumulation.** Defaulting to AROS ROM (open-source Amiga-compatible OS) rather than a copyrighted Kickstart, restricting the content manifest to public domain / Creative Commons / freeware, and writing a legal guide that future contributors can follow — each of these costs very little at authoring time and saves unbounded cost downstream. Hobbyist-adjacent projects that skip this work accumulate latent liability until it cancels them.
9. **Retrospective gaps documented truthfully become work-product for the next release.** The v1.22 retrospective flags missing test counts, unspecified mod pinning, and an underspecified curriculum mapping. v1.42 later filled the coverage gap with `@vitest/coverage-v8`; v1.27 picked up the ICD generalization; v1.48 formalized the operational runbook pattern across physical infrastructure. The retrospective only works as a feed-forward signal if it does not paper over the gaps.
10. **Thirty phases is shippable when the plan boundaries match the data-flow edges.** The v1.22 phase graph is unusually wide, but no phase depends on the internals of another in a way that would force serialization. A plan writing PXE boot configs does not block a plan writing schematic templates; a plan formalizing a team topology does not block a plan curating Amiga content. Future multi-subsystem releases should plan the boundaries the same way — along data-flow edges, not along timeline convenience.
11. **Four topologies cover the common cases and should not be extended casually.** Pipeline, map-reduce, swarm, and leader-worker describe the vast majority of team coordination patterns encountered in practice. Adding a fifth topology should require a concrete use case that none of the four handle cleanly, not just a naming preference. Every topology added increases the enforcement surface that validators, resource-locks, and sync-points must cover.
12. **Chipset budget ceilings are enforced numbers, not aspirational targets.** The 31.5 percent total allocation versus a 40 percent ceiling leaves 8.5 percent headroom for trigger bursts. The ceiling is a real gate in `scripts/validate-chipset.sh`; exceeding it fails the validator and blocks the chipset load. Without the gate, budgets drift; with the gate, every new skill addition is visible against a shared limit.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.21](../v1.21/) | Predecessor — GSD-OS Desktop Foundation; the Tauri desktop shell that the v1.22 Minecraft UI docks into |
| [v1.23](../v1.23/) | Successor — Project AMIGA; mission infrastructure and Apollo AGC simulator build on the v1.22 chipset pattern |
| [v1.24](../v1.24/) | GSD Conformance Audit — 336-checkpoint matrix exercises the v1.22 chipset model at scale |
| [v1.25](../v1.25/) | Ecosystem Integration — the 20-node dependency DAG uses the v1.22 chipset as a reference shape |
| [v1.26](../v1.26/) | Aminet Archive Extension Pack — extends the v1.22 Amiga Corner with INDEX parser, mirror engine, virus scanner |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — generalizes the v1.22 inter-team ICD specs into a cross-project pattern |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus and topology profiles directly extend v1.22's `message-bus.yaml` and topology types |
| [v1.29](../v1.29/) | Electronics Educational Pack — inherits v1.22's spatial learning curriculum pattern for MNA simulator + 77 labs |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — 19 skills, 3 crew configurations, ASIC chipset; scales the v1.22 chipset model to cloud-platform breadth |
| [v1.42](../v1.42/) | `@vitest/coverage-v8` integration that retroactively addresses v1.22's missing-test-count retrospective note |
| [v1.48](../v1.48/) | Physical Infrastructure Engineering Pack — formalizes the operational runbook pattern v1.22 introduced |
| `.chipset/minecraft-knowledge-world.yaml` | The unified chipset YAML — 20 skills + 10 agents + 5 teams + 20 routing rules, budget 31.5% of 40% ceiling |
| `.chipset/schema/chipset-schema.yaml` | JSON-Schema draft-07 definition that makes chipset shape validatable |
| `scripts/validate-chipset.sh` | Bash-only 9-check validator — sections, counts, references, dependencies, budget ceiling, orphans, cycles |
| `infra/skills/trigger-routing-matrix.yaml` | 20 skills mapped to intent → team → agent → skill routing chains; 7 disambiguation pairs |
| `infra/teams/resource-locks.yaml` | Exclusive file ownership across the 5 teams, no overlaps |
| `infra/teams/sync-points.yaml` | 6 cross-team dependency chains with execution ordering |
| `infra/teams/message-bus.yaml` | Filesystem communication channels under `.planning/artifacts/` |
| `infra/teams/infra-team.json` + `platform-team.json` + three peers | Five team definition JSON files with coordination topology metadata |
| `infra/knowledge-world/schematics/` | 10 schematic templates for the themed districts + spawn area |
| `infra/knowledge-world/curriculum/` | "Visualize a Pipeline" guided build + System Architecture as Buildings methodology |
| `docs/amiga-legal-guide.md` | Legal guide for Amiga ROM acquisition and software distribution; covers AROS default + CC/PD/freeware curation |
| `.planning/MILESTONES.md` | Canonical phase-by-phase detail for phases 169-198 (30 phases, 37 plans, 73 requirements) |
| `chapter/00-summary.md` | Parsed summary — navigation layer pointing at retrospective and lessons chapters |
| `chapter/03-retrospective.md` | Retrospective chapter — What Worked + What Could Be Better; source of the truthful gap flags |
| `chapter/04-lessons.md` | Seven classified lessons with apply-status tracking; four already marked applied in v1.27 / v1.42 / v1.48 |
| `CHANGELOG.md` | Top-level changelog entry for v1.22 |

## Engine Position

v1.22 is the release that moved the project's multi-agent architecture from ad-hoc-by-convention to chipset-by-specification. Every v1.x release before it had skills, some had agents, a few had team concepts — but none had a validatable chipset YAML with declared topologies, enforced resource locks, acyclic sync points, and a scripted validator that runs on any bash host. Every v1.x release after it inherits the chipset pattern. The v1.23 Project AMIGA mission infrastructure builds on v1.22's team-and-topology model; the v1.25 Ecosystem Integration DAG uses the chipset as the reference dependency-shape; the v1.27 Foundational Knowledge Packs generalize the ICD spec pattern; the v1.28 GSD Den filesystem message bus extends v1.22's `message-bus.yaml`; the v1.33 OpenStack Cloud Platform scales the chipset model to 19 skills across three crew configurations; the v1.42 coverage-v8 work pays down the retrospective debt; the v1.48 Physical Infrastructure Engineering Pack formalizes the runbook pattern. The v1.22 chipset file `.chipset/minecraft-knowledge-world.yaml` remains load-bearing at v1.49 because the schema and the validator are still in force. Thirty phases is a lot of release to absorb, but the shape v1.22 locked in — twenty skills under a budget ceiling, ten agents in five teams across four topologies, a validator that catches cycles — is the shape the project has kept.

## Files

- `.chipset/minecraft-knowledge-world.yaml` — unified chipset: 20 skills + 10 agents + 5 teams + 20 routing rules; 31.5% budget under 40% ceiling; 7-priority load order
- `.chipset/schema/chipset-schema.yaml` — JSON-Schema draft-07 for chipset validation
- `scripts/validate-chipset.sh` — 9-check bash-only validator (sections, counts, references, dependencies, budget ceiling, orphans, cycles)
- `infra/skills/trigger-routing-matrix.yaml` — intent → team → agent → skill routing; 7 disambiguation pairs; zero orphans
- `infra/skills/` — 20 SKILL.md files across infra / platform / amiga / creative / knowledge-world domains
- `infra/teams/infra-team.json` + `platform-team.json` + three peers — five team definition JSON files with topology metadata
- `infra/teams/resource-locks.yaml` — exclusive file ownership across teams, no overlaps
- `infra/teams/sync-points.yaml` — 6 cross-team dependency chains with execution ordering
- `infra/teams/message-bus.yaml` — filesystem communication channels under `.planning/artifacts/`
- `infra/knowledge-world/schematics/` — 10 schematic templates (pipeline visualization, tool evolution, pixel art gallery, demo scene, spawn tutorial, four district seeds)
- `infra/knowledge-world/curriculum/` — "Visualize a Pipeline" guided build + System Architecture as Buildings methodology + validation suite
- `docs/amiga-legal-guide.md` — legal guide for ROM acquisition + software distribution (AROS default, CC/PD/freeware curation)
- `docs/release-notes/v1.22/chapter/00-summary.md` — navigation chapter
- `docs/release-notes/v1.22/chapter/03-retrospective.md` — What Worked + What Could Be Better
- `docs/release-notes/v1.22/chapter/04-lessons.md` — 7 classified lessons with apply-status tracking
- `.planning/MILESTONES.md` — canonical phases 169-198 detail (30 phases, 37 plans, 73 requirements)

---

## Version History (preserved from original release notes)

The table below lists the v1.x line that accumulated through v1.22, with the actual shipped summaries for each version. This version history was preserved in the original v1.22 release notes and is retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.22** | Minecraft Knowledge World — local cloud infrastructure, Fabric server, platform portability, Amiga emulation, chipset formalization, operational maturity (this release) |
| **v1.21** | GSD-OS Desktop Foundation — Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop, calibration wizard |
| **v1.20** | Dashboard Assembly — unified CSS pipeline, 4 data collectors, console page as 6th generated page |
| **v1.19** | Budget Display Overhaul — `LoadingProjection`, dual-view display, configurable budgets, dashboard gauge |
| **v1.18** | Information Design System — shape + color encoding, status gantry, topology views, three-speed layering |
| **v1.17** | Staging Layer — analysis, scanning, resource planning, 7-state approval queue |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
