(function () {
  const cfg = window.CONFIG || {};
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  let cartas = [];
  const selecionadas = new Set();
  let ordem = { col: "credito", dir: 1 };

  const $ = (id) => document.getElementById(id);
  const tbody = document.querySelector("#tabela tbody");

  // ---------- Leitura da planilha ----------

  // Converte links do Google Sheets em link de exportação CSV.
  function urlCsv(url) {
    if (!url) return "dados-exemplo.csv";
    if (/output=csv|format=csv|tqx=out:csv/.test(url)) return url;
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m && m[1] !== "e") {
      const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
      return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
    }
    return url;
  }

  // Remove acentos/espaços para casar cabeçalhos com variações de nome.
  const norm = (s) =>
    String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const COLUNAS = {
    codigo: ["codigo", "cod", "id", "carta"],
    administradora: ["administradora", "adm", "empresa"],
    tipo: ["tipo", "segmento", "categoria"],
    credito: ["credito", "valorcredito", "valordocredito", "carta credito"],
    entrada: ["entrada", "valorentrada", "agio"],
    qtdParcelas: ["qtdparcelas", "parcelas", "nparcelas", "quantidadeparcelas", "prazo"],
    valorParcela: ["valorparcela", "valordaparcela", "parcela"],
    saldo: ["saldodevedor", "saldo"],
    vencimento: ["vencimento", "diavencimento", "venc"],
    status: ["status", "situacao"],
  };

  // Aceita "R$ 1.234,56", "1234,56", "1234.56" ou número.
  function numero(v) {
    if (typeof v === "number") return v;
    let s = String(v || "").replace(/[^\d,.-]/g, "");
    if (!s) return 0;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function mapearLinhas(linhas) {
    if (!linhas.length) return [];
    const cabecalhos = Object.keys(linhas[0]);
    const mapa = {};
    for (const [campo, nomes] of Object.entries(COLUNAS)) {
      const alvos = nomes.map(norm);
      mapa[campo] = cabecalhos.find((h) => alvos.includes(norm(h)));
    }
    const pega = (l, campo) => (mapa[campo] ? String(l[mapa[campo]] ?? "").trim() : "");

    return linhas
      .map((l) => {
        const qtd = parseInt(pega(l, "qtdParcelas"), 10) || 0;
        const valorParcela = numero(pega(l, "valorParcela"));
        const saldoInformado = numero(pega(l, "saldo"));
        return {
          codigo: pega(l, "codigo"),
          administradora: pega(l, "administradora"),
          tipo: pega(l, "tipo"),
          credito: numero(pega(l, "credito")),
          entrada: numero(pega(l, "entrada")),
          qtdParcelas: qtd,
          valorParcela,
          saldo: saldoInformado || qtd * valorParcela,
          vencimento: pega(l, "vencimento"),
          status: pega(l, "status") || "Disponível",
        };
      })
      .filter((c) => c.codigo || c.credito);
  }

  function carregar() {
    const url = urlCsv(cfg.PLANILHA_URL);
    // Parâmetro extra evita cache do navegador ao recarregar.
    const sep = url.includes("?") ? "&" : "?";
    Papa.parse(`${url}${sep}_=${Date.now()}`, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(res) {
        cartas = mapearLinhas(res.data);
        preencherAdministradoras();
        render();
      },
      error(err) {
        $("status").textContent =
          "Não foi possível carregar a planilha. Verifique se ela está compartilhada/publicada (veja o README).";
        console.error(err);
      },
    });
  }

  // ---------- Filtros, ordenação e renderização ----------

  function preencherAdministradoras() {
    const sel = $("filtroAdm");
    const atual = sel.value;
    const adms = [...new Set(cartas.map((c) => c.administradora).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Todas</option>' +
      adms.map((a) => `<option>${esc(a)}</option>`).join("");
    sel.value = adms.includes(atual) ? atual : "";
  }

  const disponivel = (c) => norm(c.status).startsWith("disponivel");

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

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function linkWhats(lista) {
    const linhas = lista.map((c) =>
      `• Carta ${c.codigo} – ${c.administradora} – Crédito ${brl.format(c.credito)} – Entrada ${brl.format(c.entrada)}`);
    const msg = `Olá! Tenho interesse em reservar:\n${linhas.join("\n")}`;
    return `https://wa.me/${cfg.WHATSAPP}?text=${encodeURIComponent(msg)}`;
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
        <td>${disp ? `<a class="btn btn-sm" target="_blank" rel="noopener" href="${linkWhats([c])}">Reservar</a>` : ""}</td>
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
    const soma = (k) => sel.reduce((t, c) => t + c[k], 0);
    $("sQtd").textContent = sel.length;
    $("sCredito").textContent = brl.format(soma("credito"));
    $("sEntrada").textContent = brl.format(soma("entrada"));
    $("sParcela").textContent = brl.format(soma("valorParcela"));
    $("btnReservarSel").href = linkWhats(sel);
  }

  // ---------- Eventos ----------

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

  carregar();
  if (cfg.ATUALIZAR_MINUTOS > 0) setInterval(carregar, cfg.ATUALIZAR_MINUTOS * 60000);
})();
