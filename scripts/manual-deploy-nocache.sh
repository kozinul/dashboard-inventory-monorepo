#!/bin/bash
set -e

# =========================================================================
# Script Manual Deploy (No-Cache) untuk Server Lokal (Dashboard Inventory)
# =========================================================================

# Folder tempat project Dashboard Inventory berada
PROJECT_DIR="/srv/inventory-app" # <-- Sesuaikan jika berbeda

# Pindah ke directory project
cd "$PROJECT_DIR" || { echo "Gagal berpindah ke direktori $PROJECT_DIR"; exit 1; }

echo "🚀 Memulai proses Manual Deploy (No Cache)..."

echo "📥 Mengunduh pembaruan terbaru dari Git..."
git pull origin main

echo "🛑 Menghentikan container yang sedang berjalan..."
docker compose -f docker-compose.prod.yml down

echo "🔨 Menjalankan build image Docker TANPA CACHE..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "✨ Menjalankan ulang container..."
docker compose -f docker-compose.prod.yml up -d

echo "🧹 Membersihkan sisa image yang sudah tidak terpakai..."
docker image prune -af

echo "✅ Selesai! Aplikasi sudah berhasil di-build ulang dan dijalankan."
