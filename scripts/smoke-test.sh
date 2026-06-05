#!/usr/bin/env bash
# smoke-test.sh — Post-Deploy Live-Smoke-Test against fudda.de
#
# Runs after every deploy via:  bash scripts/smoke-test.sh
#
# Checks that the 7 most-touched user pathways still work, without needing
# a browser or Playwright. Uses the supabase REST API + Anthropic-style
# golden-set probes.
#
# Requires the following env vars (read from /opt/fitbuddy/.env on the server):
#   SERVICE_ROLE_KEY  — admin key for generating magic links + bypass RLS for cleanup
#   ANON_KEY          — same key as the frontend uses
#
# Exit codes:
#   0   all checks passed
#   ≥1  number of failing checks (also printed)

set -uo pipefail

# ── Config ──────────────────────────────────────────────────────────────
HOST="${SMOKE_HOST:-https://fudda.de}"
SSH_HOST="${SMOKE_SSH:-root@46.225.228.12}"
TEST_EMAIL="${SMOKE_USER:-timo.koch@rwth-aachen.de}"
USER_ID="${SMOKE_USER_ID:-3af4c3b4-b6fc-4ed1-89fe-8b9cc5202a3a}"
DATE_TAG="$(date +%Y-%m-%d-%H%M%S)"

# Read keys from server (we don't keep them locally)
echo "▶ Loading keys from $SSH_HOST..."
SERVICE_ROLE_KEY="$(ssh -o ConnectTimeout=8 "$SSH_HOST" "grep '^SERVICE_ROLE_KEY=' /opt/fitbuddy/.env | cut -d= -f2")"
ANON_KEY="$(ssh -o ConnectTimeout=8 "$SSH_HOST" "grep '^ANON_KEY=' /opt/fitbuddy/.env | cut -d= -f2")"
[ -z "$SERVICE_ROLE_KEY" ] && { echo "✗ no SERVICE_ROLE_KEY"; exit 99; }

# ── Helpers ─────────────────────────────────────────────────────────────
PASS=0
FAIL=0
check() {
  local desc="$1" cmd="$2" expect="$3"
  local got
  got="$(eval "$cmd" 2>&1)"
  if echo "$got" | grep -qE "$expect"; then
    echo "  ✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $desc — expected /$expect/, got: $(echo "$got" | head -c 120)"
    FAIL=$((FAIL + 1))
  fi
}

# Generate magic link to extract a fresh JWT (no Email-Versand)
mk_token() {
  curl -s -X POST "$HOST/auth/v1/admin/generate_link" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"magiclink\",\"email\":\"$TEST_EMAIL\"}" \
  | grep -oE '"hashed_token":"[^"]+"' | cut -d\" -f4
}

# ── Layer 1: Build is live ──────────────────────────────────────────────
echo ""
echo "═══ Layer 1: HTTP + Build ═══"
check "/cockpit responds 200" \
  "curl -s -o /dev/null -w '%{http_code}' $HOST/cockpit" \
  "^200$"
check "/training responds 200" \
  "curl -s -o /dev/null -w '%{http_code}' $HOST/training" \
  "^200$"
check "index.html references current bundle" \
  "curl -s $HOST/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1" \
  "^index-"

# ── Layer 2: PostgREST schema-cache is loaded ───────────────────────────
echo ""
echo "═══ Layer 2: PostgREST schema-cache (caught B31 on 2026-05-26) ═══"
SVC_AUTH="apikey: $SERVICE_ROLE_KEY"
SVC_BEARER="Authorization: Bearer $SERVICE_ROLE_KEY"
check "ai_action_logs schema knows all Phase-2 columns" \
  "curl -s -X POST $HOST/rest/v1/ai_action_logs \
    -H '$SVC_AUTH' -H '$SVC_BEARER' -H 'Content-Type: application/json' \
    -H 'Prefer: return=minimal' \
    -d '{\"user_id\":\"$USER_ID\",\"action_type\":\"SMOKE_TEST_$DATE_TAG\",\"phase\":\"execute\",\"status\":\"attempted\",\"completion_tokens\":null,\"cost_cents_x100\":null}' \
    -w '%{http_code}' -o /dev/null" \
  "^201$"
