"""Shared database configuration. Loads from .env, falls back to defaults."""

import os

def get_db_dsn():
    """Get database connection string from .env or defaults."""
    env = {}
    for env_path in ['.env', os.path.expanduser('~/.env')]:
        if os.path.exists(env_path):
            for line in open(env_path):
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip("'\"")
            break

    password = env.get('PG_PASS', '')

    if password:
        host = env.get('PG_HOST', 'localhost')
        port = env.get('PG_PORT', '5432')
        user = env.get('PG_USER', 'postgres')
        db = env.get('PG_DB', 'tibsfox')
        return f"host={host} port={port} dbname={db} user={user} password={password}"

    # Fall back to known working credentials
    return "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"

DB_DSN = get_db_dsn()
