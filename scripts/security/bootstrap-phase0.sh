#!/bin/bash
# shellcheck disable=SC1091 # sourced files checked separately
# =============================================================================
# Bootstrap Phase 0 — Security Infrastructure Activation
# =============================================================================
#
# Runs BEFORE Claude Code connects. Activates all security infrastructure:
#   Step 0.1: Platform detection + dependency checks
#   Step 0.2: SSH key verification (find existing or offer ed25519 generation)
#   Step 0.3: Sandbox profile generation
#   Step 0.4: Credential proxy start + domain allowlist initialization
#   Step 0.5: Sandbox activation + verification
#   Step 0.6: Security LED (status.json + IPC event)
#
# Environment:
#   GSD_MAGIC_LEVEL  — Output verbosity (1=silent..5=diagnostic), default 3
#   SSH_REMOTE_CONTROL — Set to "1" or "true" for Remote Control sessions
#   SSH_AUTH_SOCK    — SSH agent socket (forwarded in Remote Control)
#
# Exit codes:
#   0 — Phase 0 complete, security LED green
#   1 — Phase 0 failed (dependency missing, sandbox verification failed, etc.)
#
# Phase 373-01 — Bootstrap Phase 0
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Directory setup
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLANNING_DIR="${PLANNING_DIR:-$PROJECT_DIR/.planning}"
SECURITY_DIR="${SECURITY_DIR:-$PLANNING_DIR/security}"
MAGIC_LEVEL="${GSD_MAGIC_LEVEL:-3}"

# Proxy socket location
PROXY_SOCKET="${PROXY_SOCKET:-$SECURITY_DIR/proxy.sock}"

# Ensure security directories exist
mkdir -p "$SECURITY_DIR/events" "$SECURITY_DIR/blocked"
mkdir -p "$PLANNING_DIR/events"

# Source helper functions
# shellcheck source=phase0-helpers.sh
source "$SCRIPT_DIR/phase0-helpers.sh"

# BST-09: Phase 0 targets <30s completion when deps pre-installed

# =============================================================================
# Step 0.1: Platform Detection + Dependency Checks (BST-03)
# =============================================================================
phase0_log "Step 0.1: Platform detection and dependency checks"

SANDBOX_PLATFORM="unsupported"
case "$(uname -s)" in
    Linux)
        SANDBOX_PLATFORM="linux"
        phase0_log "Platform: Linux — using bubblewrap for sandboxing"
        check_command "bwrap" "sudo apt install bubblewrap" "sudo dnf install bubblewrap" || {
            phase0_error "bubblewrap is required for sandbox isolation on Linux"
            exit 1
        }
        check_command "socat" "sudo apt install socat" "sudo dnf install socat" || {
            phase0_error "socat is required for proxy health checks"
            exit 1
        }
        ;;
    Darwin)
        SANDBOX_PLATFORM="macos"
        phase0_log "Platform: macOS — using Seatbelt for sandboxing"
        # Seatbelt (sandbox-exec) is built-in on macOS, no install needed
        check_command "socat" "" "" "brew install socat" || {
            phase0_error "socat is required for proxy health checks"
            exit 1
        }
        ;;
    *)
        SANDBOX_PLATFORM="unsupported"
        phase0_warn "Unsupported platform: $(uname -s) — sandbox isolation unavailable"
        ;;
esac

export SANDBOX_PLATFORM

# =============================================================================
# Step 0.2: SSH Key Verification (BST-02)
# =============================================================================
phase0_log "Step 0.2: SSH key verification"

SSH_KEY_FOUND=false
SSH_HOME="${HOME}/.ssh"

# Check for existing keys
if [ -f "$SSH_HOME/id_ed25519" ]; then
    phase0_log "SSH key found: $SSH_HOME/id_ed25519"
    SSH_KEY_FOUND=true
    # Verify permissions
    local_perms=$(stat -c '%a' "$SSH_HOME/id_ed25519" 2>/dev/null || stat -f '%Lp' "$SSH_HOME/id_ed25519" 2>/dev/null)
    if [ "$local_perms" != "600" ]; then
        phase0_warn "SSH key permissions are $local_perms (expected 600). Fixing..."
        chmod 600 "$SSH_HOME/id_ed25519"
    fi
elif [ -f "$SSH_HOME/id_rsa" ]; then
    phase0_log "SSH key found: $SSH_HOME/id_rsa"
    SSH_KEY_FOUND=true
fi

