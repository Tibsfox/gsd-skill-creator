#!/usr/bin/env bash
# test-generate-local-values.sh -- Test suite for adaptive configuration generator
#
# Validates generate-local-values.sh against all three hardware tiers using
# inline capabilities fixtures and pre-computed budget fixtures. Covers:
#   - Generous tier (64GB NVIDIA): ZGC, view_distance=24, max_players=20
#   - Comfortable tier (32GB AMD): G1GC, view_distance=16, max_players=10
#   - Minimal tier (16GB no-GPU): G1GC, view_distance=10, max_players=5
#   - JVM heap calculation correctness
#   - Network defaults
#   - Capabilities passthrough from input to output
#
# Usage: bash infra/tests/test-generate-local-values.sh
#
# 40+ assertions across 6 test groups.

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (established pattern from test-calculate-budget.sh)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
GENERATOR="${SCRIPT_DIR}/../scripts/generate-local-values.sh"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap 'teardown' EXIT

# Assert two values are equal
# Usage: assert_eq "description" "expected" "actual"
assert_eq() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected '${expected}', got '${actual}'")
        printf "  FAIL: %s (expected '%s', got '%s')\n" "${desc}" "${expected}" "${actual}"
    fi
}

# Assert output contains a string
# Usage: assert_contains "description" "needle" "haystack"
assert_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('${needle}' not found)\n" "${desc}"
    fi
}

