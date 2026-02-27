import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve, isAbsolute } from "node:path";
import { existsSync } from "node:fs";

// --- Schema ---

const ExternalProjectSchema = z.object({
  name: z.string()
    .min(1, "Project name cannot be empty")
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Project name must be lowercase alphanumeric with hyphens"),
  path: z.string()
    .min(1, "Project path cannot be empty")
    .refine(p => isAbsolute(p), "External project path must be absolute"),
});

const WwwConfigSchema = z.object({
  build_dir: z.string().default("site"),
  tools_dir: z.string().default("tools"),
}).default({ build_dir: "site", tools_dir: "tools" });

const ScConfigSchema = z.object({
  home: z.string().default("projects"),
  external_projects: z.array(ExternalProjectSchema).default([]),
  upstream_forks: z.record(z.string(), z.string()).default({}),
  www: WwwConfigSchema,
}).strict();

type ScConfig = z.infer<typeof ScConfigSchema>;

// --- Loader ---

const CONFIG_FILENAME = ".sc-config.json";

function getConfigPath(root: string): string {
  return join(root, CONFIG_FILENAME);
}

function defaultConfig(): ScConfig {
  return ScConfigSchema.parse({});
}

async function loadConfig(root: string): Promise<ScConfig> {
  const configPath = getConfigPath(root);

  if (!existsSync(configPath)) {
    return defaultConfig();
  }

  const raw = await readFile(configPath, "utf-8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Invalid JSON in ${CONFIG_FILENAME}: check syntax at ${configPath}`
    );
  }

  const result = ScConfigSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid ${CONFIG_FILENAME}:\n${issues}\n\nFile: ${configPath}`
    );
  }

  return result.data;
}

async function saveConfig(root: string, config: ScConfig): Promise<void> {
  const configPath = getConfigPath(root);
  const validated = ScConfigSchema.parse(config);
  await writeFile(configPath, JSON.stringify(validated, null, 2) + "\n");
}

function resolveProjectPath(root: string, config: ScConfig): string {
  const home = config.home;
  return isAbsolute(home) ? home : resolve(root, home);
}

export {
  ScConfigSchema,
  ExternalProjectSchema,
  WwwConfigSchema,
  loadConfig,
  saveConfig,
  defaultConfig,
  getConfigPath,
  resolveProjectPath,
  CONFIG_FILENAME,
};
export type { ScConfig };
