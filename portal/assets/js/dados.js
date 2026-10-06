// Leitura das cartas no banco de dados e utilitários compartilhados entre as páginas.
window.Cartas = (function () {
  const cfg = window.CONFIG;
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // Remove acentos/espaços para comparar textos.
  const norm = (s) =>
    String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  const urlApi = (rota) => `${cfg.API_URL || ""}${rota}`;

  // Lê as cartas do banco de dados do servidor.
  async function carregar(categoria) {
    const res = await fetch(urlApi(`/api/cartas?categoria=${categoria}`), { cache: "no-store" });
    if (!res.ok) throw new Error(`Servidor respondeu ${res.status}`);
    const lista = await res.json();
    // Saldo 0 no banco = calcular como parcelas × valor da parcela.
    return lista.map((c) => ({ ...c, saldo: c.saldo || c.qtdParcelas * c.valorParcela }));
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

  return { carregar, disponivel, linkWhats, linkReserva, brl, norm, esc, urlApi };
})();
