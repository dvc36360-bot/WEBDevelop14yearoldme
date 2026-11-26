document.addEventListener("DOMContentLoaded",async()=>{
  if(!window.sb)return;
  const page=document.body.dataset.page;
  let user; try{user=await requireUser(true)}catch(e){msg($("#notice"),e.message,true);return}
  if(!user)return;
  $("#logout")?.addEventListener("click",signOut);
  if(page==="dashboard") await dashboard();
  if(page==="products") await products();
  if(page==="orders") await orders();
  if(page==="settings") await payments();
  if(page==="subscriptions") await subscriptions();
});
async function dashboard(){
  const [p,o,s]=await Promise.all([
    sb.from("products").select("id",{count:"exact",head:true}),
    sb.from("orders").select("id",{count:"exact",head:true}),
    sb.from("subscriptions").select("id",{count:"exact",head:true})
  ]);
  $("#stats").innerHTML=`<div class="stat"><b>${p.count||0}</b><span>Pakkette</span></div><div class="stat"><b>${o.count||0}</b><span>Bestellings</span></div><div class="stat"><b>${s.count||0}</b><span>Intekeninge</span></div>`;
}
async function products(){
  const form=$("#productForm"), list=$("#items");
  async function refresh(){
    const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
    if(error){msg($("#notice"),error.message,true);return}
    list.innerHTML="";
    (data||[]).forEach(p=>{
      const row=document.createElement("div");row.className="list-row";
      const title=document.createElement("span");title.textContent=`${p.name} — ${money(p.price)} ${p.is_active?"":"(onaktief)"}`;
      const edit=document.createElement("button");edit.className="button secondary";edit.textContent="Edit";
      edit.onclick=()=>{form.id.value=p.id;form.name.value=p.name;form.description.value=p.description||"";form.price.value=p.price;form.is_active.checked=p.is_active};
      const del=document.createElement("button");del.className="button danger";del.textContent="Delete";
      del.onclick=async()=>{if(confirm("Verwyder hierdie pakket?")){const {error}=await sb.from("products").delete().eq("id",p.id);if(error)msg($("#notice"),error.message,true);else refresh()}};
      row.append(title,edit,del);list.append(row);
    });
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const payload={name:form.name.value.trim(),description:form.description.value.trim(),price:Number(form.price.value),is_active:form.is_active.checked};
    let q=form.id.value?sb.from("products").update(payload).eq("id",form.id.value):sb.from("products").insert(payload);
    const {error}=await q; if(error)return msg($("#notice"),error.message,true);
    form.reset();form.id.value="";msg($("#notice"),"Pakket gestoor.");refresh();
  });
  $("#clearProduct")?.addEventListener("click",()=>{form.reset();form.id.value=""});
  await refresh();
}
async function orders(){
  const holder=$("#items");
  const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false});
  if(error){msg($("#notice"),error.message,true);return}
  holder.innerHTML="";
  (data||[]).forEach(o=>{
    const card=document.createElement("article");card.className="order-card";
    card.innerHTML=`<h3></h3><p></p><p></p><p></p><select><option>pending</option><option>contacted</option><option>confirmed</option><option>completed</option><option>cancelled</option></select><button class="button">Stoor status</button>`;
    const ps=card.querySelectorAll("p");
    card.querySelector("h3").textContent=o.product_name||"Bestelling";
    ps[0].textContent=`${o.customer_name||""} · ${o.customer_email||""}`;
    ps[1].textContent=`Kontak: ${o.customer_phone||"—"}`;
    ps[2].textContent=`${money(o.price)} · ${new Date(o.created_at).toLocaleString("af-ZA")}`;
    const select=card.querySelector("select");select.value=o.status;
    card.querySelector("button").onclick=async()=>{const {error}=await sb.from("orders").update({status:select.value}).eq("id",o.id);msg($("#notice"),error?.message||"Status opgedateer.",!!error)};
    holder.append(card);
  });
}
async function payments(){
  const form=$("#paymentForm"),holder=$("#items");
  async function refresh(){
    const {data,error}=await sb.from("payment_methods").select("*").order("display_order");
    if(error)return msg($("#notice"),error.message,true);
    holder.innerHTML="";
    (data||[]).forEach(m=>{
      const row=document.createElement("div");row.className="list-row";
      const name=document.createElement("span");name.textContent=m.name+(m.is_active?"":" (af)");
      const edit=document.createElement("button");edit.className="button secondary";edit.textContent="Edit";edit.onclick=()=>{form.id.value=m.id;form.name.value=m.name;form.description.value=m.description||"";form.is_active.checked=m.is_active};
      const del=document.createElement("button");del.className="button danger";del.textContent="Delete";del.onclick=async()=>{if(confirm("Delete betaalmetode?")){const {error}=await sb.from("payment_methods").delete().eq("id",m.id);if(error)msg($("#notice"),error.message,true);else refresh()}};
      row.append(name,edit,del);holder.append(row);
    });
  }
  form.onsubmit=async e=>{e.preventDefault();const v={name:form.name.value.trim(),description:form.description.value.trim(),is_active:form.is_active.checked};
    const q=form.id.value?sb.from("payment_methods").update(v).eq("id",form.id.value):sb.from("payment_methods").insert(v);
    const {error}=await q;if(error)return msg($("#notice"),error.message,true);form.reset();form.id.value="";msg($("#notice"),"Betaalmetode gestoor.");refresh()};
  await refresh();
}
async function subscriptions(){
  const form=$("#subscriptionForm"),holder=$("#items");
  async function refresh(){
    const {data,error}=await sb.from("subscriptions").select("*").order("due_date");
    if(error)return msg($("#notice"),error.message,true);
    holder.innerHTML="";
    (data||[]).forEach(s=>{
      const row=document.createElement("div");row.className="list-row";
      const label=document.createElement("span");label.textContent=`${s.business_name} · ${s.subscription_name} · ${money(s.amount)} · betaal teen ${s.due_date} · ${s.status}`;
      const edit=document.createElement("button");edit.className="button secondary";edit.textContent="Edit";edit.onclick=()=>{form.id.value=s.id;form.business_name.value=s.business_name;form.customer_name.value=s.customer_name||"";form.customer_email.value=s.customer_email;form.subscription_name.value=s.subscription_name;form.amount.value=s.amount;form.due_date.value=s.due_date;form.status.value=s.status;form.billing_frequency.value=s.billing_frequency;form.reminder_enabled.checked=s.reminder_enabled};
      const del=document.createElement("button");del.className="button danger";del.textContent="Delete";del.onclick=async()=>{if(confirm("Verwyder intekening?")){const {error}=await sb.from("subscriptions").delete().eq("id",s.id);if(error)msg($("#notice"),error.message,true);else refresh()}};
      row.append(label,edit,del);holder.append(row);
    });
  }
  form.onsubmit=async e=>{e.preventDefault();const v={business_name:form.business_name.value.trim(),customer_name:form.customer_name.value.trim(),customer_email:form.customer_email.value.trim(),subscription_name:form.subscription_name.value.trim(),amount:Number(form.amount.value),due_date:form.due_date.value,status:form.status.value,billing_frequency:form.billing_frequency.value,reminder_enabled:form.reminder_enabled.checked};
    const q=form.id.value?sb.from("subscriptions").update(v).eq("id",form.id.value):sb.from("subscriptions").insert(v);
    const {error}=await q;if(error)return msg($("#notice"),error.message,true);form.reset();form.id.value="";msg($("#notice"),"Intekening gestoor.");refresh()};
  await refresh();
}
