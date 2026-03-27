/**
 * Schema Evolution — Version-aware DDL migration for Wasteland tables.
 *
 * Tracks schema versions in the `_meta` table, compares against the
 * target version, and generates ALTER TABLE statements to migrate
 * forward. Supports column additions and table creation only (no
 * destructive migrations).
 *
 * Entry points:
 * - getSchemaVersion(query): read current version from _meta
 * - setSchemaVersion(query, version): write version to _meta
 * - diffSchema(current, target): compute required migrations
 * - generateMigrationSQL(diff): produce ALTER/CREATE statements
 * - migrate(query, targetVersion): full migration pipeline
 *
 * @module schema-evolution
 */

// ============================================================================
// Types
// ============================================================================

/** A column definition in a schema version */
export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

/** A table definition in a schema version */
export interface TableDef {
  name: string;
  columns: ColumnDef[];
  primaryKey: string[];
}

/** A complete schema version */
export interface SchemaVersion {
  version: string;
  tables: TableDef[];
}

/** Types of migration operations */
export type MigrationOp =
  | { type: 'create_table'; table: TableDef }
  | { type: 'add_column'; table: string; column: ColumnDef }
  | { type: 'set_version'; version: string };

/** Result of diffing two schema versions */
export interface SchemaDiff {
  fromVersion: string;
  toVersion: string;
  operations: MigrationOp[];
}

/** Query function signature (matches DoltClient.query) */
export type QueryFn = (sql: string) => Promise<{ rows: Record<string, unknown>[] }>;

/** Migration result */
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  operationsApplied: number;
  errors: string[];
}

// ============================================================================
// Schema Registry
// ============================================================================

/** MVR 1.0 base schema — the original 7 tables */
export const SCHEMA_1_0: SchemaVersion = {
  version: '1.0',
  tables: [
    {
      name: '_meta',
      columns: [
        { name: 'key', type: 'VARCHAR(64)', nullable: false },
        { name: 'value', type: 'TEXT', nullable: true },
      ],
      primaryKey: ['key'],
    },
    {
      name: 'rigs',
      columns: [
        { name: 'handle', type: 'VARCHAR(255)', nullable: false },
        { name: 'display_name', type: 'VARCHAR(255)', nullable: true },
        { name: 'type', type: "ENUM('human','agent','org')", nullable: false },
        { name: 'trust_level', type: 'INT', nullable: false, defaultValue: '0' },
        { name: 'joined_at', type: 'TIMESTAMP', nullable: false },
      ],
      primaryKey: ['handle'],
    },
    {
      name: 'wanted',
      columns: [
        { name: 'id', type: 'VARCHAR(64)', nullable: false },
        { name: 'title', type: 'VARCHAR(512)', nullable: false },
        { name: 'description', type: 'TEXT', nullable: true },
        { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'open'" },
        { name: 'effort_level', type: 'VARCHAR(32)', nullable: false, defaultValue: "'medium'" },
        { name: 'posted_by', type: 'VARCHAR(255)', nullable: true },
        { name: 'claimed_by', type: 'VARCHAR(255)', nullable: true },
        { name: 'tags', type: 'JSON', nullable: true },
        { name: 'created_at', type: 'TIMESTAMP', nullable: true },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: true },
      ],
      primaryKey: ['id'],
    },
    {
      name: 'completions',
      columns: [
        { name: 'id', type: 'VARCHAR(64)', nullable: false },
        { name: 'wanted_id', type: 'VARCHAR(64)', nullable: true },
        { name: 'completed_by', type: 'VARCHAR(255)', nullable: true },
        { name: 'evidence', type: 'TEXT', nullable: true },
        { name: 'validated_by', type: 'VARCHAR(255)', nullable: true },
        { name: 'stamp_id', type: 'VARCHAR(64)', nullable: true },
        { name: 'completed_at', type: 'TIMESTAMP', nullable: true },
        { name: 'validated_at', type: 'TIMESTAMP', nullable: true },
      ],
      primaryKey: ['id'],
    },
    {
      name: 'stamps',
      columns: [
        { name: 'id', type: 'VARCHAR(64)', nullable: false },
        { name: 'issued_by', type: 'VARCHAR(255)', nullable: false },
        { name: 'issued_to', type: 'VARCHAR(255)', nullable: false },
        { name: 'completion_id', type: 'VARCHAR(64)', nullable: true },
        { name: 'quality', type: 'INT', nullable: false },
        { name: 'comment', type: 'TEXT', nullable: true },
        { name: 'issued_at', type: 'TIMESTAMP', nullable: true },
      ],
      primaryKey: ['id'],
    },
    {
      name: 'badges',
      columns: [
        { name: 'id', type: 'VARCHAR(64)', nullable: false },
        { name: 'handle', type: 'VARCHAR(255)', nullable: false },
        { name: 'badge_type', type: 'VARCHAR(64)', nullable: false },
        { name: 'label', type: 'VARCHAR(255)', nullable: true },
        { name: 'granted_at', type: 'TIMESTAMP', nullable: true },
      ],
      primaryKey: ['id'],
    },
    {
      name: 'chain_meta',
      columns: [
        { name: 'wasteland_name', type: 'VARCHAR(255)', nullable: false },
        { name: 'dolthub_path', type: 'VARCHAR(512)', nullable: false },
        { name: 'parent_path', type: 'VARCHAR(512)', nullable: true },
        { name: 'schema_version', type: 'VARCHAR(16)', nullable: true },
        { name: 'registered_at', type: 'TIMESTAMP', nullable: true },
      ],
      primaryKey: ['wasteland_name'],
    },
  ],
};

