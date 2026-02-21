#!/usr/bin/env bash
# render-pxe-menu.sh -- Render template files by substituting ${VAR} placeholders
#
# A general-purpose template renderer that replaces ${VAR} placeholders with
# values from a local-values YAML file. Shared across PXE menus, dnsmasq config,
# kickstart files, and other template-driven configs.
#
# Variable mapping: template ${UPPER_VAR} -> values file lower_var
# Example: template ${KICKSTART_SERVER_URL} -> values kickstart_server_url
#
# Usage: render-pxe-menu.sh --template PATH --values PATH --output PATH [--help]
#
# Exit codes:
#   0 -- Success (template rendered)
#   1 -- Missing required argument or variable
#   2 -- File not found

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Defaults ---
TEMPLATE_PATH=""
VALUES_PATH=""
OUTPUT_PATH=""

# --- Colors (if terminal supports them) ---
if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# --- Helper functions (log to stderr) ---
info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --template PATH --values PATH --output PATH

Render a template file by substituting \${VAR} placeholders with values
from a local-values YAML file.

Options:
  --template PATH    Path to template file (required)
  --values PATH      Path to local-values YAML file (required)
  --output PATH      Path to write rendered output (required)
  --help             Show this help message

Variable Mapping:
  Template variables use UPPER_SNAKE_CASE: \${KICKSTART_SERVER_URL}
  Values file uses lower_snake_case:       kickstart_server_url: "value"

  The renderer lowercases the template variable name to find the matching
  key in the values file. Quoted and unquoted values are both supported.

Values File Format:
  key: "value"       # quoted value (quotes stripped)
  key: value         # unquoted value
  # comment          # comments and blank lines ignored

Examples:
  ${SCRIPT_NAME} \\
    --template infra/templates/pxe/pxelinux.cfg-default.template \\
    --values infra/local/pxe-boot.local-values \\
    --output /var/lib/tftpboot/pxelinux.cfg/default

  ${SCRIPT_NAME} \\
    --template infra/templates/dnsmasq/pxe-boot.conf.template \\
    --values infra/local/pxe-boot.local-values \\
    --output /etc/dnsmasq.d/pxe-boot.conf
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --template)
            TEMPLATE_PATH="${2:?'--template requires a path argument'}"
            shift 2
            ;;
        --values)
            VALUES_PATH="${2:?'--values requires a path argument'}"
            shift 2
            ;;
        --output)
            OUTPUT_PATH="${2:?'--output requires a path argument'}"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            die "Unknown option: $1 (use --help for usage)"
            ;;
    esac
done

# --- Validate required arguments ---
if [[ -z "${TEMPLATE_PATH}" ]]; then
    die "Missing required argument: --template (use --help for usage)"
fi
if [[ -z "${VALUES_PATH}" ]]; then
    die "Missing required argument: --values (use --help for usage)"
fi
if [[ -z "${OUTPUT_PATH}" ]]; then
    die "Missing required argument: --output (use --help for usage)"
fi

# --- Validate files exist ---
if [[ ! -f "${TEMPLATE_PATH}" ]]; then
    die "Template file not found: ${TEMPLATE_PATH}"
fi
if [[ ! -f "${VALUES_PATH}" ]]; then
    die "Values file not found: ${VALUES_PATH}"
fi

# --- Parse values file into associative array ---
declare -A VALUES
value_count=0

info "Reading values from: ${VALUES_PATH}"

while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines
    [[ "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" =~ ^[[:space:]]*$ ]] && continue

    # Parse key: "value" or key: value
    if [[ "${line}" =~ ^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*:[[:space:]]*\"(.*)\"[[:space:]]*$ ]]; then
        # Quoted value: key: "value"
        key="${BASH_REMATCH[1]}"
        val="${BASH_REMATCH[2]}"
    elif [[ "${line}" =~ ^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*:[[:space:]]*(.+)[[:space:]]*$ ]]; then
        # Unquoted value: key: value
        key="${BASH_REMATCH[1]}"
        val="${BASH_REMATCH[2]}"
        # Trim trailing whitespace
        val="${val%"${val##*[![:space:]]}"}"
    else
        warn "Skipping unparseable line: ${line}"
        continue
    fi

    # Store as lowercase key
    key_lower="${key,,}"
    VALUES["${key_lower}"]="${val}"
    value_count=$((value_count + 1))
done < "${VALUES_PATH}"

info "Loaded ${value_count} values from values file"

# --- Read template and substitute variables ---
info "Rendering template: ${TEMPLATE_PATH}"

template_content=$(<"${TEMPLATE_PATH}")
sub_count=0
missing_vars=()

# Find all ${VAR_NAME} references in the template
# Require at least one underscore to distinguish real variables from stray text
# All template variables use UPPER_SNAKE_CASE (e.g., KICKSTART_SERVER_URL)
var_names=$(echo "${template_content}" | grep -oP '\$\{[A-Z][A-Z0-9]*_[A-Z0-9_]+\}' | sort -u || true)

for var_ref in ${var_names}; do
    # Extract variable name from ${VAR}
    var_name="${var_ref#\$\{}"
    var_name="${var_name%\}}"

    # Convert to lowercase for lookup
    key_lower="${var_name,,}"

    if [[ -v "VALUES[${key_lower}]" ]]; then
        value="${VALUES[${key_lower}]}"
        # Use bash parameter expansion for substitution (no sed escaping needed)
        template_content="${template_content//\$\{${var_name}\}/${value}}"
        sub_count=$((sub_count + 1))
        info "  ${var_ref} -> ${value}"
    else
        missing_vars+=("${var_name}")
    fi
done

# --- Check for missing variables ---
if [[ ${#missing_vars[@]} -gt 0 ]]; then
    error "Missing variables in values file:"
    for mv in "${missing_vars[@]}"; do
        error "  \${${mv}} -> expected key: ${mv,,}"
    done
    die "Add the missing keys to ${VALUES_PATH} and retry."
fi

# --- Write output ---
# Create output directory if needed
output_dir="$(dirname "${OUTPUT_PATH}")"
if [[ ! -d "${output_dir}" ]]; then
    mkdir -p "${output_dir}"
    info "Created directory: ${output_dir}"
fi

# Write to temp file first, then move atomically
tmp_output="${OUTPUT_PATH}.tmp.$$"
echo "${template_content}" > "${tmp_output}"
mv "${tmp_output}" "${OUTPUT_PATH}"

ok "Rendered output written to: ${OUTPUT_PATH}"

# --- Summary (to stdout) ---
echo ""
echo "Template rendering complete:"
echo "  Template:  ${TEMPLATE_PATH}"
echo "  Values:    ${VALUES_PATH}"
echo "  Output:    ${OUTPUT_PATH}"
echo "  Variables: ${sub_count} substituted"
