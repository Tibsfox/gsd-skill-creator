//! PostgreSQL-backed ColdSource — durable chunk backup for warm-start
//! recovery. Gated behind `#[cfg(feature = "postgres")]`.
//!
//! Uses `sqlx` with the tokio runtime. All async operations are bridged
//! to sync via `tokio::runtime::Handle::current().block_on()` because the
//! `ColdSource` trait is synchronous. This is acceptable because cold-source
//! fetches happen only during warm-start recovery (not the hot path).

use sqlx::PgPool;

use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::types::{ChunkId, TierKind};
use crate::memory_arena::warm_start::ColdSource;

/// PG-backed implementation of `ColdSource`. Stores chunk payloads in a
/// PostgreSQL table for durable backup and recovery of corrupt chunks.
pub struct PgColdSource {
    pool: PgPool,
    schema: String,
    table: String,
}

impl PgColdSource {
    /// Create a new PG cold source targeting `{schema}.{table}`.
    pub fn new(pool: PgPool, schema: impl Into<String>, table: impl Into<String>) -> Self {
        Self {
            pool,
            schema: schema.into(),
            table: table.into(),
        }
    }

    /// Create the backing table if it doesn't exist. Idempotent.
    pub fn ensure_table(&self) -> ArenaResult<()> {
        let sql = format!(
            "CREATE TABLE IF NOT EXISTS {}.{} (\
                tier TEXT NOT NULL, \
                chunk_id BIGINT NOT NULL, \
                payload BYTEA NOT NULL, \
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), \
                PRIMARY KEY (tier, chunk_id)\
            )",
            self.schema, self.table
        );
        tokio::runtime::Handle::current()
            .block_on(async { sqlx::query(&sql).execute(&self.pool).await })
            .map_err(|e| ArenaError::PgError(e.to_string()))?;
        Ok(())
    }

    /// Upsert a chunk's payload into PG. On conflict, overwrites the
    /// existing payload.
    pub fn store(&self, tier: TierKind, id: ChunkId, payload: Vec<u8>) -> ArenaResult<()> {
        let sql = format!(
            "INSERT INTO {}.{} (tier, chunk_id, payload) \
             VALUES ($1, $2, $3) \
             ON CONFLICT (tier, chunk_id) DO UPDATE SET payload = EXCLUDED.payload",
            self.schema, self.table
        );
        let tier_str = tier_to_str(tier);
        let chunk_id = id.as_u64() as i64;
        tokio::runtime::Handle::current()
            .block_on(async {
                sqlx::query(&sql)
                    .bind(tier_str)
                    .bind(chunk_id)
                    .bind(&payload)
                    .execute(&self.pool)
                    .await
            })
            .map_err(|e| ArenaError::PgError(e.to_string()))?;
        Ok(())
    }

    /// Remove a chunk's cold backup. Idempotent — no error if the row
    /// doesn't exist.
    pub fn delete(&self, tier: TierKind, id: ChunkId) -> ArenaResult<()> {
        let sql = format!(
            "DELETE FROM {}.{} WHERE tier = $1 AND chunk_id = $2",
            self.schema, self.table
        );
        let tier_str = tier_to_str(tier);
        let chunk_id = id.as_u64() as i64;
        tokio::runtime::Handle::current()
            .block_on(async {
                sqlx::query(&sql)
                    .bind(tier_str)
                    .bind(chunk_id)
                    .execute(&self.pool)
                    .await
            })
            .map_err(|e| ArenaError::PgError(e.to_string()))?;
        Ok(())
    }
}

impl ColdSource for PgColdSource {
    fn fetch(&self, tier: TierKind, id: ChunkId) -> ArenaResult<Option<Vec<u8>>> {
        let sql = format!(
            "SELECT payload FROM {}.{} WHERE tier = $1 AND chunk_id = $2",
            self.schema, self.table
        );
        let tier_str = tier_to_str(tier);
        let chunk_id = id.as_u64() as i64;
        let row: Option<(Vec<u8>,)> = tokio::runtime::Handle::current()
            .block_on(async {
                sqlx::query_as(&sql)
                    .bind(tier_str)
                    .bind(chunk_id)
                    .fetch_optional(&self.pool)
                    .await
            })
            .map_err(|e| ArenaError::PgError(e.to_string()))?;
        Ok(row.map(|(payload,)| payload))
    }
}

/// Convert a `TierKind` to its string representation for PG storage.
fn tier_to_str(tier: TierKind) -> &'static str {
    match tier {
        TierKind::Hot => "hot",
        TierKind::Warm => "warm",
        TierKind::Vector => "vector",
        TierKind::Blob => "blob",
        TierKind::Resident => "resident",
    }
}
