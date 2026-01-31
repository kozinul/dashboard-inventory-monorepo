#!/bin/bash
# ===========================================
# MongoDB Backup Script
# ===========================================

set -e

BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb_backup_${DATE}"

echo "Starting MongoDB backup..."

# Create backup using mongodump
docker exec dashboard-mongo mongodump --db inventory --out /tmp/${BACKUP_NAME}

# Copy backup from container
docker cp dashboard-mongo:/tmp/${BACKUP_NAME} ${BACKUP_DIR}/

# Compress backup
cd ${BACKUP_DIR}
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}
rm -rf ${BACKUP_NAME}

# Keep only last 7 backups
ls -t ${BACKUP_DIR}/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
