#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# ffmpeg Export Presets for Infrastructure Visualization
# Physical Infrastructure Engineering Pack (v1.48)
# ════════════════════════════════════════════════════════════════
#
# Usage:
#   source ffmpeg-presets.sh      # Load all functions into current shell
#   assemble_video                # Step 1: frames -> base video
#   add_audio                     # Step 2: add narration (optional)
#   export_all final.mp4          # Step 3: export all social media formats
#
# Or copy individual commands from this file.
#
# Requires: ffmpeg installed and in PATH (https://ffmpeg.org)
#
# Workflow:
#   1. Render animation frames from Blender:
#      File > Render > Render Animation
#      Default output: /tmp/ or the path set in render settings
#   2. Use assemble_video to create base video from frame sequence
#   3. Optionally add narration audio with add_audio
#   4. Use export functions for target platform(s)
#
# ════════════════════════════════════════════════════════════════

# ─── INPUT CONFIGURATION ──────────────────────────────────────
# Adjust these variables to match your Blender render output
INPUT_FRAMES="render_%04d.png"    # Blender default frame naming
INPUT_VIDEO="walkthrough.mp4"     # Assembled base video filename
INPUT_AUDIO="narration.mp3"       # Optional narration audio file
FRAMERATE=30                      # FPS — must match Blender render settings
OUTPUT_DIR="./exports"            # Directory for exported files

# ─── UTILITY ──────────────────────────────────────────────────

ensure_output_dir() {
    if [ ! -d "${OUTPUT_DIR}" ]; then
        mkdir -p "${OUTPUT_DIR}"
        echo "Created output directory: ${OUTPUT_DIR}"
    fi
}

# ─── STEP 1: ASSEMBLE FRAMES INTO BASE VIDEO ─────────────────
# Creates high-quality H.264 video from a rendered image sequence.
#
# Parameters:
#   -framerate: Input frame rate (must match Blender render settings)
#   -crf 18: Constant Rate Factor (0=lossless, 18=visually lossless, 23=default)
#   -preset slow: Better compression at cost of encoding time
#   -pix_fmt yuv420p: Required for compatibility with most players
#
assemble_video() {
    local frames="${1:-${INPUT_FRAMES}}"
    local output="${2:-${INPUT_VIDEO}}"
    echo "Assembling frames: ${frames} -> ${output}"
    ffmpeg \
        -framerate "${FRAMERATE}" \
        -i "${frames}" \
        -c:v libx264 \
        -preset slow \
        -crf 18 \
        -pix_fmt yuv420p \
        "${output}"
    echo "Base video created: ${output}"
    echo "  Duration: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${output}" 2>/dev/null)s"
}

# ─── STEP 2: ADD NARRATION AUDIO (OPTIONAL) ──────────────────
# Combines video with narration audio track.
# Video is copied without re-encoding (fast, no quality loss).
# Audio is encoded to AAC at 192 kbps (standard broadcast quality).
# -shortest: truncates to the shorter of video or audio.
#
add_audio() {
    local video="${1:-${INPUT_VIDEO}}"
    local audio="${2:-${INPUT_AUDIO}}"
    local output="${3:-final.mp4}"
    echo "Adding audio: ${video} + ${audio} -> ${output}"
    ffmpeg \
        -i "${video}" \
        -i "${audio}" \
        -c:v copy \
        -c:a aac \
        -b:a 192k \
        -shortest \
        "${output}"
    echo "Final video with audio: ${output}"
}

# ─── EXPORT 1: YOUTUBE (16:9, 1080p, H.264) ──────────────────
# YouTube recommended settings:
#   - Resolution: 1920x1080 (Full HD)
#   - Codec: H.264 (libx264)
#   - Bitrate: 8-12 Mbps for 1080p30
#   - Audio: AAC 192 kbps stereo
#   - Container: MP4
#
# The scale filter with pad ensures correct letterboxing if the
# source aspect ratio doesn't match 16:9.
#
export_youtube() {
    ensure_output_dir
    local input="${1:-final.mp4}"
    local output="${OUTPUT_DIR}/youtube_export.mp4"
    echo "Exporting for YouTube (1920x1080, ~8 Mbps)..."
    ffmpeg \
        -i "${input}" \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 \
        -preset slow \
        -crf 18 \
        -b:v 8M \
        -maxrate 10M \
        -bufsize 20M \
        -pix_fmt yuv420p \
        -c:a aac \
        -b:a 192k \
        "${output}"
    echo "YouTube export: ${output} (1920x1080, ~8 Mbps)"
}

