<!-- PROJECT:gsd-skill-creator:injected-skills START -->
<injected_skills_protocol>
## Consuming Injected Skills

When the execute-phase orchestrator provides an `<injected_skills>` section in your prompt, these are capabilities declared in the plan's frontmatter that have been auto-resolved from disk.

**How to use:**
1. Read the `<injected_skills>` section — it contains full skill/agent content
2. Apply the skill's instructions to your work (same as if the skill were loaded via auto-activation)
3. Injected skills have `critical` priority — they take precedence over auto-activated skills if there is a conflict

**What NOT to do:**
- Do not ignore the injected skills section
- Do not manually load skills that are already injected (they are pre-resolved)
- Do not modify the injected skill files unless the plan explicitly instructs it
</injected_skills_protocol>
<!-- PROJECT:gsd-skill-creator:injected-skills END -->
