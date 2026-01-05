# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build
```

**Environment:** Set `GEMINI_API_KEY` in `.env.local` for AI features.

## Architecture Overview

This is **Odoo TimeLink Pro**, a multi-tenant timesheet logging SPA built with React 19 + TypeScript + Vite. It integrates with Odoo ERP (simulated) and Google Gemini AI for description enhancement.

### Core Patterns

**Multi-Tenant Design:** All data operations require `tenantId`. Isolation is enforced in `StorageService` - cross-tenant access throws errors.

**View-Based Routing:** Simple string state (`currentView`) in App.tsx controls navigation. No routing library - views are: `CONTRACTOR_HOME`, `MANAGER_HOME`, `MANAGER_DETAIL`, `MANAGER_EXPORT`, `TENANT_ADMIN`.

**State Management:** React hooks in App.tsx as single source of truth. Props drill down, callbacks bubble up. No Redux/Zustand.

**Role-Based Access:** `Role.CONTRACTOR` vs `Role.MANAGER` determines available views and actions.

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main component, state management, view routing |
| `types.ts` | Domain models: `User`, `TimeEntry`, `Project`, `Task`, `Tenant` |
| `constants.ts` | Mock data for tenants, users, projects, tasks |
| `components/WeeklyTimesheet.tsx` | Core grid editor (748 lines) - weekly view with project/task rows |
| `services/storageService.ts` | localStorage persistence with tenant isolation |
| `services/geminiService.ts` | Gemini AI integration for description polish |
| `services/odooService.ts` | Odoo ERP sync stubs (user sync, timesheet upload) |
| `utils/dateUtils.ts` | Week calculations, duration parsing/formatting |

### Data Model

```
TimeEntry: tenantId, contractorId, projectId, taskId, date (YYYY-MM-DD), hours, description, status
Status: Draft → Submitted → Approved/Rejected
```

Entries are grouped by Project+Task in WeeklyTimesheet as "GridRows" with daily hour columns.

### Services

- **StorageService:** Static class wrapping localStorage (`timelink_db_v1` key). All methods take `tenantId` first.
- **AuthService:** Simulates Microsoft Entra ID OIDC flow with mock users.
- **GeminiService:** `enhanceDescription(text)` calls Gemini API to polish task descriptions.
- **OdooService:** Stub implementations for `syncUserWithOdoo()` and `uploadTimesheetToOdoo()`.

### UI Stack

- Tailwind CSS (CDN)
- Lucide React icons
- Recharts for dashboard visualization
- Inter font
