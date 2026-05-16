#!/bin/bash
# ============================================================================
# FitBuddy — Offsite Backup to Backblaze B2 (S3-compatible)
#
# Runs daily, complementing the 6-hourly local backup (backup-db.sh).
# Uploads compressed pg_dump to Backblaze B2 via S3-API.
# Retention: 30 days offsite.
#
# Setup-Voraussetzungen (User-Action, einmalig):
#   1. Backblaze Account erstellen: https://www.backblaze.com/sign-up/cloud-storage
#   2. Bucket erstellen: "fitbuddy-backups" (Region eu-central-003 für DE-residency)
#   3. Application Key generieren (keyID + applicationKey) mit Permission
#      "Read+Write on this bucket only"
#   4. /opt/fitbuddy/.env erweitern:
#       B2_KEY_ID=...
#       B2_APP_KEY=...
#       B2_BUCKET=fitbuddy-backups
#       B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
#   5. aws-cli auf VPS installieren: apt-get install -y awscli
#   6. Cron einrichten:
#       0 3 * * * /opt/fitbuddy/deploy/backup-offsite.sh >> /var/log/fitbuddy-backup-offsite.log 2>&1
#
# Restore-Test (manuell, monatlich):
#   1. aws --endpoint-url=$B2_ENDPOINT s3 ls s3://$B2_BUCKET/
#   2. Latest Backup downloaden + in Test-Postgres importieren (siehe DISASTER_RECOVERY.md)
# ============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────
BACKUP_DIR="/opt/fitbuddy/backups"
RETENTION_DAYS_OFFSITE=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fitbuddy_offsite_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="fitbuddy-db-1"
DB_NAME="postgres"
DB_USER="postgres"

# Load B2 credentials from /opt/fitbuddy/.env
if [ -f /opt/fitbuddy/.env ]; then
  # shellcheck disable=SC1091
  set -a
  source /opt/fitbuddy/.env
  set +a
fi

# Verify B2 config
if [ -z "${B2_KEY_ID:-}" ] || [ -z "${B2_APP_KEY:-}" ] || [ -z "${B2_BUCKET:-}" ] || [ -z "${B2_ENDPOINT:-}" ]; then
  echo "[$(date)] ERROR: B2 credentials not configured. See setup section at top of this script." >&2
  exit 1
fi

# Verify aws-cli is installed
if ! command -v aws >/dev/null 2>&1; then
  echo "[$(date)] ERROR: aws-cli not installed. Run: apt-get install -y awscli" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting offsite backup..."

# ── Step 1: pg_dump (same as backup-db.sh, but with marker) ───────────────
docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[$(date)] ERROR: Backup file is empty or not created!" >&2
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Local dump created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── Step 2: Upload to Backblaze B2 via S3-API ─────────────────────────────
export AWS_ACCESS_KEY_ID="${B2_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}"

REMOTE_PATH="s3://${B2_BUCKET}/$(basename "${BACKUP_FILE}")"

if aws --endpoint-url="${B2_ENDPOINT}" s3 cp "${BACKUP_FILE}" "${REMOTE_PATH}" --no-progress; then
  echo "[$(date)] Uploaded to B2: ${REMOTE_PATH}"
else
  echo "[$(date)] ERROR: Upload to B2 failed!" >&2
  exit 2
fi

# ── Step 3: Cleanup local offsite-marked dumps (>2 days, since local backup-db.sh holds 7 days) ─
DELETED_LOCAL=$(find "${BACKUP_DIR}" -name "fitbuddy_offsite_*.sql.gz" -mtime +2 -delete -print | wc -l)
echo "[$(date)] Local offsite cleanup: removed ${DELETED_LOCAL} files older than 2 days"

# ── Step 4: Cleanup remote (>30 days) ─────────────────────────────────────
# B2 lifecycle rules are configurable in the bucket settings (preferred).
# Falls keine Lifecycle-Rule gesetzt: List + filter + delete.
CUTOFF_DATE=$(date -d "${RETENTION_DAYS_OFFSITE} days ago" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS_OFFSITE}d +%Y%m%d)

REMOTE_OLD=$(aws --endpoint-url="${B2_ENDPOINT}" s3 ls "s3://${B2_BUCKET}/" \
  | awk '{print $4}' \
  | grep -E "^fitbuddy_offsite_[0-9]{8}_" \
  | awk -F_ -v cutoff="${CUTOFF_DATE}" '$3 < cutoff {print $0}')

DELETED_REMOTE=0
if [ -n "${REMOTE_OLD}" ]; then
  while IFS= read -r file; do
    if aws --endpoint-url="${B2_ENDPOINT}" s3 rm "s3://${B2_BUCKET}/${file}" --quiet; then
      DELETED_REMOTE=$((DELETED_REMOTE + 1))
    fi
  done <<< "${REMOTE_OLD}"
fi
echo "[$(date)] Remote cleanup: removed ${DELETED_REMOTE} files older than ${RETENTION_DAYS_OFFSITE} days"

# ── Step 5: Summary ───────────────────────────────────────────────────────
REMOTE_COUNT=$(aws --endpoint-url="${B2_ENDPOINT}" s3 ls "s3://${B2_BUCKET}/" | wc -l)
echo "[$(date)] Offsite backup complete. Remote files: ${REMOTE_COUNT}"