# ─── EXPORT 2: INSTAGRAM REEL (9:16 PORTRAIT, 1080x1920) ─────
# Instagram Reels requirements:
#   - Resolution: 1080x1920 (portrait 9:16)
#   - Max duration: 60 seconds (feed) / 90 seconds (reel)
#   - Codec: H.264
#   - Max file size: 250 MB
#
# Landscape video is padded with black bars to fit portrait frame.
# Duration limited to 60 seconds for feed compatibility.
#
export_instagram_reel() {
    ensure_output_dir
    local input="${1:-final.mp4}"
    local output="${OUTPUT_DIR}/instagram_reel.mp4"
    echo "Exporting for Instagram Reel (1080x1920, portrait)..."
    ffmpeg \
        -i "${input}" \
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -b:v 3.5M \
        -pix_fmt yuv420p \
        -c:a aac \
        -b:a 128k \
        -t 60 \
        "${output}"
    echo "Instagram Reel: ${output} (1080x1920, portrait, max 60s)"
}

# ─── EXPORT 3: TWITTER/X (16:9, 720p, MAX 2:20) ─────────────
# Twitter/X video requirements:
#   - Resolution: 1280x720 (HD)
#   - Max duration: 2 minutes 20 seconds (140 seconds)
#   - Max file size: 512 MB
#   - Codec: H.264
#
export_twitter() {
    ensure_output_dir
    local input="${1:-final.mp4}"
    local output="${OUTPUT_DIR}/twitter_export.mp4"
    echo "Exporting for Twitter/X (1280x720, max 2:20)..."
    ffmpeg \
        -i "${input}" \
        -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -b:v 5M \
        -pix_fmt yuv420p \
        -c:a aac \
        -b:a 128k \
        -t 140 \
        "${output}"
    echo "Twitter/X export: ${output} (1280x720, max 2:20)"
}

# ─── EXPORT 4: THUMBNAIL (JPEG STILL FRAME, 1280x720) ────────
# Extracts a single frame for use as a video thumbnail.
#
# Parameters:
#   $1: Input video (default: final.mp4)
#   $2: Timestamp to extract (default: 00:00:05 — 5 seconds in)
#
# Choose a visually compelling frame that shows the infrastructure
# clearly — typically an overview angle or detail shot with good
# lighting and material visibility.
#
export_thumbnail() {
    ensure_output_dir
    local input="${1:-final.mp4}"
    local timestamp="${2:-00:00:05}"
    local output="${OUTPUT_DIR}/thumbnail.jpg"
    echo "Extracting thumbnail at ${timestamp}..."
    ffmpeg \
        -i "${input}" \
        -ss "${timestamp}" \
        -frames:v 1 \
        -vf "scale=1280:720" \
        -q:v 2 \
        "${output}"
    echo "Thumbnail: ${output} (1280x720 JPEG, q=2)"
}

# ─── QUICK ALL-FORMATS EXPORT ────────────────────────────────
# Exports all four social media formats from a single input video.
#
# Usage:
#   export_all                    # Uses final.mp4
#   export_all my_render.mp4     # Uses specified file
#
export_all() {
    local input="${1:-final.mp4}"
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  Exporting all social media formats"
    echo "  Input: ${input}"
    echo "  Output: ${OUTPUT_DIR}/"
    echo "════════════════════════════════════════════════════════"
    echo ""

    export_youtube "${input}"
    echo ""
    export_instagram_reel "${input}"
    echo ""
    export_twitter "${input}"
    echo ""
    export_thumbnail "${input}" "00:00:05"

    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  All exports complete. Files in: ${OUTPUT_DIR}/"
    echo ""
    echo "  youtube_export.mp4      1920x1080  ~8 Mbps"
    echo "  instagram_reel.mp4      1080x1920  portrait"
    echo "  twitter_export.mp4      1280x720   max 2:20"
    echo "  thumbnail.jpg           1280x720   JPEG"
    echo "════════════════════════════════════════════════════════"
}

# ─── USAGE EXAMPLES ──────────────────────────────────────────
#
# Full workflow:
#   source ffmpeg-presets.sh
#   assemble_video                          # Step 1
#   add_audio                               # Step 2 (optional)
#   export_all final.mp4                    # Step 3
#
# Individual exports:
#   export_youtube final.mp4
#   export_instagram_reel final.mp4
#   export_twitter final.mp4
#   export_thumbnail final.mp4 "00:00:10"  # Custom timestamp
#
# Custom frame rate:
#   FRAMERATE=25 assemble_video             # For 25fps renders
#
# Custom output directory:
#   OUTPUT_DIR="./social" export_all final.mp4
#
# ════════════════════════════════════════════════════════════════
