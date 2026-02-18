---
name: asset-conversion
description: "Converts Amiga file formats (IFF/ILBM to PNG, MOD/MED to WAV/FLAC/OGG) with metadata extraction, batch processing, and YAML asset catalog generation. Use when converting Amiga files, batch processing assets, or generating asset catalogs."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "convert.*(iff|ilbm|mod|med|amiga)"
          - "asset.*(convert|catalog|batch)"
          - "batch.*convert"
          - "amiga.*file"
        files:
          - "infra/scripts/convert-ilbm.sh"
          - "infra/scripts/convert-tracker.sh"
          - "infra/scripts/batch-convert.sh"
          - "infra/scripts/generate-asset-catalog.sh"
        contexts:
          - "asset conversion"
          - "amiga file processing"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "04-amiga-emulation"
      phase_origin: "184"
---

# Asset Conversion

## Purpose

Converts Amiga-native file formats to modern equivalents while preserving metadata. Handles IFF/ILBM images (to PNG with metadata sidecar), MOD/MED tracker music (to WAV/FLAC/OGG), and provides batch processing with YAML asset catalog generation. Supports the Knowledge World exhibit pipeline by converting Amiga content for in-game display references.

## Capabilities

- Binary IFF parser: extracts BMHD, CMAP, CAMG chunks using `od` for metadata before conversion
- HAM/EHB mode detection via CAMG chunk flags with 6-bitplane heuristic fallback
- MOD header parsing prioritized over ffprobe for module-specific metadata (channels, samples, patterns)
- pipefail-safe ffmpeg demuxer detection: capture to variable first, then grep (avoids SIGPIPE)
- Metadata sidecar files (.meta.yaml) with format-specific details
- Move (not copy) meta sidecar files to centralized meta/ directory to prevent catalog duplication
- Awk-based flattened YAML parser (section.key=value) for bash metadata consumption
- LC_ALL=C sort for locale-independent catalog entry ordering
- Batch processing with parallel conversion support
- YAML asset catalog generation from converted files

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/convert-ilbm.sh` | IFF/ILBM to PNG conversion with metadata extraction |
| `infra/scripts/convert-tracker.sh` | MOD/MED to WAV/FLAC/OGG conversion |
| `infra/scripts/batch-convert.sh` | Batch processing with parallel conversion |
| `infra/scripts/generate-asset-catalog.sh` | YAML catalog generation from converted assets |

## Dependencies

- `ffmpeg` for image and audio format conversion
- `od` for binary IFF chunk parsing
- `python3` with `struct` module for test fixture generation
- No external YAML libraries -- awk-based parsing

## Usage Examples

**Convert a single IFF image:**
```bash
infra/scripts/convert-ilbm.sh input.iff output.png
# Produces: output.png + output.meta.yaml with format details
```

**Convert tracker music:**
```bash
infra/scripts/convert-tracker.sh input.mod output.flac
# Produces: output.flac + output.meta.yaml with channel/sample info
```

**Batch convert a directory:**
```bash
infra/scripts/batch-convert.sh /path/to/amiga/files /path/to/output
# Converts all supported files, generates asset catalog
```

**Generate asset catalog:**
```bash
infra/scripts/generate-asset-catalog.sh /path/to/converted
# Produces: catalog.yaml with all converted assets
```

## Test Cases

### Test 1: IFF conversion with metadata
- **Input:** Create test IFF fixture (via python3 struct), run `convert-ilbm.sh`
- **Expected:** PNG output and .meta.yaml sidecar with BMHD dimensions, color count, mode flags
- **Verify:** Output PNG exists and meta.yaml contains `width:`, `height:`, `planes:` fields

### Test 2: HAM mode detection
- **Input:** Convert IFF with HAM6 CAMG flag set
- **Expected:** Metadata reports HAM mode detected
- **Verify:** `grep 'mode:' output.meta.yaml` contains "HAM"

### Test 3: Batch conversion catalog
- **Input:** Run batch-convert.sh on directory with mixed IFF and MOD files
- **Expected:** All files converted, catalog.yaml generated with LC_ALL=C sorted entries
- **Verify:** `wc -l catalog.yaml` matches number of converted files plus header

## Token Budget Rationale

2% budget reflects four scripts with complex binary parsing logic (IFF chunk extraction, MOD header parsing), format-specific conversion pipelines, and catalog generation. The binary format handling and metadata extraction logic require sufficient context for debugging conversion issues.
