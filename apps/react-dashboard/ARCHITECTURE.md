# React Frontend Architecture Plan

## Overview
A standalone React application using proper component architecture, designed to fit into a future monorepo.

## 1. Folder Structure
```
/apps
  /react-dashboard
    /public
    /src
      /assets          # Static assets (images, fonts)
      /components
        /ui            # core/shared (Button, Badge, Card) - styled with Tailwind
        /layout        # Sidebar, Header, PageContainer
      /features
        /users         # User management domain (UserTable, UserStats)
      /hooks           # Custom React hooks (useTheme, usePagination)
      /lib             # Utilities (formatting, mock data generators)
      /pages           # Route components
      App.tsx
      main.tsx
    package.json
    tailwind.config.js
    vite.config.ts
    tsconfig.json
```

## 2. Tech Stack configuration
- **Build**: Vite (Fast HMR)
- **Styling**: Tailwind CSS (Utility-first) + `class-variance-authority` (optional, for component variants) or `clsx/tailwind-merge`.
- **Icons**: Material Symbols (via font or SVG components).
- **Router**: React Router DOM (v6).
- **State**: React Context (for Theme/Sidebar state) + Local State (for mock data).

## 3. Next Steps
1. Scaffold `package.json` and Configs.
2. Create Core UI Components (Badge, Button).
3. Create Layout System (Sidebar, Header).
4. Implement "User Management" Page using Mock Data.
