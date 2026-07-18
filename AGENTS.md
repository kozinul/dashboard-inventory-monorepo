# AGENTS.md — Work Summary

## Current State
- **User:** bndhit (admin, BND Hotel, IT department)
- **User:** agung (technician, Bali Nusa Dua Convention Center, IT department)
- **Branch:** BND Hotel (`6a3488a78e9c8aa5102a85ca`)
- **Backend:** Docker container (localhost:3000)
- **Frontend:** Docker container (port 80)

## Completed Tasks

### 2026-07-18
- **Indonesian to English translation** — Converted all Indonesian text to English across 21 files (frontend + backend). UI labels, error messages, Excel column headers, history notes, modal texts, button labels, filter labels all translated. Import column lookups kept backward-compatible with `||` fallback to Indonesian.
- **Currency format standardization** — All manual `Rp ... toLocaleString('id-ID')` replaced with centralized `formatIDR()` from `@/utils/currency`. Added `formatNumber()` utility. Updated 13+ files.
- **Selective Wipe Transactions** — Backend `resetTransactions` now accepts `{ collections: string[] }` body; frontend replaced single "Wipe All" button with 2-step modal (select checkboxes → confirm). Fixed admin authorization bug.
- **Asset status 'broken'** — Added `broken` to shared `AssetStatusSchema` enum; `brokenReason` field on Asset model/schema; badge styles in `AssetTableParts`/`AssetHero`; conditional textarea in `EditInventoryModal`/`AddInventoryModal`.
- **Hide Low Stock from Dashboard** — Added `hideFromLowStock` (Boolean) to Supply model; excluded in `getLowStockSupplies` query; toggle icon column in `SuppliesPage`.
- **Item Mutation Report — full asset movement tracking** — Added `AssetHistory.create` to 7 controllers:
  - `maintenance.controller.ts` — STATUS_CHANGE on send/accept/complete/reject/cancel tickets
  - `rental.controller.ts` — STATUS_CHANGE on create/delete rental
  - `disposal.controller.ts` — STATUS_CHANGE on approve disposal
  - `stockOpname.controller.ts` — STATUS_CHANGE on asset missing during SO
  - `importExport.controller.ts` — CREATE on Excel import
  - `assignment.controller.ts` — ASSIGN/RETURN on create/return assignment
  - `transfer.controller.ts` — TRANSFER on approve transfer
- **Item Mutation Report — Assignment fix** — Removed `isDeleted` filter from Assignment query so soft-deleted assignments (returned/cleaned) still appear in report history.
- **Item Mutation Report — AuditLog expanded** — Added maintenance, transfer, rental actions to auditActions query and action mapping.
- **Item Mutation Report — frontend fixes** — Header "Keterangan" → "Notes"; added action badge styles for STATUS_CHANGE, CREATE, DELETE, INSTALL, DISMANTLE, EVENT_BOOK, EVENT_RELEASE.
- **AssetHistory model updated** — Added `Maintenance`, `Rental`, `Disposal` to `referenceType` enum.
- **URL path rename** — `/reports/mutasi-barang` → `/reports/item-mutation`.
- **Pending ticket start fix** — `startTicket` handler `validStatuses` changed from `['Accepted', 'Sent']` to `['Accepted', 'Sent', 'Pending']`.

### 2026-07-16
- **Category page empty fix** — Added `!cat.branchId` to frontend branch filter in `CategoryManagement.tsx` so global categories (no branchId) appear.
- **Units page empty fix** — Added `!unit.branchId` to frontend branch filter in `UnitManagementPage.tsx` so global units appear.
- **Parent Asset searchable selector** — Replaced `<select>` dropdown with searchable input + debounced dropdown in `EditInventoryModal.tsx`; alias displayed first (bold); removable chip for selected parent.
- **Global search supplies fix** — Updated `search.controller.ts` supply search to handle null `branchId` via `$or`; added `partNumber` to search fields.
- **Request Delete feature (technician only)** — New `pending_delete` asset status; technician can request delete with optional reason via modal; admin/superuser/system_admin can approve (hard delete) or reject (revert to active).
- **Notification system** — Backend `Notification` model + controller + routes; frontend bell icon dropdown with unread badge, polling every 30s, mark as read / mark all read.
- **Request Delete modal** — SweetAlert2 textarea modal for optional reason input when requesting delete.

