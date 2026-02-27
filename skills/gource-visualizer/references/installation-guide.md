# Installation Guide

Platform-specific installation for Gource, ffmpeg, and Xvfb.

## Quick Start

The skill pack includes an idempotent installer that handles everything:

```bash
bash skills/gource-visualizer/scripts/install-gource.sh
```

This detects your platform, installs missing components, and verifies the installation. Safe to run multiple times.

## Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y gource ffmpeg xvfb
```

This installs:
- **gource** -- the visualization engine (requires OpenGL)
- **ffmpeg** -- video encoder (includes libx264 for H.264 and libvpx for VP9)
- **xvfb** -- virtual framebuffer for headless rendering (servers, CI, Docker)

### Specific Codec Packages

On some minimal Debian installs, ffmpeg may ship without codec support. Ensure these are present:

```bash
sudo apt-get install -y libx264-dev libvpx-dev
```

## macOS

```bash
brew install gource ffmpeg
```

No xvfb needed -- macOS has native display support even over SSH (via Quartz).

If Homebrew is not installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Apple Silicon Note

Both `gource` and `ffmpeg` have native ARM64 builds via Homebrew. No Rosetta required.

## From Source

Building Gource from source is needed when package managers provide a version older than 0.51.

### Dependencies

| Library | Purpose | Package (Ubuntu) |
|---------|---------|-----------------|
| SDL2 | Window/input | `libsdl2-dev` |
| SDL2_image | Image loading | `libsdl2-image-dev` |
| Boost | Filesystem, regex | `libboost-all-dev` |
| PCRE2 | Regex engine | `libpcre2-dev` |
| GLM | OpenGL math | `libglm-dev` |
| FreeType2 | Font rendering | `libfreetype6-dev` |
| GLEW | OpenGL extension loading | `libglew-dev` |

```bash
# Install build dependencies
sudo apt-get install -y build-essential autoconf automake \
  libsdl2-dev libsdl2-image-dev libboost-all-dev \
  libpcre2-dev libglm-dev libfreetype6-dev libglew-dev

# Build Gource
git clone https://github.com/acaudwell/Gource.git
cd Gource
./autogen.sh
./configure
make -j$(nproc)
sudo make install
```

### Verify Source Build

```bash
gource --help 2>&1 | head -1
# Expected: "Gource v0.54 ..." (or similar)
```

## Verifying Installation

Run these checks to confirm everything is working:

### Gource

```bash
# Check version (must be >= 0.51)
gource --help 2>&1 | head -1

# Check OpenGL support
glxinfo 2>/dev/null | grep "OpenGL version" || echo "glxinfo not available"
```

### ffmpeg

```bash
# Check version
ffmpeg -version 2>&1 | head -1

# Verify H.264 codec (required for MP4)
ffmpeg -codecs 2>/dev/null | grep libx264
# Expected: "DEV.LS h264 ... libx264"

# Verify VP9 codec (required for WebM)
ffmpeg -codecs 2>/dev/null | grep libvpx
# Expected: "DEV.L. vp9 ... libvpx-vp9"
```

### ffprobe

```bash
# ffprobe ships with ffmpeg -- used for output verification
ffprobe -version 2>&1 | head -1
```

### Xvfb (Linux only)

```bash
# Check xvfb-run (preferred wrapper)
command -v xvfb-run && echo "xvfb-run: found"

# Check Xvfb (fallback)
command -v Xvfb && echo "Xvfb: found"
```

## Headless Environments

Gource requires an OpenGL context to render. On servers, CI runners, and Docker containers there is no display, so Xvfb provides a virtual one.

### How It Works

`xvfb-run` creates a temporary X server with a virtual framebuffer, runs the command, then cleans up:

```bash
xvfb-run -a -s "-screen 0 1920x1080x24 +extension GLX" \
  gource --load-config preset.conf -o - . | ffmpeg [options] output.mp4
```

Key flags:
- `-a` -- auto-select a free display number
- `-screen 0 1920x1080x24` -- virtual screen at 1080p, 24-bit color
- `+extension GLX` -- enable OpenGL extension (required for Gource)

### render-headless.sh

The skill pack's `render-headless.sh` handles this automatically. When `render-video.sh` detects no `$DISPLAY`, it delegates to `render-headless.sh` which:

1. Uses `xvfb-run` if available (preferred)
2. Falls back to manual `Xvfb` process if `xvfb-run` is not installed
3. Cleans up the Xvfb process on exit

### Docker Considerations

For Docker-based CI, include xvfb in the image:

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y gource ffmpeg xvfb
```

Run with:

```bash
docker run --rm -v $(pwd):/repo myimage \
  xvfb-run -a -s "-screen 0 1920x1080x24 +extension GLX" \
  bash /repo/skills/gource-visualizer/scripts/render-video.sh \
    --repo /repo --preset standard --output /repo/output.mp4
```

## Codec Requirements

### H.264 (libx264) -- Required for MP4

Most ffmpeg packages include libx264. Verify:

```bash
ffmpeg -codecs 2>/dev/null | grep libx264
```

If missing, install the codec library and rebuild or reinstall ffmpeg:

```bash
# Ubuntu/Debian
sudo apt-get install -y libx264-dev
sudo apt-get install --reinstall ffmpeg
```

### VP9 (libvpx) -- Required for WebM

```bash
ffmpeg -codecs 2>/dev/null | grep libvpx
```

If missing:

```bash
# Ubuntu/Debian
sudo apt-get install -y libvpx-dev
sudo apt-get install --reinstall ffmpeg
```

### Full Codec Check

```bash
# List all available encoders
ffmpeg -encoders 2>/dev/null | grep -E "libx264|libvpx"
```

Expected output should include both `libx264` and `libvpx_vp9`.
