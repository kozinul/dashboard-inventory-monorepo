# Ringkasan Perubahan Terbaru

Daftar perubahan signifikan berdasarkan commit terakhir (Maret–Juni 2026).

---

## 2026-06-22

### Stock Opname Cleanup & Database Management UI
- **Backend:** Endpoint baru `POST /api/v1/stock-opname/cleanup` untuk menghapus data stock opname dalam rentang tanggal tertentu
- **Frontend:** Halaman Database Management (`DatabaseManagement.tsx`) mendapat fitur baru: form tanggal, tombol cleanup, dan konfirmasi SweetAlert sebelum eksekusi
- **Chore:** `.gitignore` diperbarui untuk mengecualikan file backup

### Standardisasi Warehouse Auto-Assignment & RBAC Department Defaults
- **Backend:**
  - Controller `stockOpname`: implementasi CRUD lengkap (create, get all, get by id, update, delete) dengan filtering cabang dan validasi akses
  - Controller `report`: endpoint laporan mutasi barang (`/api/v1/reports/item-mutation`) dengan filter branch, kategori, dan rentang tanggal
  - Controller `inventory`: perbaikan logika auto-assignment warehouse, filter lokasi otomatis saat user membuat stock opname
  - Controller `supply`: penambahan kolom `departmentId` untuk barang habis pakai
  - Model baru: `StockOpname`, `StockOpnameItem`
  - Route baru: `stockOpname`, `report`
  - Middleware permission disesuaikan untuk role `auditor`
  - Script `inspect-roles.ts` untuk debugging role permissions
- **Frontend:**
  - Halaman baru: `StockOpnamePage`, `StockOpnameDetailPage`, `CreateStockOpnameModal`, `ItemMutationReportPage`
  - Service API baru: `stockOpname.api.ts`, `reports.api.ts`
  - Route baru di `index.tsx` untuk Stock Opname dan Item Mutation Report
  - Sidebar (`DashboardLayout`): tambah menu Stock Opname dan Item Mutation Report untuk role tertentu
  - `RoleManager.tsx` & `UserPermissionEditor.tsx`: penyesuaian permission untuk auditor
- **Total: ~2.155 baris perubahan di 24 file**

---

## 2026-04-07

### Laporan Asset Inventory — Filter Building & Grouping Fleksibel
- **Backend:** Controller `importExport` diperbarui — laporan asset inventory sekarang mendukung filter `building` dan opsi `groupBy` yang bisa dipilih (none, category, location, branch, building)
- **Frontend:** Halaman Reports menambahkan dropdown filter building dan opsi grouping

### Maintenance Scripts
- Script `migrate-buildings.ts`: migrasi data building dari field `customFields` ke field dedicated `building`
- Script `clean-permissions.ts`: membersihkan permission yang tidak terpakai

### RBAC Technician & Building Column
- **Backend:**
  - Permission middleware: role `technician` mendapat akses view ke halaman tertentu
  - Model Asset: field `building` ditambahkan
  - Inventory controller: filter by building
- **Frontend:**
  - Tabel asset: kolom "Building" ditambahkan
  - Filter building di halaman Inventory
  - RoleManager: role `technician` diperbarui permission-nya

---

## 2026-04-06

### Location Detail — Kolom Dedicated di Asset Hero
- **Frontend:** `AssetHero.tsx` — informasi lokasi (building, lantai, ruang) ditampilkan sebagai kolom terpisah, bukan lagi campur aduk di kolom lain

### Auto-Sync Role Permissions
- **Backend:** Fungsi `syncPermissions()` berjalan otomatis saat server startup — memastikan semua role memiliki permission terbaru sesuai konfigurasi
- Fix TypeScript error pada `syncPermissions.ts` terkait assignment Mongoose Array

### Location Filters & Reports
- Filter lokasi ditingkatkan: sekarang bisa filter berdasarkan building, lokasi spesifik, dan parent location
- Laporan asset inventory dan mutasi barang mendapat filter lokasi yang lebih detail

---

## 2026-03-12

### Maintenance Supplies UI + Currency Format Rp
- `AddMaintenanceSupplyModal` — UI diperbarui dengan format mata uang Rp, auto-kalkulasi total
- Perbaikan sinkronisasi status aset saat maintenance ditutup
- Fix TypeScript error TS2722 di modal yang sama
- **Supply model:** field `price` type diubah ke Number

### Excel Import Headers
- Perbaikan mapping header kolom saat import Excel (menangani spasi dan kapitalisasi yang berbeda)
- Data department otomatis dipopulasi saat import

---

## 2026-03-11

### Events — Double-Booking Validation
- **Backend:** Validasi backend untuk mencegah asset di-booking ke dua event yang waktunya bertabrakan
- Logic: cek `startDate`/`endDate` overlap sebelum assign asset ke event

### Events — UI & Activity Log
- Tombol delete inline di tabel Events dengan konfirmasi SweetAlert
- Perbaikan status aset: saat diassign ke event → `event`, saat dihapus dari event → kembali ke status sebelumnya
- Activity log untuk setiap perubahan event (create, update, delete, assign asset)
- Rental rate tidak lagi required saat assign aset ke event (khusus event)
- Tab Rentals disembunyikan sementara dari UI atas permintaan user

---

## 2026-03-10

### Supervisor RBAC
- Role `supervisor` mendapat akses memperbarui status aset dan mengelola inventory
- Auto warehouse location: lokasi warehouse otomatis terisi berdasarkan branch user

### Modal Asset — Ukuran Diperbesar
- Modal Add & Edit asset diperbesar ke `max-w-5xl` untuk kenyamanan input data

### Filter Current User
- User yang sedang login tidak muncul di daftar pilihan (assignment, dll) untuk menghindari self-assignment
- Perbaikan API users: role tertentu tidak bisa melihat data user lain (403 fix)

---

## Ringkasan File Paling Sering Diubah

| File | Jumlah Commit |
|------|--------------|
| `apps/backend/src/controllers/inventory.controller.ts` | 6 |
| `apps/backend/src/controllers/importExport.controller.ts` | 5 |
| `apps/backend/src/controllers/event.controller.ts` | 3 |
| `apps/frontend/src/pages/dashboard-pages/InventoryPage.tsx` | 3 |
| `apps/backend/src/config/rolePermissions.config.ts` | 3 |
| `apps/frontend/src/layouts/DashboardLayout.tsx` | 3 |

---

## Catatan

- Semua perubahan telah melalui TypeScript type-check (`tsc --noEmit`) di kedua workspace
- Konvensi commit: `feat:` untuk fitur baru, `fix:` untuk perbaikan bug, `chore:` untuk tugas maintenance, `refactor:` untuk perubahan struktur kode tanpa perubahan fungsional