if [ "$SSH_KEY_FOUND" = false ]; then
    phase0_log "No SSH key found in $SSH_HOME"
    response=$(phase0_prompt "Generate ed25519 SSH key for GSD-OS? [Y/n]")
    case "$response" in
        [nN]*)
            phase0_warn "Skipping SSH key generation. SSH-based authentication will be unavailable."
            ;;
        *)
            mkdir -p "$SSH_HOME"
            chmod 700 "$SSH_HOME"
            ssh-keygen -t ed25519 -C "gsd-os-$(hostname)" -f "$SSH_HOME/id_ed25519" -N "" < /dev/null
            phase0_log "SSH key generated: $SSH_HOME/id_ed25519"
            SSH_KEY_FOUND=true
            ;;
    esac
fi

# SSH agent setup — handle Remote Control vs local
SSH_AGENT_FORWARDED=false
if [ "${SSH_REMOTE_CONTROL:-}" = "1" ] || [ "${SSH_REMOTE_CONTROL:-}" = "true" ]; then
    phase0_log "Remote Control session detected — using forwarded SSH agent"
    if [ -z "${SSH_AUTH_SOCK:-}" ]; then
        phase0_error "Remote Control session requires SSH_AUTH_SOCK to be set. Is SSH agent forwarding configured?"
        exit 1
    fi
    # Verify socket is accessible
    if [ ! -S "${SSH_AUTH_SOCK}" ]; then
        phase0_error "SSH_AUTH_SOCK=$SSH_AUTH_SOCK is not a valid socket"
        exit 1
    fi
    phase0_log "SSH agent socket verified: $SSH_AUTH_SOCK"
    SSH_AGENT_FORWARDED=true
else
    # Normal: ensure ssh-agent is running locally
    if [ -z "${SSH_AUTH_SOCK:-}" ]; then
        eval "$(ssh-agent -s)" > /dev/null 2>&1
        phase0_log "SSH agent started"
    fi
    # Load keys if available
    if [ "$SSH_KEY_FOUND" = true ]; then
        ssh-add -l > /dev/null 2>&1 || ssh-add 2>/dev/null || true
        phase0_log "SSH keys loaded into agent"
    fi
fi

# =============================================================================
# Step 0.3: Sandbox Profile Generation (BST-04)
# =============================================================================
phase0_log "Step 0.3: Generating sandbox profile"

"$SCRIPT_DIR/generate-sandbox-profile.sh" \
    --project "$PROJECT_DIR" \
    --planning "$PLANNING_DIR" \
    --platform "$SANDBOX_PLATFORM" \
    --output "$SECURITY_DIR/sandbox-profile.json"

if [ ! -f "$SECURITY_DIR/sandbox-profile.json" ]; then
    phase0_error "Sandbox profile generation failed — no output file"
    exit 1
fi

phase0_log "Sandbox profile written: $SECURITY_DIR/sandbox-profile.json"

# =============================================================================
# Step 0.4: Credential Proxy + Domain Allowlist (BST-05, BST-06)
# =============================================================================
phase0_log "Step 0.4: Starting credential proxy and initializing domain allowlist"

# Initialize domain allowlist with defaults if not present (BST-06)
if [ ! -f "$SECURITY_DIR/domain-allowlist.json" ]; then
    cat > "$SECURITY_DIR/domain-allowlist.json" << 'EOALLOW'
{
  "domains": [
    { "domain": "api.anthropic.com", "credential_type": "api_key_header", "header": "x-api-key" },
    { "domain": "github.com", "credential_type": "ssh_agent" },
    { "domain": "registry.npmjs.org", "credential_type": "bearer_token" }
  ]
}
EOALLOW
    phase0_log "Domain allowlist initialized with defaults (api.anthropic.com, github.com, registry.npmjs.org)"
else
    phase0_log "Domain allowlist already present: $SECURITY_DIR/domain-allowlist.json"
fi

# Start credential proxy (BST-05)
PROXY_CMD="$SCRIPT_DIR/../../bin/gsd-credential-proxy"
if [ ! -x "$PROXY_CMD" ]; then
    # Fallback: check in scripts/bin/
    PROXY_CMD="$SCRIPT_DIR/../bin/gsd-credential-proxy"
fi

