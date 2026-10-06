// Topo, menu, rodapé e botão flutuante do WhatsApp, iguais em todas as páginas.
(function () {
  const cfg = window.CONFIG;
  const { linkWhats, esc } = window.Cartas;

  // [link, nome no rodapé, nome curto no menu do topo]
  const MENU = [
    ["index.html", "Início"],
    ["imoveis.html", "Cartas de Imóveis", "Imóveis"],
    ["como-funciona.html", "Como Funciona"],
    ["venda-sua-carta.html", "Venda sua Carta"],
    ["sobre.html", "Quem Somos"],
    ["contato.html", "Contato"],
  ];

  const atual = location.pathname.split("/").pop() || "index.html";
  const whats = linkWhats(`Olá! Vim pelo site da ${cfg.EMPRESA} e gostaria de mais informações.`);
  const links = MENU.map(([href, nome, curto]) =>
    `<a href="${href}"${href === atual ? ' aria-current="page"' : ""}>${curto || nome}</a>`).join("");

  document.getElementById("site-topo").outerHTML = `
    <div class="barra-contato">
      <div class="container">
        <span>📞 ${esc(cfg.TELEFONE)}</span>
        <span>✉️ ${esc(cfg.EMAIL)}</span>
      </div>
    </div>
    <header class="site-topo">
      <div class="container topo-inner">
        <a class="logo" href="index.html"><span class="logo-icone">🏠</span>${esc(cfg.EMPRESA)}</a>
        <button class="menu-btn" aria-label="Abrir menu" aria-expanded="false">☰</button>
        <nav class="menu">${links}<a class="btn btn-sm" href="${whats}" target="_blank" rel="noopener">Fale conosco</a></nav>
      </div>
    </header>`;

  document.getElementById("site-rodape").outerHTML = `
    <footer class="site-rodape">
      <div class="container rodape-grid">
        <div>
          <p class="logo">${esc(cfg.EMPRESA)}</p>
          <p>${esc(cfg.SLOGAN)}.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          ${MENU.map(([href, nome]) => `<a href="${href}">${nome}</a>`).join("")}
        </div>
        <div>
          <h4>Contato</h4>
          <a href="${whats}" target="_blank" rel="noopener">WhatsApp: ${esc(cfg.TELEFONE)}</a>
          <a href="mailto:${esc(cfg.EMAIL)}">${esc(cfg.EMAIL)}</a>
          <span>${esc(cfg.ENDERECO)}</span>
          <a href="${esc(cfg.INSTAGRAM)}" target="_blank" rel="noopener">Instagram</a>
        </div>
      </div>
      <div class="container rodape-base">
        © ${new Date().getFullYear()} ${esc(cfg.EMPRESA)} – CNPJ ${esc(cfg.CNPJ)}.
        As cartas estão sujeitas à disponibilidade e à aprovação da administradora.
      </div>
    </footer>
    <a class="whats-flutuante" href="${whats}" target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.7-.4z"/></svg>
    </a>`;

  document.querySelector(".menu-btn").addEventListener("click", (e) => {
    const aberto = document.querySelector(".menu").classList.toggle("aberto");
    e.currentTarget.setAttribute("aria-expanded", aberto);
  });

  // Troca {{EMPRESA}} e links [data-whats] no conteúdo de cada página.
  document.querySelectorAll("[data-empresa]").forEach((el) => (el.textContent = cfg.EMPRESA));
  document.querySelectorAll("a[data-whats]").forEach((a) => {
    a.href = linkWhats(a.dataset.whats || `Olá! Vim pelo site da ${cfg.EMPRESA}.`);
    a.target = "_blank";
    a.rel = "noopener";
  });
})();
