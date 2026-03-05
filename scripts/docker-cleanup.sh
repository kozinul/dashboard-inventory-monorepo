#!/bin/bash

# ==============================================================================
# Docker Auto-Cleanup Script
# Description: Removes unused Docker containers, networks, images, and volumes.
# Usage: ./docker-cleanup.sh
# ==============================================================================

# Script Configuration
LOG_FILE="/var/log/docker-cleanup.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure script is run with sudo/root privileges
if [ "$EUID" -ne 0 ]; then 
  echo "Please run this script with sudo or as root."
  exit 1
fi

echo "==================================================" | tee -a "$LOG_FILE"
echo "Starting Docker Cleanup at $DATE" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

# 1. Clean up stopped containers, unused networks, and dangling images
echo ">> Running 'docker system prune' (removes stopped containers, unused networks, dangling images)..." | tee -a "$LOG_FILE"
docker system prune -a -f --volumes >> "$LOG_FILE" 2>&1
echo "   Done." | tee -a "$LOG_FILE"

# 2. Clean up build cache (Useful if you build often)
echo ">> Running 'docker builder prune'..." | tee -a "$LOG_FILE"
docker builder prune -a -f >> "$LOG_FILE" 2>&1
echo "   Done." | tee -a "$LOG_FILE"

# 3. Final status report
echo "" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "Docker Cleanup Finished Successfully!" | tee -a "$LOG_FILE"
echo "Disk Usage after cleanup:" | tee -a "$LOG_FILE"
docker system df | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

exit 0
