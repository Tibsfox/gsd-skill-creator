---
name: distro-abstraction
description: "Abstracts package management (dnf/apt/pacman) and firewall operations (firewalld/ufw/iptables) across Linux distributions with automatic backend detection. Use when installing packages, managing firewall rules, or writing cross-distro scripts."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "package.*(install|remove|manage)"
          - "firewall.*(open|close|rule|manage)"
          - "cross.*distro"
          - "pkg.*abstract"
          - "distro.*abstract"
        files:
          - "infra/scripts/lib/pkg-abstraction.sh"
          - "infra/scripts/lib/pkg-names.sh"
          - "infra/scripts/lib/fw-abstraction.sh"
        contexts:
          - "cross-distribution scripting"
          - "package management"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "03-platform-portability"
      phase_origin: "179"
---

# Distribution Abstraction

## Purpose

Provides cross-distribution abstractions for package management and firewall operations. Automatically detects the system's package manager (dnf, apt, pacman) and firewall backend (firewalld, ufw, iptables), then dispatches operations through a unified API. Enables all infrastructure scripts to work across CentOS, Fedora, Ubuntu, Debian, Arch, and derivatives without distribution-specific code paths.

## Capabilities

- Package management abstraction: install, remove, update, query across dnf/apt/pacman
- Package name mapping: associative arrays for O(1) lookup of distro-specific names
- Empty mapping value signals "package unavailable on backend" (distinct from missing key = passthrough)
- Firewall abstraction: open/close ports, manage rules across firewalld/ufw/iptables
- Four-strategy detection cascade with PKG_BACKEND/FW_BACKEND env override (highest priority for testing)
- FW_BACKEND=none is valid state (not error) for systems without firewall
- Idempotent firewall operations: pre-checks port state before opening/closing
- Service-to-port resolution via /etc/services for iptables backend
- apt cache staleness threshold at 1 hour to avoid stale package lists

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/lib/pkg-abstraction.sh` | Package management abstraction layer |
| `infra/scripts/lib/pkg-names.sh` | Cross-distro package name mappings |
| `infra/scripts/lib/fw-abstraction.sh` | Firewall operations abstraction layer |

## Dependencies

- One of: dnf (RHEL/Fedora), apt (Debian/Ubuntu), pacman (Arch)
- One of: firewalld, ufw, iptables (or none)
- Bash 4.0+ for associative arrays
- /etc/services for iptables service-to-port resolution

## Usage Examples

**Install a package cross-distro:**
```bash
source infra/scripts/lib/pkg-abstraction.sh
pkg_install java-21-openjdk  # Resolves to correct package name
```

**Open a firewall port:**
```bash
source infra/scripts/lib/fw-abstraction.sh
fw_open 25565 tcp  # Minecraft server port
```

**Override backend for testing:**
```bash
PKG_BACKEND=apt source infra/scripts/lib/pkg-abstraction.sh
# Forces apt backend regardless of detected system
```

## Test Cases

### Test 1: Package name resolution
- **Input:** Source pkg-abstraction.sh and call `pkg_install java-21-openjdk`
- **Expected:** Resolves package name correctly for detected backend (java-21-openjdk on dnf, openjdk-21-jdk on apt)
- **Verify:** pkg_resolve function returns non-empty string for known packages

### Test 2: Firewall idempotency
- **Input:** Call `fw_open 25565 tcp` twice
- **Expected:** Second call is no-op (port already open), exit code 0
- **Verify:** No duplicate firewall rules after repeated calls

### Test 3: Backend override
- **Input:** Set PKG_BACKEND=apt and source pkg-abstraction.sh on non-apt system
- **Expected:** Uses apt functions regardless of detected system
- **Verify:** `pkg_backend` variable equals "apt"

## Token Budget Rationale

1.5% budget covers three library files that are sourced by many other scripts. The package name mappings and firewall backend logic are moderately complex, and this skill is a dependency for multiple downstream skills (pxe-boot, kickstart-provisioning, minecraft-deployment).
