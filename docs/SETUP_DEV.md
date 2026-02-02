# PlanningOS - Developer Setup Guide

> **Version**: 1.0.0
> **Last Updated**: 2026-02-02
> **Estimated Setup Time**: 30-45 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Neon)](#database-setup-neon)
4. [Backend Setup (Rust)](#backend-setup-rust)
5. [Frontend Setup (React)](#frontend-setup-react)
6. [Desktop Setup (Tauri)](#desktop-setup-tauri)
7. [Running the Stack](#running-the-stack)
8. [IDE Configuration](#ide-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Install Command |
|----------|---------|---------|-----------------|
| **Node.js** | 22.x LTS | Frontend runtime | `fnm install 22` |
| **pnpm** | 9.x | Package manager | `npm install -g pnpm` |
| **Rust** | 1.82+ | Backend/Desktop | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Docker** | 25.x | Local services | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| **Git** | 2.40+ | Version control | System package manager |

### Verify Installation

```bash
# Check all versions
node --version    # v22.x.x
pnpm --version    # 9.x.x
rustc --version   # rustc 1.82.x
cargo --version   # cargo 1.82.x
docker --version  # Docker version 25.x.x
git --version     # git version 2.40+
```

### Recommended Tools

| Tool | Purpose | Install |
|------|---------|---------|
| **fnm** | Fast Node version manager | `curl -fsSL https://fnm.vercel.app/install \| bash` |
| **cargo-watch** | Auto-rebuild Rust | `cargo install cargo-watch` |
| **sqlx-cli** | Database migrations | `cargo install sqlx-cli` |
| **just** | Command runner | `cargo install just` |

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/fs0ciety7000/PlanningOs.git
cd PlanningOs
```

### 2. Install Dependencies

```bash
# Install all Node.js dependencies
pnpm install

# Install Rust dependencies (handled by cargo automatically)
cd packages/api && cargo build && cd ../..
```

### 3. Environment Variables

Create environment files from templates:

```bash
# Root environment
cp .env.example .env

# API environment
cp packages/api/.env.example packages/api/.env

# Web environment
cp apps/web/.env.example apps/web/.env
```

### Environment Variables Reference

#### Root `.env`

```env
# Environment
NODE_ENV=development

# Ports
API_PORT=3001
WEB_PORT=5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planningos

# Feature flags
ENABLE_MOCK_DATA=true
```

#### API `.env` (`packages/api/.env`)

```env
# Server
HOST=127.0.0.1
PORT=3001
RUST_LOG=debug,sqlx=warn,tower_http=debug

# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/planningos?sslmode=require

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=900          # 15 minutes
JWT_REFRESH_EXPIRY=604800      # 7 days

# CORS
CORS_ORIGINS=http://localhost:5173,tauri://localhost

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECS=60
```

#### Web `.env` (`apps/web/.env`)

```env
# API
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws

# App
VITE_APP_NAME=PlanningOS
VITE_APP_VERSION=$npm_package_version
```

---

## Database Setup (Neon)

### Option A: Neon Cloud (Recommended)

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub

2. **Create Project**
   ```
   Project name: planningos-dev
   Region: eu-central-1 (or closest to you)
   PostgreSQL version: 16
   ```

3. **Get Connection String**
   ```
   Dashboard → Connection Details → Connection string
   ```

   Copy and paste into `packages/api/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/planningos?sslmode=require
   ```

4. **Run Migrations**
   ```bash
   cd packages/api
   sqlx migrate run
   ```

### Option B: Local PostgreSQL (Docker)

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Connection string for local
DATABASE_URL=postgresql://planningos:planningos@localhost:5432/planningos
```

### Database Migrations

```bash
cd packages/api

# Create new migration
sqlx migrate add <name>

# Run pending migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert

# Check migration status
sqlx migrate info
```

### Seed Data

```bash
# Run seed script
cd packages/db
pnpm seed

# Or via SQL
psql $DATABASE_URL -f src/seeds/001_initial_data.sql
```

---

## Backend Setup (Rust)

### Project Structure

```
packages/api/
├── src/
│   ├── main.rs           # Entry point
│   ├── lib.rs            # Library exports
│   ├── domain/           # Business logic
│   ├── application/      # Use cases
│   ├── infrastructure/   # External adapters
│   └── api/              # HTTP handlers
├── Cargo.toml
├── .env
└── sqlx-data.json        # Compile-time SQL verification
```

### Build & Run

```bash
cd packages/api

# Development (with auto-reload)
cargo watch -x run

# Development (single run)
cargo run

# Release build
cargo build --release

# Run tests
cargo test

# Run with specific log level
RUST_LOG=debug cargo run
```

### SQLx Setup

SQLx provides compile-time SQL verification:

```bash
# Prepare offline data (for CI)
cargo sqlx prepare

# Check queries without database
cargo sqlx prepare --check
```

### Useful Cargo Commands

```bash
# Format code
cargo fmt

# Lint with Clippy
cargo clippy

# Update dependencies
cargo update

# Check for security vulnerabilities
cargo audit

# Generate documentation
cargo doc --open
```

---

## Frontend Setup (React)

### Project Structure

```
apps/web/
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Root component
│   ├── components/       # UI components
│   ├── features/         # Feature modules
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── styles/           # Global styles
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Development Server

```bash
cd apps/web

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Desktop Setup (Tauri)

### Prerequisites

```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Windows
# Install Visual Studio Build Tools with C++ workload
```

### Project Structure

```
apps/desktop/
├── src/                  # React frontend (shared with web)
└── src-tauri/
    ├── src/
    │   ├── main.rs       # Tauri entry
    │   ├── lib.rs
    │   └── commands/     # IPC commands
    ├── Cargo.toml
    ├── tauri.conf.json   # Tauri config
    └── capabilities/     # Permission system
```

### Development

```bash
cd apps/desktop

# Start development (web + tauri)
pnpm tauri dev

# Build for production
pnpm tauri build

# Generate icons
pnpm tauri icon ./src-tauri/icons/app-icon.png
```

### Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "PlanningOS",
  "version": "0.1.0",
  "identifier": "com.planningos.app",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "PlanningOS",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' https://api.planningos.com wss://api.planningos.com"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## Running the Stack

### Option 1: Individual Services

```bash
# Terminal 1: Database (if using Docker)
docker compose up postgres

# Terminal 2: Backend API
cd packages/api && cargo watch -x run

# Terminal 3: Frontend
cd apps/web && pnpm dev

# Terminal 4: Desktop (optional)
cd apps/desktop && pnpm tauri dev
```

### Option 2: Turbo (Recommended)

```bash
# Start all services
pnpm dev

# Start specific apps
pnpm dev --filter=web
pnpm dev --filter=api

# Build all
pnpm build

# Test all
pnpm test
```

### Option 3: Docker Compose (Full Stack)

```bash
# Start everything
docker compose up

# Start with rebuild
docker compose up --build

# Stop everything
docker compose down
```

### Available Scripts

```bash
# Development
pnpm dev              # Start all in dev mode
pnpm dev:web          # Start web only
pnpm dev:api          # Start API only
pnpm dev:desktop      # Start desktop app

# Build
pnpm build            # Build all
pnpm build:web        # Build web
pnpm build:api        # Build API
pnpm build:desktop    # Build desktop

# Test
pnpm test             # Run all tests
pnpm test:unit        # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report

# Code quality
pnpm lint             # Lint all
pnpm format           # Format all
pnpm typecheck        # Type check

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed data
pnpm db:reset         # Reset database
```

---

## IDE Configuration

### VS Code (Recommended)

#### Required Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "GitHub.copilot"
  ]
}
```

#### Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.cargo.features": "all",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API (Rust)",
      "type": "lldb",
      "request": "launch",
      "program": "${workspaceFolder}/packages/api/target/debug/planningos-api",
      "args": [],
      "cwd": "${workspaceFolder}/packages/api",
      "env": {
        "RUST_LOG": "debug"
      },
      "preLaunchTask": "cargo build"
    },
    {
      "name": "Debug Web (Chrome)",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web/src"
    },
    {
      "name": "Debug Tauri",
      "type": "lldb",
      "request": "launch",
      "cargo": {
        "args": ["build", "--manifest-path=./apps/desktop/src-tauri/Cargo.toml"]
      },
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### JetBrains IDEs

#### RustRover / IntelliJ

1. Install Rust plugin
2. Open project as Cargo workspace
3. Enable format on save

#### WebStorm

1. Enable ESLint
2. Enable Prettier
3. Configure TypeScript service

---

## Troubleshooting

### Common Issues

#### Node.js Version Mismatch

```bash
# Use fnm to switch versions
fnm use 22

# Or use .nvmrc
echo "22" > .nvmrc
fnm use
```

#### pnpm Install Fails

```bash
# Clear cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### Rust Build Fails

```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build

# Check for missing system dependencies (Linux)
sudo apt install build-essential pkg-config libssl-dev
```

#### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Neon status
# Go to neon.tech dashboard → Project → Connection

# For SSL issues
?sslmode=require
```

#### Tauri Build Fails

```bash
# macOS: Reinstall Xcode tools
sudo rm -rf /Library/Developer/CommandLineTools
xcode-select --install

# Linux: Install missing deps
sudo apt install libwebkit2gtk-4.1-dev

# Windows: Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different ports in .env
```

### Getting Help

1. Check the [GitHub Issues](https://github.com/fs0ciety7000/PlanningOs/issues)
2. Search existing solutions
3. Create a new issue with:
   - OS and version
   - Node/Rust/Docker versions
   - Error logs
   - Steps to reproduce

---

## Quick Reference

### Useful Commands Cheatsheet

```bash
# Start everything
pnpm dev

# Database
pnpm db:migrate
pnpm db:seed

# Testing
pnpm test
pnpm test:coverage

# Code quality
pnpm lint
pnpm format
pnpm typecheck

# Build
pnpm build

# Clean
pnpm clean
cargo clean
```

### Environment URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| API | http://localhost:3001 |
| API Docs | http://localhost:3001/docs |
| Storybook | http://localhost:6006 |

---

*Document maintained by the PlanningOS development team.*
