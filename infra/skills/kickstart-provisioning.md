---
name: kickstart-provisioning
description: "Automates CentOS Stream 9 installation via kickstart templates with security hardening and role-based extensions. Use when provisioning VMs, creating kickstart files, or deploying OS images."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "kickstart.*deploy"
          - "provision.*centos"
          - "install.*os"
          - "base.*image"
          - "kickstart.*template"
        files:
          - "infra/scripts/deploy-kickstart.sh"
          - "infra/templates/kickstart/*.template"
        contexts:
          - "os provisioning"
          - "vm installation"
        threshold: 0.7
      token_budget: "1%"
      version: 1
      enabled: true
      plan_origin: "01-infrastructure-foundation"
      phase_origin: "171"
---

# Kickstart Provisioning

## Purpose

Automates CentOS Stream 9 installation using complete kickstart files (not fragile %include fragments). Renders role-based kickstart templates with security hardening, Java 21 packages for Minecraft VMs, and first-boot hooks. The deploy script renders kickstart files but does not serve HTTP -- the operator chooses the serving method.

## Capabilities

- Complete kickstart file rendering (no Anaconda %include dependencies)
- Role-based templates: base, minecraft (adds Java 21 and dedicated system user)
- Security hardening: firewalld, SELinux enforcing, minimal package set
- Minecraft system user with nologin shell at /opt/minecraft
- First-boot hook (50-minecraft-setup.sh) validates Java installation
- Template rendering via the general-purpose render-pxe-menu.sh renderer

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/deploy-kickstart.sh` | Renders kickstart templates for PXE/HTTP serving |

## Dependencies

- PXE boot infrastructure (pxe-boot skill) for network-based installation
- Template files in `infra/templates/kickstart/`
- CentOS Stream 9 installation media (network or local mirror)
- Values file with hostname, network, and role configuration

## Usage Examples

**Render Minecraft VM kickstart:**
```bash
infra/scripts/deploy-kickstart.sh --role minecraft --hostname mc-server
# Produces: rendered kickstart file with Java 21 and minecraft user
```

**Dry-run to preview kickstart content:**
```bash
infra/scripts/deploy-kickstart.sh --dry-run --role minecraft
# Shows rendered kickstart without writing files
```

**Render base image kickstart:**
```bash
infra/scripts/deploy-kickstart.sh --role base --hostname infra-node
# Produces: minimal CentOS kickstart with security hardening
```

## Test Cases

### Test 1: Minecraft role includes Java
- **Input:** Run `deploy-kickstart.sh --dry-run --role minecraft`
- **Expected:** Rendered kickstart contains java-21-openjdk package
- **Verify:** `infra/scripts/deploy-kickstart.sh --dry-run --role minecraft 2>&1 | grep -c 'java-21'` returns >= 1

### Test 2: Security hardening present
- **Input:** Render any role kickstart
- **Expected:** Output contains firewalld enabled, SELinux enforcing
- **Verify:** Check rendered output for `firewall --enabled` and `selinux --enforcing`

### Test 3: Minecraft system user creation
- **Input:** Render minecraft role kickstart
- **Expected:** User creation with nologin shell and /opt/minecraft home
- **Verify:** Check for `useradd` or `user` directive with `/sbin/nologin`

## Token Budget Rationale

1% budget is appropriate for deploy-kickstart.sh (~120 lines) which is primarily a template renderer with role-based logic. The kickstart templates themselves are static content that does not need to be loaded into context.
