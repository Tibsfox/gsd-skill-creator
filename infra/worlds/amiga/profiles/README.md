# Amiga Application Profiles

Application-specific UAE emulation profiles for the GSD Amiga creative tools stack.

## Profile System

Each profile is an INI-style `.uae` configuration file. The launcher script (`launch-amiga-app.sh`) merges `base.uae` with the chosen application profile, then substitutes runtime values (display backend, audio settings) from `local-values.yaml`.

### How It Works

1. **base.uae** provides shared defaults (CPU, memory, display/audio placeholders)
2. An **application profile** overrides specific settings (chipset, CPU type, memory)
3. **launch-amiga-app.sh** merges both, with the app profile's values taking precedence
4. Runtime placeholders (`__UAE_DISPLAY__`, `__UAE_SAMPLE_RATE__`, `__UAE_BUFFER_SIZE__`) are replaced with values from `local-values.yaml` or sensible defaults

### Available Profiles

| Profile | Chipset | CPU | Use Case |
|---------|---------|-----|----------|
| `deluxe-paint` | OCS/A500 | 68000 | Pixel art with 32-color OCS palette, palette cycling |
| `octamed` | AGA/A1200 | 68020 | 8+ channel tracker with MIDI, audio priority |
| `protracker` | OCS/A500 | 68000 | Classic 4-channel tracker, timing-accurate playback |
| `ppaint` | AGA/A1200 | 68020 | Hi-color and HAM8 pixel art, 640x512 canvas |
| `whdload` | AGA/A1200 | 68020 | Hard-drive-based software loading via WHDLoad |

### Usage

```bash
# Launch Deluxe Paint
infra/scripts/launch-amiga-app.sh deluxe-paint

# Launch with a specific ROM
infra/scripts/launch-amiga-app.sh octamed --rom /path/to/kick31.rom

# Launch with a floppy disk image
infra/scripts/launch-amiga-app.sh protracker --adf /path/to/protracker.adf

# Preview the merged configuration without launching
infra/scripts/launch-amiga-app.sh ppaint --dry-run

# Launch WHDLoad with hard drive image
infra/scripts/launch-amiga-app.sh whdload --hdf ~/.local/share/gsd-amiga/whdload/whdload.hdf
```

### Creating Custom Profiles

To add a new application profile:

1. Copy an existing profile that is closest to your target application
2. Rename it to `your-app-name.uae`
3. Adjust chipset, CPU, memory, and display settings as needed
4. Launch with: `launch-amiga-app.sh your-app-name`

The launcher accepts any `.uae` filename (without extension) found in the profiles directory, or an absolute path to a custom `.uae` file.

### Key Settings Reference

| Setting | Values | Notes |
|---------|--------|-------|
| `chipset` | `OCS`, `ECS`, `AGA` | OCS for classic, AGA for enhanced features |
| `chipset_compatible` | `A500`, `A1200` | Determines chipset behavior model |
| `cpu_type` | `68000`, `68010`, `68020`, `68030`, `68040` | Lower = more compatible, higher = faster |
| `cpu_speed` | `real`, `max` | `real` for timing-sensitive apps |
| `chip_ram` | `256`-`8192` (KB) | Chip RAM accessible by custom chips |
| `fast_ram` | `0`-`65536` (KB) | CPU-only RAM, not DMA accessible |
| `sound_output` | `none`, `interrupts`, `normal`, `exact` | `exact` for music production |
| `sound_stereo_separation` | `0`-`10` | 0=mono, 7=full Amiga stereo, 10=wide |

### File Exchange

Files created inside the emulator are accessible from the host via the exchange directory. See `setup-amiga-exchange.sh` for configuration. Within UAE, the exchange appears as `Exchange:` volume.
