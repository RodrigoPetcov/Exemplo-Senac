// Leitura das planilhas e utilitários compartilhados entre as páginas.
window.Cartas = (function () {
  const cfg = window.CONFIG;
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // Remove acentos/espaços para casar cabeçalhos com variações de nome.
  const norm = (s) =>
    String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // Converte links do Google Sheets em link de exportação CSV.
  function urlCsv(categoria) {
    const url = (cfg.PLANILHAS || {})[categoria];
    if (!url) return `dados/${categoria}-exemplo.csv`;
    if (/output=csv|format=csv|tqx=out:csv/.test(url)) return url;
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m && m[1] !== "e") {
      const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
      return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
    }
    return url;
  }

  const COLUNAS = {
    codigo: ["codigo", "cod", "id", "carta"],
    administradora: ["administradora", "adm", "empresa"],
    tipo: ["tipo", "segmento", "categoria"],
    credito: ["credito", "valorcredito", "valordocredito"],
    entrada: ["entrada", "valorentrada", "agio"],
    qtdParcelas: ["qtdparcelas", "parcelas", "nparcelas", "quantidadeparcelas", "prazo"],
    valorParcela: ["valorparcela", "valordaparcela", "parcela"],
    saldo: ["saldodevedor", "saldo"],
    vencimento: ["vencimento", "diavencimento", "venc"],
    status: ["status", "situacao"],
  };

  // Aceita "R$ 1.234,56", "1234,56", "1234.56" ou número.
  function numero(v) {
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
      mapa[campo] = cabecalhos.find((h) => nomes.includes(norm(h)));
    }
    const pega = (l, campo) => (mapa[campo] ? String(l[mapa[campo]] ?? "").trim() : "");

    return linhas
      .map((l) => {
        const qtd = parseInt(pega(l, "qtdParcelas"), 10) || 0;
        const valorParcela = numero(pega(l, "valorParcela"));
        return {
          codigo: pega(l, "codigo"),
          administradora: pega(l, "administradora"),
          tipo: pega(l, "tipo"),
          credito: numero(pega(l, "credito")),
          entrada: numero(pega(l, "entrada")),
          qtdParcelas: qtd,
          valorParcela,
          saldo: numero(pega(l, "saldo")) || qtd * valorParcela,
          vencimento: pega(l, "vencimento"),
          status: pega(l, "status") || "Disponível",
        };
      })
      .filter((c) => c.codigo || c.credito);
  }

  function carregar(categoria) {
    const url = urlCsv(categoria);
    const sep = url.includes("?") ? "&" : "?"; // evita cache do navegador
    return new Promise((resolve, reject) => {
      Papa.parse(`${url}${sep}_=${Date.now()}`, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(mapearLinhas(res.data)),
        error: reject,
      });
    });
  }

  const disponivel = (c) => norm(c.status).startsWith("disponivel");

  function linkWhats(texto) {
    return `https://wa.me/${cfg.WHATSAPP}?text=${encodeURIComponent(texto)}`;
  }

  function linkReserva(lista) {
    const linhas = lista.map((c) =>
      `• Carta ${c.codigo} – ${c.administradora} – Crédito ${brl.format(c.credito)} – Entrada ${brl.format(c.entrada)}`);
    return linkWhats(`Olá! Tenho interesse em reservar:\n${linhas.join("\n")}`);
  }

  return { carregar, disponivel, linkWhats, linkReserva, brl, norm, esc };
})();
