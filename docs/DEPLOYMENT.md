# PlanningOS - Deployment Guide

> **Version**: 1.0.0
> **Last Updated**: 2026-02-02

---

## Table of Contents

1. [Overview](#overview)
2. [Infrastructure](#infrastructure)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Docker Configuration](#docker-configuration)
5. [Environment Management](#environment-management)
6. [Deployment Procedures](#deployment-procedures)
7. [Monitoring & Observability](#monitoring--observability)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Vercel    │     │   Fly.io    │     │    Neon     │                   │
│  │   (Web)     │────▶│   (API)     │────▶│ (Database)  │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│         │                   │                   │                           │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │ Cloudflare  │     │    Logs     │     │   Backups   │                   │
│  │    CDN      │     │  (Axiom)    │     │  (Auto)     │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              DESKTOP APP                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   GitHub    │     │   macOS     │     │  Windows    │                   │
│  │  Releases   │────▶│   .dmg      │────▶│   .msi      │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                             │                   │                           │
│                             ▼                   ▼                           │
│                      ┌─────────────────────────────────┐                   │
│                      │       Auto-Updater              │                   │
│                      │    (tauri-plugin-updater)       │                   │
│                      └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Production** | Live users | `app.planningos.com` |
| **Staging** | QA testing | `staging.planningos.com` |
| **Preview** | PR previews | `pr-{number}.planningos.com` |
| **Development** | Local dev | `localhost:5173` |

---

## Infrastructure

### Recommended Stack

| Service | Provider | Tier | Purpose |
|---------|----------|------|---------|
| **Web Hosting** | Vercel | Pro | Static + SSR hosting |
| **API Hosting** | Fly.io | Launch | Rust containers |
| **Database** | Neon | Scale | Serverless PostgreSQL |
| **CDN** | Cloudflare | Pro | Asset delivery, DDoS |
| **Secrets** | Doppler | Team | Secret management |
| **Monitoring** | Axiom | Pro | Logs + metrics |
| **Error Tracking** | Sentry | Team | Error reporting |

### Cost Estimation (Monthly)

| Service | Estimated Cost |
|---------|----------------|
| Vercel Pro | $20 |
| Fly.io (2 instances) | $30 |
| Neon Scale | $19 |
| Cloudflare Pro | $20 |
| Doppler Team | $12 |
| Axiom Pro | $25 |
| Sentry Team | $26 |
| **Total** | **~$152/month** |

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### Main CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  # ============================================
  # FRONTEND CHECKS
  # ============================================
  frontend:
    name: Frontend (Lint, Type, Test)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: frontend

  # ============================================
  # BACKEND CHECKS
  # ============================================
  backend:
    name: Backend (Lint, Test)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: planningos_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: packages/api

      - name: Check formatting
        run: cargo fmt --check
        working-directory: packages/api

      - name: Clippy
        run: cargo clippy -- -D warnings
        working-directory: packages/api

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/planningos_test
        run: |
          cargo sqlx migrate run
          cargo test
        working-directory: packages/api

      - name: Check SQLx
        run: cargo sqlx prepare --check
        working-directory: packages/api

  # ============================================
  # BUILD VERIFICATION
  # ============================================
  build:
    name: Build
    needs: [frontend, backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web
        run: pnpm build:web

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: packages/api

      - name: Build API
        run: cargo build --release
        working-directory: packages/api

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            apps/web/dist
            packages/api/target/release/planningos-api
```

#### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ============================================
  # DEPLOY WEB TO VERCEL
  # ============================================
  deploy-web:
    name: Deploy Web
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'staging' }}
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        env:
          VITE_API_URL: ${{ vars.API_URL }}
        run: pnpm build:web

      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.event.inputs.environment == 'production' && '--prod' || '' }}
          working-directory: apps/web

  # ============================================
  # DEPLOY API TO FLY.IO
  # ============================================
  deploy-api:
    name: Deploy API
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'staging' }}
      url: https://api-${{ github.event.inputs.environment || 'staging' }}.planningos.com
    steps:
      - uses: actions/checkout@v4

      - name: Setup Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          flyctl deploy \
            --config packages/api/fly.toml \
            --app planningos-api-${{ github.event.inputs.environment || 'staging' }} \
            --remote-only

  # ============================================
  # RUN MIGRATIONS
  # ============================================
  migrate:
    name: Run Migrations
    needs: [deploy-api]
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install sqlx-cli
        run: cargo install sqlx-cli --no-default-features --features postgres

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: sqlx migrate run
        working-directory: packages/api

  # ============================================
  # E2E TESTS
  # ============================================
  e2e:
    name: E2E Tests
    needs: [deploy-web, deploy-api, migrate]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        env:
          BASE_URL: ${{ vars.APP_URL }}
        run: pnpm test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

#### Desktop Release Pipeline

```yaml
# .github/workflows/release-desktop.yml
name: Release Desktop

on:
  push:
    tags:
      - 'v*'

jobs:
  build-desktop:
    name: Build Desktop (${{ matrix.platform }})
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: macos-latest
            target: x86_64-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
          - platform: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev

      - name: Install frontend dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          projectPath: apps/desktop
          tagName: v__VERSION__
          releaseName: 'PlanningOS v__VERSION__'
          releaseBody: |
            See the changelog for details.
          releaseDraft: true
          prerelease: false
          args: --target ${{ matrix.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: desktop-${{ matrix.target }}
          path: |
            apps/desktop/src-tauri/target/${{ matrix.target }}/release/bundle/
```

---

## Docker Configuration

### API Dockerfile

```dockerfile
# docker/Dockerfile.api
# ============================================
# STAGE 1: Build
# ============================================
FROM rust:1.82-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY packages/api/Cargo.toml packages/api/Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src

# Build actual application
COPY packages/api/src ./src
COPY packages/api/sqlx-data.json ./
RUN touch src/main.rs && cargo build --release

# ============================================
# STAGE 2: Runtime
# ============================================
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Copy binary
COPY --from=builder /app/target/release/planningos-api .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Run
CMD ["./planningos-api"]
```

### Web Dockerfile

```dockerfile
# docker/Dockerfile.web
# ============================================
# STAGE 1: Build
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter=web build

# ============================================
# STAGE 2: Runtime (nginx)
# ============================================
FROM nginx:alpine AS runtime

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker/docker-compose.yml
version: '3.9'

services:
  # ============================================
  # DATABASE
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: planningos-db
    environment:
      POSTGRES_USER: planningos
      POSTGRES_PASSWORD: planningos
      POSTGRES_DB: planningos
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U planningos"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # API
  # ============================================
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: planningos-api
    environment:
      - DATABASE_URL=postgresql://planningos:planningos@postgres:5432/planningos
      - HOST=0.0.0.0
      - PORT=3001
      - RUST_LOG=info
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================
  # WEB
  # ============================================
  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
      args:
        - VITE_API_URL=http://localhost:3001
    container_name: planningos-web
    ports:
      - "80:80"
    depends_on:
      api:
        condition: service_healthy

volumes:
  postgres_data:
```

### Nginx Configuration

```nginx
# docker/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional, for same-origin)
    location /api {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

---

## Environment Management

### Secrets Management with Doppler

```bash
# Install Doppler CLI
brew install dopplerhq/cli/doppler  # macOS
# or
curl -Ls https://cli.doppler.com/install.sh | sh  # Linux

# Login
doppler login

# Setup project
doppler setup

# Run with secrets injected
doppler run -- cargo run

# Export to .env file
doppler secrets download --no-file --format env > .env
```

### Environment Variables by Environment

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `DATABASE_URL` | Local PG | Neon Staging | Neon Prod |
| `JWT_SECRET` | `dev-secret` | Doppler | Doppler |
| `CORS_ORIGINS` | `*` | `staging.planningos.com` | `app.planningos.com` |
| `RUST_LOG` | `debug` | `info` | `warn` |

---

## Deployment Procedures

### Manual Deployment

#### Deploy to Staging

```bash
# 1. Merge to develop
git checkout develop
git merge feature/my-feature

# 2. Deploy API
cd packages/api
flyctl deploy --app planningos-api-staging

# 3. Deploy Web
cd apps/web
vercel

# 4. Run migrations
sqlx migrate run
```

#### Deploy to Production

```bash
# 1. Create release branch
git checkout develop
git checkout -b release/1.2.0

# 2. Update version
pnpm version 1.2.0

# 3. Merge to main
git checkout main
git merge release/1.2.0 --no-ff

# 4. Tag release
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main --tags

# GitHub Actions will handle deployment
```

### Fly.io Configuration

```toml
# packages/api/fly.toml
app = "planningos-api"
primary_region = "cdg"  # Paris

[build]
dockerfile = "../docker/Dockerfile.api"

[env]
HOST = "0.0.0.0"
PORT = "3001"
RUST_LOG = "info"

[http_service]
internal_port = 3001
force_https = true
auto_stop_machines = true
auto_start_machines = true
min_machines_running = 1
processes = ["app"]

[[http_service.checks]]
grace_period = "10s"
interval = "30s"
method = "GET"
path = "/health"
timeout = "5s"

[[vm]]
cpu_kind = "shared"
cpus = 1
memory_mb = 512
```

---

## Monitoring & Observability

### Health Endpoints

```rust
// API health check
GET /health
{
  "status": "healthy",
  "version": "1.2.0",
  "uptime": 3600,
  "database": "connected",
  "timestamp": "2026-02-02T12:00:00Z"
}

// Detailed health (admin only)
GET /health/detailed
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok", "latency_ms": 5 },
    "memory": { "used_mb": 128, "total_mb": 512 },
    "cpu": { "usage_percent": 15 }
  }
}
```

### Logging (Axiom)

```rust
// Structured logging with tracing
use tracing::{info, error, instrument};

#[instrument(skip(pool))]
async fn create_schedule(pool: &PgPool, input: CreateScheduleInput) -> Result<Schedule> {
    info!(user_id = %input.user_id, date = %input.date, "Creating schedule");

    // ... implementation

    Ok(schedule)
}
```

### Error Tracking (Sentry)

```rust
// packages/api/src/infrastructure/observability/sentry.rs
use sentry::integrations::tower::SentryLayer;

pub fn init_sentry() {
    let _guard = sentry::init((
        env::var("SENTRY_DSN").ok(),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: Some(env::var("ENVIRONMENT").unwrap_or_else(|_| "development".into()).into()),
            traces_sample_rate: 0.2,
            ..Default::default()
        },
    ));
}
```

### Metrics Dashboard

Key metrics to monitor:

| Metric | Alert Threshold |
|--------|-----------------|
| Request latency (p99) | > 500ms |
| Error rate | > 1% |
| Database connections | > 80% pool |
| Memory usage | > 80% |
| CPU usage | > 70% sustained |

---

## Rollback Procedures

### Immediate Rollback

```bash
# Rollback API to previous version
flyctl releases list --app planningos-api
flyctl releases rollback --app planningos-api

# Rollback Web (Vercel)
vercel rollback

# Rollback database migration
sqlx migrate revert
```

### Full Rollback Checklist

1. **Identify the issue**
   - Check error logs
   - Check metrics
   - Identify affected version

2. **Communicate**
   - Notify team in Slack
   - Update status page

3. **Rollback application**
   ```bash
   # API
   flyctl releases rollback --app planningos-api

   # Web
   vercel rollback
   ```

4. **Rollback database (if needed)**
   ```bash
   # CAUTION: May cause data loss
   sqlx migrate revert
   ```

5. **Verify**
   - Check health endpoints
   - Run smoke tests
   - Monitor error rates

6. **Post-mortem**
   - Document what happened
   - Identify root cause
   - Create preventive measures

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in Doppler (not in code)
- [ ] Environment variables validated
- [ ] Database migrations tested
- [ ] No console.log / println! in production code
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Post-Deployment

- [ ] Health checks passing
- [ ] No error spikes in Sentry
- [ ] Response times normal
- [ ] Database connections stable
- [ ] SSL certificate valid

---

*Document maintained by the PlanningOS development team.*
