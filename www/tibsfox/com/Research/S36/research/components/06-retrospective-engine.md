
## Context

Output path convention: `releases/seattle-360/NNN-[slug]/` where NNN is zero-padded degree
(000=Quincy Jones, 359=Unwound). Slug from `ArtistProfile.slug`.

**Atomicity protocol:**
1. Write all artifacts to a staging path: `releases/seattle-360/.staging/NNN-[slug]/`
2. Verify all 4 files present and non-empty in staging
3. Move staging directory to final path (atomic rename)
4. Apply write protection (`chmod 444` on all files)
5. Update progress.json and ledger ONLY after successful rename
6. If any step fails: delete staging directory; log error; emit ROLLBACK signal

**Write-protection:** Once published, artifact files are immutable. No component may
modify them. Only the safety-warden-audit-log may be appended.


## Technical Specification

### Behavioral Requirements

**MUST:**
- Verify Safety Warden PASS before any write
- Use atomic staging → rename pattern
- Zero-pad degree to 3 digits for path naming
- Verify all 4 files (pdf, tex, html, json) present in staging before rename
- Write-protect with `chmod 444` after rename
- Update `progress.json` atomically (temp file + rename)
- Append to `release-ledger.md` with: degree, name, genre, era, timestamp, token count
- Update `college-node-index.json` by adding all paths from `knowledge-nodes.json`

**MUST NOT:**
- Proceed if Safety Warden signal is GATE or BLOCK
- Leave partial files in final path
- Allow concurrent pipeline executions (lock file at `releases/seattle-360/.lock`)

