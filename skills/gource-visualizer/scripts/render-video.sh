#!/usr/bin/env bash
# =============================================================================
# render-video.sh -- Gource -> ffmpeg pipeline orchestration for all presets
# =============================================================================
#
# Produces MP4 (H.264) or WebM (VP9) videos from repository history by
# piping Gource PPM output into ffmpeg. Supports all four preset configs,
# auto-calculates seconds-per-day from repo metrics, and handles headless
# environments via render-headless.sh.
#
# Usage: render-video.sh --repo <path> --preset <name> [options]
#
# Required:
#   --repo <path>             Repository directory or .log file
#   --preset <name>           quick|standard|cinematic|thumbnail
#
# Optional:
#   --output <path>           Output file (default: ./gource-output.mp4)
#   --title "text"            Video title overlay
#   --logo <path>             Logo image path
#   --caption-file <path>     Gource caption file
#   --avatar-dir <path>       User avatar image directory
#   --format mp4|webm         Output format (default: mp4)
#   --headless                Force headless via Xvfb
#   --start-date "YYYY-MM-DD" Filter start date
#   --stop-date "YYYY-MM-DD"  Filter stop date
#   --seconds-per-day <float> Override auto timing calculation
#   --background <hex>        Background color (default: 000000)
#   --help                    Show this help message
#
# Exit codes:
#   0 - Success
#   1 - Invalid arguments or input
#   2 - Gource not found
#   3 - ffmpeg not found
#   4 - Gource rendering failed
#   5 - ffmpeg encoding failed
#   6 - Output verification failed
#
# Phase 400-01 -- Render Pipeline
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$SCRIPT_DIR/.."

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[render] ERROR: $*" >&2
}

info() {
    echo "[render] $*" >&2
}

# ---------------------------------------------------------------------------
# Cleanup trap
# ---------------------------------------------------------------------------

GOURCE_PID=""
FFMPEG_PID=""

# shellcheck disable=SC2329
cleanup() {
    if [[ -n "$GOURCE_PID" ]]; then
        kill "$GOURCE_PID" 2>/dev/null || true
    fi
    if [[ -n "$FFMPEG_PID" ]]; then
        kill "$FFMPEG_PID" 2>/dev/null || true
    fi
}

trap 'cleanup' INT TERM EXIT

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
render-video.sh -- Gource -> ffmpeg pipeline orchestration

Usage: render-video.sh --repo <path> --preset <name> [options]

Required:
  --repo <path>             Repository directory or .log file
  --preset <name>           quick|standard|cinematic|thumbnail

Optional:
  --output <path>           Output file (default: ./gource-output.mp4)
  --title "text"            Video title overlay
  --logo <path>             Logo image path
  --caption-file <path>     Gource caption file
  --avatar-dir <path>       User avatar image directory
  --format mp4|webm         Output format (default: mp4)
  --headless                Force headless via Xvfb
  --start-date "YYYY-MM-DD" Filter start date
  --stop-date "YYYY-MM-DD"  Filter stop date
  --seconds-per-day <float> Override auto timing calculation
  --background <hex>        Background color (default: 000000)
  --help                    Show this help message

Exit codes:
  0  Success
  1  Invalid arguments or input
  2  Gource not found
  3  ffmpeg not found
  4  Gource rendering failed
  5  ffmpeg encoding failed
  6  Output verification failed

Examples:
  render-video.sh --repo . --preset quick
  render-video.sh --repo /path/to/repo --preset cinematic --format webm
  render-video.sh --repo combined.log --preset standard --title "Our Project"
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

