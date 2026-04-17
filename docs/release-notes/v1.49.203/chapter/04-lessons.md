# Lessons — v1.49.203

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Parallel research fleets scale.**
   5 research agents running simultaneously produced 107K words of sourced material. The furry arts doc (14,154 words) was the most thorough because the agent had the clearest audience context.
   _⚙ Status: `investigate` · lesson #1351_

2. **History woven through > history front-loaded.**
   The decision to spread historical context through every chapter (via callout boxes rather than a standalone history chapter) makes the book readable cover-to-cover instead of reference-only.
   _⚙ Status: `investigate` · lesson #1352_

3. **Furry arts as primary use case, not appendix.**
   Framing through the community's lens produced better, more practical content than treating furry workflows as a special case of general 3D.
   _🤖 Status: `investigate` · lesson #1353 · needs review_
   > LLM reasoning: Candidate snippet about Neko Case + Fisher has no visible connection to furry-arts framing.

4. **The mission pack pattern works for books.**
   The original 31-page mission pack (vision + research + execution plan) provided the structure that 10 research agents and 6 writing agents could execute against in parallel.
   _🤖 Status: `investigate` · lesson #1354 · needs review_
   > LLM reasoning: Candidate snippet references pollinators, not mission-pack-for-books structure.

5. **LaTeX chapter splitting is essential at scale.**
   Moving from one monolithic .tex to \input{chapters/ch0X.tex} kept the build manageable and enabled parallel writing.
   _⚙ Status: `investigate` · lesson #1355_

6. **FTP path mapping matters.**
   The FTP root maps to /Research/ on the web, not /. First upload went to /Research/BLN (double-nested, 404). Fixed to /BLN.
   _⚙ Status: `investigate` · lesson #1356_
