// Página inicial: cartas em destaque e simulador rápido.
(function () {
  const { carregar, disponivel, linkReserva, brl, esc } = window.Cartas;

  function cartao(c) {
    return `<article class="card-carta">
      <div class="card-topo">
        <span class="tag ok">Imóvel</span>
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
  carregar("imoveis")
    .then((imoveis) => {
      alvo.innerHTML = imoveis.filter(disponivel)
        .sort((a, b) => a.entrada / a.credito - b.entrada / b.credito)
        .slice(0, 6).map(cartao).join("") || "<p>Nenhuma carta disponível no momento.</p>";
    })
    .catch(() => (alvo.innerHTML = "<p>Não foi possível carregar as cartas agora.</p>"));

  // Simulador: leva para a página da categoria já filtrada pelo valor
  document.getElementById("simulador").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const valor = parseFloat(f.valor.value) || 0;
    const qs = valor ? `?min=${Math.round(valor * 0.8)}&max=${Math.round(valor * 1.2)}` : "";
    location.href = `imoveis.html${qs}`;
  });
})();
