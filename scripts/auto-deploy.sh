#!/usr/bin/env bash

set -Eeuo pipefail

# ==============================================================================
# Dashboard Inventory - Auto Deploy Script
# ==============================================================================
#
# Description:
#   Auto deploy aplikasi Dashboard Inventory menggunakan Git + Docker Compose.
#
# Workflow:
#   1. Cek update dari GitHub
#   2. Jika ada update:
#        - Git Pull
#        - Docker Build
#        - Docker Compose Up
#        - Docker Cleanup
#
# Author  : Kozinul Asror
# Version : 1.0.0
# ==============================================================================

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

PROJECT_DIR="/srv/inventory-app"
COMPOSE_FILE="docker-compose.prod.yml"
BRANCH="main"

LOG_DIR="/var/log/inventory"
LOG_FILE="$LOG_DIR/deploy.log"

LOCK_FILE="/tmp/inventory-deploy.lock"

PATH="/usr/local/bin:/usr/bin:/bin"

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LOG_DIR="$SCRIPT_DIR"
LOG_FILE="$LOG_DIR/deploy.log"

mkdir -p "$LOG_DIR"

exec >> "$LOG_FILE" 2>&1

# ------------------------------------------------------------------------------
# Lock (Prevent Multiple Deploy)
# ------------------------------------------------------------------------------

exec 200>"$LOCK_FILE"

flock -n 200 || {
    echo
    echo "============================================================"
    echo "$(date '+%F %T')"
    echo "Deploy sedang berjalan. Keluar..."
    echo "============================================================"
    exit 0
}

# ------------------------------------------------------------------------------
# Error Handler
# ------------------------------------------------------------------------------

trap 'echo; echo "ERROR: Script gagal pada baris $LINENO"; echo "$(date "+%F %T")"; echo "============================================================"' ERR

# ------------------------------------------------------------------------------
# Header
# ------------------------------------------------------------------------------

echo
echo "============================================================"
echo "Dashboard Inventory Auto Deploy"
echo "Started : $(date '+%F %T')"
echo "============================================================"

# ------------------------------------------------------------------------------
# Check Project Directory
# ------------------------------------------------------------------------------

if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR : Project directory tidak ditemukan."
    echo "$PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# ------------------------------------------------------------------------------
# Check Docker Compose File
# ------------------------------------------------------------------------------

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR : File $COMPOSE_FILE tidak ditemukan."
    exit 1
fi

# ------------------------------------------------------------------------------
# Check Docker
# ------------------------------------------------------------------------------

echo
echo "[1/6] Checking Docker..."

if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon tidak berjalan."
    exit 1
fi

echo "Docker OK"

# ------------------------------------------------------------------------------
# Fetch Latest Source
# ------------------------------------------------------------------------------

echo
echo "[2/6] Checking Git Repository..."

git fetch origin "$BRANCH"

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then

    echo "Tidak ada update."

    echo
    echo "Finished : $(date '+%F %T')"
    echo "============================================================"

    exit 0
fi

echo "Update ditemukan."

echo "Local : $LOCAL_COMMIT"
echo "Remote: $REMOTE_COMMIT"

# ------------------------------------------------------------------------------
# Pull Latest Source
# ------------------------------------------------------------------------------

echo
echo "[3/6] Pulling latest source..."

if ! git pull origin "$BRANCH"; then

    echo
    echo "============================================================"
    echo "ERROR : Git Pull gagal."
    echo
    echo "Kemungkinan penyebab:"
    echo " - Ada perubahan lokal di server"
    echo " - Merge conflict"
    echo
    echo "Silakan selesaikan konflik terlebih dahulu."
    echo "============================================================"

    exit 1

fi

echo "Git Pull berhasil."

# ------------------------------------------------------------------------------
# Build Docker Images
# ------------------------------------------------------------------------------

echo
echo "[4/6] Building Docker images..."

docker compose -f "$COMPOSE_FILE" build

echo "Build selesai."

# ------------------------------------------------------------------------------
# Start Containers
# ------------------------------------------------------------------------------

echo
echo "[5/6] Starting Docker containers..."

docker compose -f "$COMPOSE_FILE" up -d

echo "Container berjalan."

# ------------------------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------------------------

echo
echo "[6/6] Cleaning Docker images..."

docker image prune -f

echo "Cleanup selesai."

# ------------------------------------------------------------------------------
# Footer
# ------------------------------------------------------------------------------

echo
echo "============================================================"
echo "Deployment berhasil."
echo "Finished : $(date '+%F %T')"
echo "============================================================"