/** MVR 1.1 schema — adds trust system columns, sandbox fields, evidence_url */
export const SCHEMA_1_1: SchemaVersion = {
  version: '1.1',
  tables: [
    ...SCHEMA_1_0.tables.map(t => {
      if (t.name === 'rigs') {
        return {
          ...t,
          columns: [
            ...t.columns,
            { name: 'trust_level_changed_at', type: 'TIMESTAMP', nullable: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: true },
          ],
        };
      }
      if (t.name === 'wanted') {
        return {
          ...t,
          columns: [
            ...t.columns,
            { name: 'project', type: 'VARCHAR(64)', nullable: true },
            { name: 'type', type: 'VARCHAR(32)', nullable: true },
            { name: 'priority', type: 'INT', nullable: true },
            { name: 'evidence_url', type: 'TEXT', nullable: true },
            { name: 'sandbox_required', type: 'BOOLEAN', nullable: true, defaultValue: '0' },
            { name: 'sandbox_scope', type: 'VARCHAR(64)', nullable: true },
            { name: 'sandbox_min_tier', type: 'INT', nullable: true },
          ],
        };
      }
      if (t.name === 'completions') {
        return {
          ...t,
          columns: [
            ...t.columns,
            { name: 'parent_completion_id', type: 'VARCHAR(64)', nullable: true },
            { name: 'block_hash', type: 'VARCHAR(64)', nullable: true },
            { name: 'hop_uri', type: 'VARCHAR(512)', nullable: true },
          ],
        };
      }
      return t;
    }),
  ],
};

/** Registry of all known schema versions, ordered */
export const SCHEMA_REGISTRY: SchemaVersion[] = [SCHEMA_1_0, SCHEMA_1_1];

// ============================================================================
// Version Management
// ============================================================================

/**
 * Read the current schema version from the _meta table.
 * Returns '0.0' if no version is set or the table doesn't exist.
 */
export async function getSchemaVersion(query: QueryFn): Promise<string> {
  try {
    const result = await query(
      "SELECT value FROM _meta WHERE `key` = 'schema_version'",
    );
    if (result.rows.length > 0 && result.rows[0].value) {
      return String(result.rows[0].value);
    }
    return '0.0';
  } catch {
    return '0.0';
  }
}

/**
 * Write the schema version to the _meta table.
 */
export async function setSchemaVersion(
  query: QueryFn,
  version: string,
): Promise<void> {
  await query(
    `REPLACE INTO _meta (\`key\`, value) VALUES ('schema_version', '${version}')`,
  );
}

// ============================================================================
// Schema Diffing
// ============================================================================

