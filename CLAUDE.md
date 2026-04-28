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
- [src/app/context/AppContext.tsx](src/app/context/AppContext.tsx) — global context that orchestrates all hooks. Access it with `useApp()`. **Do not add logic here**—use hooks instead.
- [src/lib/supabase.ts](src/lib/supabase.ts) — Supabase client initialization and all TypeScript interfaces for DB types.
- [src/app/routes.ts](src/app/routes.ts) — React Router route definitions.
- [src/app/App.tsx](src/app/App.tsx) — Root component; renders `<Layout>` with role-filtered navigation.

### Frontend architecture: Services + Hooks pattern

The frontend is organized by **domain/epic** (aligned with Jira), not by layer:

```
src/
├── services/              ← Pure RPC calls (no React)
│   ├── authService.ts            (auth, login, register)
│   ├── usuariosService.ts        (users, personal)
│   ├── clientesService.ts        (clients, vehicles)
│   ├── citasService.ts           (appointments)
│   ├── ordenesService.ts         (work orders, QC, notes)
│   ├── inventarioService.ts      (parts, stock, suppliers)
│   ├── pagosService.ts           (payments, invoices)
│   ├── reportesService.ts        (reports)
│   └── transversalService.ts     (notifications, audit, catalogs)
│
├── hooks/                ← State + Logic (React)
│   ├── useAuth.ts                (session, login)
│   ├── useUsuarios.ts            (users CRUD)
│   ├── useClientes.ts            (clients/vehicles CRUD)
│   ├── useCitas.ts               (appointments CRUD)
│   ├── useOrdenes.ts             (work orders + details)
│   ├── useInventario.ts          (inventory + stock)
│   ├── usePagos.ts               (payments + invoices)
│   ├── useReportes.ts            (report generation)
│   └── useTransversal.ts         (notifications, audit, catalogs)
│
└── app/context/
    └── AppContext.tsx            (assembles all hooks into context)
```

**Data flow:**
1. Component calls hook (e.g., `useOrdenes()`)
2. Hook manages state with `useState`
3. Hook calls service function
4. Service calls `supabase.rpc()`
5. Hook updates state with response

**Example:**
```ts
// In hooks/useOrdenes.ts
const addOrden = async (o: OrdenTrabajo) => {
  const { data, error } = await ordenesService.crear(o);  // Call service
  if (!error) setOrdenes([...ordenes, data.orden]);       // Update state
  return { ok: !error };
};

// In a component
const { ordenes, addOrden } = useOrdenes();  // Destructure from hook
const result = await addOrden(nuevoOrden);   // Call hook method
```

**Rules:**
- ✅ Services call RPC functions only
- ✅ Hooks manage state, call services, expose methods
- ✅ AppContext assembles hooks, no logic inside it
- ❌ Never put business logic in AppContext
- ❌ Never call `supabase.rpc()` from components directly

### Database access pattern (critical)

**All database operations go through Supabase RPC functions, never direct table access.** Row-Level Security blocks direct queries. Every RPC call is made **via a service**, never directly from components:

```ts
// ❌ Wrong: Never call RPC directly from components
const { data } = await supabase.rpc('crear_orden', {...});

// ✅ Correct: Call via service
const { data } = await ordenesService.crear(o);  // service makes the RPC call
```

Services in `src/services/` wrap RPC calls. Mutation functions return `{ ok: boolean; error?: string }`. The 80+ RPC functions are defined in [database-setup.sql](database-setup.sql) and cover the full lifecycle of all entities.

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

### Adding new features

When implementing a new feature, follow this flow:

1. **Create RPC function** in [database-setup.sql](database-setup.sql) (if needed)
2. **Create service** in `src/services/` — wrap RPC calls only
3. **Create hook** in `src/hooks/` — manage state, call service
4. **Update AppContext** to expose the hook
5. **Use in component** — destructure from `useApp()` or call hook directly

Example: Adding a "cancel order" feature

```ts
// 1. RPC (in database-setup.sql)
CREATE FUNCTION cancelar_orden(p_orden_id uuid) RETURNS ...

// 2. Service (src/services/ordenesService.ts)
cancelar: (ordenId: string) =>
  supabase.rpc('cancelar_orden', { p_orden_id: ordenId }),

// 3. Hook (already in src/hooks/useOrdenes.ts)
const cancelOrder = async (id: string) => {
  const { data, error } = await ordenesService.cancelar(id);
  if (!error) setOrdenes(prev => prev.map(o => ...));
  return { ok: !error };
};

// 4. AppContext exports via ordenes hook
// (no changes needed, already done)

// 5. Component uses it
const { ordenes, cancelOrder } = useOrdenes();
await cancelOrder(ordenId);
```

### Demo credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrador |
| asesor | asesor123 | Asesor de Servicio |
| jefe | jefe123 | Jefe de Taller |
| mecanico | mec123 | Mecánico |
| cliente | cliente123 | Cliente |
