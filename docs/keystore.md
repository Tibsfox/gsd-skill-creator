# Keystore — credential storage for gsd-skill-creator

Shipped at v1.49.650. Replaces the v1 plaintext credential file
(`~/.config/gsd-os/credentials.enc` — `.enc` extension despite plaintext
contents) with an encrypted v2 storage selecting between two mutually
exclusive paths at first run.

## Storage paths

The keystore probes the OS keyring at first run and commits to one path
for the lifetime of the install. Reverse migration (Path 2 → Path 1) is
deferred to v1.49.6XX cluster #3.

### Path 1 (preferred) — OS keyring

When the OS keyring is available, the API credential is stored DIRECTLY
in the keyring under:

- **Service:** `gsd-skill-creator`
- **Account:** `anthropic-api-key`

Per platform:

- **Linux:** `secret-service` (gnome-keyring, KeePassXC, KWallet via the
  D-Bus secret-service protocol)
- **macOS:** Keychain Services (`apple-native` keyring crate backend)
- **Windows:** Credential Manager (`windows-native` keyring crate backend)

No encrypted file is written. No passphrase is prompted. The OS handles
encryption + access control. This matches `gh auth` / `cargo login` /
`kubectl config` precedent.

### Path 2 (fallback) — age-encrypted file

When the OS keyring is NOT available (headless servers, SSH-only ops, CI
without secret-service daemons, dev VMs without gnome-keyring), the
credential is encrypted to:

- **Path:** `~/.config/gsd-os/credentials.age`
- **Format:** age binary (X25519 + ChaCha20-Poly1305)
- **Identity:** Argon2id-derived from a user-entered passphrase

The age crate ships as Rust-native. No libsodium / no C linkage. Audited
AEAD primitives from the RustCrypto project.

## Key-derivation parameters (Path 2 only)

Per OWASP Password Storage Cheat Sheet (2024-09):

| Parameter | Value |
|---|---|
| Algorithm | Argon2id |
| Memory cost | 64 MiB |
| Iterations | 3 |
| Parallelism | 1 |
| Salt | 32 bytes from OsRng (stored alongside ciphertext) |
| Output | 32 bytes |

First-run derivation cost is ~250-400ms on modern CPUs.

## On-disk binary format (Path 2)

```
+------+---+----------+-----------+
| GSDK | V |   SALT   |    AGE    |
| 4 B  | 1 | 32 bytes | remaining |
+------+---+----------+-----------+
```

- `GSDK` — magic header
- `V` — format version (currently `1`)
- `SALT` — 32-byte Argon2id salt
- `AGE` — age-encrypted payload

The version byte lets future migrations distinguish parameter sets and
catches accidental cross-build incompatibility (test vs release per R13).

## CLI surfaces

Two invocation surfaces share the same Rust keystore lib (operator-pinned
hybrid architecture, 2026-05-11).

### Surface 1 — Node wrapper (UX continuity)

```bash
skill-creator keystore migrate              # Migrate v1 plaintext → v2
skill-creator keystore set <account>        # Store/update credential (value from stdin)
skill-creator keystore status               # Print current state
skill-creator keystore migrate --to-keyring # Path 2 → Path 1 (M3 stub at v1.49.650)
skill-creator keystore --help               # Help text
```

The Node wrapper shells out to the standalone Rust bin via
`child_process.spawn` and passes through args + stdin + stdout + exit
codes. Use this surface for discoverability + integration with other
`skill-creator` subcommands.

### Surface 2 — Standalone Rust bin

```bash
skill-creator-keystore migrate
skill-creator-keystore set anthropic-api-key
skill-creator-keystore status
skill-creator-keystore migrate --to-keyring
skill-creator-keystore --help
```

Operators in CI / minimal-Node environments / pure-Rust automation can
invoke the bin directly. Both surfaces produce identical results because
they share the same Rust security lib (zero duplicate logic).

### Bin resolution order (Node wrapper)

The Node wrapper resolves the Rust bin via:

1. `KEYSTORE_BIN` environment variable (full path; for dev hosts)
2. `<repo>/src-tauri/target/release/skill-creator-keystore`
3. `<repo>/src-tauri/target/debug/skill-creator-keystore`
4. `skill-creator-keystore` on `$PATH` (release-install case)

### Exit codes (both surfaces)

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Runtime error (migration failed, save failed) |
| 2 | Usage / config error (no stdin value, config dir unresolvable) |
| 3 | M3 stub: `--to-keyring` deferral |
| 127 | Node wrapper: bin not found |

## Migration (v1 plaintext → v2)

The migration is **backup-first**: the v1 plaintext file is NEVER deleted
before the v2 storage round-trip verifies byte-equal.

Steps:

1. Read v1 plaintext file (`~/.config/gsd-os/credentials.enc`)
2. Probe OS keyring availability
3. **Path 1:** write each `<account>:<value>` entry into the OS keyring;
   read back; assert byte-equal for every entry
4. **Path 2:** prompt passphrase (stdin); derive Argon2id key; age-encrypt;
   write `credentials.age`; re-decrypt; assert byte-equal
5. **ONLY** after step 3 or 4 succeeds: delete v1 plaintext file
6. Idempotent re-runs: if v1 file is absent + v2 source present, no-op

Critical invariant: any failure leaves v1 untouched and the user can
retry without data loss.

## Per-OS keyring guarantees (R12)

