// Modo de edição da tabela: pede a senha, permite inserir, alterar e remover
// cartas e salva tudo no banco de dados de uma vez.
(function () {
  const { urlApi, esc } = window.Cartas;
  const categoria = document.body.dataset.categoria;
  const STATUS = ["Disponível", "Reservada", "Vendida"];
  const CHAVE_TOKEN = "tokenEdicao";

  const $ = (id) => document.getElementById(id);
  const dlg = $("dlgSenha");
  const tbody = document.querySelector("#tabelaEditor tbody");

  let linhas = [];            // cópia editável das cartas
  const removidos = new Set(); // ids removidos ainda não salvos
  let proximoTemp = 1;        // id provisório das cartas novas

  const token = {
    ler: () => { try { return sessionStorage.getItem(CHAVE_TOKEN); } catch { return null; } },
    gravar: (t) => { try { sessionStorage.setItem(CHAVE_TOKEN, t); } catch {} },
    apagar: () => { try { sessionStorage.removeItem(CHAVE_TOKEN); } catch {} },
  };
  let tokenMemoria = token.ler();

  // ---------- Senha ----------

  function pedirSenha() {
    $("senhaErro").textContent = "";
    $("formSenha").reset();
    dlg.showModal();
    $("campoSenha").focus();
  }

  $("formSenha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = e.submitter || e.target.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
      const res = await fetch(urlApi("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: $("campoSenha").value }),
      });
      const corpo = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(corpo.erro || "Não foi possível validar a senha.");
      tokenMemoria = corpo.token;
      token.gravar(corpo.token);
      dlg.close();
      if (!$("editor").hidden) salvar(); // a sessão tinha expirado durante um salvamento
      else abrirEditor();
    } catch (err) {
      $("senhaErro").textContent = err.message === "Failed to fetch"
        ? "Servidor indisponível. O site precisa estar rodando pelo servidor (npm start)."
        : err.message;
      $("campoSenha").select();
    } finally {
      botao.disabled = false;
    }
  });
  $("btnCancelarSenha").addEventListener("click", () => dlg.close());

  // ---------- Editor ----------

  async function abrirEditor() {
    try {
      const res = await fetch(urlApi(`/api/cartas?categoria=${categoria}`), { cache: "no-store" });
      if (!res.ok) throw new Error();
      carregarLinhas(await res.json());
    } catch {
      return alert("Não foi possível carregar as cartas do banco de dados.");
    }
    $("areaPublica").hidden = true;
    $("editor").hidden = false;
    document.body.classList.add("editando");
    $("editor").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function carregarLinhas(lista) {
    linhas = lista.map((c) => ({ ...c, _original: JSON.stringify(c) }));
    removidos.clear();
    render();
  }

  const alterada = (l) => l._novo || JSON.stringify(semControle(l)) !== l._original;
  const semControle = ({ _original, _novo, _temp, ...c }) => c;
  const pendencias = () => linhas.filter(alterada).length + removidos.size;

  function campo(l, nome, tipo = "text", extra = "") {
    // Saldo 0 = calculado automaticamente (parcelas × valor), então mostra o campo vazio.
    const valor = nome === "saldo" && !l.saldo ? "" : l[nome] ?? "";
    return `<input type="${tipo}" data-campo="${nome}" value="${esc(valor)}" ${extra}>`;
  }

  function render() {
    tbody.innerHTML = linhas.map((l) => {
      const chave = l.id ?? `t${l._temp}`;
      return `<tr data-chave="${chave}" class="${l._novo ? "nova" : alterada(l) ? "alterada" : ""}">
        <td data-label="Código">${campo(l, "codigo", "text", 'required maxlength="100"')}</td>
        <td data-label="Administradora">${campo(l, "administradora", "text", 'maxlength="100"')}</td>
        <td data-label="Crédito (R$)">${campo(l, "credito", "number", 'min="0" step="0.01"')}</td>
        <td data-label="Entrada (R$)">${campo(l, "entrada", "number", 'min="0" step="0.01"')}</td>
        <td data-label="Qtd parcelas">${campo(l, "qtdParcelas", "number", 'min="0" step="1"')}</td>
        <td data-label="Valor parcela (R$)">${campo(l, "valorParcela", "number", 'min="0" step="0.01"')}</td>
        <td data-label="Saldo devedor (R$)">${campo(l, "saldo", "number", 'min="0" step="0.01" placeholder="auto"')}</td>
        <td data-label="Vencimento">${campo(l, "vencimento", "text", 'maxlength="20"')}</td>
        <td data-label="Status"><select data-campo="status">${STATUS.map((s) =>
          `<option${s === l.status ? " selected" : ""}>${s}</option>`).join("")}</select></td>
        <td><button type="button" class="btn-remover" title="Remover carta" aria-label="Remover carta ${esc(l.codigo)}">Remover</button></td>
      </tr>`;
    }).join("") || `<tr><td colspan="10" class="vazio">Nenhuma carta. Clique em "Adicionar carta".</td></tr>`;
    atualizarBarra();
  }

  function atualizarBarra() {
    const n = pendencias();
    $("btnSalvar").disabled = n === 0;
    $("btnSalvar").textContent = n ? `Salvar alterações (${n})` : "Salvar alterações";
    $("btnDescartar").disabled = n === 0;
    $("editorTotal").textContent = `${linhas.length} carta(s) no banco${removidos.size ? `, ${removidos.size} a remover` : ""}.`;
  }

  const linhaDe = (tr) => linhas.find((l) => String(l.id ?? `t${l._temp}`) === tr.dataset.chave);

  tbody.addEventListener("input", (e) => {
    const tr = e.target.closest("tr");
    const l = tr && linhaDe(tr);
    if (!l || !e.target.dataset.campo) return;
    const nome = e.target.dataset.campo;
    l[nome] = e.target.type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value;
    tr.className = l._novo ? "nova" : alterada(l) ? "alterada" : "";
    atualizarBarra();
  });

  tbody.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-remover")) return;
    const l = linhaDe(e.target.closest("tr"));
    if (!confirm(`Remover a carta ${l.codigo || "(sem código)"}? Ela só será apagada do banco ao clicar em "Salvar alterações".`)) return;
    if (l.id) removidos.add(l.id);
    linhas = linhas.filter((x) => x !== l);
    render();
  });

  $("btnAdicionar").addEventListener("click", () => {
    linhas.unshift({
      _novo: true, _temp: proximoTemp++, codigo: "", administradora: "", tipo: categoria === "imoveis" ? "Imóvel" : "Veículo",
      credito: 0, entrada: 0, qtdParcelas: 0, valorParcela: 0, saldo: 0, vencimento: "", status: "Disponível",
    });
    render();
    tbody.querySelector("input").focus();
  });

  async function salvar() {
    const vazio = linhas.find((l) => !String(l.codigo).trim());
    if (vazio) return mensagem("Preencha o código de todas as cartas antes de salvar.", true);

    const lote = {
      inserir: linhas.filter((l) => l._novo).map(semControle),
      atualizar: linhas.filter((l) => !l._novo && alterada(l)).map(semControle),
      remover: [...removidos],
    };
    $("btnSalvar").disabled = true;
    mensagem("Salvando…");
    try {
      const res = await fetch(urlApi(`/api/cartas?categoria=${categoria}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenMemoria || ""}` },
        body: JSON.stringify(lote),
      });
      const corpo = await res.json().catch(() => ({}));
      if (res.status === 401) {
        token.apagar();
        mensagem("Sua sessão de edição expirou. Digite a senha para salvar.", true);
        return pedirSenha();
      }
      if (!res.ok) throw new Error(corpo.erro || "Erro ao salvar.");
      carregarLinhas(corpo);
      mensagem("Alterações salvas no banco de dados.");
      window.TabelaCartas && window.TabelaCartas.recarregar();
    } catch (err) {
      mensagem(err.message === "Failed to fetch" ? "Servidor indisponível. Tente novamente." : err.message, true);
      atualizarBarra();
    }
  }

  function mensagem(texto, erro = false) {
    const el = $("editorMsg");
    el.textContent = texto;
    el.classList.toggle("erro", erro);
  }

  function sairEditor() {
    if (pendencias() && !confirm("Existem alterações não salvas. Sair mesmo assim?")) return;
    fetch(urlApi("/api/sair"), { method: "POST", headers: { Authorization: `Bearer ${tokenMemoria || ""}` } }).catch(() => {});
    tokenMemoria = null;
    token.apagar();
    linhas = [];
    removidos.clear();
    mensagem("");
    $("editor").hidden = true;
    $("areaPublica").hidden = false;
    document.body.classList.remove("editando");
  }

  $("btnSalvar").addEventListener("click", salvar);
  $("btnSair").addEventListener("click", sairEditor);
  $("btnDescartar").addEventListener("click", () => {
    if (confirm("Descartar todas as alterações não salvas?")) { abrirEditor(); mensagem(""); }
  });
  $("btnEditar").addEventListener("click", () => (tokenMemoria ? abrirEditor() : pedirSenha()));

  window.addEventListener("beforeunload", (e) => {
    if (!$("editor").hidden && pendencias()) e.preventDefault();
  });
})();
