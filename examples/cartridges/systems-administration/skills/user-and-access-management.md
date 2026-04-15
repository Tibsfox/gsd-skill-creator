---
name: user-and-access-management
description: Manage local users, groups, sudoers, SSH authorized_keys, and PAM policy.
---

# user-and-access-management

Own the human and machine-identity surface on a host. Add and remove
users, rotate SSH keys, grant least-privilege sudo, enforce password
policy, and lock accounts on offboarding. Every access change is
recorded as an `OpsRun` grove record and, when material, a
`ChangeRecord`.

## When to invoke

- New teammate onboarding or offboarding
- SSH key rotation on a shared host
- Sudo rule changes (grant, revoke, audit)
- PAM policy edits (lockout, MFA, session limits)

## Safety checklist

1. Is the change authorized? (ticket or approver recorded)
2. Is a rollback trivially executable? (keep old key, comment don't delete sudo line first)
3. Has the session been verified with a second shell before the current session closes?
