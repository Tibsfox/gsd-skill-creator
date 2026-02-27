# Gource Visualization Pack

> Repository history visualization for the GSD ecosystem

**Status:** Mission-Ready
**Skill-Creator:** `sc learn gource-visualization`
**Dependencies:** gource, ffmpeg, xvfb (Linux headless)

## Quick Start

```bash
# 1. Install dependencies (idempotent -- skips if already present)
bash scripts/install-gource.sh

# 2. Render a video of the current repository
bash scripts/render-video.sh --repo . --preset standard --output my-project.mp4

# 3. Or just tell Claude:
# "Visualize the history of this project"
```

## Presets

| Preset | Resolution | FPS | Duration | Use Case |
|--------|-----------|-----|----------|----------|
| quick | 1280x720 | 30 | ~30s | Fast preview, iteration |
| standard | 1920x1080 | 60 | ~3 min | Presentations, demos |
| cinematic | 1920x1080 | 60 | ~4 min | YouTube, portfolio, publication |
| thumbnail | 1920x1080 | -- | 1 frame | Screenshots, badges |

Preset configs live at `configs/preset-<name>.conf`. The render script auto-calculates `--seconds-per-day` to hit the target duration based on repository date range.

## Multi-Repo Example

Combine multiple repositories into a single color-coded visualization:

```bash
# Merge logs with per-repo color coding
bash scripts/merge-repos.sh --color --output combined.log /path/to/repo-a /path/to/repo-b

# Render the combined log
bash scripts/render-video.sh --repo combined.log --preset cinematic --output team-history.mp4
```

See `references/multi-repo-guide.md` for namespace prefixing, color palettes, and chronological sorting details.

## Directory Structure

```
skills/gource-visualizer/
  SKILL.md                          # Skill definition (triggers, decision tree, workflows)
  README.md                         # This file
  scripts/
    install-gource.sh               # Idempotent installer for gource, ffmpeg, xvfb
    detect-repo.sh                  # VCS detection and metrics extraction (JSON)
    generate-log.sh                 # Single-repo Gource custom log generation
    merge-repos.sh                  # Multi-repo log merge with namespacing and color
    generate-captions.sh            # Git tags to Gource caption format
    resolve-avatars.sh              # GitHub API avatar fetcher with caching
    render-video.sh                 # Gource-to-ffmpeg render pipeline orchestrator
    render-headless.sh              # Xvfb wrapper for headless environments
  configs/
    preset-quick.conf               # 720p, 30fps, overview camera
    preset-standard.conf            # 1080p, 60fps, user highlights
    preset-cinematic.conf           # 1080p, 60fps, captions, bloom
    preset-thumbnail.conf           # 1080p, single frame capture
  references/
    installation-guide.md           # Platform-specific install procedures
    presets.md                      # Preset breakdown and parameter tuning
    ffmpeg-pipeline.md              # ffmpeg recipes for post-processing
    multi-repo-guide.md             # Multi-repo workflow with examples
    custom-log-format.md            # Gource custom log format specification
    option-reference.md             # Curated Gource option guide
  agents/
    installer.yaml                  # Dependency installation agent
    log-generator.yaml              # Log generation and merge agent
    renderer.yaml                   # Render pipeline agent
    deliverer.yaml                  # Output delivery agent
  tests/
    test-generate-log.sh            # Log generation tests
    test-generate-captions.sh       # Caption generation tests
    test-merge-repos.sh             # Multi-repo merge tests
    test-resolve-avatars.sh         # Avatar resolution tests
```

## Script Reference

| Script | Purpose | Key Arguments |
|--------|---------|---------------|
| `install-gource.sh` | Install gource + ffmpeg + xvfb | (none -- idempotent) |
| `detect-repo.sh` | VCS detection, metrics as JSON | `<repo-path>` |
| `generate-log.sh` | Git repo to Gource custom log | `<repo-path> [output-file]` |
| `merge-repos.sh` | Merge multi-repo logs | `[--color] [--output file] <repo>...` |
| `generate-captions.sh` | Git tags to caption format | `<repo-path> [output-file] [--include-merges]` |
| `resolve-avatars.sh` | GitHub avatar fetcher | `<repo-path> <output-dir>` |
| `render-video.sh` | Full render pipeline | `--repo <path> --preset <name> [--output file]` |
| `render-headless.sh` | Xvfb wrapper for servers | `"<command string>"` |

## Running Tests

```bash
bash tests/test-generate-log.sh
bash tests/test-generate-captions.sh
bash tests/test-merge-repos.sh
bash tests/test-resolve-avatars.sh
```

Tests use pure-bash harnesses with temporary git repositories as fixtures. No external test framework required.

## About Gource

[Gource](https://gource.io) is an open-source software version control visualization tool created by [Andrew Caudwell](https://github.com/acaudwell/Gource). It renders repository history as an animated tree with contributors navigating the file structure. Licensed under GPL-3.0.

## GSD Integration

This skill activates on prompts matching trigger intents such as "visualize repository history", "create a Gource video", "show me what we built", "code history video", or "project evolution animation". See `SKILL.md` for the full trigger list and decision tree.

The agent pipeline (installer, log-generator, renderer, deliverer) automates the full workflow from dependency installation through output delivery. For post-milestone visualization, the renderer reads git tag ranges to scope the video to a specific development period.
