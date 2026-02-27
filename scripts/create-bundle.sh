#!/usr/bin/env bash
# create-bundle.sh — Create a DACP bundle directory.
#
# Usage:
#   create-bundle.sh <priority> <opcode> <src> <dst> <intent_file> [options]
#
# Options:
#   --data <dir>       Directory of data files to include
#   --code <dir>       Directory of code scripts to include
#   --manifest <file>  Pre-built manifest.json (otherwise generated from args)
#   --output <dir>     Output directory (default: .planning/bus/messages/)
#   --help             Show usage
#
# Bundle layout:
#   {priority}-{YYYYMMDD-HHMMSS}-{opcode}-{src}-{dst}.bundle/
#     manifest.json   Bundle metadata
#     intent.md       Human-readable intent
#     data/           Structured data files (optional)
#     code/           Executable scripts (optional)
#     .complete       Atomicity marker (written last)
#
# Size limits:
#   manifest.json  <= 10KB
#   intent.md      <= 20KB
#   data/ total    <= 50KB
#   code/ per file <= 10KB
#   bundle total   <= 100KB

set -euo pipefail

# ============================================================================
# Constants
# ============================================================================

MAX_DATA_SIZE=51200       # 50KB
MAX_SCRIPT_SIZE=10240     # 10KB
MAX_MANIFEST_SIZE=10240   # 10KB
MAX_INTENT_SIZE=20480     # 20KB
MAX_BUNDLE_SIZE=102400    # 100KB

# ============================================================================
# Helpers
# ============================================================================

