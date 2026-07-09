# Ringkasan Perubahan Terbaru

Daftar perubahan signifikan berdasarkan commit terakhir (Maret–Juli 2026).

---

## 2026-07-09

### Alias Field untuk Quick Search & Display

**Tujuan:** Menambahkan field `alias` pada Asset untuk memudahkan pencarian dan display yang lebih ringkas.

#### Perubahan Backend

1. **`apps/backend/src/models/asset.model.ts`** — Field baru `alias: { type: String, trim: true }`
2. **`apps/backend/src/controllers/inventory.controller.ts`** — `alias` di-include dalam search pipeline (`$or`), populate `parentAssetId` menyertakan `name serial alias`
3. **`apps/backend/src/controllers/search.controller.ts`** — Pencarian global menyertakan field `alias`
4. **`apps/backend/src/controllers/stockOpname.controller.ts`** — Populate `assetId` dan `supplyId` di Stock Opname detail, export, dan import sekarang menyertakan `alias`
5. **`apps/backend/src/controllers/report.controller.ts`** — Populate `assetId` menyertakan `alias` untuk laporan mutasi

#### Perubahan Frontend

1. **`apps/frontend/src/services/assetService.ts`** — Interface `Asset` ditambahkan field `alias?: string`
2. **`apps/frontend/src/features/inventory/components/AddInventoryModal.tsx`** — Input "Alias" dengan placeholder "e.g. NVR Hikvision 16 CH" dan tooltip
3. **`apps/frontend/src/features/inventory/components/EditInventoryModal.tsx`** — Sama, dengan populate dari `asset.alias`
4. **`apps/frontend/src/features/inventory/components/AssetTableParts.tsx`** — Alias ditampilkan di atas nama (indigo), tooltip pada alias
5. **`apps/frontend/src/features/inventory/components/asset-details/AssetHero.tsx`** — Alias ditampilkan di samping nama, parent asset menampilkan alias (fallback ke name)
6. **`apps/frontend/src/layouts/DashboardLayout.tsx`** — Global search menampilkan alias jika ada
7. **Semua selection modal/dropdown** — Alias ditampilkan dengan format `alias | name`

### Stock Opname Improvements

1. **Grouping by Category** — Items dikelompokkan berdasarkan category, bukan alias/name
2. **Item Display** — Format `alias / name` dalam satu baris dengan serial di bawah
3. **Status Transitions** — DRAFT → ONGOING → REVIEW → COMPLETED, dengan action "Return to Ongoing" (REVIEW → ONGOING)
4. **Keterangan Column** — Kolom input teks per-item untuk catatan, dengan highlight indigo saat ONGOING
5. **Location Tracking** — Audit log untuk perubahan lokasi aset dengan format `Location: from → to`

### Stock Opname History Tab

**Tujuan:** Menampilkan riwayat stock opname di halaman detail asset.

#### Backend
- **`apps/backend/src/controllers/stockOpname.controller.ts`** — Endpoint baru `GET /by-asset/:assetId` untuk fetch StockOpnameItem berdasarkan assetId
- **`apps/backend/src/routes/stockOpname.routes.ts`** — Route `/by-asset/:assetId` ditempatkan sebelum `/:id` agar tidak konflik

#### Frontend
- **`apps/frontend/src/features/inventory/api/stockOpname.api.ts`** — Fungsi baru `getStockOpnameByAsset()`
- **`apps/frontend/src/features/inventory/components/asset-details/AssetStockOpnameTab.tsx`** — Komponen tab baru dengan tabel: Date, Opname Title, Status, Found, Checker, Notes
- **`apps/frontend/src/pages/dashboard-pages/AssetDetailsPage.tsx`** — Tab "Stock Opname" ditambahkan ke navigasi

### UI Fixes
- **Breadcrumb** — Melewati segment statis jika segment berikutnya memiliki label dinamis
- **Item Mutation** — Menu renamed dari "Mutasi Barang" ke "Item Mutation"
- **Indonesian → English** — Semua hint text dan label diubah ke Bahasa Inggris

---

## 2026-07-08

### Is Container — Checkbox & Total Slots di Form Add & Edit Asset

**Tujuan:** Menambahkan checkbox "Is Container" dan input "Total Slots" pada form Add New Asset dan Edit Asset untuk menandai aset yang dapat menampung aset lain (contoh: NVR 16 channel yang dapat menampung maksimal 16 camera).

