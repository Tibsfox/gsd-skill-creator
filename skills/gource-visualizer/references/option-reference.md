# Gource and FFmpeg Option Reference

Curated options organized by use case. Not exhaustive -- covers the flags most relevant to `render-video.sh` and skill pack workflows. For full Gource docs: `gource --help`.

## Visual Appearance

| Flag | Type | Default | Example | Description |
|------|------|---------|---------|-------------|
| `--background-colour` | hex | 000000 | `--background-colour 1a1a2e` | Background color (6-digit hex, no #) |
| `--font-colour` | hex | FFFFFF | `--font-colour CCCCCC` | Text color for date, title, filenames |
| `--dir-colour` | hex | -- | `--dir-colour 88AAFF` | Directory name color |
| `--highlight-colour` | hex | -- | `--highlight-colour FF6B6B` | Highlighted user color |
| `--font-size` | int | 16 | `--font-size 22` | Base font size in pixels |
| `--font-file` | path | -- | `--font-file /path/to/font.ttf` | Custom TrueType font |
| `--user-scale` | float | 1.0 | `--user-scale 1.5` | Scale user avatars (1.5 = 50% larger) |
| `--user-font-size` | int | -- | `--user-font-size 18` | Username label font size |
| `--dir-font-size` | int | -- | `--dir-font-size 14` | Directory label font size |

## Timing and Playback

| Flag | Type | Default | Example | Description |
|------|------|---------|---------|-------------|
| `--seconds-per-day` | float | 10 | `--seconds-per-day 0.05` | Seconds of video per day of history. Lower = faster playback. `render-video.sh` auto-calculates this from preset target duration and repo date range |
| `--auto-skip-seconds` | float | 3 | `--auto-skip-seconds 1` | Skip ahead when nothing happens for this many seconds |
| `--time-scale` | float | 1.0 | `--time-scale 2.0` | Speed multiplier applied on top of seconds-per-day |
| `--max-file-lag` | float | -- | `--max-file-lag 0.5` | Max time files take to appear after commit (reduces visual lag) |
| `--start-date` | string | -- | `--start-date "2024-01-01"` | Only show history from this date |
| `--stop-date` | string | -- | `--stop-date "2024-12-31"` | Only show history up to this date |
| `--start-position` | float | 0.0 | `--start-position 0.5` | Start at fraction through timeline (0.5 = halfway) |
| `--stop-at-end` | bool | false | `--stop-at-end` | Stop when end of log reached (required for piped output) |
| `--stop-at-time` | float | -- | `--stop-at-time 1` | Stop after N seconds of playback |

## Layout and Camera

| Flag | Type | Default | Example | Description |
|------|------|---------|---------|-------------|
| `--camera-mode` | string | overview | `--camera-mode track` | `overview` shows full tree, `track` follows active users |
| `--padding` | float | 1.1 | `--padding 1.5` | Camera padding multiplier around tree |
| `--bloom-multiplier` | float | 1.0 | `--bloom-multiplier 1.2` | Glow intensity around active nodes |
| `--bloom-intensity` | float | 0.75 | `--bloom-intensity 0.8` | Bloom brightness |
| `--elasticity` | float | -- | `--elasticity 0.3` | How springy the tree layout is (lower = stiffer) |
| `--multi-sampling` | bool | false | `--multi-sampling` | Enable anti-aliasing (smoother edges, slower render) |

## Content Filtering

| Flag | Type | Example | Description |
|------|------|---------|-------------|
| `--file-filter` | regex | `--file-filter "\.lock$"` | Hide files matching pattern |
| `--file-show-filter` | regex | `--file-show-filter "\.ts$"` | Only show files matching pattern |
| `--user-filter` | regex | `--user-filter "dependabot"` | Hide users matching pattern |
| `--hide` | list | `--hide mouse,progress` | Hide UI elements (comma-separated) |

### `--hide` values

| Value | Hides |
|-------|-------|
| `bloom` | Glow effects |
| `date` | Date display |
| `dirnames` | Directory labels |
| `files` | File nodes (shows only tree structure) |
| `filenames` | File labels |
| `mouse` | Mouse cursor |
| `progress` | Progress bar |
| `root` | Root directory node |
| `tree` | Tree edges |
| `users` | User avatars |
| `usernames` | User name labels |

Combine: `--hide mouse,progress,filenames`

## Overlays

| Flag | Type | Default | Example | Description |
|------|------|---------|---------|-------------|
| `--title` | string | -- | `--title "My Project"` | Title text in bottom-left corner |
| `--logo` | path | -- | `--logo logo.png` | Logo image in bottom-right corner |
| `--logo-offset` | XxY | 20x20 | `--logo-offset 30x30` | Logo offset from corner in pixels |
| `--caption-file` | path | -- | `--caption-file captions.txt` | Caption file for timed text overlays |
| `--caption-duration` | float | 10 | `--caption-duration 6` | How long each caption displays |
| `--caption-size` | int | 22 | `--caption-size 28` | Caption font size |
| `--caption-colour` | hex | FFFFFF | `--caption-colour FFDD00` | Caption text color |
| `--key` | bool | false | `--key` | Show file extension color legend |

### Caption File Format

One line per caption: `<unix-timestamp>|<caption text>`

```
1609459200|v1.0 Released
1625097600|Major refactor
1640995200|v2.0 Released
```

Use `generate-captions.sh` to auto-generate from git tags.

## Output

| Flag | Type | Example | Description |
|------|------|---------|-------------|
| `--output-framerate` | int | `--output-framerate 60` | Frames per second for PPM output |
| `--viewport` | WxH | `--viewport 1920x1080` | Output resolution |
| `-o` | path | `-o -` | Output PPM to file or stdout (`-` for pipe) |

Note: `--viewport` must be set in the `[display]` section of `.conf` files, not the `[gource]` section.

## FFmpeg Encoding Flags

See [ffmpeg-pipeline.md](ffmpeg-pipeline.md) for full encoding reference. Quick summary:

| Format | Command Fragment |
|--------|-----------------|
| MP4 (H.264) | `-vcodec libx264 -preset medium -pix_fmt yuv420p -crf 18` |
| WebM (VP9) | `-vcodec libvpx -b:v 10000K` |

## Preset Defaults

Each preset config overrides many of these options. See [presets.md](presets.md) for the full comparison table and per-preset breakdown.

CLI flags passed to `render-video.sh` (e.g., `--background`, `--title`) are appended after `--load-config` and override preset defaults.
