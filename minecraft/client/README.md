# GSD Knowledge World - Client Quick Start

Get connected to the Knowledge World in under 5 minutes using the
pre-configured Prism Launcher profile.

## Prerequisites

- **Minecraft Java Edition** (purchased and logged in via your Mojang/Microsoft account)
- **Java 21** (OpenJDK recommended; see troubleshooting if unsure)
- **Prism Launcher** installed ([prismlauncher.org](https://prismlauncher.org/))

## Step 1: Import the Profile

1. Open Prism Launcher.
2. Click **Add Instance** > **Import from zip** (or drag-and-drop).
3. Select the `prism-instance/` folder from this directory.
   - Alternatively, copy the entire `prism-instance/` folder into your Prism
     Launcher instances directory:
     - **Windows:** `%APPDATA%/PrismLauncher/instances/GSD-Knowledge-World/`
     - **macOS:** `~/Library/Application Support/PrismLauncher/instances/GSD-Knowledge-World/`
     - **Linux:** `~/.local/share/PrismLauncher/instances/GSD-Knowledge-World/`
4. You should see **GSD Knowledge World** appear in your instance list.

## Step 2: Download and Place Mods

Download the 4 required mods listed in `mods-manifest.yaml`. Each entry
includes the exact version and download URL:

| Mod | Filename | Source |
|-----|----------|--------|
| Fabric API | `fabric-api-0.112.0+1.21.4.jar` | [Modrinth](https://modrinth.com/mod/fabric-api/version/0.112.0+1.21.4) |
| Litematica | `litematica-fabric-1.21.4-0.19.52.jar` | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/litematica) |
| MaLiLib | `malilib-fabric-1.21.4-0.21.3.jar` | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/malilib) |
| Syncmatica | `syncmatica-1.21.4-0.3.11.jar` | [Modrinth](https://modrinth.com/mod/syncmatica) |

Place all 4 JAR files in the instance's mods folder:

```
prism-instance/.minecraft/mods/
```

Or, if you copied the instance into Prism Launcher's directory, place them
in the `mods/` folder inside the instance.

## Step 3: Set the Server Address

1. Launch the **GSD Knowledge World** instance from Prism Launcher.
2. From the title screen, go to **Multiplayer** > **Add Server**.
3. Enter:
   - **Server Name:** `GSD Knowledge World`
   - **Server Address:** your server IP and port (e.g., `192.168.122.10:25565`)
   - Check your `infra/local/minecraft.local-values` for the exact address.
4. Click **Done**, then **Join Server**.

## Step 4: Verify Everything Works

Run this checklist before your first session:

- [ ] Prism Launcher shows **GSD Knowledge World** in the instance list
- [ ] The `.minecraft/mods/` folder contains exactly 4 JAR files
- [ ] Title screen bottom-left shows `Minecraft 1.21.4 / Fabric (Modded)`
- [ ] F3 debug screen shows 4+ mods loaded
- [ ] Server appears in multiplayer list with green connection bars
- [ ] You can connect and see the Knowledge World spawn

## Troubleshooting

If something goes wrong, see `docs/minecraft/troubleshooting.md` for
solutions to the most common issues (wrong Java version, mod mismatches,
connection problems, whitelist rejection, Syncmatica handshake failures).

## File Reference

| File | Purpose |
|------|---------|
| `mods-manifest.yaml` | Single source of truth for mod versions and download URLs |
| `prism-instance/mmc-pack.json` | Prism Launcher component versions (Minecraft + Fabric Loader) |
| `prism-instance/instance.cfg` | Instance settings (name, memory allocation) |
| `prism-instance/.minecraft/mods/` | Place downloaded mod JARs here |
