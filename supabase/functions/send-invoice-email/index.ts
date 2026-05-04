const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { clienteEmail, clienteNombre, facturaNumero, total, subtotal, impuesto, metodoPago, fecha } = body;

    if (!clienteEmail || !facturaNumero) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const apiKey = Deno.env.get("RESEND_API_KEY") || "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #1e293b; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .section h2 { margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; }
    .detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 13px; }
    .detail-value { font-weight: 500; color: #1e293b; }
    .total-section { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; border-radius: 4px; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; }
    .total-row.grand-total { font-size: 20px; font-weight: bold; color: #1e293b; border-top: 2px solid #0284c7; padding-top: 15px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
        <div class="logo">
          <img src="https://uikpczaqoaxhwjybfvxw.supabase.co/storage/v1/object/public/taller/705ae0af64042a0b0fa15a9246b41db08254ad91.png" alt="Logo" style="max-width: 180px; margin-bottom: 15px;">
        </div>
      <h1>TallerPro</h1>
      <p>Su Nota de Venta está lista</p>
    </div>

    <div class="section">
      <h2>Datos del Cliente</h2>
      <div class="detail">
        <span class="detail-label">Nombre: </span>
        <span class="detail-value">${clienteNombre || '—'}</span>
      </div>
      <div class="detail">
        <span class="detail-label">Email: </span>
        <span class="detail-value">${clienteEmail}</span>
      </div>
    </div>

    <div class="section">
      <h2>Detalles de la Factura</h2>
      <div class="detail">
        <span class="detail-label">Número de Factura: </span>
        <span class="detail-value">${facturaNumero}</span>
      </div>
      <div class="detail">
        <span class="detail-label">Fecha: </span>
        <span class="detail-value">${fecha || '—'}</span>
      </div>
      <div class="detail">
        <span class="detail-label">Método de Pago: </span>
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
          <span>IVA (12%)</span>
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
      <p>Si tienes preguntas sobre tu nota de venta, responde este email</p>
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TallerPro <facturas@tallerpro.email>",
        to: clienteEmail,
        subject: `Tu factura ${facturaNumero} está lista — TallerPro 🔧`,
        html: html,
      }),
    });

    const resendData = await resendRes.json();

    return new Response(
      JSON.stringify({
        ok: resendRes.ok,
        resendStatus: resendRes.status,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
