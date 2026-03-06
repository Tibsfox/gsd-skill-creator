> **Note:** The canonical version of this document is [meta/filesystem-contracts.md](meta/filesystem-contracts.md).

# Filesystem Contracts -- GSD OpenStack Cloud Platform (NASA SE Edition)

This document establishes filesystem contracts for the GSD OpenStack Cloud Platform (NASA SE Edition). Every phase in the v1.33 roadmap writes output to specific directories. No phase should create directories not listed here. No two phases should write to the same file without explicit dependency.

This is the authority for "where does Phase X put its output?"

## Directory Structure

```
data/chipset/
  chipset.yaml                    # Phase 318 (Chipset Definition)

.planning/
  bus/                            # Phase 317 (Communication Framework)
    command/                      # FLIGHT <-> Tier 2-3
    execution/                    # PLAN <-> EXEC <-> VERIFY
    specialist/                   # TOPO <-> CRAFT
    user/                         # CAPCOM <-> human
    observation/                  # All -> SKILL
    health/                       # SURGEON <-> agents
    budget/                       # BUDGET <-> agents
    cloud-ops/                    # OpenStack APIs <-> SURGEON
    doc-sync/                     # Running system <-> doc verification

skills/
  openstack/                      # Phase 313 (Core Skills) + Phase 314 (Ops Skills)
    keystone/SKILL.md             # Phase 313
    nova/SKILL.md                 # Phase 313
    neutron/SKILL.md              # Phase 313
    cinder/SKILL.md               # Phase 313
    glance/SKILL.md               # Phase 313
    swift/SKILL.md                # Phase 313
    heat/SKILL.md                 # Phase 313
    horizon/SKILL.md              # Phase 313
    kolla-ansible/SKILL.md        # Phase 313
    monitoring/SKILL.md           # Phase 314
    backup/SKILL.md               # Phase 314
    security/SKILL.md             # Phase 314
    networking-debug/SKILL.md     # Phase 314
    capacity/SKILL.md             # Phase 314
  methodology/                    # Phase 312 (Foundation) + Phase 315 (Doc Skills)
    nasa-se/SKILL.md              # Phase 312 (this phase)
    ops-manual-writer/SKILL.md    # Phase 315
    runbook-generator/SKILL.md    # Phase 315
    doc-verifier/SKILL.md         # Phase 315

docs/
  sysadmin-guide/                 # Phase 319
    00-overview.md
    01-pre-phase-a-concept.md
    02-phase-a-development.md
    03-phase-b-design.md
    04-phase-c-build.md
    05-phase-d-test.md
    06-phase-e-operations.md
    07-phase-f-closeout.md
  operations-manual/              # Phase 320
    keystone-procedures.md
    nova-procedures.md
    neutron-procedures.md
    cinder-procedures.md
    glance-procedures.md
    swift-procedures.md
    heat-procedures.md
    horizon-procedures.md
  runbooks/                       # Phase 321
    task-index.md
    symptom-index.md
    RB-KEYSTONE-*.md
    RB-NOVA-*.md
    RB-NEUTRON-*.md
    RB-CINDER-*.md
    RB-GLANCE-*.md
    RB-SWIFT-*.md
    RB-HEAT-*.md
    RB-HORIZON-*.md
  reference/                      # Phase 321
    nasa-se-mapping.md
    openstack-cross-cloud.md
    quick-reference-card.md
  vv/                             # Phase 322
    requirements-verification-matrix.md
    validation-plan.md
    test-procedures/
  compliance-matrix.md            # Phase 322
  lessons-learned.md              # Phase 325
  filesystem-contracts.md         # Phase 312 (this document)

configs/                          # Phase 318 (Chipset) + Phase 313 (Kolla-Ansible)
  kolla-ansible/                  # Phase 313
  templates/                      # Phase 315 (Doc Skills)
```

## Naming Conventions

| Category | Pattern | Example |
|----------|---------|---------|
| Skill files | `skills/{domain}/{name}/SKILL.md` (lowercase, hyphens) | `skills/openstack/keystone/SKILL.md` |
| Doc files | `docs/{category}/{name}.md` (lowercase, hyphens) | `docs/sysadmin-guide/01-pre-phase-a-concept.md` |
| Runbook IDs | `RB-{SERVICE}-{NNN}` (uppercase service, 3-digit number) | `RB-NOVA-001`, `RB-KEYSTONE-003` |
| Requirement IDs | `CLOUD-{DOMAIN}-{NNN}` (uppercase domain, 3-digit number) | `CLOUD-COMPUTE-001`, `CLOUD-NETWORK-005` |
| Config files | `configs/{tool}/{filename}` (tool-specific naming) | `configs/kolla-ansible/globals.yml` |
| Bus messages | `.planning/bus/{loop}/{timestamp}-{type}.json` | `.planning/bus/command/001-directive.json` |
| Chipset | `data/chipset/chipset.yaml` | Single file, YAML format |

