---
name: server-configuration
description: "Configures Minecraft server properties, whitelist management, and RCON access with tier-adaptive settings and automated secrets management. Use when configuring server settings, managing player whitelist, or setting up RCON."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "server.*propert"
          - "whitelist.*(add|remove|manage)"
          - "rcon.*(config|setup|password)"
          - "server.*config"
          - "player.*manage"
        files:
          - "infra/scripts/deploy-server-config.sh"
          - "infra/scripts/manage-whitelist.sh"
          - "infra/templates/minecraft/server.properties.template"
        contexts:
          - "server configuration"
          - "player management"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "02-minecraft-server"
      phase_origin: "175"
---

# Server Configuration

## Purpose

Configures Minecraft server properties, whitelist management, and RCON access control. Renders template-driven server.properties with tier-adaptive performance settings, manages player whitelist via jq (with python3 fallback), and handles automated RCON password generation with gitignored secrets storage.

## Capabilities

- Template-driven server.properties rendering with tier-adaptive settings
- Automated RCON password generation stored in infra/local/minecraft-secrets.yaml (gitignored, chmod 600)
- Idempotent secrets management: generates once, preserves on subsequent runs
- Whitelist management: add, remove, list, sync operations
- jq primary JSON manipulation with python3 fallback for whitelist
- Offline UUID generation matching Java UUID.nameUUIDFromBytes() (MD5 + UUID v3 bits)
- Three-tier RCON command fallback: mcrcon CLI, python3 socket, file-only mode
- Merged values file pattern: flattens minecraft.server + network sections + secrets for renderer
- Performance tuning documentation for view-distance, simulation-distance based on tier

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/deploy-server-config.sh` | Renders server.properties and manages RCON secrets |
| `infra/scripts/manage-whitelist.sh` | Whitelist add/remove/list/sync with offline UUID generation |

## Dependencies

- `jq` for whitelist JSON manipulation (python3 as fallback)
- Templates in `infra/templates/minecraft/`
- Local values file with minecraft.server configuration section
- Deployed Minecraft server (minecraft-deployment skill)

## Usage Examples

**Deploy server configuration:**
```bash
infra/scripts/deploy-server-config.sh
# Renders server.properties, generates RCON password if needed
```

**Add a player to whitelist:**
```bash
infra/scripts/manage-whitelist.sh add PlayerName
# Generates offline UUID and adds to whitelist.json
```

**List whitelisted players:**
```bash
infra/scripts/manage-whitelist.sh list
# Shows all players with UUIDs
```

**Sync whitelist via RCON:**
```bash
infra/scripts/manage-whitelist.sh sync
# Reloads whitelist on running server via RCON
```

## Test Cases

### Test 1: Offline UUID generation
- **Input:** Run `manage-whitelist.sh add TestPlayer`
- **Expected:** whitelist.json contains entry with correct offline UUID (Java UUID.nameUUIDFromBytes compatible)
- **Verify:** `jq '.[].name' whitelist.json | grep -c 'TestPlayer'` returns 1

### Test 2: RCON password generation is idempotent
- **Input:** Run `deploy-server-config.sh` twice
- **Expected:** RCON password generated on first run, preserved on second
- **Verify:** Password value in minecraft-secrets.yaml unchanged between runs

### Test 3: Secrets file permissions
- **Input:** Run `deploy-server-config.sh` and check file permissions
- **Expected:** infra/local/minecraft-secrets.yaml has mode 600
- **Verify:** `stat -c '%a' infra/local/minecraft-secrets.yaml` returns 600

## Token Budget Rationale

1.5% budget covers deploy-server-config.sh (~170 lines) with template rendering and secrets management, plus manage-whitelist.sh (~200 lines) with UUID generation and RCON fallback logic. The multiple fallback strategies and cross-tool integration justify this budget.
