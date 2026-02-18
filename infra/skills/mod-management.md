---
name: mod-management
description: "Manages Fabric mod lifecycle including Modrinth API-based installation, version pinning via manifest, SHA-256 verification, and read-only update checking. Use when installing mods, checking for updates, or managing mod versions."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "mod.*(install|update|check|deploy)"
          - "fabric.*mod"
          - "syncmatica"
          - "modrinth"
          - "mod.*manifest"
        files:
          - "infra/scripts/deploy-mods.sh"
          - "infra/scripts/check-mod-updates.sh"
          - "infra/templates/minecraft/mod-manifest.yaml.template"
        contexts:
          - "mod management"
          - "server mods"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "02-minecraft-server"
      phase_origin: "174"
---

# Mod Management

## Purpose

Manages the complete Fabric mod lifecycle: resolves mods from Modrinth API v2, pins versions via manifest YAML, verifies JAR integrity with SHA-256, and provides read-only update checking without modifying files. Handles the four required mods (Fabric API, Litematica, MaLiLib, Syncmatica) and supports Syncmatica configuration for schematic sharing.

## Capabilities

- Modrinth API v2 resolution with jq-based JSON parsing and graceful fallback
- Version-pinned deployment from mod-manifest.yaml
- SHA-256 verification with local-values as authoritative hash source (not API hash)
- Read-only update checker: exit code 2 signals updates available for cron/scripted monitoring
- Mod manifest stored at SERVER_DIR/mod-manifest.yaml, separate from mods/ jar directory
- Syncmatica configuration for multi-player schematic sharing
- Never downloads or modifies files during update check (safety by design)

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/deploy-mods.sh` | Installs and verifies Fabric mods from manifest |
| `infra/scripts/check-mod-updates.sh` | Read-only checker for mod version currency |

## Dependencies

- Modrinth API v2 access (api.modrinth.com)
- `jq` for JSON parsing
- `curl` for API requests and mod downloads
- `sha256sum` for integrity verification
- Deployed Minecraft server (minecraft-deployment skill)
- Mod manifest template in `infra/templates/minecraft/`

## Usage Examples

**Deploy all mods from manifest:**
```bash
infra/scripts/deploy-mods.sh
# Downloads, verifies SHA-256, installs to mods/ directory
```

**Check for available updates:**
```bash
infra/scripts/check-mod-updates.sh
# Exit 0: all current, Exit 2: updates available
```

**Dry-run mod deployment:**
```bash
infra/scripts/deploy-mods.sh --dry-run
# Shows which mods would be downloaded without making changes
```

## Test Cases

### Test 1: Update checker reports available updates
- **Input:** Run `check-mod-updates.sh --dry-run` with outdated version in manifest
- **Expected:** Exit code 2 and report showing current vs latest versions
- **Verify:** `infra/scripts/check-mod-updates.sh --dry-run; echo $?` returns 0 or 2 (not 1)

### Test 2: SHA-256 verification
- **Input:** Deploy mods and tamper with one JAR file
- **Expected:** Re-run deploy-mods.sh detects hash mismatch and re-downloads
- **Verify:** Log output shows "hash mismatch" for tampered file

### Test 3: Read-only update check
- **Input:** Run check-mod-updates.sh and compare mods/ directory before/after
- **Expected:** No files created, modified, or deleted in mods/ directory
- **Verify:** `find mods/ -newer /tmp/timestamp-marker` returns empty

## Token Budget Rationale

1.5% budget covers deploy-mods.sh (~180 lines) with Modrinth API integration and SHA-256 verification, plus check-mod-updates.sh (~120 lines) as a read-only companion. The API interaction patterns and manifest parsing require moderate context.