PROXY_ACTIVE=false
PROXY_PID=""
if [ -x "$PROXY_CMD" ]; then
    "$PROXY_CMD" \
        --socket "$PROXY_SOCKET" \
        --allowlist "$SECURITY_DIR/domain-allowlist.json" \
        --ssh-agent "${SSH_AUTH_SOCK:-}" \
        --log-dir "$SECURITY_DIR/events" &
    PROXY_PID=$!
    echo "$PROXY_PID" > "$SECURITY_DIR/proxy.pid"
    phase0_log "Credential proxy started (PID: $PROXY_PID)"

    # Health check loop: 10 retries * 0.5s = max 5s wait
    PROXY_HEALTHY=false
    for i in $(seq 1 10); do
        if command -v socat > /dev/null 2>&1 && \
           echo "GET /__proxy_health" | socat - UNIX-CONNECT:"$PROXY_SOCKET" 2>/dev/null | grep -q '"status":"running"'; then
            PROXY_HEALTHY=true
            PROXY_ACTIVE=true
            phase0_log "Credential proxy health check passed (attempt $i)"
            break
        fi
        sleep 0.5
    done

    if [ "$PROXY_HEALTHY" = false ]; then
        phase0_error "Credential proxy health check failed after 5 seconds"
        kill "$PROXY_PID" 2>/dev/null || true
        exit 1
    fi
else
    phase0_warn "Credential proxy binary not found — proxy features unavailable"
    phase0_warn "Expected at: $PROXY_CMD"
fi

# =============================================================================
# Step 0.5: Sandbox Activation + Verification (BST-07)
# =============================================================================
phase0_log "Step 0.5: Activating sandbox and running verification"

SANDBOX_ACTIVE=false
if [ "$SANDBOX_PLATFORM" = "unsupported" ]; then
    phase0_warn "Sandbox activation skipped — unsupported platform"
else
    # Run verify-sandbox.sh inside the sandbox
    VERIFY_EXIT=0
    "$SCRIPT_DIR/run-in-sandbox.sh" \
        --profile "$SECURITY_DIR/sandbox-profile.json" \
        -- "$SCRIPT_DIR/verify-sandbox.sh" || VERIFY_EXIT=$?

    # NO BYPASS: sandbox failure always halts Phase 0 (BST-07)
    if [ "$VERIFY_EXIT" -ne 0 ]; then
        phase0_error "SANDBOX VERIFICATION FAILED (exit code: $VERIFY_EXIT)"
        phase0_error "Phase 0 cannot proceed without verified sandbox isolation."
        phase0_error "Aborting bootstrap — no bypass available."
        exit 1
    fi

    SANDBOX_ACTIVE=true
    phase0_log "Sandbox verification passed — isolation confirmed"
fi

# =============================================================================
# Step 0.6: Security LED (BST-08)
# =============================================================================
phase0_log "Step 0.6: Security LED activation"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Write status.json
cat > "$SECURITY_DIR/status.json" << EOSTATUS
{
  "phase0_complete": true,
  "timestamp": "$TIMESTAMP",
  "sandbox_active": $SANDBOX_ACTIVE,
  "sandbox_platform": "$SANDBOX_PLATFORM",
  "proxy_active": $PROXY_ACTIVE,
  "proxy_pid": "${PROXY_PID:-null}",
  "proxy_socket": "$PROXY_SOCKET",
  "ssh_agent_forwarded": $SSH_AGENT_FORWARDED
}
EOSTATUS

phase0_log "Security status written: $SECURITY_DIR/status.json"

# Emit IPC event to security.jsonl
mkdir -p "$PLANNING_DIR/events"
echo "{\"event\":\"security:sandbox-active\",\"data\":$(cat "$SECURITY_DIR/status.json")}" \
    >> "$PLANNING_DIR/events/security.jsonl"

phase0_log "IPC event emitted: security:sandbox-active"

# Summary output based on magic level
phase0_summary_output() {
    case "$MAGIC_LEVEL" in
        1) : ;; # Silent
        2) echo "Security systems online." ;;
        3) echo "Sandbox configured. Proxy running. SSH keys verified. Security LED green." ;;
        4) # Steps already logged individually by phase0_log at each step
           echo "Phase 0 complete: all security checks passed." ;;
        5) # Full diagnostic already emitted by phase0_log calls
           echo "Phase 0 complete: all security checks passed."
           echo "  Proxy socket: $PROXY_SOCKET"
           echo "  SSH agent: ${SSH_AUTH_SOCK:-none}"
           echo "  Allowlist: $SECURITY_DIR/domain-allowlist.json"
           cat "$SECURITY_DIR/domain-allowlist.json" 2>/dev/null || true ;;
        *) echo "Security systems online." ;;
    esac
}

phase0_summary_output

phase0_log "Phase 0 complete — security LED green"
