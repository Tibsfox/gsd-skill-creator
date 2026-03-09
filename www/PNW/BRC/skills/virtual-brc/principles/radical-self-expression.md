# Radical Self-Expression — User-Defined Content

**Principle:** Radical self-expression arises from the unique gifts of the individual. No one other than the individual or a collaborating group can determine its content. It is offered as a gift to others. In this spirit, the giver should respect the rights and liberties of the recipient.
**GSD Guideline:** User-Defined Content
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

Walk through an old-growth forest and no two trees express themselves the same way.
One Sitka spruce grows straight as a mast; its neighbor, shaped by decades of
prevailing wind, leans twenty degrees and wears a flag crown. Both are spruce. Both
are valid. The forest does not enforce a uniform growth pattern — it enforces only
the physics of gravity and the chemistry of photosynthesis. Everything else is
self-expression.

In the GSD skill system, content policy is set by the rig, not by the system. A rig
may organize its skills any way it chooses: by theme, by function, by whim, by
color. It may name its agents after planets, rivers, or breakfast cereals. The
system does not impose naming conventions, organizational taxonomies, or aesthetic
standards on skill content. The only boundaries enforced at the system level are
safety boundaries — the warden gates that protect against harm (see Civic
Responsibility). Everything inside those safety rails is the rig's domain.

This means the system must be architecturally content-agnostic. Skill validators
check structural correctness (required fields present, types valid, interfaces
declared) but never evaluate content quality, originality, or appropriateness.
The playa is full of art that some people love and others don't understand — and
that is exactly right. The system's job is to ensure the art doesn't collapse on
someone, not to curate the gallery.

## Testable Behaviors

1. Skill validators check only structural correctness (required fields, type validity, interface declarations) and never evaluate content semantics.
2. Rig-level configuration can override default skill organization, naming, and display without system restriction.
3. The system does not reject skill submissions based on content quality, originality, or thematic consistency.
4. Safety warden gates operate on structural and behavioral criteria only, not on content-level evaluation.
5. Two rigs with identical skills but different organizational schemas both pass validation without warnings.

## Dependencies

- `civic-responsibility` — Safety Warden defines the only hard boundaries on expression
- `radical-inclusion` — Open access ensures all forms of expression reach the commons
- `gifting` — Self-expression is offered as gift; the system does not curate gifts

## PNW Metaphor

Like the Sitka spruce that grows flag-crowned on a windward bluff and columnar in a
sheltered valley — same species, radically different expression — each rig shapes its
skill landscape to match its own conditions. The forest permits all forms that
physics allows; the system permits all content that safety allows.
