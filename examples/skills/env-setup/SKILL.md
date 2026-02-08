---
name: env-setup
description: Provides environment configuration best practices including .env management, secrets hygiene, and config validation. Use when setting up environment variables, managing secrets, creating config files, or when user mentions 'env', '.env', 'environment variables', 'config', 'secrets', 'credentials'.
---

# Environment Configuration

Security-first patterns for managing environment variables, secrets, and application configuration across multiple environments.

## Security-Critical Rules

These rules are non-negotiable. Violating them creates security vulnerabilities.

| Rule | Why |
|------|-----|
| NEVER commit `.env` files to version control | Secrets in git history are permanent; they persist even after deletion |
| NEVER log or display actual secret values | Logs are often stored in plain text, forwarded to third parties |
| NEVER hardcode secrets in source code | Source code is shared, reviewed, and stored broadly |
| NEVER pass secrets as command-line arguments | Arguments are visible in process listings (`ps aux`) |
| ALWAYS use `.env.example` with placeholder values | Documents required variables without exposing real values |
| ALWAYS add `.env*` to `.gitignore` BEFORE creating `.env` | Prevents accidental commit; order matters |

---

## .gitignore Configuration

Add this BEFORE creating any `.env` files.

```gitignore
# Environment files - NEVER commit these
.env
.env.local
.env.development
.env.staging
.env.production
.env.test

# Keep the example template
!.env.example

# Other secret files
*.pem
*.key
*.p12
*.pfx
credentials.json
service-account.json
```

### Verify Nothing Is Tracked

```bash
# Check if any .env files are already tracked
git ls-files | grep -i '\.env'

# If found, remove from tracking (file stays on disk)
git rm --cached .env
git commit -m "chore: remove tracked .env file"
```

---

## .env File Patterns

### Naming Conventions

| Convention | Example | Rule |
|-----------|---------|------|
| Variable names | `DATABASE_URL` | UPPER_SNAKE_CASE, always |
| Prefix by service | `DB_HOST`, `REDIS_URL`, `AWS_REGION` | Group related vars with common prefix |
| Boolean values | `ENABLE_CACHE=true` | Use `true`/`false`, not `1`/`0` or `yes`/`no` |
| Port numbers | `PORT=3000` | Numeric, no quotes |
| URLs | `API_BASE_URL=https://api.example.com` | Full URL with protocol, no trailing slash |
| Feature flags | `FEATURE_NEW_DASHBOARD=true` | Prefix with `FEATURE_` |

### .env File Format Rules

```bash
# Comments start with #
# Blank lines are ignored

# Group related variables with comments
# -- Database --
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=appuser
DB_PASSWORD=changeme

# Quotes are optional but recommended for values with spaces or special chars
APP_NAME="My Application"
GREETING_MESSAGE="Hello, world!"

# No spaces around the equals sign
# WRONG: DB_HOST = localhost
# RIGHT: DB_HOST=localhost

# Multi-line values use quotes
RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/yGJD...
-----END RSA PRIVATE KEY-----"
```

---

## .env.example Template

Every project must have a `.env.example` that documents all required variables with safe placeholder values. This file IS committed to version control.

### Template Generator

For a typical web application:

```bash
# .env.example
# Copy this file to .env and fill in actual values
# cp .env.example .env

# ============================================================
# Application
# ============================================================
NODE_ENV=development
PORT=3000
APP_NAME="My App"
LOG_LEVEL=info

# ============================================================
# Database
# ============================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password
# Or use a connection string:
# DATABASE_URL=postgresql://user:password@localhost:5432/myapp_dev

# ============================================================
# Cache
# ============================================================
REDIS_URL=redis://localhost:6379

# ============================================================
# Authentication
# ============================================================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=generate_a_secure_random_string_here
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ============================================================
# External Services
# ============================================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# ============================================================
# Email
# ============================================================
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@example.com

# ============================================================
# Storage
# ============================================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=myapp-uploads-dev

# ============================================================
# Feature Flags
# ============================================================
FEATURE_NEW_DASHBOARD=false
FEATURE_BETA_API=false
```

### Placeholder Value Rules

| Variable Type | Placeholder Style | Example |
|--------------|-------------------|---------|
| Non-secret config | Real default value | `PORT=3000` |
| Passwords | `your_[thing]_password` | `DB_PASSWORD=your_db_password` |
| API keys | `your_[thing]_here` | `STRIPE_SECRET_KEY=sk_test_your_key_here` |
| Generated secrets | Generation instructions | `JWT_SECRET=generate_a_secure_random_string_here` |
| URLs with credentials | Template with placeholders | `DATABASE_URL=postgresql://user:password@localhost:5432/db` |

---

## Multi-Environment Patterns

### File Hierarchy

```
.env.example          # Template (committed to git)
.env                  # Local overrides (gitignored)
.env.development      # Dev defaults (gitignored)
.env.test             # Test defaults (gitignored)
.env.staging          # Staging values (gitignored)
.env.production       # Production values (gitignored)
```

### Loading Order (Most Frameworks)

```
1. .env                   (always loaded, highest local priority)
2. .env.{NODE_ENV}        (environment-specific)
3. .env.local             (local overrides)
4. Process environment     (highest priority, from shell/CI/orchestrator)
```

**Process environment always wins.** This means CI/CD and container orchestrators can override file-based config without modifying files.

### Environment-Specific Patterns

| Environment | Characteristics |
|-------------|----------------|
| `development` | Local services, verbose logging, debug mode, mock external APIs |
| `test` | In-memory or test databases, no external calls, deterministic seeds |
| `staging` | Production-like infra, test data, may use real external services |
| `production` | Real everything, minimal logging of sensitive data, error tracking on |

