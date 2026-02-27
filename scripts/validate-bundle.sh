#!/usr/bin/env bash
# validate-bundle.sh — Validate a DACP bundle directory.
#
# Usage:
#   validate-bundle.sh <bundle_path>
#
# Validates:
#   1. Bundle path exists and is a directory
#   2. .complete atomicity marker exists
#   3. Required files: manifest.json, intent.md
#   4. manifest.json is valid JSON
#   5. Required manifest fields present
#   6. Fidelity-level consistency (data/ and code/ dirs)
#   7. Size limits (manifest 10KB, intent 20KB, data 50KB, code 10KB/file, total 100KB)
#   8. File references in manifest match actual files
#   9. Code file execute permissions
#
# Output: JSON to stdout
#   { "valid": true|false, "bundle": "<path>", "errors": [...], "warnings": [...] }
#
# Exit codes:
#   0 = valid (no errors, no warnings)
#   1 = invalid (errors found)
#   2 = valid with warnings only

set -euo pipefail

# ============================================================================
# Constants
# ============================================================================

MAX_MANIFEST_SIZE=10240    # 10KB
MAX_INTENT_SIZE=20480      # 20KB
MAX_DATA_SIZE=51200        # 50KB
MAX_SCRIPT_SIZE=10240      # 10KB
MAX_BUNDLE_SIZE=102400     # 100KB

# ============================================================================
# State
# ============================================================================

ERRORS=()
WARNINGS=()

add_error() {
  ERRORS+=("$1")
}

