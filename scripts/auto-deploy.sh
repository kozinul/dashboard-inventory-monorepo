#!/bin/bash

# =========================================================================
# Script Auto-Deploy untuk Server Lokal (Dashboard Inventory)
# =========================================================================

# Folder tempat project Dashboard Inventory berada
PROJECT_DIR="/workspace" # <-- UBAH INI ke lokasi folder project di server!

# Pindah ke directory project
cd $PROJECT_DIR || exit

# Ambil status perubahan terbaru dari remote origin
git fetch origin main

# Cek apakah ada perbedaan antara branch lokal main dan origin/main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ $LOCAL != $REMOTE ]; then
    echo "$(date): Merespon perubahan baru. Sedang mengunduh commit terbaru..."
    
    # Tarik commit terbaru
    git pull origin main
    
    # Instal dan Build (jika Anda pakai build script manual sebelum docker)
    # pnpm install
    # pnpm build

    # Restart layanan Docker Compose untuk meng-apply perubahan
    echo "$(date): Me-restart service container Docker..."
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml up -d --build
    
    # Bersihkan image/cache usang (opsional tapi disarankan)
    docker image prune -af
    
    echo "$(date): Server berhasil di-update."
else
    # Jika tidak ada update, script tidak melakukan apa-apa
    echo "$(date): Tidak ada update baru di branch main."
fi
