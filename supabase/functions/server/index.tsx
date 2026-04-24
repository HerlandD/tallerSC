import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7f295475/health", (c) => {
  return c.json({ status: "ok" });
});

// POST /work-orders — creates a new work order with a server-generated OT number
app.post("/work-orders", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { cliente_id, vehiculo_id, creado_por, datos } = body as {
    cliente_id?: string;
    vehiculo_id?: string;
    creado_por?: string;
    datos?: Record<string, unknown>;
  };

  if (!cliente_id || !vehiculo_id || !creado_por) {
    return c.json({ error: "cliente_id, vehiculo_id y creado_por son requeridos" }, 422);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("crear_orden_v2", {
    p_cliente_id: cliente_id,
    p_vehiculo_id: vehiculo_id,
    p_creado_por: creado_por,
    p_datos: datos ?? {},
  });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!data?.success) {
    return c.json({ error: data?.error ?? "Error al crear la orden" }, 500);
  }

  return c.json({ id: data.id, numero: data.numero }, 201);
});

Deno.serve(app.fetch);