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

// Test endpoint
app.get("/test", (c) => {
  return c.json({ message: "Server function is working" });
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

// POST /send-factura-email — envía factura por email usando Resend
app.post("/send-factura-email", async (c) => {
  try {
    const body = await c.req.json() as {
      clienteEmail?: string;
      clienteNombre?: string;
      facturaNumero?: string;
      total?: number;
      subtotal?: number;
      impuesto?: number;
      metodoPago?: string;
      fecha?: string;
      ordenNumero?: string;
    };

    const { clienteEmail, clienteNombre, facturaNumero, total, subtotal, impuesto, metodoPago, fecha } = body;

    if (!clienteEmail || !facturaNumero) {
      return c.json({ error: "clienteEmail y facturaNumero son requeridos" }, 422);
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .detail-label { color: #64748b; font-size: 13px; }
        .detail-value { font-weight: 500; color: #1e293b; }
        .total-section { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; border-radius: 4px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .total-row.grand-total { font-size: 18px; font-weight: bold; color: #1e293b; border-top: 2px solid #0284c7; padding-top: 12px; margin-top: 12px; }
        .footer { background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 TallerPro</h1>
          <p>Tu factura está lista</p>
        </div>

        <div class="section">
          <h2>Datos del Cliente</h2>
          <div class="detail">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">${clienteNombre || '—'}</span>
          </div>
          <div class="detail">
            <span class="detail-label">Email</span>
            <span class="detail-value">${clienteEmail}</span>
          </div>
        </div>

        <div class="section">
          <h2>Detalles de la Factura</h2>
          <div class="detail">
            <span class="detail-label">Número de Factura</span>
            <span class="detail-value">${facturaNumero}</span>
          </div>
          <div class="detail">
            <span class="detail-label">Fecha</span>
            <span class="detail-value">${fecha || '—'}</span>
          </div>
          <div class="detail">
            <span class="detail-label">Método de Pago</span>
            <span class="detail-value">${metodoPago || '—'}</span>
          </div>
        </div>

        <div class="section">
          <h2>Resumen de Pago</h2>
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal</span>
              <span>$${(subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>IVA</span>
              <span>$${(impuesto || 0).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>$${(total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por confiar en <strong>TallerPro</strong></p>
          <p>Si tienes preguntas sobre tu factura, responde este email</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TallerPro <onboarding@resend.dev>",
        to: [clienteEmail],
        subject: `Tu factura ${facturaNumero} está lista — TallerPro 🔧`,
        html: htmlTemplate,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error("Resend error:", errText);
      return c.json({ error: `No se pudo enviar el email: ${errText}` }, 500);
    }

    const resendData = await resendResponse.json() as { id?: string };
    return c.json({ ok: true, resendId: resendData.id });
  } catch (error) {
    console.error("Error en send-factura-email:", error);
    return c.json({ error: "Error interno: " + (error as Error).message }, 500);
  }
});

Deno.serve(app.fetch);
