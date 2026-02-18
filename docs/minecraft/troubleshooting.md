# GSD Knowledge World - Troubleshooting Guide

This guide covers the 5 most common connection failure modes when setting up
the GSD Knowledge World Minecraft client. Each section includes the symptom
(what you see), diagnosis (how to confirm the cause), fix (exact steps), and
verification (how to confirm the fix worked).

All mod versions reference `minecraft/client/mods-manifest.yaml` as the
single source of truth. For full installation instructions, see
`docs/minecraft/client-setup-guide.md`.

---

## Failure 1: Wrong Java Version

### Symptom

One of the following:

- Launcher shows `Unsupported class file major version 65` or similar error.
- Minecraft crashes immediately on launch with a Java-related exception.
- Fabric Installer refuses to run or shows a blank window.
- Error message references `java.lang.UnsupportedClassVersionError`.

### Diagnosis

Check your installed Java version:

```
java -version
```

If the output shows a version below 21 (e.g., `openjdk version "17.0.x"`
or `java version "1.8.0_xxx"`), this is the cause. Minecraft 1.21.4 with
Fabric requires Java 21.

### Fix

Install OpenJDK 21:

**Windows:**
```
winget install EclipseAdoptium.Temurin.21.JDK
```

**macOS:**
```
brew install openjdk@21
```
Then symlink so the system finds it:
```
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

**Linux (Debian/Ubuntu):**
```
sudo apt update && sudo apt install openjdk-21-jdk
```

**Linux (Fedora/CentOS):**
```
sudo dnf install java-21-openjdk-devel
```

If you have multiple Java versions installed, configure the default:

**Linux:**
```
sudo update-alternatives --config java
```
Select the Java 21 entry.

**Prism Launcher users:** You can also set the Java path per-instance in
Settings > Java > Java Path. Point it to your Java 21 installation.

### Verification

```
java -version
```

Output should show `openjdk version "21.x.x"` (exact patch version may vary).
Relaunch Minecraft after updating Java.

---

## Failure 2: Mod Version Mismatch

### Symptom

One of the following:

- Minecraft crashes on startup with `Incompatible mod set` error.
- Error log shows `requires fabric-api >= X.Y.Z` or similar dependency message.
- Title screen appears but shows `Fabric API not found` warning.
- Game starts but Litematica/Syncmatica menus are missing.

### Diagnosis

Compare the mod JAR filenames in your mods folder against the versions in
`minecraft/client/mods-manifest.yaml`:

| Expected Filename | Version |
|-------------------|---------|
| `fabric-api-0.112.0+1.21.4.jar` | 0.112.0+1.21.4 |
| `litematica-fabric-1.21.4-0.19.52.jar` | 0.19.52 |
| `malilib-fabric-1.21.4-0.21.3.jar` | 0.21.3 |
| `syncmatica-1.21.4-0.3.11.jar` | 0.3.11 |

Check for:

- Wrong versions (e.g., a mod built for 1.21.3 instead of 1.21.4).
- Missing mods (you need all 4; MaLiLib is often forgotten because it is
  a dependency of Litematica, not a standalone mod).
- Duplicate mods (two versions of the same mod in the mods folder).
- Extra mods (incompatible mods you did not intend to install).

### Fix

1. Delete all JAR files from the mods folder.
2. Re-download the exact versions listed in `minecraft/client/mods-manifest.yaml`
   using the URLs provided.
3. Place only those 4 JARs in the mods folder. No other files should be present.

Mods folder locations:

- **Prism Launcher:** `<instances>/GSD-Knowledge-World/.minecraft/mods/`
- **Windows (Vanilla):** `%APPDATA%\.minecraft\mods\`
- **macOS (Vanilla):** `~/Library/Application Support/minecraft/mods/`
- **Linux (Vanilla):** `~/.minecraft/mods/`

### Verification

Launch Minecraft. The title screen should show
`Minecraft 1.21.4 / Fabric (Modded)` in the bottom-left. Press F3 to open
the debug overlay and confirm 4+ mods are loaded.

---

## Failure 3: Connection Refused

### Symptom

One of the following in the Multiplayer screen:

- `Can't connect to server` with a red X icon.
- `Connection refused` error when trying to join.
- `Can't resolve hostname` error.
- Server entry shows `Pinging...` indefinitely.

### Diagnosis

The issue is between your client and the server. Work through these checks
in order:

1. **Verify the server address.** Check `infra/local/minecraft.local-values`
   for the correct IP and port (default: 25565).

2. **Verify the server is running.** If you have SSH access:
   ```
   systemctl status minecraft
   ```
   The service should show `active (running)`.

3. **Verify network connectivity.** From your client machine:
   ```
   ping YOUR_SERVER_IP
   ```
   If ping fails, you have a network-level issue (wrong IP, different subnet,
   VPN interference).

