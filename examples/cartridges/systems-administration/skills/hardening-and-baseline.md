---
name: hardening-and-baseline
description: Apply and maintain a host security baseline — SSH, fail2ban, SELinux/AppArmor, CIS benchmarks, drift detection.
---

# hardening-and-baseline

Own the host security posture. The baseline is an explicit object,
not a vibe — it lives in version control and a `HardeningBaseline`
grove record tracks the current state of every managed host.

## Baseline components

- **SSH** — disable root login, key-only auth, short `LoginGraceTime`, `AllowUsers` allowlist
- **fail2ban** — at minimum `sshd` jail, tuned findtime/bantime/maxretry
- **MAC** — SELinux `enforcing` or AppArmor with enforcing profiles for exposed services
- **sudoers** — least-privilege, NOPASSWD only for automation accounts with narrow command lists
- **Kernel** — `sysctl` hardening (rp_filter, kptr_restrict, ptrace_scope, panic_on_oops)
- **Package** — no orphaned packages, no unknown repos, auto-security updates on

## Drift detection

Run a nightly comparison of current config against the baseline.
Every drift is a `HardeningBaseline` diff and either (a) a ticket
to restore, or (b) an approved baseline update.