repo_path=""
preset=""
output=""
title=""
logo=""
caption_file=""
avatar_dir=""
format="mp4"
headless=false
start_date=""
stop_date=""
user_spd=""
background="000000"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo)
            if [[ $# -lt 2 ]]; then err "Missing argument for --repo"; exit 1; fi
            repo_path="$2"; shift 2 ;;
        --preset)
            if [[ $# -lt 2 ]]; then err "Missing argument for --preset"; exit 1; fi
            preset="$2"; shift 2 ;;
        --output)
            if [[ $# -lt 2 ]]; then err "Missing argument for --output"; exit 1; fi
            output="$2"; shift 2 ;;
        --title)
            if [[ $# -lt 2 ]]; then err "Missing argument for --title"; exit 1; fi
            title="$2"; shift 2 ;;
        --logo)
            if [[ $# -lt 2 ]]; then err "Missing argument for --logo"; exit 1; fi
            logo="$2"; shift 2 ;;
        --caption-file)
            if [[ $# -lt 2 ]]; then err "Missing argument for --caption-file"; exit 1; fi
            caption_file="$2"; shift 2 ;;
        --avatar-dir)
            if [[ $# -lt 2 ]]; then err "Missing argument for --avatar-dir"; exit 1; fi
            avatar_dir="$2"; shift 2 ;;
        --format)
            if [[ $# -lt 2 ]]; then err "Missing argument for --format"; exit 1; fi
            format="$2"; shift 2 ;;
        --headless)
            headless=true; shift ;;
        --start-date)
            if [[ $# -lt 2 ]]; then err "Missing argument for --start-date"; exit 1; fi
            start_date="$2"; shift 2 ;;
        --stop-date)
            if [[ $# -lt 2 ]]; then err "Missing argument for --stop-date"; exit 1; fi
            stop_date="$2"; shift 2 ;;
        --seconds-per-day)
            if [[ $# -lt 2 ]]; then err "Missing argument for --seconds-per-day"; exit 1; fi
            user_spd="$2"; shift 2 ;;
        --background)
            if [[ $# -lt 2 ]]; then err "Missing argument for --background"; exit 1; fi
            background="$2"; shift 2 ;;
        --help|-h)
            usage; exit 0 ;;
        *)
            err "Unknown option: $1"; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Validate required arguments
# ---------------------------------------------------------------------------

if [[ -z "$repo_path" ]]; then
    err "Missing required --repo argument"
    usage >&2
    exit 1
fi

if [[ -z "$preset" ]]; then
    err "Missing required --preset argument"
    usage >&2
    exit 1
fi

# Validate repo path: must be a directory or a .log file
if [[ ! -d "$repo_path" ]] && [[ ! -f "$repo_path" ]]; then
    err "Repository path does not exist: $repo_path"
    exit 1
fi

# Validate preset
case "$preset" in
    quick|standard|cinematic|thumbnail) ;;
    *)
        err "Invalid preset: $preset (must be quick|standard|cinematic|thumbnail)"
        exit 1
        ;;
esac

# Validate format
case "$format" in
    mp4|webm) ;;
    *)
        err "Invalid format: $format (must be mp4|webm)"
        exit 1
        ;;
esac

# Set default output based on format
if [[ -z "$output" ]]; then
    output="./gource-output.${format}"
fi

# Validate preset config exists
preset_conf="$PACK_DIR/configs/preset-${preset}.conf"
if [[ ! -f "$preset_conf" ]]; then
    err "Preset config not found: $preset_conf"
    exit 1
fi

# ---------------------------------------------------------------------------
# Check dependencies
# ---------------------------------------------------------------------------

if ! command -v gource >/dev/null 2>&1; then
    err "Gource not found. Install with: bash $PACK_DIR/scripts/install-gource.sh"
    exit 2
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    err "ffmpeg not found. Install with: bash $PACK_DIR/scripts/install-gource.sh"
    exit 3
fi

# ---------------------------------------------------------------------------
# Gather repository metrics (only for directory repos)
# ---------------------------------------------------------------------------

date_range=0
commit_count=0

if [[ -d "$repo_path" ]]; then
    if [[ -x "$PACK_DIR/scripts/detect-repo.sh" ]] && command -v jq >/dev/null 2>&1; then
        metrics=$("$PACK_DIR/scripts/detect-repo.sh" "$repo_path" 2>/dev/null || echo '{}')
        date_range=$(echo "$metrics" | jq -r '.date_range_days // 0')
        commit_count=$(echo "$metrics" | jq -r '.commit_count // 0')
    else
        # Fallback: compute date range from git log
        commit_count=$(git -C "$repo_path" rev-list --count HEAD 2>/dev/null || echo "0")
        commit_count=$(echo "$commit_count" | tr -d '[:space:]')
        first_epoch=$(git -C "$repo_path" log --reverse --format='%at' 2>/dev/null | head -1 || echo "0")
        last_epoch=$(git -C "$repo_path" log -1 --format='%at' 2>/dev/null || echo "0")
        if [[ "$first_epoch" -gt 0 ]] && [[ "$last_epoch" -gt 0 ]]; then
            diff_secs=$((last_epoch - first_epoch))
            if [[ "$diff_secs" -lt 0 ]]; then diff_secs=$((-diff_secs)); fi
            date_range=$((diff_secs / 86400))
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Calculate timing: seconds-per-day
# ---------------------------------------------------------------------------

# Preset target durations (seconds)
target_secs=180
case "$preset" in
    quick)     target_secs=30 ;;
    standard)  target_secs=180 ;;
    cinematic) target_secs=240 ;;
    thumbnail) target_secs=1 ;;
esac

spd=""
if [[ -n "$user_spd" ]]; then
    # User override
    spd="$user_spd"
elif [[ "$date_range" -gt 0 ]]; then
    # Auto-calculate from metrics
    spd=$(awk "BEGIN { v = $target_secs / $date_range; if (v < 0.01) v = 0.01; printf \"%.4f\", v }")
else
    # Fallback for .log files or repos with no date range
    spd="0.1"
fi

# ---------------------------------------------------------------------------
# Read fps from preset config
# ---------------------------------------------------------------------------

fps=$(grep "output-framerate" "$preset_conf" 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)
fps="${fps:-60}"

# Read viewport from preset config for progress display
viewport=$(grep "viewport" "$preset_conf" 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)
viewport="${viewport:-1920x1080}"

# ---------------------------------------------------------------------------
# Progress reporting
# ---------------------------------------------------------------------------

info "Preset: $preset ($viewport @ ${fps}fps)"
if [[ -d "$repo_path" ]] && [[ "$commit_count" -gt 0 ]]; then
    # Format date range with commas for readability
    formatted_days=$(printf "%'d" "$date_range" 2>/dev/null || echo "$date_range")
    formatted_commits=$(printf "%'d" "$commit_count" 2>/dev/null || echo "$commit_count")
    info "Repository: $formatted_commits commits over $formatted_days days"
    info "Timing: $spd seconds/day -> ~${target_secs}s target video"
else
    info "Input: $repo_path"
    info "Timing: $spd seconds/day"
fi
info "Format: $format"
info "Output: $output"

# ---------------------------------------------------------------------------
# Build Gource command
# ---------------------------------------------------------------------------

gource_cmd="gource"
gource_cmd+=" --load-config \"$preset_conf\""
gource_cmd+=" --seconds-per-day $spd"

# Optional arguments
if [[ -n "$title" ]]; then
    gource_cmd+=" --title \"$title\""
fi

if [[ -n "$logo" ]]; then
    gource_cmd+=" --logo \"$logo\""
fi

if [[ -n "$caption_file" ]]; then
    gource_cmd+=" --caption-file \"$caption_file\""
fi

if [[ -n "$avatar_dir" ]]; then
    gource_cmd+=" --user-image-dir \"$avatar_dir\""
fi

if [[ -n "$start_date" ]]; then
    gource_cmd+=" --start-date \"$start_date\""
fi

if [[ -n "$stop_date" ]]; then
    gource_cmd+=" --stop-date \"$stop_date\""
fi

if [[ "$background" != "000000" ]]; then
    gource_cmd+=" --background-colour $background"
fi

# Output to stdout as PPM stream
gource_cmd+=" -o -"

# Input path (last argument)
gource_cmd+=" \"$repo_path\""

# ---------------------------------------------------------------------------
# Build ffmpeg command
# ---------------------------------------------------------------------------

ffmpeg_cmd="ffmpeg -y -r $fps -f image2pipe -vcodec ppm -i -"

case "$format" in
    mp4)
        ffmpeg_cmd+=" -vcodec libx264 -preset medium -pix_fmt yuv420p -crf 18 -threads 0 -bf 0"
        ;;
    webm)
        ffmpeg_cmd+=" -vcodec libvpx -b:v 10000K"
        ;;
