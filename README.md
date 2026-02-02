# PlanningOS

> Workforce Scheduling Platform - Migrating from Excel to Modern Web/Desktop App

## Overview

PlanningOS is a comprehensive workforce scheduling platform designed for **Planners** (managers) and **Agents** (employees). It manages shift assignments across a 364-day cycle divided into 13 periods of 28 days each.

## Tech Stack

- **Backend**: Rust (Axum) with Hexagonal Architecture
- **Desktop**: Tauri v2
- **Frontend**: React 19, TypeScript, Vite
- **Database**: Neon (Serverless PostgreSQL)
- **UI**: Tailwind CSS v4, shadcn/ui, Framer Motion
- **State**: TanStack Query, Zustand

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Rust 1.82+
- Docker (optional, for local PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/fs0ciety7000/PlanningOs.git
cd PlanningOs

# Install dependencies
pnpm install

# Setup environment
cp packages/api/.env.example packages/api/.env
cp apps/web/.env.example apps/web/.env

# Run development servers
pnpm dev
```

### Database Setup

```bash
# Run migrations
cd packages/api
sqlx migrate run

# Seed initial data
psql $DATABASE_URL -f packages/db/src/seeds/001_initial_data.sql
```

## Project Structure

```
PlanningOs/
├── apps/
│   ├── web/          # React SPA
│   └── desktop/      # Tauri Desktop App
├── packages/
│   ├── api/          # Rust Backend (Axum)
│   ├── db/           # Database Migrations & Seeds
│   └── shared/       # Shared Types & Utils
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP_DEV.md
│   ├── DEPLOYMENT.md
│   └── INIT_GIT.md
└── docker/
```

## Business Rules

### Temporal Structure
- **Year**: 364 days (13 periods × 28 days)
- **Period**: P1 to P13, each exactly 28 days

### Quotas per Period (Hard Constraints)
- **4 CH** (Congé Habituel - Regular Leave)
- **4 RH** (Repos Hebdomadaire - Weekly Rest)
- **1 CV** (Congé Vieillesse - Seniority Leave)
- **RR** required for each holiday worked

### Hour Calculations
- Standard duration: 8h
- Night hours: 8h for night codes (121, 6121, 7121), 2h for standard codes

## Shift Codes

| Category | Codes | Duration | Night Hours |
|----------|-------|----------|-------------|
| Standard | 101, 102, 6101, 6102, 7101, 7102 | 8h | 2h |
| Intermediate | 111, 112, 6111, 6112, 7111, 7112 | 8h | 2h |
| Night | 121, 6121, 7121 | 8h | 8h |
| Partial | X_AM, X_PM | 8h | 2h |
| Special | AG (Strike) | 8h | 0h |
| Rest | RH, CH, RR, ZM | 0h | 0h |
| Leave | CN, JC, CV | 8h/0h | 0h |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and database schema
- [Development Setup](docs/SETUP_DEV.md) - Developer onboarding guide
- [Deployment](docs/DEPLOYMENT.md) - CI/CD and production deployment
- [Git Workflow](docs/INIT_GIT.md) - Branching strategy and commit conventions

## License

MIT
