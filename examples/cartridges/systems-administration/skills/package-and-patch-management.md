---
name: package-and-patch-management
description: Install, upgrade, hold, and remove packages across apt/dnf/pacman/zypper and drive unattended-upgrades.
---

# package-and-patch-management

Keep the host on a known, supported package set. Apply security
updates promptly, schedule kernel updates around reboot windows, and
hold packages that are temporarily incompatible with the workload.
Reconcile held packages during post-incident recovery.

## Core operations

- `apt update && apt upgrade` / `dnf upgrade` / `pacman -Syu`
- Drive unattended-upgrades / dnf-automatic with reboot policy
- Hold / unhold with `apt-mark hold`, `dnf versionlock`, `pacman IgnorePkg`
- Kernel swap + reboot window coordination

## Rules

- Never upgrade during an active incident without explicit approval
- Always record the pre-upgrade package snapshot (`dpkg -l > /var/backups/pkg-$(date -I).list`)
- Patch cadence is a `RunbookEntry`, not an ad-hoc habit
