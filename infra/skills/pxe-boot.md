---
name: pxe-boot
description: "Deploys PXE network boot infrastructure with dnsmasq, TFTP, BIOS/UEFI boot menus, and CentOS boot media. Use when setting up network boot, configuring PXE, or deploying boot infrastructure."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "pxe.*boot"
          - "network.*boot"
          - "dnsmasq.*config"
          - "tftp.*setup"
          - "boot.*menu"
        files:
          - "infra/scripts/deploy-pxe.sh"
          - "infra/templates/pxe/*.template"
          - "infra/templates/dnsmasq/*.template"
        contexts:
          - "pxe deployment"
          - "network boot setup"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "01-infrastructure-foundation"
      phase_origin: "170"
---

# PXE Boot

## Purpose

Deploys complete PXE network boot infrastructure for automated OS installation. Configures dnsmasq for DHCP/TFTP services, sets up BIOS and UEFI boot menus, and downloads CentOS boot media. Provides the network boot layer that kickstart provisioning depends on for zero-touch OS installation.

## Capabilities

- dnsmasq configuration for DHCP (192.168.122.200-250 range) and TFTP services
- BIOS/UEFI dual-boot support via DHCP option 93 (client-arch) detection
- Template-driven boot menu generation with configurable timeout (30s default to local disk)
- CentOS Stream 9 boot media download and TFTP root setup
- bind-interfaces + specific interface for DHCP/TFTP network isolation
- General-purpose template renderer (render-pxe-menu.sh) for any template/values pair

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/deploy-pxe.sh` | Main PXE infrastructure deployment script |
| `infra/scripts/setup-tftp-root.sh` | Creates TFTP directory structure with boot files |
| `infra/scripts/render-pxe-menu.sh` | General-purpose template renderer for boot menus |
| `infra/scripts/download-centos-boot-media.sh` | Downloads CentOS boot kernel and initrd |

## Dependencies

- dnsmasq (DHCP + TFTP server)
- Network interface for PXE services (typically virbr0 or bridge interface)
- CentOS Stream 9 mirror access for boot media download
- Root privileges for dnsmasq configuration and TFTP setup
- Templates in `infra/templates/pxe/` and `infra/templates/dnsmasq/`

## Usage Examples

**Deploy full PXE infrastructure:**
```bash
sudo infra/scripts/deploy-pxe.sh
# Sets up dnsmasq, TFTP, boot menus, downloads CentOS media
```

**Dry-run to preview configuration:**
```bash
infra/scripts/deploy-pxe.sh --dry-run
# Shows what would be configured without making changes
```

**Render a custom boot menu:**
```bash
infra/scripts/render-pxe-menu.sh \
  infra/templates/pxe/default.template \
  infra/local/pxe-values.yaml
```

## Test Cases

### Test 1: Template rendering
- **Input:** Run `deploy-pxe.sh --dry-run`
- **Expected:** Template rendering produces valid dnsmasq configuration with DHCP range and TFTP root
- **Verify:** `infra/scripts/deploy-pxe.sh --dry-run 2>&1 | grep -c 'dhcp-range\|tftp-root'` returns >= 2

### Test 2: BIOS/UEFI boot menu structure
- **Input:** Render default boot menu template
- **Expected:** Menu contains both BIOS (pxelinux) and UEFI (grub) boot entries
- **Verify:** Check rendered output contains both `LABEL` (syslinux) and `menuentry` (grub) syntax

### Test 3: Boot timeout defaults to local disk
- **Input:** Render boot menu with default values
- **Expected:** Timeout is 30 seconds with local disk as default boot option
- **Verify:** Rendered menu contains `TIMEOUT 300` (syslinux) or `set timeout=30` (grub)

## Token Budget Rationale

1.5% budget accounts for deploy-pxe.sh plus three supporting scripts (setup-tftp-root.sh, render-pxe-menu.sh, download-centos-boot-media.sh) and template files. The multi-script nature and template rendering complexity justify a slightly higher budget than single-script skills.