### 2026-07-12
- **Item Mutation Report — Keterangan column added** — New column showing supply history notes; colSpan updated to 9.
- **Item Mutation Report — auto-apply filters** — useEffect now depends on `itemTypeFilter`, `startDate`, `endDate` (no manual "Filter" click needed).
- **Item Mutation Report — AssetHistory integration** — Backend now queries `AssetHistory` alongside `AuditLog` for asset mutations; `referenceType` included in all rows.
- **SupplyHistory — referenceType & referenceId added** — New schema fields: `referenceType` (Event/Manual/Import/StockOpname) + `referenceId`.
- **AssetHistory model created** — Unified asset movement log with actions: CREATE, UPDATE, DELETE, ASSIGN, RETURN, TRANSFER, EVENT_BOOK, EVENT_RELEASE, ADJUST, MOVE, STATUS_CHANGE, INSTALL, DISMANTLE.
- **Supply deduction/restock in event controller** — Deduct on planning→scheduled; restock on cancelled only (consumables not restocked on completion); restock on deleteEvent for scheduled/ongoing.
- **All SupplyHistory.create calls updated** — Added `userId`, `referenceType`, Indonesian notes across supply, event, stockOpname, importExport controllers.
- **RBAC fixes** — `item_mutation_report` removed from `user` role defaults; added to fallback arrays for manager, supervisor, technician, auditor in DashboardLayout.tsx.
- **DB RBAC overrides updated** — Added `item_mutation_report` and `stock_opname` to technician and supervisor role overrides in MongoDB.
- **Excel export updated** — Added "Keterangan" and "Sumber" columns to item mutation Excel export.

### 2026-07-11
- **Vendor Management fix** — Client-side filter `data.filter(v => v.branchId === activeBranchId)` removed; now passes `branchId` query param to backend API. Non-superuser backend uses `$or` (`{branchId: userBranch} OR {branchId: null}`) so global vendors with null branchId appear.
- **Rental menu activated** — Uncommented `{ name: 'Rental', href: '/rental', icon: CalendarDaysIcon }` in DashboardLayout.tsx sidebar navigation.

### 2026-07-10
- **Category Summary integrated into ReportsPage** — Removed standalone route; added `category-summary` card to `REPORT_TYPES`.
- **Category Summary grouped by category → unique asset name** — Backend aggregation: group by `{ category, name, status }` then `{ category, name }`; frontend shows category header with per-name rows indented.
- **Grand total row removed** from Category Summary table.
- **ObjectId conversion fix** — `getCategorySummary` now uses `new mongoose.Types.ObjectId()` for branch filter in aggregation $match.
- **RAK CCTV department updated** — Set to IT (`69a45010c62dc66c69587040`).
- **Item Mutation Report — alias field added** — Backend select/populate includes `alias`; frontend shows alias as primary line above asset name in Item column; qty displays `1` for assets, stock change for supplies.

## Important Notes
- Backend/frontend containers must be rebuilt with `docker compose -f docker-compose.prod.yml build --no-cache backend frontend && up -d --force-recreate` after code changes.
- Mongoose connects to database `inventory`.
- `Location.branchId` and `Asset.branchId` stored as ObjectId. Mongoose `find()` auto-converts strings to ObjectId, but `aggregate()` requires explicit `new mongoose.Types.ObjectId()` conversion.
- Vendor data in DB: 2 vendors — 1 with `null` branchId (global), 1 with BNDCC branchId.
- Rental & Event feature is fully functional (models, controllers, routes, pages, components, RBAC) — now visible in sidebar.
- All user-facing text is in English. Currency formatting uses `formatIDR()` from `@/utils/currency`. Import templates support both English and Indonesian column headers for backward compatibility.
- Item Mutation Report captures all asset movements via 5 data sources: SupplyHistory, Assignment, Transfer, AssetHistory, AuditLog.