/**
 * Compare two schema versions and produce migration operations.
 * Only supports additive changes: new tables and new columns.
 */
export function diffSchema(current: SchemaVersion, target: SchemaVersion): SchemaDiff {
  const operations: MigrationOp[] = [];

  const currentTableNames = new Set(current.tables.map(t => t.name));

  for (const targetTable of target.tables) {
    if (!currentTableNames.has(targetTable.name)) {
      // New table
      operations.push({ type: 'create_table', table: targetTable });
    } else {
      // Existing table — check for new columns
      const currentTable = current.tables.find(t => t.name === targetTable.name)!;
      const currentColumnNames = new Set(currentTable.columns.map(c => c.name));

      for (const col of targetTable.columns) {
        if (!currentColumnNames.has(col.name)) {
          operations.push({
            type: 'add_column',
            table: targetTable.name,
            column: col,
          });
        }
      }
    }
  }

  operations.push({ type: 'set_version', version: target.version });

  return {
    fromVersion: current.version,
    toVersion: target.version,
    operations,
  };
}

/**
 * Compare a version string against the registry to find the schema.
 * Returns null if version is not found.
 */
export function findSchema(version: string): SchemaVersion | null {
  return SCHEMA_REGISTRY.find(s => s.version === version) ?? null;
}

// ============================================================================
// SQL Generation
// ============================================================================

/** Generate a column definition SQL fragment */
function columnSQL(col: ColumnDef): string {
  let sql = `\`${col.name}\` ${col.type}`;
  if (!col.nullable) sql += ' NOT NULL';
  if (col.defaultValue !== undefined) sql += ` DEFAULT ${col.defaultValue}`;
  return sql;
}

/**
 * Generate SQL statements for a set of migration operations.
 */
export function generateMigrationSQL(diff: SchemaDiff): string[] {
  const statements: string[] = [];

  for (const op of diff.operations) {
    switch (op.type) {
      case 'create_table': {
        const cols = op.table.columns.map(columnSQL).join(',\n    ');
        const pk = op.table.primaryKey.map(k => `\`${k}\``).join(', ');
        statements.push(
          `CREATE TABLE IF NOT EXISTS \`${op.table.name}\` (\n    ${cols},\n    PRIMARY KEY (${pk})\n)`,
        );
        break;
      }
      case 'add_column': {
        statements.push(
          `ALTER TABLE \`${op.table}\` ADD COLUMN ${columnSQL(op.column)}`,
        );
        break;
      }
      case 'set_version': {
        statements.push(
          `REPLACE INTO _meta (\`key\`, value) VALUES ('schema_version', '${op.version}')`,
        );
        break;
      }
    }
  }

  return statements;
}

// ============================================================================
// Migration Runner
// ============================================================================

/**
 * Run a full migration from the current version to the target version.
 *
 * Steps:
 * 1. Read current version from _meta
 * 2. Find schemas for current and target versions
 * 3. Compute diff
 * 4. Generate and execute SQL statements
 * 5. Update version in _meta
 */
export async function migrate(
  query: QueryFn,
  targetVersion: string,
): Promise<MigrationResult> {
  const currentVersion = await getSchemaVersion(query);
  const errors: string[] = [];

  if (currentVersion === targetVersion) {
    return {
      success: true,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      operationsApplied: 0,
      errors: [],
    };
  }

  const currentSchema = findSchema(currentVersion);
  const targetSchema = findSchema(targetVersion);

  if (!currentSchema) {
    return {
      success: false,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      operationsApplied: 0,
      errors: [`Unknown current schema version: ${currentVersion}`],
    };
  }

  if (!targetSchema) {
    return {
      success: false,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      operationsApplied: 0,
      errors: [`Unknown target schema version: ${targetVersion}`],
    };
  }

  const diff = diffSchema(currentSchema, targetSchema);
  const statements = generateMigrationSQL(diff);

  let applied = 0;
  for (const sql of statements) {
    try {
      await query(sql);
      applied++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed: ${sql.slice(0, 80)}... — ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    fromVersion: currentVersion,
    toVersion: targetVersion,
    operationsApplied: applied,
    errors,
  };
}
