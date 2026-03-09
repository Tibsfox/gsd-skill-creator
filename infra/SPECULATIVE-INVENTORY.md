# Speculative Infrastructure Inventory

**Created:** v1.49.29 (GAP-6 resolution)
**Purpose:** Identify infrastructure designed but not validated in production deployment.

All infrastructure in this directory is **design-quality** — architecturally sound and code-reviewed, but not tested end-to-end in a production environment. This is by design: the project builds infrastructure specifications ahead of deployment phases.

## Categories

### VM Backends (Phase 172) — Partially Tested
KVM backend tested via `infra/tests/test-vm-lifecycle.sh`. VMware and VirtualBox backends designed but not exercised.
- `scripts/vm-backend-vmware.sh`
- `scripts/vm-backend-kvm.sh`
- `scripts/lib/hv-vbox.sh`
- `scripts/lib/hv-vmware.sh`

### Platform Abstraction — Design Only
Package manager and firewall abstractions for multi-distro support.
- `scripts/lib/pkg-abstraction.sh`
- `scripts/lib/fw-abstraction.sh`

### PXE/Kickstart Templates (Phases 170-171)
Network boot infrastructure templates.
- `templates/kickstart/base.ks.template`
- `templates/kickstart/minecraft.ks.template`
- `templates/pxe/pxelinux.cfg-default.template`
- `templates/pxe/grub.cfg.template`
- `templates/dnsmasq/pxe-boot.conf.template`

### Minecraft World Design (Phases 186-190) — Specifications
Schematic specs awaiting in-world build phases.
- `minecraft/world-design/world-master-plan.yaml`
- `world/spawn/spawn-plaza-spec.yaml`
- `world/spawn/tutorial-path-spec.yaml`
- `world/spawn/welcome-center-spec.yaml`
- `knowledge-world/amiga-corner/amiga-corner-schematic-spec.yaml`

### Runbooks — Untested Procedures
Operational procedures designed but not executed end-to-end.
- `docs/runbook-day-1-deployment.md`
- `docs/runbook-day-2-operations.md`
- `docs/runbook-server-update.md`
- `docs/runbook-incident-response.md`
- `docs/integration-verification.md`

### Knowledge Packs (Phases 207+) — Pipeline Design
Content generation pipeline specifications.
- `packs/knowledge/chipset.yaml`
- `packs/knowledge/teams/kp-content-pipeline.yaml`

### Monitoring/Alerting — Deployed, Not Incident-Tested
Alert rules deployed but not validated through real incidents.
- `monitoring/alerts/minecraft-alerts.yaml`
- `monitoring/exporters/deploy-exporters.sh`

## Validation Status

None of this infrastructure is broken or incorrect. It follows the project's "cartography not construction" principle — specifications are mapped ahead of build phases. Each category will be validated when its corresponding build phase executes.