esac

ffmpeg_cmd+=" \"$output\""

# ---------------------------------------------------------------------------
# Execute pipeline
# ---------------------------------------------------------------------------

info "Rendering Gource -> ffmpeg pipeline..."

pipeline_cmd="$gource_cmd | $ffmpeg_cmd"

run_pipeline() {
    if [[ "$headless" = true ]] || [[ -z "${DISPLAY:-}" ]]; then
        if [[ -x "$PACK_DIR/scripts/render-headless.sh" ]]; then
            info "Headless mode: delegating to render-headless.sh"
            "$PACK_DIR/scripts/render-headless.sh" "$pipeline_cmd"
        else
            err "Headless rendering requires render-headless.sh but it was not found"
            exit 4
        fi
    else
        eval "$pipeline_cmd"
    fi
}

if ! run_pipeline; then
    # Determine which stage failed
    if [[ ! -f "$output" ]] || [[ ! -s "$output" ]]; then
        err "Gource rendering failed (no output produced)"
        exit 4
    else
        err "ffmpeg encoding failed"
        exit 5
    fi
fi

# ---------------------------------------------------------------------------
# Output verification
# ---------------------------------------------------------------------------

if [[ ! -f "$output" ]]; then
    err "Output file not created: $output"
    exit 6
fi

