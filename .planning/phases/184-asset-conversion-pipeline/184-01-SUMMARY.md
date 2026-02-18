---
phase: 184-asset-conversion-pipeline
plan: 01
subsystem: infra
tags: [amiga, iff, ilbm, mod, med, png, wav, flac, ogg, netpbm, ffmpeg, libopenmpt, tracker-music, pixel-art]

requires:
  - phase: 183-amiga-application-profiles
    provides: "Bidirectional host-UAE file exchange with from-amiga/iff/ and from-amiga/mod/ directories"
provides:
  - "IFF/ILBM to PNG converter with palette metadata extraction (ilbmtoppm + ImageMagick fallback)"
  - "MOD/MED to WAV/FLAC/OGG renderer with module metadata extraction (ffmpeg+libopenmpt + openmpt123 fallback)"
  - "YAML metadata sidecars for both image and audio conversions"
  - "Package name mappings for netpbm, ImageMagick, ffmpeg, libopenmpt, flac, vorbis-tools"
  - "77-assertion combined test suite validating both converters"
affects: [184-02-batch-pipeline, amiga-creative-workflow]

tech-stack:
  added: [netpbm, ilbmtoppm, pnmtopng, ffmpeg-libopenmpt, flac, vorbis-tools]
  patterns: [iff-binary-parsing, mod-header-parsing, yaml-metadata-sidecar, tool-detection-cascade, pipefail-safe-grep]

key-files:
  created:
    - infra/scripts/convert-ilbm.sh
    - infra/scripts/convert-tracker.sh
    - infra/tests/test-convert-ilbm.sh
    - infra/tests/test-convert-tracker.sh
  modified:
    - infra/scripts/lib/pkg-names.sh

key-decisions:
  - "Binary IFF parser extracts BMHD, CMAP, CAMG chunks using od for metadata before conversion"
  - "MOD header parsing prioritized over ffprobe for module-specific metadata (channels, samples, patterns)"
  - "pipefail-safe ffmpeg demuxer detection: capture to variable first, then grep (avoids SIGPIPE)"
  - "HAM/EHB mode detection via CAMG chunk flags with 6-bitplane heuristic fallback"
  - "python3 struct module used for test IFF fixture generation (reliable binary construction)"

patterns-established:
  - "Tool detection cascade: primary tool -> secondary -> tertiary -> error with install instructions"
  - "YAML metadata sidecar pattern: source + domain-specific fields + conversion provenance alongside output file"
  - "pipefail-safe pipe pattern: capture command output to variable before grepping to avoid SIGPIPE"
  - "Test fixture generation via python3 for exact binary control in bash test suites"

requirements-completed: [AMIGA-07, AMIGA-08]

duration: 14min
completed: 2026-02-18
---

# Phase 184 Plan 01: Asset Conversion Pipeline - Individual Converters Summary

**IFF/ILBM to PNG and MOD/MED to WAV/FLAC/OGG converters with binary metadata parsing, YAML sidecars, and 77-assertion test suites**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-18T22:12:56Z
- **Completed:** 2026-02-18T22:27:36Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 1

## Accomplishments
- IFF/ILBM converter with binary chunk parser (BMHD, CMAP, CAMG) for exact metadata extraction including HAM/EHB mode detection
- MOD/MED renderer producing WAV/FLAC/OGG via ffmpeg+libopenmpt with openmpt123 and sox fallback chain
- Binary header parsers for MOD, MED, S3M, and XM formats extracting title, channels, patterns, samples
- YAML metadata sidecars preserve full provenance: source dimensions/palette/channels, conversion tool, timestamps
- Package name mappings for 7 new packages across dnf, apt, and pacman backends
- 77 combined assertions across two test suites (37 IFF + 40 tracker), 100% pass rate

## Task Commits

Each task was committed atomically:

1. **Task 1: IFF/ILBM to PNG converter with palette metadata** - `0d3bccd` (feat)
2. **Task 2: MOD/MED to WAV/FLAC/OGG renderer with metadata** - `f098cfb` (feat)

