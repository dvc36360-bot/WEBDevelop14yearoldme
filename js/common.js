const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const msg = (el, text, bad=false) => { if(el){el.textContent=text;el.className="notice "+(bad?"error":"success");} };
const getUser = async () => {
  if(!window.sb) throw new Error("Supabase is nog nie ingestel nie. Voltooi config.js.");
  const {data,error}=await sb.auth.getUser(); if(error) throw error; return data.user;
};
const requireUser = async (admin=false) => {
  const user=await getUser();
  if(!user){ location.href=admin?"login.html":"login.html"; return null; }
  if(admin){
    const {data,error}=await sb.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
    if(error || !data){ alert("Hierdie rekening het nie admin-toegang nie."); await sb.auth.signOut(); location.href="login.html"; return null; }
  }
  return user;
};
const signOut = async () => { if(sb) await sb.auth.signOut(); location.href="../index.html"; };
const applyTheme = async () => {
  const saved=localStorage.getItem("ww-theme") || "light";
  document.documentElement.dataset.theme=saved;
  $$("[data-theme-toggle]").forEach(b=>b.addEventListener("click",()=>{
    const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next; localStorage.setItem("ww-theme",next);
  }));
};
document.addEventListener("DOMContentLoaded",applyTheme);

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-menu-toggle]").forEach(button=>{
    button.addEventListener("click",()=>{
      const menu=button.parentElement.querySelector("[data-menu]");
      if(!menu)return;
      const open=menu.classList.toggle("open");
      button.setAttribute("aria-expanded",String(open));
      button.innerHTML=open?"<span></span><span></span><span></span>":"<span></span><span></span><span></span>";
    });
  });
});