output_size=$(stat -c%s "$output" 2>/dev/null || stat -f%z "$output" 2>/dev/null || echo "0")
if [[ "$output_size" -eq 0 ]]; then
    err "Output file is empty: $output"
    exit 6
fi

# Human-readable file size
if command -v numfmt >/dev/null 2>&1; then
    human_size=$(numfmt --to=iec --suffix=B "$output_size")
elif command -v du >/dev/null 2>&1; then
    human_size=$(du -h "$output" | cut -f1)
else
    human_size="${output_size} bytes"
fi

# Extract video info via ffprobe if available
duration=""
resolution=""
codec=""
if command -v ffprobe >/dev/null 2>&1; then
    # Duration
    duration=$(ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null || echo "")
    if [[ -n "$duration" ]]; then
        # Format as M:SS
        dur_int=${duration%%.*}
        if [[ -n "$dur_int" ]] && [[ "$dur_int" -gt 0 ]]; then
            dur_min=$((dur_int / 60))
            dur_sec=$((dur_int % 60))
            duration=$(printf "%d:%02d" "$dur_min" "$dur_sec")
        fi
    fi

    # Resolution and codec
    resolution=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=width,height \
        -of csv=s=x:p=0 "$output" 2>/dev/null || echo "")
    codec=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=codec_name \
        -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null || echo "")
fi

# Build info string
info_parts="$human_size"
if [[ -n "$duration" ]]; then info_parts+=", $duration"; fi
if [[ -n "$resolution" ]]; then info_parts+=", $resolution"; fi
if [[ -n "$codec" ]]; then
    # Pretty-print codec name
    case "$codec" in
        h264) codec="H.264" ;;
        vp9)  codec="VP9" ;;
    esac
    info_parts+=", $codec"
fi

info "Output: $output ($info_parts)"

# ---------------------------------------------------------------------------
# Generate thumbnail (skip for thumbnail preset -- it IS the thumbnail)
# ---------------------------------------------------------------------------

output_dir=$(dirname "$output")

if [[ "$preset" != "thumbnail" ]]; then
    thumb_path="${output_dir}/thumbnail.png"
    if command -v ffmpeg >/dev/null 2>&1; then
        if ffmpeg -y -i "$output" -vf "select=eq(n\\,0)" -frames:v 1 "$thumb_path" 2>/dev/null; then
            info "Thumbnail: $thumb_path"
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Generate render summary
# ---------------------------------------------------------------------------

summary_path="${output_dir}/render-summary.md"
render_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

{
    echo "# Render Summary"
    echo ""
    echo "| Field | Value |"
    echo "|-------|-------|"
    echo "| Preset | $preset |"
    echo "| Resolution | ${resolution:-$viewport} |"
    echo "| Format | $format |"
    if [[ -n "$duration" ]]; then
        echo "| Duration | $duration |"
    fi
    echo "| File Size | $human_size |"
    if [[ -n "$codec" ]]; then
        echo "| Codec | $codec |"
    fi
    echo "| FPS | $fps |"
    echo "| Seconds/Day | $spd |"
    echo "| Repository | $repo_path |"
    if [[ "$commit_count" -gt 0 ]]; then
        echo "| Commits | $commit_count |"
        echo "| Date Range | $date_range days |"
    fi
    echo "| Generated | $render_date |"
    echo ""
    echo "## Command"
    echo ""
    echo '```bash'
    echo "$pipeline_cmd"
    echo '```'
} > "$summary_path"

info "Summary: $summary_path"
info "Done"

exit 0
