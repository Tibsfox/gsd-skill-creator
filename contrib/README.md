# Contrib

Collaboration zone for upstream contributions (PRs we send), downstream contributions (PRs we receive), and side project publishing.

## Quick Start

```bash
# Check contribution status
sc contrib status

# Stage an upstream PR
sc contrib upstream stage <project>

# Review a downstream contribution
sc contrib downstream review <pr-id>
```

## Structure

- `upstream/` -- Forked branches for PRs we submit to other projects
- `downstream/staging/` -- Incoming contributor PRs staged for review
- `publishing/` -- Side projects extracted for independent publication
- `publishing/templates/` -- Templates for publishable project scaffolds

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