## Ownership Rules

1. **Each file has exactly ONE owner phase** that creates it. The owner phase is annotated in the directory structure above.
2. **Phases may READ files from earlier phases** but not MODIFY them without explicit dependency declaration.
3. **Exception:** `docs/compliance-matrix.md` may be updated by both Phase 322 (initial creation) and Phase 324 (integration verification updates).
4. **The `data/chipset/chipset.yaml`** is written by Phase 318 and read by all subsequent phases.
5. **The `skills/methodology/nasa-se/SKILL.md`** is written by Phase 312 and read by Phases 315, 316, 317, 318, 319, and 322.
6. **Bus directories** (`.planning/bus/`) are written by Phase 317 (structure creation) and used by Phases 316-325 (message exchange).

### Cross-Phase Read Dependencies

The following files are READ by multiple downstream phases:

- `skills/methodology/nasa-se/SKILL.md` -- read by skills/openstack/ skill authors (Phase 313, 314) for methodology cross-references
- `skills/openstack/keystone/SKILL.md` -- read by docs/operations-manual/ authors (Phase 320) and docs/runbooks/ authors (Phase 321)
- `skills/openstack/nova/SKILL.md` -- read by docs/operations-manual/ and docs/runbooks/ authors
- `skills/openstack/neutron/SKILL.md` -- read by docs/operations-manual/ and docs/runbooks/ authors
- `docs/filesystem-contracts.md` -- read by all phases to determine output locations
- `docs/sysadmin-guide/00-overview.md` -- read by docs/vv/ authors (Phase 322) for compliance verification
- `docs/operations-manual/*.md` -- read by docs/runbooks/ authors (Phase 321) for procedure cross-references
- `configs/kolla-ansible/globals.yml` -- read by docs/sysadmin-guide/ authors (Phase 319) for configuration documentation

## File Format Standards

| Category | Format | Validation |
|----------|--------|------------|
| Skills | YAML frontmatter + Markdown body | Must pass SKILL.md validation (name, description required; name matches `[a-z0-9-]{1,64}`) |
| Documentation | Markdown with consistent heading hierarchy | H1 for title, H2 for sections, H3 for subsections |
| Configs | YAML (chipset, kolla-ansible) or tool-specific | Must parse without errors; chipset must validate against schema |
| Bus messages | JSON files in `.planning/bus/{loop}/` directories | Must conform to communication loop message schema |
| Requirements | Markdown with traceable IDs | Every requirement ID must be unique; format `CLOUD-{DOMAIN}-{NNN}` |

## Phase-to-Directory Mapping

This table provides a quick lookup: given a phase number, which directories does it write to?

| Phase | Directories Written | Primary Output |
|-------|-------------------|----------------|
| 312 | `skills/methodology/nasa-se/`, `docs/` | NASA SE skill, filesystem contracts |
| 313 | `skills/openstack/{core-services}/`, `configs/kolla-ansible/` | 8 core OpenStack skills + kolla-ansible skill |
| 314 | `skills/openstack/{ops-domains}/` | 6 operations skills |
| 315 | `skills/methodology/{doc-skills}/`, `configs/templates/` | 3 documentation skills, doc templates |
| 316 | Agent configs (in `.planning/` or chipset) | Deployment + operations crew definitions |
| 317 | `.planning/bus/`, agent configs | Communication framework, bus directories |
| 318 | `data/chipset/` | Complete chipset.yaml |
| 319 | `docs/sysadmin-guide/` | 7-chapter systems administrator's guide |
| 320 | `docs/operations-manual/` | Per-service operations procedures |
| 321 | `docs/runbooks/`, `docs/reference/` | 40+ runbooks, reference library |
| 322 | `docs/vv/`, `docs/compliance-matrix.md` | V&V plan, compliance matrix |
| 323 | GSD-OS dashboard integration | Cloud ops panel, documentation console |
| 324 | Integration verification results | End-to-end verification reports |
| 325 | `docs/lessons-learned.md` | NASA LLIS-format lessons learned |
