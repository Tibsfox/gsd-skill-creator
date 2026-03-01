#!/bin/bash
# =============================================================================
# Sandbox Profile Generator Wrapper
# =============================================================================
#
# Wraps the Phase 368 Rust binary (gsd-sandbox-config) for sandbox profile
# generation. If the binary is not available, writes a stub profile JSON
# with bwrap_args that exclude credential directories.
#
# Usage:
#   generate-sandbox-profile.sh \
#     --project PROJECT_DIR \
#     --planning PLANNING_DIR \
#     --platform linux|macos|unsupported \
#     --output OUTPUT_JSON_PATH
#
# Production: replace stub with call to gsd-sandbox-config binary (Phase 368)
#
# Phase 373-01 / 516-03 — Bootstrap Phase 0
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
PROJECT_DIR=""
PLANNING_DIR=""
PLATFORM=""
OUTPUT=""

while [ $# -gt 0 ]; do
    case "$1" in
        --project)
            PROJECT_DIR="$2"
            shift 2
            ;;
        --planning)
            PLANNING_DIR="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        *)
            echo "[Phase0 ERROR] Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$PROJECT_DIR" ] || [ -z "$PLATFORM" ] || [ -z "$OUTPUT" ]; then
    echo "[Phase0 ERROR] Missing required arguments." >&2
    echo "Usage: generate-sandbox-profile.sh --project DIR --planning DIR --platform PLATFORM --output PATH" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Try production binary first
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_CONFIG_BIN="$SCRIPT_DIR/../../bin/gsd-sandbox-config"

if [ -x "$SANDBOX_CONFIG_BIN" ]; then
    # Production path: call Phase 368 Rust binary
    "$SANDBOX_CONFIG_BIN" \
        --project "$PROJECT_DIR" \
        --planning "${PLANNING_DIR:-}" \
        --platform "$PLATFORM" \
        --output "$OUTPUT"
    exit $?
fi

# ---------------------------------------------------------------------------
# Fallback: write stub profile JSON with safe bwrap_args
# ---------------------------------------------------------------------------
# Stub profiles MUST exclude credential directories (~/.ssh, ~/.aws,
# ~/.config/gcloud, ~/.gnupg) from bind mounts. Uses --tmpfs for these
# paths so programs don't get ENOENT but also can't read real keys.

GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
HOME_DIR="${HOME:-/tmp/home}"

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

cat > "$OUTPUT" << EOPROFILE
{
  "project_dir": "$PROJECT_DIR",
  "planning_dir": "${PLANNING_DIR:-}",
  "platform": "$PLATFORM",
  "generated_at": "$GENERATED_AT",
  "stub": true,
  "agent_type": "exec",
  "bwrap_args": [
    "bwrap",
    "--die-with-parent",
    "--cap-drop", "ALL",
    "--unshare-pid",
    "--unshare-uts",
    "--proc", "/proc",
    "--dev", "/dev",
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/bin", "/bin",
    "--ro-bind", "/sbin", "/sbin",
    "--ro-bind", "/etc", "/etc",
    "--ro-bind", "$PROJECT_DIR", "$PROJECT_DIR",
    "--tmpfs", "$HOME_DIR/.ssh",
    "--tmpfs", "$HOME_DIR/.aws",
    "--tmpfs", "$HOME_DIR/.config/gcloud",
    "--tmpfs", "$HOME_DIR/.gnupg"
  ],
  "note": "Stub profile — replace with Phase 368 gsd-sandbox-config binary output"
}
EOPROFILE
