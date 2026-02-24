#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  FitBuddy — Sync Edge Functions to Server                      ║
# ║  Copies Edge Functions to the Supabase functions volume         ║
# ║  Usage: ./deploy/sync-functions.sh                              ║
# ╚══════════════════════════════════════════════════════════════════╝

set -euo pipefail

SERVER="${DEPLOY_SERVER:-fitbuddy@YOUR_SERVER_IP}"
DEPLOY_DIR="/opt/fitbuddy"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$PROJECT_DIR/supabase/functions"

echo "=== FitBuddy Edge Functions Sync ==="
echo "Quelle: $FUNCTIONS_DIR"
echo "Ziel: $SERVER:$DEPLOY_DIR/volumes/functions/"
echo ""

# Pruefen ob Functions vorhanden
if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "FEHLER: $FUNCTIONS_DIR nicht gefunden!"
  exit 1
fi

# Sync Edge Functions
rsync -avz --delete \
  "$FUNCTIONS_DIR/" \
  "$SERVER:$DEPLOY_DIR/volumes/functions/"

echo ""
echo "=== Edge Functions synchronisiert ==="
echo "Neustart noetig: ssh $SERVER 'cd $DEPLOY_DIR && docker compose restart functions'"
