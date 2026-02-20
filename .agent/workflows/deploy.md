---
description: Prosedur teknis untuk deploy update terbaru ke server.
---

1. Pastikan semua perubahan sudah di-commit di local.
2. Jalankan build check untuk memvalidasi TypeScript dan build process.
// turbo
```bash
pnpm run build
```
3. Sync dengan repository remote.
```bash
git pull origin main
```
4. Push perubahan ke branch main.
```bash
git push origin main
```
5. Verifikasi status server dan health check endpoint.
```bash
curl http://localhost:3000/health
```
