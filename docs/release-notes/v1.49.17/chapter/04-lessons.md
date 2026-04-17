# Lessons — v1.49.17

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Composition-as-packaging solves the scaling problem for educational content.**
   Cartridges allow domains to be authored independently and composed at load time, avoiding the monolithic department structure that v1.49.10's flat-atoms architecture was designed to prevent.
   _⚙ Status: `investigate` · lesson #341_

2. **The Mark Farina crossfade metaphor captures the cartridge design intent.**
   Four tracks into one continuous field of sound -- four knowledge domains into one learning experience. The metaphor isn't decorative; it's the design specification.
   _⚙ Status: `investigate` · lesson #342_

3. **Cross-domain vocabularies are the glue that makes composition meaningful.**
   Without the 122-entry vocabulary mapping connections between audio, hardware, and mathematics, the cartridge would be three unrelated packs in a zip file.
   _⚙ Status: `investigate` · lesson #343_

4. **The cartridge format is defined but the composition semantics are informal.**
   The Space Between Cartridge bridges audio, hardware, and mathematics, but the rules for how cartridges compose (ordering, conflict resolution, overlapping concepts) aren't formalized.
   _⚙ Status: `investigate` · lesson #344_

5. **112 new tests for a new packaging format is thin.**
   The cartridge loader, validator, registry, packer/unpacker each handle failure modes (invalid cartridges, missing dependencies, version conflicts) that need explicit test coverage.
   _🤖 Status: `investigate` · lesson #345 · needs review_
   > LLM reasoning: Chorus Protocol snippet unrelated to cartridge loader/validator test coverage.