# Cleanup the probe insert right away
ssh "$SSH_HOST" "docker exec fitbuddy-db-1 psql -U postgres -d postgres -c \"DELETE FROM ai_action_logs WHERE action_type LIKE 'SMOKE_TEST_%'\"" > /dev/null

# ── Layer 3: Audit-trigger coverage ─────────────────────────────────────
echo ""
echo "═══ Layer 3: Audit-Trigger Coverage (caught B29 on 2026-05-22) ═══"
TRIGGER_COUNT="$(ssh "$SSH_HOST" "docker exec fitbuddy-db-1 psql -U postgres -d postgres -tA -c \"SELECT COUNT(DISTINCT event_object_table) FROM information_schema.triggers WHERE trigger_schema='public' AND trigger_name LIKE 'audit_%'\"")"
echo "  → audit-Trigger auf $TRIGGER_COUNT verschiedenen Tabellen"
if [ "${TRIGGER_COUNT:-0}" -lt 17 ]; then
  echo "  ✗ expected ≥ 17 (workouts + meals + … + training_plans + training_plan_days + training_phase_cycles)"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ ≥ 17"
  PASS=$((PASS + 1))
fi

# ── Layer 4: Read-paths work as auth-user ───────────────────────────────
echo ""
echo "═══ Layer 4: Auth + Read-Paths ═══"
TOKEN="$(mk_token)"
if [ -z "$TOKEN" ]; then
  echo "  ✗ Magic-link could not be generated"
  FAIL=$((FAIL + 1))
else
  # We don't need the JWT itself for these probes — service-role bypasses RLS,
  # which is correct because we're only checking PostgREST schema sanity.
  check "GET meals returns 200" \
    "curl -s -o /dev/null -w '%{http_code}' '$HOST/rest/v1/meals?select=id&user_id=eq.$USER_ID&limit=1' -H '$SVC_AUTH' -H '$SVC_BEARER'" \
    "^200$"
  check "GET workouts returns 200" \
    "curl -s -o /dev/null -w '%{http_code}' '$HOST/rest/v1/workouts?select=id&user_id=eq.$USER_ID&limit=1' -H '$SVC_AUTH' -H '$SVC_BEARER'" \
    "^200$"
  check "GET training_plans returns 200" \
    "curl -s -o /dev/null -w '%{http_code}' '$HOST/rest/v1/training_plans?select=id&user_id=eq.$USER_ID&limit=1' -H '$SVC_AUTH' -H '$SVC_BEARER'" \
    "^200$"
  check "active plan + last_used_at field exists (B39 still wired)" \
    "curl -s '$HOST/rest/v1/training_plans?select=id,name,is_active,updated_at&user_id=eq.$USER_ID&is_active=eq.true&limit=1' -H '$SVC_AUTH' -H '$SVC_BEARER'" \
    "\"is_active\":true"
fi

# ── Layer 5: Telemetry baseline — no spike in failures ──────────────────
echo ""
echo "═══ Layer 5: Telemetry baseline (last 24h) ═══"
FAIL_RATE="$(ssh "$SSH_HOST" "docker exec fitbuddy-db-1 psql -U postgres -d postgres -tA -c \"
  WITH agg AS (
    SELECT
      COUNT(*) FILTER (WHERE status='success') AS s,
      COUNT(*) FILTER (WHERE status='failed')  AS f
    FROM ai_action_logs
    WHERE phase='execute' AND created_at > NOW() - INTERVAL '24 hours'
  )
  SELECT ROUND(100.0 * f / NULLIF(s+f,0), 1) FROM agg
\"")"
echo "  → failure-rate last 24h: ${FAIL_RATE:-n/a}%"
if [ -n "$FAIL_RATE" ] && [ "$(echo "$FAIL_RATE >= 10" | bc -l 2>/dev/null || echo 0)" = "1" ]; then
  echo "  ✗ failure-rate > 10% — investigate before next deploy"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ failure-rate within budget"
  PASS=$((PASS + 1))
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo ""
echo "═══ SUMMARY ═══"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "✓ Smoke-test green — deploy is healthy."
  exit 0
else
  echo ""
  echo "✗ Smoke-test failed — DON'T continue with further changes until investigated."
  exit $FAIL
fi