4. **Verify the port is open.** From your client machine:
   ```
   nc -zv YOUR_SERVER_IP 25565
   ```
   Or on Windows (PowerShell):
   ```
   Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 25565
   ```
   If the port is closed, the server firewall may be blocking it.

5. **Verify firewall rules on the server.** If you have SSH access:
   ```
   sudo firewall-cmd --list-ports
   ```
   Port `25565/tcp` should be listed. If not:
   ```
   sudo firewall-cmd --permanent --add-port=25565/tcp
   sudo firewall-cmd --reload
   ```

### Fix

Apply fixes based on which check failed above:

- **Wrong address:** Correct the server IP/port in Multiplayer settings.
- **Server not running:** Start it: `sudo systemctl start minecraft`
- **Network unreachable:** Check that your client is on the same network
  or has a route to the server. Disable VPN if using one.
- **Port blocked:** Open the port in the server's firewall (see step 5).

### Verification

After applying fixes, the server entry in Multiplayer should show green
connection bars, the server MOTD, and the current player count. You should
be able to click "Join Server" without errors.

---

## Failure 4: Not Whitelisted

### Symptom

You connect to the server but are immediately kicked with the message:

```
You are not white-listed on this server
```

### Diagnosis

The server has whitelist enforcement enabled and your Minecraft username
has not been added. This is a server-side configuration, not a client
issue. Your client setup is correct if you reached the kick message.

To check the current whitelist (requires server access):

```
cat /opt/minecraft/server/whitelist.json
```

Or via RCON:

```
whitelist list
```

### Fix

Contact the server administrator and provide your exact Minecraft username
(case-sensitive). The admin adds you via one of these methods:

**Via RCON or server console:**
```
whitelist add YOUR_USERNAME
```

**Via the management script** (if Phase 175 whitelist management is deployed):
```
./infra/scripts/manage-whitelist.sh add YOUR_USERNAME
```

The whitelist updates immediately; no server restart is needed.

### Verification

After the admin confirms your username was added, click "Join Server" in
Minecraft. You should connect successfully without the whitelist kick
message.

---

## Failure 5: Syncmatica Handshake Failure

### Symptom

You can connect to the server and play normally, but:

- Syncmatica shared schematics are not visible.
- The game log shows `Syncmatica: handshake failed` or similar error.
- The Syncmatica menu shows no server schematics.
- Litematica works locally but server schematics do not sync.

### Diagnosis

This failure has three common causes:

1. **Syncmatica version mismatch:** Your client Syncmatica version does not
   match the server version. They must be identical.

2. **Syncmatica not installed:** The mod JAR is missing from your mods
   folder entirely.

3. **Missing dependencies:** Syncmatica requires both Litematica and MaLiLib
   to function. If either is missing, Syncmatica silently fails.

Check your mods folder for these three JARs:

```
syncmatica-1.21.4-0.3.11.jar
litematica-fabric-1.21.4-0.19.52.jar
malilib-fabric-1.21.4-0.21.3.jar
```

Compare the Syncmatica version with the server's version. The server mod
manifest is at `infra/templates/minecraft/mod-manifest.yaml.template` and
the client manifest is at `minecraft/client/mods-manifest.yaml`. Both must
specify the same Syncmatica version.

### Fix

1. Remove any existing Syncmatica JAR from your mods folder.
2. Download the exact version listed in `minecraft/client/mods-manifest.yaml`:
   - `syncmatica-1.21.4-0.3.11.jar` from
     [Modrinth](https://modrinth.com/mod/syncmatica)
3. Confirm Litematica and MaLiLib are also present (all 3 are required
   for schematic sync to work).
4. Restart Minecraft completely (close and relaunch, do not just disconnect
   and reconnect).

### Verification

After relaunching:

1. Connect to the server.
2. Open the Syncmatica menu. The default keybind depends on your Litematica
   configuration -- check Litematica's settings under "Generic" > "Open GUI"
   (commonly `M` then navigate to Syncmatica tab).
3. If the handshake succeeded, you will see a list of server schematics
   available for download and placement.
4. Check the game log (`latest.log`) for `Syncmatica: handshake successful`
   or the absence of handshake error messages.

---

## General Tips

- **Always check `minecraft/client/mods-manifest.yaml` first.** It is the
  single source of truth for all client mod versions.

- **Do not mix mod loaders.** Fabric mods do not work with Forge, Quilt,
  or NeoForge. Use only the Fabric Loader.

- **One mods folder, one set of mods.** Never have multiple versions of
  the same mod in your mods folder. Delete old JARs before adding new ones.

- **Restart fully after mod changes.** Minecraft does not hot-reload mods.
  Close the game completely and relaunch after adding or removing mods.

- **Check the setup guide.** If you have not completed the full installation,
  return to `docs/minecraft/client-setup-guide.md` and follow either
  Path A (Prism Launcher) or Path B (Vanilla Launcher) from the beginning.

- **Java version matters.** Many startup failures trace back to using Java 17
  or older. Always verify with `java -version` before troubleshooting
  anything else.