## Files Created/Modified
- `infra/scripts/convert-ilbm.sh` - IFF/ILBM to PNG/TIFF converter with ilbmtoppm, ImageMagick, GraphicsMagick fallback (641 lines)
- `infra/scripts/convert-tracker.sh` - MOD/MED to WAV/FLAC/OGG renderer with ffmpeg, openmpt123, sox fallback (950 lines)
- `infra/tests/test-convert-ilbm.sh` - 37-assertion test suite for IFF converter (606 lines)
- `infra/tests/test-convert-tracker.sh` - 40-assertion test suite for tracker renderer (687 lines)
- `infra/scripts/lib/pkg-names.sh` - Added netpbm, ImageMagick, ffmpeg, libopenmpt, openmpt123, flac, vorbis-tools mappings

## Decisions Made
- Binary IFF parser uses `od` for byte-level reading of BMHD (dimensions, bitplanes, compression), CMAP (palette), and CAMG (display mode flags) chunks
- MOD header parsing always runs before ffprobe because ffprobe only reports rendered stereo channels, not original module channel count
- ffmpeg demuxer detection uses capture-then-grep pattern to avoid SIGPIPE failures with bash pipefail
- HAM mode detected via CAMG flag 0x800; EHB via 0x80; 6-bitplane heuristic as fallback when no CAMG present
- Test IFF fixtures use python3 struct module for exact binary construction (more reliable than bash printf for complex binary)
- Palette hex values are uppercase zero-padded (#0A00FF format) for consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pipefail SIGPIPE in ffmpeg demuxer detection**
- **Found during:** Task 2 (tracker converter)
- **Issue:** `ffmpeg -demuxers | grep -q libopenmpt` fails under bash pipefail because grep -q closes pipe early, sending SIGPIPE to ffmpeg
- **Fix:** Capture ffmpeg output to variable first, then grep the variable
- **Files modified:** infra/scripts/convert-tracker.sh, infra/tests/test-convert-tracker.sh
- **Verification:** Converter now correctly detects ffmpeg+libopenmpt as rendering tool

**2. [Rule 1 - Bug] Fixed test fixture IFF with byterun1 compression flag but uncompressed body**
- **Found during:** Task 1 (HAM mode test)
- **Issue:** Test HAM IFF file had compression=1 (byterun1) in BMHD but raw body data, causing ilbmtoppm decompression failure
- **Fix:** Set compression=0 in test fixture BMHD chunk to match actual body content
- **Files modified:** infra/tests/test-convert-ilbm.sh
- **Verification:** HAM mode test passes with correct metadata extraction

**3. [Rule 1 - Bug] Fixed metadata extraction order for tracker converter**
- **Found during:** Task 2 (metadata extraction test)
- **Issue:** ffprobe was called first but only returns rendered stream metadata (2 stereo channels), losing module-level channel count (4 for M.K. MOD)
- **Fix:** Always parse binary header first for module-specific fields, use ffprobe only as title supplement
- **Files modified:** infra/scripts/convert-tracker.sh
- **Verification:** Metadata correctly reports 4 channels for M.K. MOD files

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All fixes necessary for correct operation. No scope creep.

## Issues Encountered
- ppmtoilbm creates minimal IFF files (1 bitplane for solid color images) that don't exercise multi-bitplane metadata extraction -- solved by using python3 struct module for precise test fixture creation
- ffmpeg demuxer list grep incompatible with bash pipefail due to SIGPIPE -- solved with capture-then-grep pattern (documented as established pattern for future use)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both converters ready for Plan 02's batch conversion pipeline to orchestrate
- YAML sidecar format established for Plan 02's asset catalog generator to consume
- Package name mappings in place for automated tool installation
- Convert scripts handle missing tools gracefully with clear install instructions

## Self-Check: PASSED

All 5 files verified present. Both task commits (0d3bccd, f098cfb) verified in git log.

---
*Phase: 184-asset-conversion-pipeline*
*Completed: 2026-02-18*