---

## Config Validation

Validate all environment variables at application startup. Fail fast with clear error messages, not later with cryptic runtime errors.

### Zod (TypeScript)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database (required)
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // Redis (optional with default)
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth (required in production)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // External services (optional in development)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),

  // Feature flags
  FEATURE_NEW_DASHBOARD: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

// Use at startup
export const env = validateEnv();
```

### Joi (Node.js)

```javascript
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .required(),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: 'postgresql' }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
}).unknown(true); // Allow other env vars to exist

const { error, value } = envSchema.validate(process.env);
if (error) {
  console.error(`Config validation error: ${error.message}`);
  process.exit(1);
}

module.exports = value;
```

### Python (Pydantic)

```python
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    # Application
    app_env: str = Field("development", pattern="^(development|test|staging|production)$")
    port: int = Field(8000, ge=1, le=65535)
    log_level: str = Field("info", pattern="^(debug|info|warn|error)$")

    # Database
    database_url: str

    # Auth
    jwt_secret: str = Field(min_length=32)

    # External services
    stripe_secret_key: str | None = None

    @validator("stripe_secret_key")
    def validate_stripe_key(cls, v):
        if v and not v.startswith("sk_"):
            raise ValueError("Stripe secret key must start with sk_")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


# Fails fast at import time if validation fails
settings = Settings()
```

### Validation Rules

| Rule | Why |
|------|-----|
| Validate at startup, not first use | Fail immediately, not 3 hours into a production deploy |
| Provide default values for non-secrets | Reduce setup friction for new developers |
| Never provide default values for secrets | Forces explicit configuration; no "default password" in production |
| Type-coerce from strings | All env vars are strings; validate and convert early |
| Document validation errors clearly | Tell developers exactly which variable is wrong and why |

---

## Secrets Hygiene

### Secret Rotation

| Practice | Implementation |
|----------|---------------|
| Use short-lived tokens | JWT access tokens: 15 minutes; refresh tokens: 7 days |
| Rotate API keys periodically | Generate new key, update config, revoke old key |
| Use environment-specific keys | Different Stripe keys for dev/staging/prod |
| Audit secret access | Log when secrets are read (not the values) |

### If a Secret Is Leaked

1. **Revoke immediately** -- Rotate the compromised credential. Do not wait.
2. **Check git history** -- If committed, it is in every clone forever. Rotate.
3. **Audit access logs** -- Determine if the secret was used by an attacker.
4. **Update all environments** -- Replace the secret everywhere it is used.
5. **Post-mortem** -- How did it leak? Fix the process.

```bash
# Search git history for accidentally committed secrets
git log --all -p | grep -i "password\|secret\|api_key\|token" | head -20

# Use tools like trufflehog or gitleaks for comprehensive scanning
trufflehog git file://. --only-verified
gitleaks detect --source .
```

### Logging Safety

```typescript
// NEVER do this
console.log('Connecting with password:', process.env.DB_PASSWORD);
console.log('Config:', process.env);
console.log('Request headers:', req.headers); // May contain Authorization

// SAFE alternatives
console.log('Connecting to database:', process.env.DB_HOST);
console.log('Config loaded for environment:', process.env.NODE_ENV);
console.log('Auth header present:', !!req.headers.authorization);

// Mask secrets in logs if you must reference them
function maskSecret(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}
console.log('Using API key:', maskSecret(process.env.API_KEY));
// Output: "Using API key: sk_t****f8k2"
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# Secrets configured in GitHub repository settings
# Settings > Secrets and variables > Actions

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        run: |
          npm run deploy
```

### Docker / Container Orchestration

```bash
# Pass at runtime (not build time)
docker run -e DATABASE_URL="postgresql://..." myapp

# Or use an env file
docker run --env-file .env.production myapp

# Docker Compose
services:
  app:
    env_file:
      - .env.production
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Committing `.env` to git | Secrets exposed in repo history forever | Add to `.gitignore` before creating |
| No `.env.example` | New developers don't know what vars are needed | Always maintain `.env.example` |
| Default passwords for secrets | `JWT_SECRET=secret` ships to production | No defaults for secrets; require explicit configuration |
| Secrets in Dockerfile ENV | Visible in image metadata | Use runtime env vars or Docker secrets |
| Logging `process.env` | Dumps all secrets to logs | Log only non-sensitive values |
| Same secrets across environments | One leak compromises everything | Unique secrets per environment |
| No validation at startup | Cryptic errors hours later in production | Validate all config at app initialization |
| Secrets in URL query strings | URLs are logged by proxies, browsers, analytics | Use headers for auth tokens |
| Shared `.env` files via email/Slack | Secrets in plaintext in chat history | Use a secrets manager or encrypted transfer |
| Long-lived API keys with no rotation | Compromised key stays valid indefinitely | Rotate keys periodically; use expiring tokens |

## Setup Checklist

When configuring a new project's environment:

- [ ] `.gitignore` includes `.env*` patterns (excluding `.env.example`)
- [ ] `.env.example` exists with all variables documented
- [ ] `.env.example` uses safe placeholder values (no real secrets)
- [ ] Config validation runs at application startup
- [ ] Validation errors are clear and specific
- [ ] Non-secret config has sensible defaults
- [ ] Secrets have NO defaults (must be explicitly set)
- [ ] Each environment uses unique secret values
- [ ] No secrets in source code, Dockerfiles, or CLI arguments
- [ ] Logging does not output secret values
- [ ] Secret scanning is part of CI pipeline
- [ ] Team knows the secret rotation procedure
