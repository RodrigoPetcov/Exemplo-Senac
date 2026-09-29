// Página inicial: cartas em destaque e simulador rápido.
(function () {
  const { carregar, disponivel, linkReserva, brl, esc } = window.Cartas;

  function cartao(c, categoria) {
    return `<article class="card-carta">
      <div class="card-topo">
        <span class="tag ok">${categoria === "imoveis" ? "Imóvel" : "Veículo"}</span>
        <span class="card-cod">Carta ${esc(c.codigo)}</span>
      </div>
      <p class="card-adm">${esc(c.administradora)}</p>
      <p class="card-credito">${brl.format(c.credito)}</p>
      <dl>
        <div><dt>Entrada</dt><dd>${brl.format(c.entrada)}</dd></div>
        <div><dt>Parcelas</dt><dd>${c.qtdParcelas}x ${brl.format(c.valorParcela)}</dd></div>
      </dl>
      <a class="btn" href="${linkReserva([c])}" target="_blank" rel="noopener">Quero esta carta</a>
    </article>`;
  }

  const alvo = document.getElementById("destaques");
  Promise.all([carregar("imoveis"), carregar("veiculos")])
    .then(([imoveis, veiculos]) => {
      const pega = (lista, cat, n) =>
        lista.filter(disponivel).sort((a, b) => a.entrada / a.credito - b.entrada / b.credito)
          .slice(0, n).map((c) => cartao(c, cat));
      alvo.innerHTML = [...pega(imoveis, "imoveis", 4), ...pega(veiculos, "veiculos", 2)].join("") ||
        "<p>Nenhuma carta disponível no momento.</p>";
    })
    .catch(() => (alvo.innerHTML = "<p>Não foi possível carregar as cartas agora.</p>"));

  // Simulador: leva para a página da categoria já filtrada pelo valor
  document.getElementById("simulador").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const valor = parseFloat(f.valor.value) || 0;
    const qs = valor ? `?min=${Math.round(valor * 0.8)}&max=${Math.round(valor * 1.2)}` : "";
    location.href = `${f.categoria.value}.html${qs}`;
  });
})();
