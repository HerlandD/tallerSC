# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # Production build → /dist
```

No test runner or linter is currently configured.

## Architecture

**TallerPro** is a single-page React + TypeScript app for managing a mechanical workshop. The backend is entirely Supabase (PostgreSQL + RPC functions). There is no separate backend server.

### Key entry points

- [src/main.tsx](src/main.tsx) — React entry, mounts `<AppProvider>` wrapping `<App>`
- [src/app/context/AppContext.tsx](src/app/context/AppContext.tsx) — single global context that holds all state: current user, all CRUD entities, notifications, audit logging, and catalog data. Access it with `useApp()`.
- [src/lib/supabase.ts](src/lib/supabase.ts) — Supabase client initialization and all TypeScript interfaces for DB types.
- [src/app/routes.ts](src/app/routes.ts) — React Router route definitions.
- [src/app/App.tsx](src/app/App.tsx) — Root component; renders `<Layout>` with role-filtered navigation.

### Database access pattern (critical)

**All database operations go through Supabase RPC functions, never direct table access.** Row-Level Security blocks direct queries. Every RPC call follows this pattern:

```ts
const { data, error } = await supabase.rpc('nombre_funcion', { param1, param2 });
```

Mutation functions return `{ ok: boolean; error?: string }`. The 80+ RPC functions are defined in [database-setup.sql](database-setup.sql) and cover the full lifecycle of all entities.

### Authentication

- Login via `login_usuario(username, password)` RPC — password is SHA-256 hashed with pepper `$TlrPro2026$` before sending.
- Session stored in `localStorage` under key `tallerpro_session`.
- Five roles: `administrador`, `asesor`, `jefe_taller`, `mecanico`, `cliente`. Navigation items in [src/app/components/Layout.tsx](src/app/components/Layout.tsx) are filtered by role.

### Core domain entities

1. **OrdenTrabajo** — central business entity. State machine: `registrada → en_diagnostico → esperando_aprobacion → en_reparacion → control_calidad → liberada → finalizada`. Linked to cliente, vehiculo, mechanics, quotes, parts, QC checklist, and audit trail.
2. **Cita** (Appointment) — states: `pendiente → confirmada → en_progreso → completada` (or `cancelada`/`reprogramada`).
3. **Repuesto** (Inventory) — stock tracking with Kardex movement journal (entrada, salida, reserva, liberacion, ajuste).
4. **Notificacion** — role-based alerts for low stock, pending quotes, new appointments, etc.
5. **LogAuditoria** — every action logs via `insertar_log_auditoria` RPC.

### UI stack

- **shadcn/ui** (Radix UI-based) components live in [src/app/components/ui/](src/app/components/ui/). Add new ones with the shadcn CLI or manually following existing patterns.
- **Tailwind CSS v4** via `@tailwindcss/vite` — no separate config file needed.
- **Recharts** for charts in the Dashboard.
- **React Hook Form** for all forms.
- Path alias `@` maps to `./src` (configured in [vite.config.ts](vite.config.ts)).

### Environment variables

Supabase credentials are in `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both are required at dev and build time.

### Demo credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrador |
| asesor | asesor123 | Asesor de Servicio |
| jefe | jefe123 | Jefe de Taller |
| mecanico | mec123 | Mecánico |
| cliente | cliente123 | Cliente |
