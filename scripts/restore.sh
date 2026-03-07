#!/bin/bash
# ===========================================
# System Full Restore Script (DB + Uploads)
# ===========================================

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_filename.tar.gz>"
  echo "Example: ./restore.sh system_backup_20260307_133000.tar.gz"
  exit 1
fi

BACKUP_FILE=$1
BACKUP_DIR="/app/backups"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

if [ ! -f "$BACKUP_PATH" ]; then
  echo "Error: Backup file $BACKUP_PATH does not exist."
  exit 1
fi

# Extract the base name without .tar.gz
BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)
TEMP_DIR="/tmp/${BACKUP_NAME}"

echo "Starting full system restore from $BACKUP_FILE..."

# 1. Extract the tar.gz archive to a temporary directory
echo "Extracting archive..."
cd /tmp
tar -xzf ${BACKUP_PATH}

# 2. Restore MongoDB database
if [ -d "${TEMP_DIR}/database" ]; then
    echo "Restoring MongoDB database..."
    # Copy the database dump into the mongo container
    docker cp ${TEMP_DIR}/database dashboard-mongo:/tmp/restore_db
    # Run mongorestore
    docker exec dashboard-mongo mongorestore --drop --db inventory /tmp/restore_db
    # Cleanup inside mongo container
    docker exec dashboard-mongo rm -rf /tmp/restore_db
else
    echo "Warning: No database dump found in the backup archive."
fi

# 3. Restore uploaded images/files
if [ -d "${TEMP_DIR}/uploads" ]; then
    echo "Restoring uploaded files..."
    # Copy the uploads directory into the backend container
    # Note: Copying to /app/uploads will overwrite existing files with the same name,
    # but might leave newer files that weren't in the backup intact.
    # To do a clean restore, we clear the directory first.
    docker exec dashboard-backend sh -c 'rm -rf /app/uploads/* || true'
    
    # Needs to copy contents of the temp uploads directory to /app/uploads
    # docker cp copies the directory itself if destination exists
    docker cp ${TEMP_DIR}/uploads/. dashboard-backend:/app/uploads/
else
    echo "Warning: No uploads directory found in the backup archive."
fi

# 4. Cleanup temporary files
echo "Cleaning up temporary files..."
rm -rf ${TEMP_DIR}

echo "System restore completed successfully!"
