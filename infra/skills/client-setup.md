---
name: client-setup
description: "Provides cross-platform Minecraft client setup with Fabric Loader, mod installation guides, pre-configured Prism Launcher profiles, and connection troubleshooting. Use when setting up Minecraft clients or troubleshooting connection issues."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "client.*setup"
          - "prism.*launcher"
          - "connect.*minecraft"
          - "fabric.*client"
          - "troubleshoot.*connect"
        files:
          - "minecraft/client/*.yaml"
          - "minecraft/client/prism-instance/*"
          - "minecraft/client/README.md"
        contexts:
          - "client installation"
          - "player onboarding"
        threshold: 0.7
      token_budget: "1%"
      version: 1
      enabled: true
      plan_origin: "02-minecraft-server"
      phase_origin: "176"
---

# Client Setup

## Purpose

Provides comprehensive cross-platform Minecraft client setup documentation with Fabric Loader installation, mod management, pre-configured Prism Launcher MMC profiles, and connection troubleshooting. Serves as the single source of truth for player onboarding with dual-path documentation: quick Prism Launcher path (~5 min) and vanilla manual fallback (~10 min).

## Capabilities

- Cross-platform installation guides (Windows, macOS, Linux)
- Prism Launcher MMC pack format (mmc-pack.json + instance.cfg) for portable instance configuration
- Single-source-of-truth mod manifest: all docs reference mods-manifest.yaml for versions and download URLs
- Four required client mods: Fabric API, Litematica, MaLiLib, Syncmatica
- Troubleshooting for 5 common connection failure modes
- Dual-path documentation: Prism Launcher quick path (5 min) plus vanilla manual fallback (10 min)
- SHA-256 checksums deferred to deployment time since JARs not pre-downloaded

## Key Scripts

| Script | Purpose |
|--------|---------|
| (documentation-only skill) | No executable scripts -- guides and configuration files |

## Dependencies

- Minecraft Java Edition (player's own license)
- Prism Launcher (recommended) or vanilla Minecraft launcher
- Fabric Loader for Minecraft 1.21.4
- Client mods listed in mods-manifest.yaml
- Server address and whitelist entry from server-configuration skill

## Usage Examples

**Set up client with Prism Launcher (quick path):**
```
1. Install Prism Launcher from prismlauncher.org
2. Import minecraft/client/prism-instance/ as new instance
3. Launch -- mods are pre-configured
4. Connect to server address from local-values
```

**Set up client manually (vanilla path):**
```
1. Install Fabric Loader for Minecraft 1.21.4
2. Download mods from mods-manifest.yaml URLs
3. Place JARs in .minecraft/mods/
4. Launch and connect
```

**Troubleshoot connection issues:**
```
Refer to minecraft/client/README.md troubleshooting section
for 5 common failure modes and resolutions
```

## Test Cases

### Test 1: Mod manifest completeness
- **Input:** Read mods-manifest.yaml
- **Expected:** Lists all 4 required client mods (Fabric API, Litematica, MaLiLib, Syncmatica) with download URLs
- **Verify:** `grep -c 'fabric-api\|litematica\|malilib\|syncmatica' minecraft/client/mods-manifest.yaml` returns 4

### Test 2: Prism Launcher profile valid
- **Input:** Inspect minecraft/client/prism-instance/ contents
- **Expected:** Contains mmc-pack.json and instance.cfg with Fabric 1.21.4
- **Verify:** `jq '.components[].uid' minecraft/client/prism-instance/mmc-pack.json` includes fabric loader

### Test 3: Cross-platform coverage
- **Input:** Read minecraft/client/README.md
- **Expected:** Contains sections for Windows, macOS, and Linux installation
- **Verify:** `grep -c 'Windows\|macOS\|Linux' minecraft/client/README.md` returns >= 3

## Token Budget Rationale

1% budget is appropriate for a documentation-only skill with no executable scripts. The content is primarily guides and configuration files that provide context for client setup questions but don't require complex script understanding.
