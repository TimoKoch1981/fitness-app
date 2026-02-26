#!/bin/bash
# ============================================================================
# FitBuddy — PostgreSQL Backup Script
# Runs pg_dump on the Supabase PostgreSQL container.
# Recommended: Run via cron every 6 hours.
#
# Crontab entry:
#   0 */6 * * * /opt/supabase/deploy/backup-db.sh >> /var/log/fitbuddy-backup.log 2>&1
#
# Retention: 7 days (configurable via RETENTION_DAYS)
# ============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/supabase/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fitbuddy_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="supabase-db"
DB_NAME="postgres"
DB_USER="postgres"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup..."

# Run pg_dump inside the Docker container, pipe through gzip
docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

# Verify backup was created and is not empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[$(date)] ERROR: Backup file is empty or not created!"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Clean up old backups
DELETED=$(find "${BACKUP_DIR}" -name "fitbuddy_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "[$(date)] Cleaned up ${DELETED} old backup(s) (older than ${RETENTION_DAYS} days)"

# Summary
TOTAL_BACKUPS=$(ls -1 "${BACKUP_DIR}"/fitbuddy_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "[$(date)] Backup complete. Total: ${TOTAL_BACKUPS} backups, ${TOTAL_SIZE} used."
