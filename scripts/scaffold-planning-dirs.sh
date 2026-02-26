#!/usr/bin/env bash
# scaffold-planning-dirs.sh -- Create .planning/ directory tree for GSD-OS
# Idempotent: safe to run multiple times.
set -euo pipefail

BASE="${1:-.planning}"

dirs=(
  "$BASE/conversations"
  "$BASE/staging/intake"
  "$BASE/staging/processed"
  "$BASE/staging/quarantine"
  "$BASE/missions"
  "$BASE/console/inbox/pending"
  "$BASE/console/outbox/status"
  "$BASE/console/outbox/questions"
  "$BASE/console/outbox/notifications"
  "$BASE/config"
)

for d in "${dirs[@]}"; do
  mkdir -p "$d"
done

echo "scaffold complete: ${#dirs[@]} directories ensured under $BASE"
