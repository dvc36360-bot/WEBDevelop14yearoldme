// Deploy with: supabase functions deploy send-order-email
// Set secrets: RESEND_API_KEY, ORDER_NOTIFICATION_FROM, WEBWINKEL_ADMIN_EMAIL
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { customer_name, customer_email, product_name } = await req.json();
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ORDER_NOTIFICATION_FROM");
  const admin = Deno.env.get("WEBWINKEL_ADMIN_EMAIL");
  if (!key || !from) return Response.json({ ok:false, error:"Email secrets not configured" }, { status: 503 });
  const html = `<p>Hallo ${String(customer_name || "daar")},</p><p>Ons het jou bestelling vir <b>${String(product_name || "jou pakket")}</b> ontvang. WebWinkel sal jou so gou moontlik kontak.</p><p>WebWinkel</p>`;
  const r = await fetch("https://api.resend.com/emails", { method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"}, body:JSON.stringify({from,to:[customer_email],subject:"WebWinkel het jou bestelling ontvang",html}) });
  if (!r.ok) return new Response(await r.text(), {status:502});
  if (admin) {
    await fetch("https://api.resend.com/emails", {method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[admin],subject:"Nuwe WebWinkel-bestelling",html:`<p>${String(customer_name||"")}: ${String(product_name||"")}</p><p>${String(customer_email||"")}</p>`})});
  }
  return Response.json({ok:true});
});
