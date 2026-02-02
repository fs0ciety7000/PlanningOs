#!/bin/bash
# PlanningOS Database Setup Script
# Usage: ./scripts/setup-db.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  PlanningOS Database Setup     ${NC}"
echo -e "${BLUE}================================${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    # Try to load from .env
    if [ -f "packages/api/.env" ]; then
        export $(grep -v '^#' packages/api/.env | xargs)
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Error: DATABASE_URL is not set${NC}"
        echo ""
        echo "Please set your Neon database URL:"
        echo "  export DATABASE_URL='postgresql://user:password@host.neon.tech/planningos?sslmode=require'"
        echo ""
        echo "Or create packages/api/.env with DATABASE_URL"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo -e "${GREEN}✓${NC} psql is available"

# Check connection
echo -e "${YELLOW}→${NC} Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed"
    echo "Please check your DATABASE_URL"
    exit 1
fi

# Run migrations
echo -e "${YELLOW}→${NC} Running migrations..."
psql "$DATABASE_URL" -f packages/db/src/migrations/001_initial_schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migrations completed"
else
    echo -e "${RED}✗${NC} Migrations failed"
    exit 1
fi

# Run seed
echo -e "${YELLOW}→${NC} Seeding data..."
psql "$DATABASE_URL" -f packages/db/src/seeds/001_initial_data.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Seed data inserted"
else
    echo -e "${RED}✗${NC} Seeding failed"
    exit 1
fi

# Verify data
echo -e "${YELLOW}→${NC} Verifying data..."
RESULT=$(psql "$DATABASE_URL" -t -c "
SELECT json_build_object(
    'organizations', (SELECT COUNT(*) FROM organizations),
    'users', (SELECT COUNT(*) FROM users),
    'shift_types', (SELECT COUNT(*) FROM shift_types),
    'periods', (SELECT COUNT(*) FROM periods),
    'holidays', (SELECT COUNT(*) FROM holidays)
);
")

echo ""
echo -e "${BLUE}Database Summary:${NC}"
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Setup Complete!               ${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Test Users:"
echo "  - admin@planningos.local    (Admin)     - Password: Admin123!"
echo "  - planner@planningos.local  (Planner)   - Password: Planner123!"
echo "  - agent1@planningos.local   (Agent)     - Password: Agent123!"
echo ""
echo "Next steps:"
echo "  1. Start the API: cd packages/api && cargo run"
echo "  2. Start the web: pnpm dev"
echo ""
