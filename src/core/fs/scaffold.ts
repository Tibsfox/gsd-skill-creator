import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

// Zone directory structure
const ZONE_DIRS: Record<string, string[]> = {
  "projects": [],
  "contrib": [
    "upstream",
    "downstream",
    join("downstream", "staging"),
    "publishing",
    join("publishing", "templates"),
  ],
  "packs": [],
  "www": [
    "site",
    "tools",
    "staging",
  ],
};

// Leaf directories that get .gitkeep files
const LEAF_DIRS: string[] = [
  "projects",
  join("contrib", "upstream"),
  join("contrib", "downstream"),
  join("contrib", "downstream", "staging"),
  join("contrib", "publishing"),
  join("contrib", "publishing", "templates"),
  "packs",
  join("www", "site"),
  join("www", "tools"),
  join("www", "staging"),
];

// README content for each zone
const README_CONTENT: Record<string, string> = {
  "projects": `# Projects

Your GSD projects live here. Each subdirectory is an independent project with its own \`.planning/\` directory for GSD state management. Projects in this directory are gitignored by default -- they're your personal workspace.

## Quick Start

\`\`\`bash
# Create a new project
sc project init my-app

# List all projects (local + external)
sc project list

# Open a project
cd projects/my-app
\`\`\`

## External Projects

You can also register external directories as projects via \`.sc-config.json\`:

\`\`\`json
{
  "external_projects": [
    { "name": "my-app", "path": "/home/user/code/my-app" }
  ]
}
\`\`\`

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
`,

  "contrib": `# Contrib

Collaboration zone for upstream contributions (PRs we send), downstream contributions (PRs we receive), and side project publishing.

## Quick Start

\`\`\`bash
# Check contribution status
sc contrib status

# Stage an upstream PR
sc contrib upstream stage <project>

# Review a downstream contribution
sc contrib downstream review <pr-id>
\`\`\`

## Structure

- \`upstream/\` -- Forked branches for PRs we submit to other projects
- \`downstream/staging/\` -- Incoming contributor PRs staged for review
- \`publishing/\` -- Side projects extracted for independent publication
- \`publishing/templates/\` -- Templates for publishable project scaffolds

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
`,

  "packs": `# Packs

Educational and domain knowledge packs built with skill-creator. Each pack is a self-contained learning module with curriculum, exercises, and assessment.

## Available Packs

| Pack | Source | Description |
|------|--------|-------------|
| holomorphic | src/holomorphic/ | Complex dynamics and holomorphic functions |
| electronics | src/knowledge/ | Electronics engineering with circuit simulation |
| agc | src/agc/ | Apollo Guidance Computer architecture |
| aminet | src/aminet/ | Amiga software archive and history |

## Quick Start

\`\`\`bash
# List all available packs
sc pack list

# Show pack details
sc pack info <name>
\`\`\`

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
`,

  "www": `# WWW

Web staging area for documentation sites, web tools, and live content. Generated output goes in \`site/\`, source tools in \`tools/\`, and pre-publish review in \`staging/\`.

## Quick Start

\`\`\`bash
# Check www status
sc www status

# Build documentation site (when Astro is configured)
sc www build

# Serve locally for testing
sc www serve
\`\`\`

## Structure

- \`site/\` -- Generated static site output (gitignored)
- \`tools/\` -- Web-based tool source files (tracked)
- \`staging/\` -- Pre-publish review area (gitignored)

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
`,
};

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p: string): Promise<void> {
  if (!(await exists(p))) {
    await mkdir(p, { recursive: true });
  }
}

async function ensureFile(p: string, content: string): Promise<void> {
  if (!(await exists(p))) {
    await writeFile(p, content, "utf-8");
  }
}

/**
 * Scaffold the four zone directories under root.
 * Idempotent: safe to call multiple times.
 */
export async function scaffoldZones(root: string): Promise<void> {
  // Create zone directories and their subdirectories
  for (const [zone, subdirs] of Object.entries(ZONE_DIRS)) {
    await ensureDir(join(root, zone));
    for (const sub of subdirs) {
      await ensureDir(join(root, zone, sub));
    }
  }

  // Write .gitkeep in leaf directories
  for (const leaf of LEAF_DIRS) {
    await ensureFile(join(root, leaf, ".gitkeep"), "");
  }

  // Write README.md in zone root directories (not subdirs)
  for (const [zone, content] of Object.entries(README_CONTENT)) {
    await ensureFile(join(root, zone, "README.md"), content);
  }
}
