# Preset Configuration Guide

The skill pack includes four preset configurations that control resolution, framerate, visual style, and Gource behavior. Each preset is a `.conf` file loaded via `gource --load-config`.

## Summary

| Preset | Resolution | FPS | Target Duration | Use Case |
|--------|-----------|-----|----------------|----------|
| quick | 1280x720 | 30 | ~30s | Fast preview, demos, draft checks |
| standard | 1920x1080 | 60 | ~3 min | Default for presentations and sharing |
| cinematic | 1920x1080 | 60 | ~4 min | Showcase quality, rich visual effects |
| thumbnail | 1920x1080 | -- | 1 frame | Static image for previews and READMEs |

`render-video.sh` auto-calculates `seconds-per-day` from your repository's date range and the preset's target duration. Override with `--seconds-per-day`.

## quick

**Config:** `configs/preset-quick.conf`

Fast, low-resolution render for quick iteration and draft previews. Strips visual extras for speed.

| Setting | Value | Why |
|---------|-------|-----|
| viewport | 1280x720 | Smaller = faster render |
| output-framerate | 30 | Half the frames = half the render time |
| bloom-multiplier | 0.5 | Minimal glow (faster) |
| multi-sampling | false | No anti-aliasing (faster) |
| hide | mouse, progress, filenames | Less overlay rendering |
| camera-mode | overview | Full tree view |

**When to use:** Testing render settings, quick project demos, draft previews before committing to a full render.

**When NOT to use:** Final presentations, public sharing, anything where visual quality matters.

## standard

**Config:** `configs/preset-standard.conf`

The default preset. Full HD with smooth playback and balanced visual quality.

| Setting | Value | Why |
|---------|-------|-----|
| viewport | 1920x1080 | Full HD |
| output-framerate | 60 | Smooth playback |
| bloom-multiplier | 1.0 | Standard glow |
| bloom-intensity | 0.75 | Visible but not overwhelming |
| multi-sampling | true | Anti-aliased edges |
| user-scale | 1.5 | Larger user avatars for visibility |
| font-size | 22 | Readable text |
| hide | mouse, progress | Clean UI |
| key | true | Show file extension legend |

**When to use:** Presentations, project updates, team demos, embedding in documentation.

**When NOT to use:** Quick drafts (use quick), or when maximum visual quality is needed (use cinematic).

## cinematic

**Config:** `configs/preset-cinematic.conf`

Maximum visual quality for showcases and portfolio pieces. Richer bloom, larger fonts, caption support.

| Setting | Value | Why |
|---------|-------|-----|
| viewport | 1920x1080 | Full HD |
| output-framerate | 60 | Smooth playback |
| bloom-multiplier | 1.2 | Enhanced glow for dramatic effect |
| bloom-intensity | 0.8 | Brighter bloom |
| multi-sampling | true | Anti-aliased edges |
| user-scale | 1.5 | Larger user avatars |
| font-size | 24 | Large, readable text |
| dir-font-size | 14 | Directory labels visible |
| filename-time | 2.0 | Files visible longer |
| caption-size | 22 | Caption text size |
| caption-duration | 6 | Captions display for 6 seconds |
| caption-colour | FFFFFF | White captions |
| hide | mouse, progress | Clean UI |
| key | true | Show file extension legend |

**When to use:** Public showcases, portfolio videos, conference talks, project retrospectives, milestone celebrations.

**When NOT to use:** Quick iterations (slow to render), repos with very few commits (not enough content to fill 4 minutes).

## thumbnail

**Config:** `configs/preset-thumbnail.conf`

Captures a single frame at the midpoint of the repository timeline. Not a video -- produces a static image when combined with ffmpeg thumbnail extraction.

| Setting | Value | Why |
|---------|-------|-----|
| viewport | 1920x1080 | Full HD for sharp thumbnails |
| start-position | 0.5 | Start at timeline midpoint (most representative) |
| stop-at-time | 1 | Stop after 1 second (captures ~1 frame) |
| bloom-multiplier | 1.0 | Standard glow |
| multi-sampling | true | Anti-aliased for crisp image |
| hide | mouse, progress, date | Clean image without overlays |

**When to use:** README badges, project cards, social media previews, CI artifacts.

**When NOT to use:** Any situation requiring video output.

## Overriding Preset Values

CLI flags passed to `render-video.sh` override preset config values. The `--load-config` flag loads the preset first, then subsequent flags take precedence.

```bash
# Use standard preset but with dark blue background
render-video.sh --repo . --preset standard --background 1a1a2e

# Use cinematic preset but override timing
render-video.sh --repo . --preset cinematic --seconds-per-day 0.5

# Use standard preset with a title and logo
render-video.sh --repo . --preset standard \
  --title "My Project" --logo logo.png

# Use standard preset but output WebM instead of MP4
render-video.sh --repo . --preset standard --format webm
```

## Custom Presets

Create your own `.conf` file following the Gource config format. Two INI sections:

```ini
[display]
viewport=3840x2160

[gource]
seconds-per-day=0.5
auto-skip-seconds=1
file-idle-time=0
highlight-users=true
hide=mouse,progress
camera-mode=overview
multi-sampling=true
bloom-multiplier=1.0
stop-at-end=true
output-framerate=60
```

Save as `configs/preset-custom.conf` and reference with `--preset custom`.

### Section Rules

- `[display]` section: `viewport` only (window/output resolution)
- `[gource]` section: all Gource flags as `key=value` pairs
- Flags use the long-form name without `--` prefix
- Boolean flags: `true` or `false`
- No quotes around values

### Testing Custom Presets

Preview interactively (requires display):

```bash
gource --load-config configs/preset-custom.conf .
```

Then render:

```bash
render-video.sh --repo . --preset custom
```