#### Latar Belakang
- Backend model `Asset` sudah memiliki field `isContainer` (Boolean, default false) dan `totalSlots` (Number, default 0) serta `parentAssetId` + endpoint `install`/`dismantle`
- Form **Add New Asset** dan **Edit Asset** belum memiliki UI untuk mengatur field tersebut

#### Perubahan Frontend

1. **`apps/frontend/src/services/assetService.ts:23-24`** — Interface `Asset` ditambahkan field:
   - `isContainer?: boolean`
   - `totalSlots?: number`

2. **`apps/frontend/src/features/inventory/components/AddInventoryModal.tsx`**:
   - Tambah `isContainer: boolean` & `totalSlots: string` ke interface form
   - Checkbox "Is Container" + help text *"Centang jika aset ini dapat menampung aset lain"*
   - Conditional input "Total Slots" (number, required) muncul saat checkbox dicentang
   - On submit: `isContainer` sebagai boolean, `totalSlots` di-parse ke `parseInt()`
   - Form reset menyertakan kedua field

3. **`apps/frontend/src/features/inventory/components/EditInventoryModal.tsx`**:
   - Sama seperti Add form: tambah checkbox "Is Container" + conditional "Total Slots"
   - Form populate membaca dari `asset.isContainer` & `asset.totalSlots`
   - Payload menyertakan `isContainer` & `totalSlots` dengan konversi yang sama

#### Backend
- ✅ Model `asset.model.ts` — sudah memiliki `isContainer` & `totalSlots`
- ✅ Controller — `createAsset`/`updateAsset` menggunakan `...req.body` sehingga otomatis menerima field baru

---

### Connected Devices — Rewrite Tab dengan Dual View (Table & Channel)

**Tujuan:** Mengubah tab "Connected Devices" di halaman detail aset menjadi lebih informatif dengan dual view: Table View untuk overview dan Channel View untuk dokumentasi CCTV per-channel.

#### Perubahan

1. **`apps/frontend/src/features/inventory/components/asset-details/AssetConnectedDevicesTab.tsx`** — Rewrite total:
   - **Dual View**: Toggle "List" | "Channel View" di header (Channel View hanya muncul jika `totalSlots > 0`)
   - **Table View**: Tabel child assets dengan kolom Asset (link), Serial, Category, **Location**, Status, Channel, Actions (Remove)
   - **Channel View**: Layout per-channel (CH 1, CH 2, ...) menampilkan:
     - Thumbnail device, nama (link), serial, **📍 lokasi** (building/location/detail), status badge
     - Empty channel: tombol "Assign" → dropdown unslotted children
   - **Smart Assign**:
     - Tombol "Assign Device" di header: klik → dropdown daftar **unslotted children** (child yang belum punya channel). Pilih → auto-assign ke slot kosong pertama
     - Jika tidak ada unslotted children → SweetAlert info
     - Channel View "Assign" → dropdown unslotted children. Jika tidak ada → "No devices to assign"
   - **Remove**: tombol `remove_circle` dengan konfirmasi SweetAlert, panggil `POST /inventory/items/:id/dismantle`
   - Header menampilkan jumlah device terhubung + available slots (contoh: "5 devices connected (11 available)")
   - Empty state menyesuaikan (container vs non-container)

2. **`apps/backend/src/controllers/inventory.controller.ts`**:
   - ✅ Perbaikan activity log: `Installed in ${parentName}` tidak lagi menampilkan "at Slot undefined"
   - ✅ Perbaikan select children: menambahkan `slotNumber`, `images`, `location`, `building`, `locationDetail`, `parentAssetId` — sebelumnya hanya `name serial model category status` sehingga `slotNumber` tidak terbaca di frontend

#### Cara Kerja
1. Buka halaman detail aset container (isContainer = true)
2. Tab "Connected Devices" menampilkan child assets dalam **Table View** (default)
3. Beralih ke **Channel View** via toggle untuk melihat layout per-channel
4. Channel View mendokumentasikan CCTV/device SN ada di channel berapa dari NVR ini, lengkap dengan lokasi
5. **Assign**: Klik "Assign Device" (header) atau "Assign" (channel view) → dropdown unslotted children → pilih device → auto-assign ke channel
6. **Remove**: Klik ikon `remove_circle` → konfirmasi → child terputus dari parent

### Fix: Rack View — Sembunyikan Child Assets dari Slot Tampilan

