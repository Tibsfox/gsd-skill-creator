/**
 * Command-name canonicalization.
 *
 * Shipped GSD command frontmatter declares its `name` in hyphen form
 * (`gsd-phase`, `gsd-plan-phase`), which is what the discovery layer surfaces
 * as `GsdCommandMetadata.name`. The intent/gate/transition vocabulary — and the
 * user-facing slash-command form derived from the `commands/gsd/` directory —
 * use the colon form (`gsd:phase`). Without normalization, membership checks of
 * a discovered command against those hardcoded colon sets never match, which
 * silently disables lifecycle filtering and the destructive gate.
 *
 * Canonicalize to the colon form so comparisons work regardless of which form
 * the caller supplies. Non-`gsd-` names (already-colon, or unrelated) pass
 * through unchanged.
 */
export function canonicalCommandName(name: string): string {
  return name.startsWith('gsd-') ? `gsd:${name.slice(4)}` : name;
}
