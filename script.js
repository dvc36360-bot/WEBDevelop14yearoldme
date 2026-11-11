
document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(opened));
      menuButton.textContent = opened ? "Close ✕" : "Menu ☰";
    });
  }

  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[data-page]").forEach(link => {
    if (link.dataset.page === current) link.classList.add("active");
  });

  document.querySelectorAll(".faq-q").forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      item.classList.toggle("open");
      button.setAttribute("aria-expanded", String(item.classList.contains("open")));
    });
  });

  const config = window.WEBWINKEL_CONFIG || {};
  document.querySelectorAll("[data-whatsapp]").forEach(link => {
    const number = (config.whatsappNumber || "").replace(/\D/g, "");
    if (number) {
      const message = encodeURIComponent("Hello WebWinkel, I would like to enquire about a website.");
      link.href = `https://wa.me/${number}?text=${message}`;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
  });

  const serviceSelect = document.querySelector("#service");
  if (serviceSelect) {
    const requestedService = new URLSearchParams(location.search).get("service");
    if (requestedService) {
      const match = Array.from(serviceSelect.options).find(option => option.text === requestedService);
      if (match) serviceSelect.value = match.value;
    }
  }

  const form = document.querySelector("#quote-form");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const message = [
        "WebWinkel website enquiry",
        `Name: ${data.get("name")}`,
        `Business: ${data.get("business") || "Not provided"}`,
        `Email: ${data.get("email")}`,
        `Service: ${data.get("service")}`,
        `Message: ${data.get("message")}`
      ].join("\n");
      const number = (config.whatsappNumber || "").replace(/\D/g, "");
      const email = (config.contactEmail || "").trim();
      if (number) {
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
        form.reset();
      } else if (email) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent("Website enquiry - WebWinkel")}&body=${encodeURIComponent(message)}`;
        form.reset();
      } else {
        const preview = document.querySelector("#form-feedback");
        preview.textContent = "Your message is ready, but WebWinkel's approved business WhatsApp number or email still needs to be added in config.js. You can copy the message below.";
        preview.classList.remove("hidden");
        const output = document.querySelector("#message-preview");
        output.value = message;
        output.classList.remove("hidden");
        const copyButton = document.querySelector("#copy-message");
        if (copyButton) copyButton.classList.remove("hidden");
      }
    });
  }

  const copyButton = document.querySelector("#copy-message");
  if (copyButton) copyButton.addEventListener("click", async () => {
    const output = document.querySelector("#message-preview");
    try {
      await navigator.clipboard.writeText(output.value);
      copyButton.textContent = "Copied!";
    } catch {
      output.select();
      document.execCommand("copy");
      copyButton.textContent = "Copied!";
    }
  });

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});