# Section-aware YAML value extraction from a string (piped content)
# Handles sections by tracking current section header and finding keys within
# Usage: yaml_val "section" "key" "file"
yaml_section_val() {
    local section="$1"
    local key="$2"
    local file="$3"
    awk -v sect="${section}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Nested subsection value extraction
# Usage: yaml_subsection_val "minecraft" "jvm" "gc_type" "file"
yaml_subsection_val() {
    local section="$1"
    local subsec="$2"
    local key="$3"
    local file="$4"
    awk -v sect="${section}" -v subsec="${subsec}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^  "subsec":" { in_sub=1; next }
        in_sect && /^  [a-zA-Z]/ && $0 !~ "^    " { in_sub=0 }
        in_sect && in_sub && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Create an inline budget fixture in the temp directory
# Usage: create_budget "generous" 4 2 60 14 16 7 50 44 7
create_budget() {
    local tier="$1"
    local host_ram="$2" host_cores="$3"
    local vm_ram="$4" vm_cores="$5"
    local mc_ram="$6" mc_cores="$7" mc_storage="$8"
    local unalloc_ram="$9" unalloc_cores="${10}"
    local budget_file="${TEMP_DIR}/budget-${tier}.yaml"
    cat > "${budget_file}" <<YAML
host_reserved:
  ram_gb: ${host_ram}
  cores: ${host_cores}
vm_available:
  ram_gb: ${vm_ram}
  cores: ${vm_cores}
minecraft_vm:
  ram_gb: ${mc_ram}
  cores: ${mc_cores}
  storage_gb: ${mc_storage}
unallocated:
  ram_gb: ${unalloc_ram}
  cores: ${unalloc_cores}
meets_requirements: true
tier: ${tier}
YAML
    printf "%s" "${budget_file}"
}

# Run the generator and capture output to a file
# Usage: run_generator "capabilities_fixture" "budget_file" "output_file"
run_generator() {
    local caps="$1"
    local budget="$2"
    local output="$3"
    bash "${GENERATOR}" --capabilities "${caps}" --budget "${budget}" --output "${output}" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Group 1: Generous tier (64GB NVIDIA)
# ---------------------------------------------------------------------------

test_generous_tier() {
    printf "\n--- Group 1: Generous Tier (64GB NVIDIA) ---\n"
    setup

    local budget output
    budget="$(create_budget "generous" 4 2 60 14 16 7 50 44 7)"
    output="${TEMP_DIR}/local-values-generous.yaml"

    run_generator "${FIXTURES_DIR}/capabilities-64gb-nvidia.yaml" "${budget}" "${output}"

    if [[ ! -f "${output}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Generous: output file not created")
        printf "  FAIL: output file not created\n"
        return
    fi

    assert_eq "Generous: system.tier=generous" \
        "generous" "$(yaml_section_val "system" "tier" "${output}")"
    assert_eq "Generous: minecraft.jvm.heap_min_mb=4096" \
        "4096" "$(yaml_subsection_val "minecraft" "jvm" "heap_min_mb" "${output}")"
    assert_eq "Generous: minecraft.jvm.gc_type=ZGC" \
        "ZGC" "$(yaml_subsection_val "minecraft" "jvm" "gc_type" "${output}")"
    assert_eq "Generous: minecraft.server.view_distance=24" \
        "24" "$(yaml_subsection_val "minecraft" "server" "view_distance" "${output}")"
    assert_eq "Generous: minecraft.server.max_players=20" \
        "20" "$(yaml_subsection_val "minecraft" "server" "max_players" "${output}")"
    assert_eq "Generous: minecraft.server.simulation_distance=12" \
        "12" "$(yaml_subsection_val "minecraft" "server" "simulation_distance" "${output}")"
    assert_eq "Generous: minecraft.server.entity_broadcast_range=150" \
        "150" "$(yaml_subsection_val "minecraft" "server" "entity_broadcast_range" "${output}")"
    assert_eq "Generous: minecraft.mods.syncmatica_max_schematic_size=1000000" \
        "1000000" "$(yaml_subsection_val "minecraft" "mods" "syncmatica_max_schematic_size" "${output}")"
    assert_eq "Generous: gpu.compute_level=advanced" \
        "advanced" "$(yaml_section_val "gpu" "compute_level" "${output}")"
    assert_eq "Generous: gpu.passthrough_viable=true" \
        "true" "$(yaml_section_val "gpu" "passthrough_viable" "${output}")"
    assert_eq "Generous: audio.server=pipewire" \
        "pipewire" "$(yaml_section_val "audio" "server" "${output}")"
    assert_eq "Generous: hypervisor.preferred=kvm" \
        "kvm" "$(yaml_section_val "hypervisor" "preferred" "${output}")"
}

# ---------------------------------------------------------------------------
# Group 2: Comfortable tier (32GB AMD)
# ---------------------------------------------------------------------------

test_comfortable_tier() {
    printf "\n--- Group 2: Comfortable Tier (32GB AMD) ---\n"

    local budget output
    budget="$(create_budget "comfortable" 4 2 28 6 14 3 50 14 3)"
    output="${TEMP_DIR}/local-values-comfortable.yaml"

    run_generator "${FIXTURES_DIR}/capabilities-32gb-amd.yaml" "${budget}" "${output}"

    if [[ ! -f "${output}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Comfortable: output file not created")
        printf "  FAIL: output file not created\n"
        return
    fi

    assert_eq "Comfortable: system.tier=comfortable" \
        "comfortable" "$(yaml_section_val "system" "tier" "${output}")"
    assert_eq "Comfortable: minecraft.jvm.heap_min_mb=2048" \
        "2048" "$(yaml_subsection_val "minecraft" "jvm" "heap_min_mb" "${output}")"
    assert_eq "Comfortable: minecraft.jvm.gc_type=G1GC" \
        "G1GC" "$(yaml_subsection_val "minecraft" "jvm" "gc_type" "${output}")"
    assert_eq "Comfortable: minecraft.server.view_distance=16" \
        "16" "$(yaml_subsection_val "minecraft" "server" "view_distance" "${output}")"
    assert_eq "Comfortable: minecraft.server.max_players=10" \
        "10" "$(yaml_subsection_val "minecraft" "server" "max_players" "${output}")"
    assert_eq "Comfortable: gpu.compute_level=standard" \
        "standard" "$(yaml_section_val "gpu" "compute_level" "${output}")"
    assert_eq "Comfortable: audio.server=pulseaudio" \
        "pulseaudio" "$(yaml_section_val "audio" "server" "${output}")"
    assert_eq "Comfortable: hypervisor.preferred=kvm" \
        "kvm" "$(yaml_section_val "hypervisor" "preferred" "${output}")"
}

# ---------------------------------------------------------------------------
# Group 3: Minimal tier (16GB no-GPU)
# ---------------------------------------------------------------------------

test_minimal_tier() {
    printf "\n--- Group 3: Minimal Tier (16GB No-GPU) ---\n"

    local budget output
    budget="$(create_budget "minimal" 4 2 12 2 6 1 50 6 1)"
    output="${TEMP_DIR}/local-values-minimal.yaml"

    run_generator "${FIXTURES_DIR}/capabilities-16gb-nogpu.yaml" "${budget}" "${output}"

    if [[ ! -f "${output}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Minimal: output file not created")
        printf "  FAIL: output file not created\n"
        return
    fi

    assert_eq "Minimal: system.tier=minimal" \
        "minimal" "$(yaml_section_val "system" "tier" "${output}")"
    assert_eq "Minimal: minecraft.jvm.heap_min_mb=1024" \
        "1024" "$(yaml_subsection_val "minecraft" "jvm" "heap_min_mb" "${output}")"
    assert_eq "Minimal: minecraft.jvm.gc_type=G1GC" \
        "G1GC" "$(yaml_subsection_val "minecraft" "jvm" "gc_type" "${output}")"
    assert_eq "Minimal: minecraft.server.view_distance=10" \
        "10" "$(yaml_subsection_val "minecraft" "server" "view_distance" "${output}")"
    assert_eq "Minimal: minecraft.server.max_players=5" \
        "5" "$(yaml_subsection_val "minecraft" "server" "max_players" "${output}")"
    assert_eq "Minimal: gpu.compute_level=none" \
        "none" "$(yaml_section_val "gpu" "compute_level" "${output}")"
    assert_eq "Minimal: gpu.uae_display=software" \
        "software" "$(yaml_section_val "gpu" "uae_display" "${output}")"
    assert_eq "Minimal: audio.routing_method=direct_alsa" \
        "direct_alsa" "$(yaml_section_val "audio" "routing_method" "${output}")"
}

# ---------------------------------------------------------------------------
# Group 4: JVM heap calculation
# ---------------------------------------------------------------------------

test_jvm_heap_calculation() {
    printf "\n--- Group 4: JVM Heap Calculation ---\n"

    # Generous: MC RAM=16GB -> heap_max = 16*1024-512 = 15872
    local output="${TEMP_DIR}/local-values-generous.yaml"
    assert_eq "JVM heap generous: 16GB -> 15872" \
        "15872" "$(yaml_subsection_val "minecraft" "jvm" "heap_max_mb" "${output}")"

    # Comfortable: MC RAM=14GB -> heap_max = 14*1024-512 = 13824
    output="${TEMP_DIR}/local-values-comfortable.yaml"
    assert_eq "JVM heap comfortable: 14GB -> 13824" \
        "13824" "$(yaml_subsection_val "minecraft" "jvm" "heap_max_mb" "${output}")"

    # Minimal: MC RAM=6GB -> heap_max = 6*1024-512 = 5632
    output="${TEMP_DIR}/local-values-minimal.yaml"
    assert_eq "JVM heap minimal: 6GB -> 5632" \
        "5632" "$(yaml_subsection_val "minecraft" "jvm" "heap_max_mb" "${output}")"
}

# ---------------------------------------------------------------------------
# Group 5: Network defaults
# ---------------------------------------------------------------------------

test_network_defaults() {
    printf "\n--- Group 5: Network Defaults ---\n"

    # Use generous output (has all network features)
    local output="${TEMP_DIR}/local-values-generous.yaml"

    assert_eq "Network: pxe_dhcp_range_start=192.168.122.200" \
        "192.168.122.200" "$(yaml_section_val "network" "pxe_dhcp_range_start" "${output}")"
    assert_eq "Network: pxe_dhcp_range_end=192.168.122.250" \
        "192.168.122.250" "$(yaml_section_val "network" "pxe_dhcp_range_end" "${output}")"
    assert_eq "Network: game_port=25565" \
        "25565" "$(yaml_section_val "network" "game_port" "${output}")"
    assert_eq "Network: rcon_port=25575" \
        "25575" "$(yaml_section_val "network" "rcon_port" "${output}")"
    assert_eq "Network: management_interface=enp3s0" \
        "enp3s0" "$(yaml_section_val "network" "management_interface" "${output}")"
}

# ---------------------------------------------------------------------------
# Group 6: Capabilities passthrough
# ---------------------------------------------------------------------------

test_capabilities_passthrough() {
    printf "\n--- Group 6: Capabilities Passthrough ---\n"

    # Generous (64GB NVIDIA) -- all capabilities true
    local output="${TEMP_DIR}/local-values-generous.yaml"
    assert_eq "Caps generous: can_run_vms=true" \
        "true" "$(yaml_section_val "capabilities" "can_run_vms" "${output}")"
    assert_eq "Caps generous: has_audio_output=true" \
        "true" "$(yaml_section_val "capabilities" "has_audio_output" "${output}")"
    assert_eq "Caps generous: is_tier1_distro=true" \
        "true" "$(yaml_section_val "capabilities" "is_tier1_distro" "${output}")"
    assert_eq "Caps generous: has_midi=true" \
        "true" "$(yaml_section_val "capabilities" "has_midi" "${output}")"

    # Minimal (16GB no-GPU) -- some capabilities false
    output="${TEMP_DIR}/local-values-minimal.yaml"
    assert_eq "Caps minimal: can_passthrough_gpu=false" \
        "false" "$(yaml_section_val "capabilities" "can_passthrough_gpu" "${output}")"
    assert_eq "Caps minimal: has_midi=false" \
        "false" "$(yaml_section_val "capabilities" "has_midi" "${output}")"
    assert_eq "Caps minimal: has_bridge_support=false" \
        "false" "$(yaml_section_val "capabilities" "has_bridge_support" "${output}")"
    assert_eq "Caps minimal: has_usb3=true" \
        "true" "$(yaml_section_val "capabilities" "has_usb3" "${output}")"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== Adaptive Configuration Generator Tests ===\n"
    printf "Generator: %s\n" "${GENERATOR}"
    printf "Fixtures: %s\n\n" "${FIXTURES_DIR}"

    setup

    # Groups 1-3 must run first (they generate the output files used by groups 4-6)
    test_generous_tier
    test_comfortable_tier
    test_minimal_tier
    test_jvm_heap_calculation
    test_network_defaults
    test_capabilities_passthrough

    printf "\n=== Results ===\n"
    printf "Assertions run: %s\n" "${TESTS_RUN}"
    printf "Passed: %s\n" "${TESTS_PASSED}"
    printf "Failed: %s\n" "${TESTS_FAILED}"

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        printf "\nFailures:\n"
        for failure in "${FAILURES[@]}"; do
            printf "  - %s\n" "${failure}"
        done
        exit 1
    fi

    printf "\nAll %s assertions passed.\n" "${TESTS_RUN}"
    exit 0
}

main "$@"
