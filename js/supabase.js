(() => {
  const cfg = window.WEBWINKEL_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY ||
      cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")) {
    console.warn("WebWinkel: voltooi config.js met jou Supabase publishable key.");
    window.sb = null;
    return;
  }
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
})();
