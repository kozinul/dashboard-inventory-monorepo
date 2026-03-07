#!/bin/bash
# ===========================================
# System Full Backup Script (DB + Uploads)
# ===========================================

set -e

BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="system_backup_${DATE}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

echo "Starting full system backup (MongoDB + Uploads)..."

# 1. Prepare temporary directory
mkdir -p ${TEMP_DIR}

# 2. Create MongoDB dump inside the mongo container
docker exec dashboard-mongo mongodump --db inventory --out /tmp/${BACKUP_NAME}_db

# 3. Copy MongoDB dump from container to temp directory
docker cp dashboard-mongo:/tmp/${BACKUP_NAME}_db/inventory ${TEMP_DIR}/database

# 4. Copy uploaded images/files from the backend container
docker cp dashboard-backend:/app/uploads ${TEMP_DIR}/uploads

# 5. Compress everything into one tar.gz
cd /tmp
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}

# 6. Move the compressed archive to the target backup directory
mv ${BACKUP_NAME}.tar.gz ${BACKUP_DIR}/

# 7. Cleanup temp files
rm -rf ${TEMP_DIR}
docker exec dashboard-mongo rm -rf /tmp/${BACKUP_NAME}_db

# 8. Keep only last 7 backups
ls -t ${BACKUP_DIR}/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