**Tujuan:** Memperbaiki tampilan rack/panel agar hanya menampilkan aset top-level (yang terpasang langsung di rack), bukan aset anak (contoh: camera di dalam NVR).

#### Perubahan
1. **`apps/frontend/src/pages/inventory/panels/PanelDetailPage.tsx:56`**:
   - Tambah filter `if (child.parentAssetId) return;` pada iterasi `children.forEach`
   - Asset yang memiliki `parentAssetId` (berarti dia adalah anak dari container lain) tidak dimasukkan ke slot rack
   - Hanya aset tanpa parent (top-level) yang muncul di Rack View

---

## 2026-07-07

### RBAC Refactoring — Role Hierarchy & Data Scoping

**Tujuan:** Mengubah role hierarchy dan data scoping di seluruh sistem agar `superuser` melihat semua cabang/semua departemen, `system_admin` melihat cabang sendiri/semua departemen, dan role lainnya (`admin`/`manager`/`dept_admin`/`supervisor`/`technician`/`user`/`auditor`) hanya melihat cabang + departemen sendiri.

#### Backend — Controller Refactoring (20 controller di-update)
- **Branch scoping:** semua controller diubah sehingga hanya `superuser` yang bisa mengakses data lintas cabang; role lain dibatasi ke cabang sendiri
- **Department scoping:** `superuser` dan `system_admin` dapat mengakses semua departemen dalam cakupan cabangnya; `admin` dan role dibawahnya dibatasi ke departemen sendiri
- **Create/Update:** hanya `superuser` yang bisa mengubah `branchId` secara bebas saat membuat/mengedit data
- Controller yang diperbarui: `inventory`, `dashboard`, `disposal`, `event`, `location`, `rental`, `report`, `search`, `stockOpname`, `supply`, `unit`, `user`, `vendor`, `category`, `assignment`, `maintenance`, `transfer`, `auditLog`, `importExport`, `supply` (delete permission)
- Pola `!['superuser', 'admin', 'system_admin']` diganti dengan `req.user.role !== 'superuser'` (untuk branch) dan `req.user.role !== 'superuser' && req.user.role !== 'system_admin'` (untuk departemen)
- `admin` tidak lagi dianggap setara `superuser` untuk data scoping; `admin` sekarang diperlakukan seperti `manager` untuk scope data (cabang + departemen sendiri), namun tetap memiliki full action permissions dari `rolePermissions.config.ts`
- Backend `protect` middleware sudah melakukan `.populate('branchId')`; frontend sudah di-address di commit sebelumnya (`DashboardLayout.tsx:163`)

#### Frontend — Role Checks & UI Scoping
- **AssetSelectionModal.tsx** — `admin` tidak lagi bisa melihat aset semua departemen
- **AddInventoryModal.tsx** — `admin` tidak lagi bisa memilih departemen sembarangan; `system_admin` tetap bisa pilih departemen dalam cabangnya
- **DashboardLayout.tsx** — branch initialization sekarang hanya `superuser` yang skip; audit log access dibatasi ke `superuser`/`system_admin` saja
- **EventsTab.tsx** — `admin` tidak lagi punya akses delete event completed (hanya `superuser`/`system_admin`)
- **TransferPage.tsx** — `system_admin` ditambahkan ke `canCreateTransfer` dan `isManager`
- **InventoryPage.tsx** — `system_admin` ditambahkan ke `canEdit`
- **ReportsPage.tsx** — `system_admin` ditambahkan ke filteredDepartments dan department dropdown
- **MaintenanceDetailContent.tsx** — `system_admin` ditambahkan ke `isAdmin`
- **LocationModal.tsx** — `system_admin` ditambahkan ke `canManageWarehouse`
- **UserPermissionEditor.tsx** — `system_admin` ditambahkan ke full access check
- **SuppliesPage.tsx** — fix typo `'administrator'` → `'admin'`, tambah `system_admin`
- **MaintenanceTable.tsx** — fix typo `'administrator'` → `'admin'`, tambah `system_admin`

#### Catatan
- Permission config (`rolePermissions.config.ts`) tetap tidak berubah — permission config mengontrol ACTION (view/create/edit/delete), bukan data scope
- Middleware `authorize()` untuk route-level access tetap berfungsi per-route
- Semua pattern yang tersisa di frontend (`StockOpnamePage`, `RentalPage`, `EventDetailsPage`, dll) adalah ACTION permission checks, bukan data scoping — tidak perlu diubah
- Build successfully: `vite build` lulus tanpa error

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