usage() {
  sed -n '2,/^$/s/^# \?//p' "$0"
  exit 0
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# Portable file size (bytes)
file_size() {
  wc -c < "$1" | tr -d ' '
}

# Portable directory total size (bytes)
dir_size() {
  local total=0
  local f
  for f in "$1"/*; do
    [ -f "$f" ] && total=$(( total + $(file_size "$f") ))
  done
  echo "$total"
}

# ============================================================================
# Argument parsing
# ============================================================================

[ $# -lt 1 ] && usage

case "${1:-}" in
  --help|-h) usage ;;
esac

[ $# -lt 5 ] && die "Expected at least 5 arguments: <priority> <opcode> <src> <dst> <intent_file>"

PRIORITY="$1"
OPCODE="$2"
SRC="$3"
DST="$4"
INTENT_FILE="$5"
shift 5

DATA_DIR=""
CODE_DIR=""
MANIFEST_FILE=""
OUTPUT_DIR=".planning/bus/messages/"

while [ $# -gt 0 ]; do
  case "$1" in
    --data)
      [ $# -lt 2 ] && die "--data requires a directory argument"
      DATA_DIR="$2"; shift 2 ;;
    --code)
      [ $# -lt 2 ] && die "--code requires a directory argument"
      CODE_DIR="$2"; shift 2 ;;
    --manifest)
      [ $# -lt 2 ] && die "--manifest requires a file argument"
      MANIFEST_FILE="$2"; shift 2 ;;
    --output)
      [ $# -lt 2 ] && die "--output requires a directory argument"
      OUTPUT_DIR="$2"; shift 2 ;;
    --help|-h) usage ;;
    *) die "Unknown option: $1" ;;
  esac
done

# ============================================================================
# Validation
# ============================================================================

# Priority must be 0-7
[[ "$PRIORITY" =~ ^[0-7]$ ]] || die "Priority must be 0-7, got: $PRIORITY"

# Opcode must be uppercase letters only
[[ "$OPCODE" =~ ^[A-Z]+$ ]] || die "Opcode must be uppercase letters, got: $OPCODE"

# src/dst must be lowercase with hyphens only
[[ "$SRC" =~ ^[a-z][a-z0-9-]*$ ]] || die "Source agent must be lowercase with hyphens, got: $SRC"
[[ "$DST" =~ ^[a-z][a-z0-9-]*$ ]] || die "Target agent must be lowercase with hyphens, got: $DST"

# Intent file must exist and be readable
[ -f "$INTENT_FILE" ] || die "Intent file not found: $INTENT_FILE"
[ -r "$INTENT_FILE" ] || die "Intent file not readable: $INTENT_FILE"

# Check intent file size
INTENT_SIZE=$(file_size "$INTENT_FILE")
[ "$INTENT_SIZE" -le "$MAX_INTENT_SIZE" ] || die "Intent file ($INTENT_SIZE bytes) exceeds ${MAX_INTENT_SIZE} byte limit"

# Validate data directory if provided
if [ -n "$DATA_DIR" ]; then
  [ -d "$DATA_DIR" ] || die "Data directory not found: $DATA_DIR"
  DATA_TOTAL=$(dir_size "$DATA_DIR")
  [ "$DATA_TOTAL" -le "$MAX_DATA_SIZE" ] || die "Data directory ($DATA_TOTAL bytes) exceeds ${MAX_DATA_SIZE} byte limit"
fi

# Validate code directory if provided
if [ -n "$CODE_DIR" ]; then
  [ -d "$CODE_DIR" ] || die "Code directory not found: $CODE_DIR"
  for f in "$CODE_DIR"/*; do
    [ -f "$f" ] || continue
    FSIZE=$(file_size "$f")
    [ "$FSIZE" -le "$MAX_SCRIPT_SIZE" ] || die "Script $(basename "$f") ($FSIZE bytes) exceeds ${MAX_SCRIPT_SIZE} byte limit"
  done
fi

# Validate manifest file if provided
if [ -n "$MANIFEST_FILE" ]; then
  [ -f "$MANIFEST_FILE" ] || die "Manifest file not found: $MANIFEST_FILE"
  MSIZE=$(file_size "$MANIFEST_FILE")
  [ "$MSIZE" -le "$MAX_MANIFEST_SIZE" ] || die "Manifest ($MSIZE bytes) exceeds ${MAX_MANIFEST_SIZE} byte limit"
  # Validate JSON syntax
  if command -v jq >/dev/null 2>&1; then
    jq . "$MANIFEST_FILE" >/dev/null 2>&1 || die "Manifest is not valid JSON"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import json; json.load(open('$MANIFEST_FILE'))" 2>/dev/null || die "Manifest is not valid JSON"
  fi
fi

# ============================================================================
# Build bundle
# ============================================================================

TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
BUNDLE_NAME="${PRIORITY}-${TIMESTAMP}-${OPCODE}-${SRC}-${DST}.bundle"
PRIORITY_DIR="${OUTPUT_DIR}/priority-${PRIORITY}"
BUNDLE_PATH="${PRIORITY_DIR}/${BUNDLE_NAME}"

# Create bundle directory hierarchy
mkdir -p "$BUNDLE_PATH"

# Determine fidelity level if no manifest provided
if [ -z "$MANIFEST_FILE" ]; then
  FIDELITY=0
  if [ -n "$DATA_DIR" ] && [ -n "$CODE_DIR" ]; then
    FIDELITY=2
  elif [ -n "$DATA_DIR" ]; then
    FIDELITY=1
  fi

  # Extract first line of intent as summary
  INTENT_SUMMARY=$(head -n1 "$INTENT_FILE" | sed 's/^#\+ *//')

  # Generate minimal manifest
  cat > "${BUNDLE_PATH}/manifest.json" <<MANIFEST
{
  "version": "1.0.0",
  "fidelity_level": ${FIDELITY},
  "source_agent": "${SRC}",
  "target_agent": "${DST}",
  "opcode": "${OPCODE}",
  "intent_summary": "${INTENT_SUMMARY}",
  "human_origin": {
    "vision_doc": "",
    "planning_phase": "",
    "user_directive": ""
  },
  "data_manifest": {},
  "code_manifest": {},
  "assembly_rationale": {
    "level_justification": "Auto-generated by create-bundle.sh",
    "skills_used": [],
    "generated_artifacts": [],
    "reused_artifacts": []
  },
  "provenance": {
    "assembled_by": "create-bundle.sh",
    "assembled_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "skill_versions": {}
  }
}
MANIFEST
else
  cp "$MANIFEST_FILE" "${BUNDLE_PATH}/manifest.json"
fi

# Copy intent file
cp "$INTENT_FILE" "${BUNDLE_PATH}/intent.md"

# Copy data files if provided
if [ -n "$DATA_DIR" ]; then
  mkdir -p "${BUNDLE_PATH}/data"
  cp "$DATA_DIR"/* "${BUNDLE_PATH}/data/" 2>/dev/null || true
fi

# Copy code files if provided
if [ -n "$CODE_DIR" ]; then
  mkdir -p "${BUNDLE_PATH}/code"
  for f in "$CODE_DIR"/*; do
    [ -f "$f" ] || continue
    cp "$f" "${BUNDLE_PATH}/code/"
    chmod +x "${BUNDLE_PATH}/code/$(basename "$f")"
  done
fi

# Check total bundle size before completing
TOTAL_SIZE=$(dir_size "$BUNDLE_PATH")
# Add subdirectory sizes
for subdir in data code; do
  [ -d "${BUNDLE_PATH}/${subdir}" ] && TOTAL_SIZE=$(( TOTAL_SIZE + $(dir_size "${BUNDLE_PATH}/${subdir}") ))
done

if [ "$TOTAL_SIZE" -gt "$MAX_BUNDLE_SIZE" ]; then
  rm -rf "$BUNDLE_PATH"
  die "Total bundle size ($TOTAL_SIZE bytes) exceeds ${MAX_BUNDLE_SIZE} byte limit — removed partial bundle"
fi

# Write .complete marker LAST for atomicity
echo "" > "${BUNDLE_PATH}/.complete"

# Output the full bundle path
echo "$BUNDLE_PATH"
