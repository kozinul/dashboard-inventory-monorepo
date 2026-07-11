# AGENTS.md — Work Summary

## Current State
- **User:** bndhit (admin, BND Hotel, IT department)
- **Branch:** BND Hotel (`6a3488a78e9c8aa5102a85ca`)
- **Backend:** Docker container (localhost:3000)
- **Frontend:** Docker container (port 80)

## Completed Tasks

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
- Backend/frontend containers must be rebuilt with `docker compose build && up -d --force-recreate` after code changes.
- Mongoose connects to database `inventory`.
- `Location.branchId` and `Asset.branchId` stored as ObjectId. Mongoose `find()` auto-converts strings to ObjectId, but `aggregate()` requires explicit `new mongoose.Types.ObjectId()` conversion.
- Vendor data in DB: 2 vendors — 1 with `null` branchId (global), 1 with BNDCC branchId.
- Rental & Event feature is fully functional (models, controllers, routes, pages, components, RBAC) — now visible in sidebar.