add_warning() {
  WARNINGS+=("$1")
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

# Extract JSON field value (simple string or number extraction)
json_field() {
  local file="$1"
  local field="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".$field // empty" "$file" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json, sys
try:
    d = json.load(open('$file'))
    v = d.get('$field')
    if v is not None: print(v)
except: pass
" 2>/dev/null
  fi
}

# Check if JSON field exists
json_has_field() {
  local file="$1"
  local field="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -e "has(\"$field\")" "$file" >/dev/null 2>&1
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json, sys
d = json.load(open('$file'))
sys.exit(0 if '$field' in d else 1)
" 2>/dev/null
  fi
}

# Extract manifest keys from a record field (data_manifest or code_manifest)
json_record_keys() {
  local file="$1"
  local field="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".$field // {} | keys[]" "$file" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json
d = json.load(open('$file'))
for k in d.get('$field', {}).keys(): print(k)
" 2>/dev/null
  fi
}

# ============================================================================
# Usage
# ============================================================================

if [ $# -lt 1 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  sed -n '2,/^$/s/^# \?//p' "$0"
  exit 0
fi

BUNDLE_PATH="$1"

# ============================================================================
# Validation checks
# ============================================================================

# 1. Existence: bundle_path exists and is a directory
if [ ! -d "$BUNDLE_PATH" ]; then
  add_error "Bundle path does not exist or is not a directory: $BUNDLE_PATH"
fi

# Only proceed with further checks if the directory exists
if [ -d "$BUNDLE_PATH" ]; then

  # 2. Completeness marker
  if [ ! -f "$BUNDLE_PATH/.complete" ]; then
    add_error "Incomplete bundle: .complete marker not found"
  fi

  # 3. Required files
  if [ ! -f "$BUNDLE_PATH/manifest.json" ]; then
    add_error "Required file missing: manifest.json"
  fi

  if [ ! -f "$BUNDLE_PATH/intent.md" ]; then
    add_error "Required file missing: intent.md"
  fi

  # 4. Manifest JSON validity (only if file exists)
  MANIFEST_VALID=false
  if [ -f "$BUNDLE_PATH/manifest.json" ]; then
    if command -v jq >/dev/null 2>&1; then
      if jq . "$BUNDLE_PATH/manifest.json" >/dev/null 2>&1; then
        MANIFEST_VALID=true
      else
        add_error "manifest.json is not valid JSON"
      fi
    elif command -v python3 >/dev/null 2>&1; then
      if python3 -c "import json; json.load(open('$BUNDLE_PATH/manifest.json'))" 2>/dev/null; then
        MANIFEST_VALID=true
      else
        add_error "manifest.json is not valid JSON"
      fi
    else
      add_warning "Cannot validate JSON: neither jq nor python3 available"
    fi
  fi

  # 5. Required manifest fields (only if manifest is valid JSON)
  if [ "$MANIFEST_VALID" = true ]; then
    REQUIRED_FIELDS="version fidelity_level source_agent target_agent opcode intent_summary"
    for field in $REQUIRED_FIELDS; do
      if ! json_has_field "$BUNDLE_PATH/manifest.json" "$field"; then
        add_error "Required manifest field missing: $field"
      fi
    done
  fi

  # 6. Fidelity consistency (warnings only)
  if [ "$MANIFEST_VALID" = true ]; then
    FIDELITY=$(json_field "$BUNDLE_PATH/manifest.json" "fidelity_level")
    if [ -n "$FIDELITY" ]; then
      if [ "$FIDELITY" -ge 1 ] 2>/dev/null && [ ! -d "$BUNDLE_PATH/data" ]; then
        add_warning "Fidelity level $FIDELITY expects data/ directory but none found"
      fi
      if [ "$FIDELITY" -ge 2 ] 2>/dev/null && [ ! -d "$BUNDLE_PATH/code" ]; then
        add_warning "Fidelity level $FIDELITY expects code/ directory but none found"
      fi
    fi
  fi

  # 7. Size limits
  if [ -f "$BUNDLE_PATH/manifest.json" ]; then
    MSIZE=$(file_size "$BUNDLE_PATH/manifest.json")
    if [ "$MSIZE" -gt "$MAX_MANIFEST_SIZE" ]; then
      add_error "manifest.json ($MSIZE bytes) exceeds ${MAX_MANIFEST_SIZE} byte limit"
    fi
  fi

  if [ -f "$BUNDLE_PATH/intent.md" ]; then
    ISIZE=$(file_size "$BUNDLE_PATH/intent.md")
    if [ "$ISIZE" -gt "$MAX_INTENT_SIZE" ]; then
      add_error "intent.md ($ISIZE bytes) exceeds ${MAX_INTENT_SIZE} byte limit"
    fi
  fi

  if [ -d "$BUNDLE_PATH/data" ]; then
    DATA_TOTAL=$(dir_size "$BUNDLE_PATH/data")
    if [ "$DATA_TOTAL" -gt "$MAX_DATA_SIZE" ]; then
      add_error "data/ directory ($DATA_TOTAL bytes) exceeds ${MAX_DATA_SIZE} byte limit"
    fi
  fi

  if [ -d "$BUNDLE_PATH/code" ]; then
    for f in "$BUNDLE_PATH/code"/*; do
      [ -f "$f" ] || continue
      FSIZE=$(file_size "$f")
      if [ "$FSIZE" -gt "$MAX_SCRIPT_SIZE" ]; then
        add_error "Script $(basename "$f") ($FSIZE bytes) exceeds ${MAX_SCRIPT_SIZE} byte limit"
      fi
    done
  fi

  # Total bundle size
  TOTAL_SIZE=0
  for f in "$BUNDLE_PATH"/*; do
    [ -f "$f" ] && TOTAL_SIZE=$(( TOTAL_SIZE + $(file_size "$f") ))
  done
  for subdir in data code; do
    if [ -d "$BUNDLE_PATH/$subdir" ]; then
      TOTAL_SIZE=$(( TOTAL_SIZE + $(dir_size "$BUNDLE_PATH/$subdir") ))
    fi
  done
  if [ "$TOTAL_SIZE" -gt "$MAX_BUNDLE_SIZE" ]; then
    add_error "Total bundle size ($TOTAL_SIZE bytes) exceeds ${MAX_BUNDLE_SIZE} byte limit"
  fi

  # 8. File references in manifest match actual files
  if [ "$MANIFEST_VALID" = true ]; then
    # Check data_manifest keys against data/ files
    while IFS= read -r key; do
      [ -z "$key" ] && continue
      if [ ! -f "$BUNDLE_PATH/data/$key" ]; then
        add_error "data_manifest references '$key' but file not found in data/"
      fi
    done < <(json_record_keys "$BUNDLE_PATH/manifest.json" "data_manifest")

    # Check code_manifest keys against code/ files
    while IFS= read -r key; do
      [ -z "$key" ] && continue
      if [ ! -f "$BUNDLE_PATH/code/$key" ]; then
        add_error "code_manifest references '$key' but file not found in code/"
      fi
    done < <(json_record_keys "$BUNDLE_PATH/manifest.json" "code_manifest")
  fi

  # 9. Code file execute permissions
  if [ -d "$BUNDLE_PATH/code" ]; then
    for f in "$BUNDLE_PATH/code"/*; do
      [ -f "$f" ] || continue
      case "$f" in *.sh) ;; *) continue ;; esac
      if [ ! -x "$f" ]; then
        add_warning "Script $(basename "$f") missing execute permission"
      fi
    done
  fi

fi

# ============================================================================
# Output JSON result
# ============================================================================

# Build errors JSON array
ERRORS_JSON="["
for i in "${!ERRORS[@]}"; do
  [ "$i" -gt 0 ] && ERRORS_JSON+=","
  # Escape quotes in error message
  escaped="${ERRORS[$i]//\"/\\\"}"
  ERRORS_JSON+="\"$escaped\""
done
ERRORS_JSON+="]"

# Build warnings JSON array
WARNINGS_JSON="["
for i in "${!WARNINGS[@]}"; do
  [ "$i" -gt 0 ] && WARNINGS_JSON+=","
  escaped="${WARNINGS[$i]//\"/\\\"}"
  WARNINGS_JSON+="\"$escaped\""
done
WARNINGS_JSON+="]"

# Determine validity
VALID="true"
if [ "${#ERRORS[@]}" -gt 0 ]; then
  VALID="false"
fi

# Escape bundle path
ESCAPED_PATH="${BUNDLE_PATH//\"/\\\"}"

echo "{\"valid\":$VALID,\"bundle\":\"$ESCAPED_PATH\",\"errors\":$ERRORS_JSON,\"warnings\":$WARNINGS_JSON}"

# Exit code
if [ "${#ERRORS[@]}" -gt 0 ]; then
  exit 1
elif [ "${#WARNINGS[@]}" -gt 0 ]; then
  exit 2
else
  exit 0
fi
