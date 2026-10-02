// Menu mobile
const menu = document.getElementById("menu");
const toggle = document.getElementById("menuToggle");

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.classList.toggle("active", open);
  toggle.setAttribute("aria-expanded", open);
});

menu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded", false);
  })
);

// Fundo do menu ao rolar
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
});

// Animação de entrada das seções
const revealEls = document.querySelectorAll(
  ".section-head, .card, .steps-list li, .testimonial, .about-grid > *, .cta-box, details, .contact-grid > *"
);
revealEls.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el) => observer.observe(el));

// Formulário → abre conversa no WhatsApp
const WHATSAPP = "5511900000000";
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const msg =
    `Olá, Ale! Meu nome é ${data.get("nome")}. ` +
    `Tenho interesse em treino ${data.get("formato").toLowerCase()} ` +
    `com objetivo de ${data.get("objetivo").toLowerCase()}. ` +
    `Meu WhatsApp: ${data.get("telefone")}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
});

// Ano do rodapé
document.getElementById("year").textContent = new Date().getFullYear();
