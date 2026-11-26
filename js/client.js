document.addEventListener("DOMContentLoaded", async () => {
  if(!window.sb) return;
  const page=document.body.dataset.page;
  if(page==="signup"){
    $("#signupForm")?.addEventListener("submit",async e=>{
      e.preventDefault(); const f=e.currentTarget; const full_name=f.full_name.value.trim();
      const {data,error}=await sb.auth.signUp({email:f.email.value.trim(),password:f.password.value,
        options:{data:{full_name,phone:f.phone.value.trim()}}});
      if(error) return msg($("#notice"),error.message,true);
      msg($("#notice"),"Registrasie ontvang. Kyk jou e-pos om jou rekening te bevestig.");
      f.reset();
    });
  }
  if(page==="login"){
    $("#loginForm")?.addEventListener("submit",async e=>{
      e.preventDefault(); const f=e.currentTarget;
      const {error}=await sb.auth.signInWithPassword({email:f.email.value.trim(),password:f.password.value});
      if(error) return msg($("#notice"),error.message,true);
      location.href="home.html";
    });
  }
  if(page==="home"||page==="orders"||page==="settings"){
    let user; try{user=await requireUser(false)}catch(e){return msg($("#notice"),e.message,true)}
    if(!user)return;
    $$("[data-user-email]").forEach(x=>x.textContent=user.email||"");
    if(page==="orders") await loadProducts();
    if(page==="settings") await loadSettings(user);
  }
  $("#logout")?.addEventListener("click",signOut);
});

async function loadProducts(){
  const holder=$("#productList"); if(!holder)return;
  const {data,error}=await sb.from("products").select("id,name,description,price,currency").eq("is_active",true).order("created_at",{ascending:false});
  if(error){holder.textContent=error.message;return}
  holder.innerHTML="";
  (data||[]).forEach(p=>{
    const card=document.createElement("article"); card.className="product-card";
    card.innerHTML=`<h3></h3><p></p><strong></strong><button class="button">Bestel</button>`;
    card.querySelector("h3").textContent=p.name;
    card.querySelector("p").textContent=p.description||"";
    card.querySelector("strong").textContent=money(p.price);
    card.querySelector("button").addEventListener("click",()=>openOrder(p));
    holder.append(card);
  });
  if(!data?.length) holder.innerHTML="<p>Geen pakkette is tans beskikbaar nie.</p>";
}
async function openOrder(product){
  const phone=prompt("Tik jou kontaknommer in:");
  if(!phone || !phone.trim()) return;
  const user=await getUser();
  const {data:profile}=await sb.from("profiles").select("full_name,email").eq("id",user.id).maybeSingle();
  const name=profile?.full_name || user.user_metadata?.full_name || "";
  const email=user.email || "";
  const {error}=await sb.from("orders").insert({customer_id:user.id,customer_name:name,customer_email:email,
    customer_phone:phone.trim(),product_id:product.id,product_name:product.name,price:product.price,status:"pending"});
  if(error){alert("Kon nie bestel nie: "+error.message);return}
  // The server-side email function is configured separately; never expose email API secrets in the browser.
  try{await sb.functions.invoke("send-order-email",{body:{customer_name:name,customer_email:email,product_name:product.name}})}catch(e){console.warn(e)}
  alert("Jou bestelling is ontvang! WebWinkel sal jou so gou moontlik kontak.");
}
async function loadSettings(user){
  const {data}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
  const f=$("#profileForm"); if(!f)return;
  f.full_name.value=data?.full_name||user.user_metadata?.full_name||"";
  f.phone.value=data?.phone||"";
  f.email.value=user.email||"";
  f.addEventListener("submit",async e=>{
    e.preventDefault();
    const {error}=await sb.from("profiles").upsert({id:user.id,full_name:f.full_name.value.trim(),phone:f.phone.value.trim()});
    if(error)return msg($("#notice"),error.message,true);
    const {error:authError}=await sb.auth.updateUser({email:f.email.value.trim()});
    if(authError)return msg($("#notice"),authError.message,true);
    msg($("#notice"),"Profiel gestoor. E-posverandering kan bevestiging vereis.");
  });
  $("#passwordForm")?.addEventListener("submit",async e=>{
    e.preventDefault(); const p=$("#newPassword").value;
    if(p.length<8)return msg($("#notice"),"Gebruik minstens 8 karakters.",true);
    const {error}=await sb.auth.updateUser({password:p});
    if(error)return msg($("#notice"),error.message,true);
    e.currentTarget.reset(); msg($("#notice"),"Wagwoord suksesvol verander.");
  });
}
