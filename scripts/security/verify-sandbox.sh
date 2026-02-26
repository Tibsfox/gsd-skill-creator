#!/usr/bin/env bash
# =============================================================================
# Sandbox Isolation Verification Script
# =============================================================================
#
# Runs INSIDE the sandbox to confirm all isolation properties are active.
# Exit code = number of failed tests (0 = all pass).
#
# Tests:
#   1. Cannot read SSH keys (~/.ssh/ inaccessible)
#   2. Cannot write outside project directory
#   3. Cannot reach non-allowlisted network domains directly
#   4. Proxy connectivity check (warning only — proxy may not be running)
#   5. Cannot use nsenter to escape namespace (CAP_SYS_ADMIN blocked)
#
# Usage:
#   Run inside a bwrap sandbox:
#     bwrap ... -- bash scripts/security/verify-sandbox.sh
#
#   Run standalone for testing (tests will fail differently outside sandbox):
#     bash scripts/security/verify-sandbox.sh
#
# Phase 368 — Sandbox Configurator
# =============================================================================

set -uo pipefail

FAILURES=0
PASS_COUNT=0

pass() {
    echo "PASS: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo "FAIL: $1"
    FAILURES=$((FAILURES + 1))
}

# ─────────────────────────────────────────────────────────────────────────────
# Test 1: Cannot read SSH keys (SB-07)
# ─────────────────────────────────────────────────────────────────────────────
# In a properly sandboxed environment, ~/.ssh/ is not bind-mounted,
# so any attempt to read files there will fail with "No such file".

if cat "${HOME}/.ssh/id_ed25519" 2>/dev/null || cat "${HOME}/.ssh/id_rsa" 2>/dev/null; then
    fail "SSH key readable inside sandbox"
else
    pass "SSH key not accessible"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Test 2: Cannot write outside project directory (SB-08)
# ─────────────────────────────────────────────────────────────────────────────
# Only explicitly bound directories should be writable. /tmp is not bound
# for EXEC/VERIFY/SCOUT agents.

ESCAPE_FILE="/tmp/sandbox-escape-test-$$"
if touch "${ESCAPE_FILE}" 2>/dev/null; then
    fail "Can write outside project directory (wrote to /tmp)"
    rm -f "${ESCAPE_FILE}" 2>/dev/null
else
    pass "Cannot write outside project"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Test 3: Cannot reach non-allowlisted domains directly (SB-09)
# ─────────────────────────────────────────────────────────────────────────────
# With --unshare-net, all direct network access should be blocked.
# Only the proxy socket can route traffic to allowlisted domains.

if command -v curl >/dev/null 2>&1; then
    if curl -s --max-time 3 --connect-timeout 2 https://example.com >/dev/null 2>&1; then
        fail "Can reach non-allowlisted domain (example.com)"
    else
        pass "Non-allowlisted domains blocked"
    fi
elif command -v wget >/dev/null 2>&1; then
    if wget -q --timeout=3 -O /dev/null https://example.com 2>/dev/null; then
        fail "Can reach non-allowlisted domain (example.com)"
    else
        pass "Non-allowlisted domains blocked"
    fi
else
    # No HTTP client available — network is likely very restricted
    pass "Non-allowlisted domains blocked (no HTTP client available)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Test 4: Proxy connectivity (warning only)
# ─────────────────────────────────────────────────────────────────────────────
# The proxy may not be running during initial verification. This is a
# warning, not a pass/fail test. The proxy is started by Phase 373 bootstrap.

PROXY_PORT="${PROXY_PORT:-8888}"
if command -v curl >/dev/null 2>&1; then
    if curl -s --max-time 5 --connect-timeout 3 \
        --proxy "socks5h://localhost:${PROXY_PORT}" \
        https://api.anthropic.com/v1/models >/dev/null 2>&1; then
        pass "Proxy connection to API working"
    else
        echo "WARN: Proxy connection failed (expected if proxy not started yet)"
    fi
else
    echo "WARN: curl not available for proxy test"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Test 5: Cannot use nsenter to escape namespace (SB-11)
# ─────────────────────────────────────────────────────────────────────────────
# With --cap-drop ALL, nsenter requires CAP_SYS_ADMIN which is not available.
# This blocks namespace escape via nsenter, unshare, and similar tools.

if command -v nsenter >/dev/null 2>&1; then
    if nsenter --target 1 --mount --pid -- /bin/true 2>/dev/null; then
        fail "nsenter escape possible (CAP_SYS_ADMIN available)"
    else
        pass "nsenter blocked"
    fi
else
    # nsenter not available in sandbox — even better
    pass "nsenter blocked (not available in sandbox)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Results
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "Results: ${PASS_COUNT} passed, ${FAILURES} failed"
exit "${FAILURES}"
