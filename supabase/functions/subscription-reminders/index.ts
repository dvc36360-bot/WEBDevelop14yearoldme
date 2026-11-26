// Scheduled function starter. Configure Supabase Cron to invoke daily.
// Set secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ORDER_NOTIFICATION_FROM
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const key=Deno.env.get("RESEND_API_KEY"), from=Deno.env.get("ORDER_NOTIFICATION_FROM");
  if(!key || !from) return Response.json({ok:false,error:"Email secrets missing"},{status:503});
  const target=new Date(); target.setDate(target.getDate()+7);
  const due=target.toISOString().slice(0,10);
  const {data,error}=await supabase.from("subscriptions").select("*").eq("due_date",due).eq("reminder_enabled",true).eq("status","outstanding");
  if(error) return Response.json({ok:false,error:error.message},{status:500});
  let sent=0;
  for(const s of data||[]){
    const html=`<p>Hallo ${s.customer_name||"daar"},</p><p>Jou betaling vir ${s.business_name} (${s.subscription_name}) van R${s.amount} is oor 7 dae betaalbaar, op ${s.due_date}.</p><p>Kontak WebWinkel indien jy reeds betaal het.</p>`;
    const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[s.customer_email],subject:"WebWinkel: betaling oor 7 dae betaalbaar",html})});
    if(r.ok) sent++;
  }
  return Response.json({ok:true,found:data?.length||0,sent});
});
