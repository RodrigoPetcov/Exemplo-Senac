// Tabela de cartas (páginas de imóveis e veículos).
// A categoria vem de <body data-categoria="imoveis">.
(function () {
  const cfg = window.CONFIG;
  const { carregar, disponivel, linkReserva, brl, norm, esc } = window.Cartas;
  const categoria = document.body.dataset.categoria;

  let cartas = [];
  const selecionadas = new Set();
  let ordem = { col: "credito", dir: 1 };

  const $ = (id) => document.getElementById(id);
  const tbody = document.querySelector("#tabela tbody");

  // Filtros podem vir na URL, ex.: imoveis.html?max=200000 (usado pelo simulador da home)
  const params = new URLSearchParams(location.search);
  if (params.get("min")) $("creditoMin").value = params.get("min");
  if (params.get("max")) $("creditoMax").value = params.get("max");

  function atualizar() {
    carregar(categoria)
      .then((lista) => {
        cartas = lista;
        preencherAdministradoras();
        render();
      })
      .catch((err) => {
        $("status").textContent =
          "Não foi possível carregar a planilha. Verifique se ela está compartilhada/publicada (veja o README).";
        console.error(err);
      });
  }

  function preencherAdministradoras() {
    const sel = $("filtroAdm");
    const atual = sel.value;
    const adms = [...new Set(cartas.map((c) => c.administradora).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Todas</option>' + adms.map((a) => `<option>${esc(a)}</option>`).join("");
    sel.value = adms.includes(atual) ? atual : "";
  }

  function filtradas() {
    const busca = norm($("busca").value);
    const adm = $("filtroAdm").value;
    const cMin = parseFloat($("creditoMin").value) || 0;
    const cMax = parseFloat($("creditoMax").value) || Infinity;
    const eMax = parseFloat($("entradaMax").value) || Infinity;
    const soDisp = $("soDisponiveis").checked;

    return cartas
      .filter((c) =>
        (!busca || norm(c.codigo + c.administradora).includes(busca)) &&
        (!adm || c.administradora === adm) &&
        c.credito >= cMin && c.credito <= cMax &&
        c.entrada <= eMax &&
        (!soDisp || disponivel(c)))
      .sort((a, b) => {
        const col = ordem.col === "parcelas" ? "valorParcela" : ordem.col;
        const va = a[col], vb = b[col];
        const r = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR", { numeric: true });
        return r * ordem.dir;
      });
  }

  function render() {
    const lista = filtradas();
    $("status").textContent = `${lista.length} carta(s) encontrada(s) de ${cartas.length}.`;

    tbody.innerHTML = lista.map((c) => {
      const disp = disponivel(c);
      const marcada = selecionadas.has(c.codigo) ? "checked" : "";
      const classeStatus = disp ? "ok" : norm(c.status).startsWith("reserv") ? "res" : "off";
      return `<tr class="${disp ? "" : "indisp"}">
        <td data-label="Selecionar"><input type="checkbox" data-cod="${esc(c.codigo)}" ${marcada} ${disp ? "" : "disabled"} aria-label="Selecionar carta ${esc(c.codigo)}"></td>
        <td data-label="Código"><strong>${esc(c.codigo)}</strong></td>
        <td data-label="Administradora">${esc(c.administradora)}</td>
        <td data-label="Crédito" class="num destaque">${brl.format(c.credito)}</td>
        <td data-label="Entrada" class="num">${brl.format(c.entrada)}</td>
        <td data-label="Parcelas" class="num">${c.qtdParcelas}x ${brl.format(c.valorParcela)}</td>
        <td data-label="Saldo devedor" class="num">${brl.format(c.saldo)}</td>
        <td data-label="Vencimento" class="num">${esc(c.vencimento)}</td>
        <td data-label="Status"><span class="tag ${classeStatus}">${esc(c.status)}</span></td>
        <td>${disp ? `<a class="btn btn-sm" target="_blank" rel="noopener" href="${linkReserva([c])}">Reservar</a>` : ""}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="10" class="vazio">Nenhuma carta encontrada com esses filtros.</td></tr>`;

    document.querySelectorAll("th[data-col]").forEach((th) => {
      th.classList.toggle("asc", th.dataset.col === ordem.col && ordem.dir === 1);
      th.classList.toggle("desc", th.dataset.col === ordem.col && ordem.dir === -1);
    });
    atualizarResumo();
  }

  function atualizarResumo() {
    const sel = cartas.filter((c) => selecionadas.has(c.codigo));
    $("resumo").hidden = sel.length === 0;
    document.body.classList.toggle("com-resumo", sel.length > 0);
    const soma = (k) => sel.reduce((t, c) => t + c[k], 0);
    $("sQtd").textContent = sel.length;
    $("sCredito").textContent = brl.format(soma("credito"));
    $("sEntrada").textContent = brl.format(soma("entrada"));
    $("sParcela").textContent = brl.format(soma("valorParcela"));
    $("btnReservarSel").href = linkReserva(sel);
  }

  ["busca", "filtroAdm", "creditoMin", "creditoMax", "entradaMax", "soDisponiveis"].forEach((id) =>
    $(id).addEventListener("input", render));

  document.querySelectorAll("th[data-col]").forEach((th) =>
    th.addEventListener("click", () => {
      ordem = { col: th.dataset.col, dir: ordem.col === th.dataset.col ? -ordem.dir : 1 };
      render();
    }));

  tbody.addEventListener("change", (e) => {
    const cod = e.target.dataset.cod;
    if (cod === undefined) return;
    e.target.checked ? selecionadas.add(cod) : selecionadas.delete(cod);
    atualizarResumo();
  });

  atualizar();
  if (cfg.ATUALIZAR_MINUTOS > 0) setInterval(atualizar, cfg.ATUALIZAR_MINUTOS * 60000);
})();
