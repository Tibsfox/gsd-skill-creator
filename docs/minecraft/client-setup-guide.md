# GSD Knowledge World - Client Setup Guide

Complete guide for connecting to the GSD Knowledge World Minecraft server.
Two paths are provided: **Path A** (Prism Launcher, recommended, ~5 minutes) and
**Path B** (Vanilla Launcher, ~10 minutes). Both cover Windows, macOS, and Linux.

All mod versions reference the single source of truth at
`minecraft/client/mods-manifest.yaml`.

---

## Prerequisites

Before starting either path, confirm you have:

1. **Minecraft Java Edition** -- purchased and logged in via your
   Mojang/Microsoft account at [minecraft.net](https://www.minecraft.net/).

2. **Java 21** (OpenJDK recommended per project open-standards policy).
   Check your version:
   ```
   java -version
   ```
   If the output shows anything below 21, install OpenJDK 21 first:
   - **Windows:** `winget install EclipseAdoptium.Temurin.21.JDK`
   - **macOS:** `brew install openjdk@21`
   - **Linux (Debian/Ubuntu):** `sudo apt install openjdk-21-jdk`
   - **Linux (Fedora/CentOS):** `sudo dnf install java-21-openjdk-devel`

3. **Minimum 4 GB RAM** allocated to Minecraft (configured during setup below).

4. **Server address** -- check your `infra/local/minecraft.local-values` file
   for the IP address and port. The default port is `25565`. Throughout this
   guide, replace `YOUR_SERVER_IP:25565` with your actual server address.

---

## Path A: Quick Setup with Prism Launcher (Recommended)

Estimated time: **5 minutes**.

Prism Launcher is a free, open-source Minecraft launcher that supports
multiple instances, mod management, and profile imports. This is the
recommended path because the GSD Knowledge World ships with a
pre-configured profile.

### A.1: Install Prism Launcher

**Windows:**
- Download the installer or portable ZIP from
  [prismlauncher.org/download](https://prismlauncher.org/download/).
- Run the installer and follow the prompts.
- Alternatively, install via winget:
  ```
  winget install PrismLauncher.PrismLauncher
  ```

**macOS:**
- Install via Homebrew (recommended):
  ```
  brew install --cask prismlauncher
  ```
- Or download the DMG from
  [prismlauncher.org/download](https://prismlauncher.org/download/).

**Linux:**
- Flatpak (works on all distributions):
  ```
  flatpak install flathub org.prismlauncher.PrismLauncher
  ```
- Or install from your distribution's package manager:
  - **Fedora:** `sudo dnf install prismlauncher`
  - **Ubuntu/Debian:** See [prismlauncher.org/download](https://prismlauncher.org/download/) for PPA instructions.
  - **Arch Linux:** `sudo pacman -S prismlauncher`

### A.2: Import the Pre-configured Profile

1. Open Prism Launcher.
2. Log in with your Minecraft/Microsoft account if prompted.
3. Copy the `minecraft/client/prism-instance/` folder into your Prism
   Launcher instances directory:
   - **Windows:** `%APPDATA%\PrismLauncher\instances\GSD-Knowledge-World\`
   - **macOS:** `~/Library/Application Support/PrismLauncher/instances/GSD-Knowledge-World/`
   - **Linux:** `~/.local/share/PrismLauncher/instances/GSD-Knowledge-World/`
4. Restart Prism Launcher if it was already open.
5. You should see **GSD Knowledge World** in your instance list. The instance
   is configured for Minecraft 1.21.4 with Fabric Loader 0.16.10.

### A.3: Download and Install Mods

Download all 4 required mods. The exact versions and download URLs are
listed in `minecraft/client/mods-manifest.yaml`:

| Mod | Version | Filename | Download |
|-----|---------|----------|----------|
| Fabric API | 0.112.0+1.21.4 | `fabric-api-0.112.0+1.21.4.jar` | [Modrinth](https://modrinth.com/mod/fabric-api/version/0.112.0+1.21.4) |
| Litematica | 0.19.52 | `litematica-fabric-1.21.4-0.19.52.jar` | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/litematica) |
| MaLiLib | 0.21.3 | `malilib-fabric-1.21.4-0.21.3.jar` | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/malilib) |
| Syncmatica | 0.3.11 | `syncmatica-1.21.4-0.3.11.jar` | [Modrinth](https://modrinth.com/mod/syncmatica) |

Place all 4 JAR files into the instance mods folder:

- **If you copied the instance into Prism Launcher's directory:**
  `<instances>/GSD-Knowledge-World/.minecraft/mods/`

- **If using the repo directly:**
  `minecraft/client/prism-instance/.minecraft/mods/`

Confirm the mods folder contains exactly 4 JAR files and nothing else.
Remove any old or duplicate JARs.

### A.4: Set Server Address and Connect

1. In Prism Launcher, select **GSD Knowledge World** and click **Launch**.
2. Wait for the title screen. The bottom-left should show:
   `Minecraft 1.21.4 / Fabric (Modded)`
3. Click **Multiplayer** > **Add Server**.
4. Enter:
   - **Server Name:** `GSD Knowledge World`
   - **Server Address:** `YOUR_SERVER_IP:25565`
5. Click **Done**. The server should appear with a green connection bar and
   the MOTD (Message of the Day).
6. Click **Join Server**.

If the server shows a red X or you cannot connect, see
`docs/minecraft/troubleshooting.md`.

---

## Path B: Manual Setup with Vanilla Launcher

Estimated time: **10 minutes**.

Use this path if you prefer the official Minecraft Launcher or cannot
install Prism Launcher.

### B.1: Install Fabric Loader

First, download the Fabric Installer from
[fabricmc.net/use/installer](https://fabricmc.net/use/installer/).

#### Windows

1. Download `fabric-installer-1.0.1.exe` from the link above.
2. Double-click to run the installer.
3. In the installer window:
   - **Minecraft Version:** select `1.21.4`
   - **Loader Version:** select `0.16.10`
   - **Install Location:** leave as default (`%APPDATA%\.minecraft`)
   - Check **Create profile** (should be checked by default)
4. Click **Install**.
5. The installer creates a new launcher profile called `fabric-loader-1.21.4`.

#### macOS

1. Download `fabric-installer-1.0.1.jar` from the link above.
2. Open Terminal and navigate to the download folder:
   ```
   cd ~/Downloads
   ```
3. Run the installer:
   ```
   java -jar fabric-installer-1.0.1.jar
   ```
4. In the installer GUI:
   - **Minecraft Version:** select `1.21.4`
   - **Loader Version:** select `0.16.10`
   - Leave install location as default
5. Click **Install**.

If the GUI does not appear, run in headless mode:
```
java -jar fabric-installer-1.0.1.jar client -mcversion 1.21.4 -loader 0.16.10
```

#### Linux

1. Download `fabric-installer-1.0.1.jar` from the link above.
2. Open a terminal and run:
   ```
   java -jar ~/Downloads/fabric-installer-1.0.1.jar
   ```
3. In the installer GUI:
   - **Minecraft Version:** select `1.21.4`
   - **Loader Version:** select `0.16.10`
   - Leave install location as default
4. Click **Install**.

Headless alternative:
```
java -jar ~/Downloads/fabric-installer-1.0.1.jar client -mcversion 1.21.4 -loader 0.16.10
```

### B.2: Install Mods

Download the same 4 mods listed in Section A.3 above (Fabric API,
Litematica, MaLiLib, Syncmatica) using the exact versions from
`minecraft/client/mods-manifest.yaml`.

Place all 4 JAR files into your Minecraft mods directory:

**Windows:**
```
%APPDATA%\.minecraft\mods\
```
Open this folder in File Explorer by pressing `Win+R`, typing
`%APPDATA%\.minecraft\mods`, and pressing Enter. Create the `mods` folder
if it does not exist.

**macOS:**
```
~/Library/Application Support/minecraft/mods/
```
Open this folder in Finder by pressing `Cmd+Shift+G` and pasting the path.
Create the `mods` folder if it does not exist.

**Linux:**
```
~/.minecraft/mods/
```
Create the `mods` folder if it does not exist:
```
mkdir -p ~/.minecraft/mods/
```

Copy the JAR files:
```
cp fabric-api-0.112.0+1.21.4.jar ~/.minecraft/mods/
cp litematica-fabric-1.21.4-0.19.52.jar ~/.minecraft/mods/
cp malilib-fabric-1.21.4-0.21.3.jar ~/.minecraft/mods/
cp syncmatica-1.21.4-0.3.11.jar ~/.minecraft/mods/
```

### B.3: Configure Memory Allocation

The Knowledge World works best with at least 4 GB of RAM allocated:

1. Open the Minecraft Launcher.
2. Go to **Installations** tab.
3. Find the **fabric-loader-1.21.4** profile and click the three dots > **Edit**.
4. Click **More Options**.
5. In the **JVM Arguments** field, change `-Xmx2G` to `-Xmx4G`:
   ```
   -Xmx4G -Xms2G
   ```
6. Click **Save**.

### B.4: Launch and Connect

1. Open the Minecraft Launcher.
2. Select the **fabric-loader-1.21.4** profile from the dropdown at the
   bottom-left of the launcher.
3. Click **Play**.
4. Wait for the title screen. The bottom-left should show:
   `Minecraft 1.21.4 / Fabric (Modded)`
5. Click **Multiplayer** > **Add Server**.
6. Enter:
   - **Server Name:** `GSD Knowledge World`
   - **Server Address:** `YOUR_SERVER_IP:25565`
7. Click **Done**. The server should appear in the list.
8. Click **Join Server**.

---

## Verification Checklist

After completing either Path A or Path B, confirm the following:

- [ ] **Fabric Loader profile exists:** The launcher shows a Fabric profile
      for Minecraft 1.21.4 (either in Prism Launcher or Vanilla Launcher).

- [ ] **Mods folder has exactly 4 JARs:**
  - `fabric-api-0.112.0+1.21.4.jar`
  - `litematica-fabric-1.21.4-0.19.52.jar`
  - `malilib-fabric-1.21.4-0.21.3.jar`
  - `syncmatica-1.21.4-0.3.11.jar`

- [ ] **Title screen confirms Fabric:** Bottom-left corner reads
      `Minecraft 1.21.4 / Fabric (Modded)`.

- [ ] **Mods are loaded:** Press F3 on the title screen or in-game. The debug
      overlay should show 4+ mods loaded (Fabric API counts as a mod; the
      exact count may vary slightly).

- [ ] **Server is reachable:** In the multiplayer server list, the GSD
      Knowledge World entry shows green connection bars and the server
      MOTD.

- [ ] **You can join:** Clicking "Join Server" connects you without errors.
      If whitelist is enabled, ensure the server admin has added your
      username first.

---

## Server Connection Details

| Setting | Value |
|---------|-------|
| Server Name | GSD Knowledge World |
| Server Address | Check `infra/local/minecraft.local-values` for your IP |
| Default Port | 25565 |
| Minecraft Version | 1.21.4 |
| Mod Loader | Fabric 0.16.10 |
| Required Mods | 4 (Fabric API, Litematica, MaLiLib, Syncmatica) |

If the server has whitelist enabled, contact the server administrator to
add your Minecraft username. The admin runs:

```
whitelist add YOUR_USERNAME
```

via RCON or the server console. See `docs/minecraft/troubleshooting.md`
(Failure 4) for details.

---

## Next Steps

Once connected to the Knowledge World:

1. Explore the spawn area for orientation signs and maps.
2. Open the Syncmatica menu (default keybind: check Litematica settings)
   to browse shared schematics.
3. Use Litematica to place and follow building blueprints in the
   Knowledge World districts.

For connection issues, mod problems, or Syncmatica sync failures, see
`docs/minecraft/troubleshooting.md`.
