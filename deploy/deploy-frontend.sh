#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  FitBuddy — Frontend Deploy to Hetzner                         ║
# ║  Builds locally and deploys via rsync                           ║
# ║  Usage: ./deploy/deploy-frontend.sh                             ║
# ╚══════════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Konfiguration ──────────────────────────────────────────────
SERVER="${DEPLOY_SERVER:-root@46.225.228.12}"
DEPLOY_DIR="/opt/fitbuddy"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== FitBuddy Frontend Deploy ==="
echo "Server: $SERVER"
echo "Project: $PROJECT_DIR"
echo ""

# ── 1. Build ───────────────────────────────────────────────────
echo "[1/4] Production Build..."
cd "$PROJECT_DIR"

# Production env vars (Supabase URL zeigt auf den eigenen Server)
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://fudda.de}" \
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:?Fehlt! Setze VITE_SUPABASE_ANON_KEY}" \
VITE_AI_PROVIDER=supabase \
VITE_OPENAI_MODEL=gpt-4o-mini \
npm run build

# ── 2. Security Check ─────────────────────────────────────────
echo "[2/4] Security Check..."
if grep -r "sk-proj-\|sk-live-\|sk-test-" dist/ 2>/dev/null; then
  echo "FEHLER: API-Key im Build gefunden! Abbruch."
  exit 1
fi
echo "OK: Keine API-Keys im Bundle."

# ── 3. Bundle-Info ─────────────────────────────────────────────
echo "[3/4] Bundle-Info:"
du -sh dist/
echo "Dateien: $(find dist/ -type f | wc -l)"

# ── 4. Deploy via rsync ───────────────────────────────────────
echo "[4/4] Deploy via rsync..."
rsync -avz --delete \
  dist/ \
  "$SERVER:$DEPLOY_DIR/frontend/"

echo ""
echo "=== Deploy erfolgreich! ==="
echo "URL: https://fudda.de"
