#!/usr/bin/env bash
# scripts/verify-sandbox.sh — Convenience wrapper (SSH-07)
# Delegates to the actual verification script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/security/verify-sandbox.sh" "$@"
