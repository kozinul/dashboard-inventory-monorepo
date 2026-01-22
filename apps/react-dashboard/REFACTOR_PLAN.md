# User Management Refactor Plan - React

## Goal
Transform static "User & Organization Management" HTML into a scalable React module within `apps/react-dashboard`.

## 1. Config Updates
- **Tailwind Config**: Migrate colors (`slate-card`, `slate-hover`, `background-light`, etc.) and fonts (`Space Grotesk`) from HTML to `apps/react-dashboard/tailwind.config.js`.
- **Index HTML**: Add Google Fonts links to `apps/react-dashboard/index.html`.

## 2. Component Architecture
Decompose the HTML into the following structure:

```
src/
  components/
    layout/
      TopNavbar.tsx        # <header> content
      // Sidebar is already there, might need updates or keep as is if not in this specific design
      DashboardLayout.tsx  # Update to support the new Navbar style if needed
    users/
      UserTable.tsx        # The main <table>
      UserRow.tsx          # Individual <tr>
      UserFilters.tsx      # Search + Select inputs
      StatsGrid.tsx        # Bottom Bento Grid
      PageHeader.tsx       # Title + Add Button
      TabNavigation.tsx    # Users / Departments / Job Titles
    common/
      StatusBadge.tsx      # Reusable badge component
      Pagination.tsx       # Table footer
```

## 3. Data Schema
- Create `src/data/mock-users.ts` reflecting the HTML table data (Alex Rivera, Sarah Jenkins, etc).
- Create `src/data/mock-stats.ts` for the Bento grid.

## 4. Execution Steps
1.  **Update Tailwind & Fonts**: Ensure the visual foundation matches.
2.  **Create Components**: Build atomic components first (Badges, Buttons), then molecular (Row, Card), then organisms (Table, Layout).
3.  **Assemble Page**: Stitch everything together in `src/pages/UserManagement.tsx`.
4.  **Verify**: Ensure it looks exactly like the source HTML.

## Design Notes
- The provided HTML has a Top Navbar but NO Sidebar. The previous scaffold had a Sidebar.
- *Constraint Check*: The prompt says "Transform this HTML... User & Organization Management frontend module as part of a larger admin dashboard system."
- *Decision*: I will adapt the `DashboardLayout` to utilize the **Top Navbar** design provided in the HTML, or incorporate it. The HTML shows a full-width header. I'll create a layout variant or update the existing one to match the "AV Inventory Admin Console" look.
