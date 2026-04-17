# Publish Script Examples

`tools/release-history/publish.mjs` stages chapter files under `local_copy` target paths.
These example scripts take the staged tree and push it to a remote destination.

Copy the one you want, drop the `.example` suffix, customize, and commit (or gitignore —
private credentials belong in `.env` + your secret manager).

| Template | Destination | Transport |
|----------|-------------|-----------|
| `publish-rsync.sh.example` | any ssh host | rsync over ssh |
| `publish-s3.sh.example` | AWS S3 bucket | aws cli |
| `publish-gh-pages.sh.example` | GitHub Pages branch | git worktree |
| `publish-ftp.sh.example` | FTP host | lftp mirror |
| `publish-netlify.sh.example` | Netlify site | netlify cli |

## Pattern

All scripts follow the same three-step workflow:

1. Ensure `publish.mjs --execute` has staged to a local directory.
2. Do a provider-specific push of that directory to the remote.
3. Verify (HEAD check, list, etc.) and log.

Add your publish script to a target in `release-history.local.json`:

```json
{
  "publish": {
    "targets": [
      { "name": "github",  "kind": "local_copy", "dest": "docs/release-notes/{version}/chapter/{file}" },
      { "name": "website", "kind": "local_copy", "dest": ".release-story-staging/{version}/{file}" }
    ]
  }
}
```

Then your shell script mirrors `.release-story-staging/` to the remote of your choice.

## Safety

Every example honors these rules:
- Hard leak-scan enforced by `publish.mjs` *before* staging — so by the time these scripts
  see files, they're already clean.
- Dry-run flag on every template — preview before pushing.
- Checksum-based idempotency (handled by `publish.mjs`), so re-runs are cheap.