| Platform | Backend | Required runtime | Behavior on locked / absent |
|---|---|---|---|
| Linux | secret-service (D-Bus) | gnome-keyring-daemon OR KeePassXC OR KWallet with secret-service plugin | Fall back to Path 2 |
| macOS | Keychain | Always available (system service) | Reports as available; prompts user on first access |
| Windows | Credential Manager | Always available (system service) | Reports as available; tied to user logon credentials |

**Linux headless caveat:** SSH-only operators without a running
secret-service daemon will see `is_available() == false` and migration
will dispatch to Path 2 (passphrase prompt). To enable Path 1 on a
headless host, install `gnome-keyring-daemon --components=secrets`
under a systemd user unit OR use `pass`'s secret-service compatibility
shim.

**WSL caveat:** WSL2 without an X session does not auto-start
gnome-keyring-daemon. Treat as headless: use Path 2 OR install
`gnome-keyring-daemon` + start manually before first run.

## Passphrase quality (R14)

Path 2 passphrases are **not** strength-checked at v1.49.650. The
encryption strength is bounded by passphrase entropy:

- A 6-character lowercase ASCII passphrase has ~28 bits of entropy → 1
  GPU-day at modern hash rates
- A 4-word Diceware passphrase has ~52 bits → ~years on dedicated hardware
- A 6-word Diceware passphrase has ~77 bits → infeasible

**Recommendation:** use a Diceware-style passphrase (4+ random words) OR
a password manager-generated 20+ character string. Avoid common passwords,
dictionary words, or anything you can type without thinking.

Future milestone may add a zxcvbn-style entropy gate at write time.

## Error-message sanitization

Every keystore error message that could embed credential bytes passes
through `sanitize_error_message(msg, plaintext, key)` which asserts no
4-byte contiguous fragment of plaintext or key appears in `msg`.

The 4-byte threshold (per arch-review refinement #3) balances false
positives (~2e-10 random-string collision rate) against detection
sensitivity (any 4+-byte fragment of an API key is recognizably the
secret).

In test builds, leak detection is a hard assertion. In production builds,
detected leaks cause the caller to redact and produce a generic error.

## Feature flags

| Flag | Default | Purpose |
|---|---|---|
| `legacy-plaintext-keystore` | OFF in release | Re-enables the legacy plaintext-credential-file path. **Scheduled for full removal at v1.49.6XX cluster #3.** Emits a `warn!` log when enabled. |
| `gnome-keyring` | OFF | Pre-v1.49.650 Linux libsecret stub. Subsumed by the unified `keyring v3` backend in this milestone. |
| `macos-keychain` | OFF | Pre-v1.49.650 macOS stub. Subsumed by `keyring v3` `apple-native` backend. |

History:

- v1.49.634: `insecure-plaintext-keystore` introduced (gates legacy
  plaintext path out of release builds)
- v1.49.650: renamed to `legacy-plaintext-keystore` for one-milestone
  deprecation window
- v1.49.6XX cluster #3 (future): feature + code branch REMOVED

## Discovery state machine

`skill-creator keystore status` reports one of:

| State | Indicators |
|---|---|
| `Path 1 (OS keyring)` | keyring entry present, no `credentials.age`, no v1 plaintext |
| `Path 2 (age-encrypted file)` | no keyring entry, `credentials.age` present |
| `Path 1 (OS keyring) — Path 2 file present as orphan` | both keyring AND `credentials.age` present (Path 1 wins; orphan file suggested for cleanup) |
| `v1 plaintext (legacy)` | only `credentials.enc` plaintext file present |
| `empty` | none of the above |

Priority order: Path 1 > Path 2 > V1Plaintext > Empty.

## Code organization

- `src-tauri/src/security/encryption.rs` — Argon2id + age + sanitizer
- `src-tauri/src/security/keyring_backend.rs` — KeyringStore trait,
  OsKeyring production, InMemoryKeyring test
- `src-tauri/src/security/migration.rs` — v1→v2 backup-first dispatcher
- `src-tauri/src/security/keystore.rs` — unified Keystore API +
  KeystoreError enum
- `src-tauri/bin/skill-creator-keystore.rs` — standalone Rust CLI
- `src/cli/commands/keystore.ts` — Node wrapper

## Testing

`cargo test --lib security::tests` covers 47 unit tests:

- `encryption_tests`: 15 (round-trip, distinct ciphertexts, tamper detection,
  wrong passphrase, header validation, 2 positive + 2 negative sanitizer)
- `keyring_backend_tests`: 10 (InMemoryKeyring, unavailable host, store +
  load + delete + idempotency + overwrite + round_trip_verify)
- `migration_tests`: 22 (parse, discover_state 5 states, Path 1 happy + 4
  error paths, Path 2 happy + 3 error paths, dispatcher + idempotency)

`npx vitest run src/cli/commands/keystore.test.ts` covers 9 tests for the
Node wrapper (help rendering, validation, bin resolution, subprocess
pass-through).

Real-OS keyring integration is left to manual smoke tests / future
end-to-end CI.

## See also

- `.planning/keystore-encryption-decision.md` — W0 decision artifact
  (operator-checkpoint)
- `.planning/missions/v1-49-650-housekeeping-cluster/components/01-keystore-encryption.md`
  — component spec
- `src-tauri/src/security/tests/keystore_reachability.rs` — structural
  proof that the legacy plaintext branch stays gated out of release
  builds
- `.planning/codebase/CONCERNS.md` §18 — closure record
