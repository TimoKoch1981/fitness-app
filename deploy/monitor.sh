#!/bin/bash
# ============================================================================
# FitBuddy — Monitoring Script
# Checks health of all services and sends alert on failure.
#
# Crontab entry (every 5 minutes):
#   */5 * * * * /opt/supabase/deploy/monitor.sh >> /var/log/fitbuddy-monitor.log 2>&1
# ============================================================================

set -euo pipefail

# Configuration
DOMAIN="fudda.de"
ALERT_FILE="/tmp/fitbuddy_alert_sent"
LOG_FILE="/var/log/fitbuddy-monitor.log"
MAX_LOG_SIZE=10485760  # 10 MB

# Health check endpoints
declare -A CHECKS=(
  ["Frontend"]="https://${DOMAIN}"
  ["Auth (GoTrue)"]="https://${DOMAIN}/auth/v1/health"
  ["REST API"]="https://${DOMAIN}/rest/v1/"
)

FAILURES=()
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function: Check HTTP endpoint
check_endpoint() {
  local name="$1"
  local url="$2"
  local status

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null || echo "000")

  if [[ "${status}" =~ ^(200|204|301|302|401|406)$ ]]; then
    echo "[${TIMESTAMP}] OK: ${name} (HTTP ${status})"
    return 0
  else
    echo "[${TIMESTAMP}] FAIL: ${name} (HTTP ${status})"
    FAILURES+=("${name}: HTTP ${status}")
    return 1
  fi
}

# Function: Check Docker containers
check_containers() {
  local stopped
  stopped=$(docker ps --filter "name=supabase" --filter "status=exited" --format "{{.Names}}" 2>/dev/null)

  if [ -n "${stopped}" ]; then
    echo "[${TIMESTAMP}] FAIL: Stopped containers: ${stopped}"
    FAILURES+=("Stopped containers: ${stopped}")
  else
    local running
    running=$(docker ps --filter "name=supabase" --format "{{.Names}}" 2>/dev/null | wc -l)
    echo "[${TIMESTAMP}] OK: ${running} Supabase containers running"
  fi
}

# Function: Check disk space
check_disk() {
  local usage
  usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')

  if [ "${usage}" -gt 85 ]; then
    echo "[${TIMESTAMP}] WARN: Disk usage at ${usage}%"
    FAILURES+=("Disk usage: ${usage}%")
  else
    echo "[${TIMESTAMP}] OK: Disk usage ${usage}%"
  fi
}

# Function: Check memory
check_memory() {
  local mem_pct
  mem_pct=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')

  if [ "${mem_pct}" -gt 90 ]; then
    echo "[${TIMESTAMP}] WARN: Memory usage at ${mem_pct}%"
    FAILURES+=("Memory usage: ${mem_pct}%")
  else
    echo "[${TIMESTAMP}] OK: Memory usage ${mem_pct}%"
  fi
}

# ── Run all checks ────────────────────────────────────────────────────

echo "─── Health Check ${TIMESTAMP} ───"

for name in "${!CHECKS[@]}"; do
  check_endpoint "${name}" "${CHECKS[${name}]}" || true
done

check_containers
check_disk
check_memory

# ── Report ────────────────────────────────────────────────────────────

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "[${TIMESTAMP}] === ${#FAILURES[@]} FAILURE(S) DETECTED ==="
  for f in "${FAILURES[@]}"; do
    echo "  - ${f}"
  done

  # Write failure marker (can be picked up by external alert system)
  echo "${TIMESTAMP}: ${FAILURES[*]}" >> /tmp/fitbuddy_failures.log

  # Optional: restart stopped containers
  stopped=$(docker ps --filter "name=supabase" --filter "status=exited" --format "{{.Names}}" 2>/dev/null)
  if [ -n "${stopped}" ]; then
    echo "[${TIMESTAMP}] Auto-restarting stopped containers..."
    docker compose -f /opt/supabase/docker-compose.yml up -d 2>/dev/null || true
  fi
else
  echo "[${TIMESTAMP}] All checks passed."
  # Clear alert flag
  rm -f "${ALERT_FILE}"
fi

# Rotate log if too large
if [ -f "${LOG_FILE}" ] && [ "$(stat -f%z "${LOG_FILE}" 2>/dev/null || stat -c%s "${LOG_FILE}" 2>/dev/null)" -gt "${MAX_LOG_SIZE}" ]; then
  mv "${LOG_FILE}" "${LOG_FILE}.old"
fi
