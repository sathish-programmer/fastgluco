#!/bin/bash
# ==============================================================================
# Mito Reboot Production Database Backup Script
# Automatically dumps MongoDB Atlas 'mitoreboot_db' to local machine,
# compresses into .tar.gz to save disk space, and retains the last 5 weekly backups.
# ==============================================================================

set -e

# Configuration
BACKUP_ROOT="/Users/sathishkumark/Documents/Sathish-Work/healthApp/db_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/temp_${TIMESTAMP}"
ARCHIVE_NAME="mitoreboot_db_backup_${TIMESTAMP}.tar.gz"
LOG_FILE="${BACKUP_ROOT}/backup.log"
RETENTION_COUNT=5

MONGODUMP_BIN=$(which mongodump || echo "/opt/homebrew/bin/mongodump")
PROD_MONGO_URI="mongodb+srv://mitoreboot_db_user:sh1QaG5uXB3lxd1u@mitoreboot.q354jlv.mongodb.net/mitoreboot_db"

mkdir -p "${BACKUP_ROOT}"
echo "--------------------------------------------------------" >> "${LOG_FILE}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting weekly production MongoDB backup..." >> "${LOG_FILE}"

if [ ! -x "${MONGODUMP_BIN}" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: mongodump binary not found at ${MONGODUMP_BIN}!" >> "${LOG_FILE}"
  exit 1
fi

# 1. Run mongodump
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dumping mitoreboot_db from Atlas..." >> "${LOG_FILE}"
"${MONGODUMP_BIN}" --uri="${PROD_MONGO_URI}" --out="${BACKUP_DIR}" >> "${LOG_FILE}" 2>&1

# 2. Compress the backup to minimize disk usage on local Mac
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressing backup to ${ARCHIVE_NAME}..." >> "${LOG_FILE}"
tar -czf "${BACKUP_ROOT}/${ARCHIVE_NAME}" -C "${BACKUP_DIR}" .
rm -rf "${BACKUP_DIR}"

ARCHIVE_SIZE=$(ls -lh "${BACKUP_ROOT}/${ARCHIVE_NAME}" | awk '{print $5}')
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup successfully created: ${ARCHIVE_NAME} (${ARCHIVE_SIZE})" >> "${LOG_FILE}"

# 3. Rotate old backups: keep the latest $RETENTION_COUNT archives
cd "${BACKUP_ROOT}"
BACKUP_FILES=( $(ls -t mitoreboot_db_backup_*.tar.gz 2>/dev/null || true) )
TOTAL_BACKUPS=${#BACKUP_FILES[@]}

if [ ${TOTAL_BACKUPS} -gt ${RETENTION_COUNT} ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pruning old backups (retaining newest ${RETENTION_COUNT})..." >> "${LOG_FILE}"
  for (( i=${RETENTION_COUNT}; i<${TOTAL_BACKUPS}; i++ )); do
    OLD_BACKUP="${BACKUP_FILES[$i]}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleting old archive: ${OLD_BACKUP}" >> "${LOG_FILE}"
    rm -f "${BACKUP_ROOT}/${OLD_BACKUP}"
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed successfully." >> "${LOG_FILE}"
echo "--------------------------------------------------------" >> "${LOG_FILE}"
exit 0
