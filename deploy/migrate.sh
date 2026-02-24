#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  FitBuddy — Run Migrations on Self-Hosted Supabase             ║
# ║  Executes all SQL migrations in order                           ║
# ║  Usage: ./deploy/migrate.sh                                     ║
# ╚══════════════════════════════════════════════════════════════════╝

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/fitbuddy}"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations"

# Lade .env fuer POSTGRES_PASSWORD
if [ -f "$DEPLOY_DIR/.env" ]; then
  source "$DEPLOY_DIR/.env"
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?Fehlt! Setze POSTGRES_PASSWORD in .env}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"
DB_CONTAINER="fitbuddy-db-1"

echo "=== FitBuddy Migrationen ==="
echo "Migrations: $MIGRATIONS_DIR"
echo ""

# Pruefen ob DB-Container laeuft
if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
  echo "FEHLER: DB-Container '$DB_CONTAINER' laeuft nicht!"
  echo "Starte mit: cd $DEPLOY_DIR && docker compose up -d db"
  exit 1
fi

# Migrationen in Reihenfolge ausfuehren
MIGRATION_COUNT=0
for migration in "$MIGRATIONS_DIR"/*.sql; do
  FILENAME=$(basename "$migration")
  echo "  Ausfuehre: $FILENAME"
  docker exec -i "$DB_CONTAINER" psql -U postgres -d "$POSTGRES_DB" < "$migration" 2>&1 | \
    grep -v "^$" | head -5
  MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
done

echo ""
echo "=== $MIGRATION_COUNT Migrationen ausgefuehrt ==="
