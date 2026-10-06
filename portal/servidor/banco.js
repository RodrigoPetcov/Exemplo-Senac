// Banco de dados SQLite das cartas (usa o SQLite embutido no Node 22+).
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

const STATUS = ["Disponível", "Reservada", "Vendida"];
const CATEGORIAS = ["imoveis", "veiculos"];

// Campos editáveis: [nome na API, coluna no banco, tipo]
const CAMPOS = [
  ["codigo", "codigo", "texto"],
  ["administradora", "administradora", "texto"],
  ["tipo", "tipo", "texto"],
  ["credito", "credito", "numero"],
  ["entrada", "entrada", "numero"],
  ["qtdParcelas", "qtd_parcelas", "inteiro"],
  ["valorParcela", "valor_parcela", "numero"],
  ["saldo", "saldo", "numero"],
  ["vencimento", "vencimento", "texto"],
  ["status", "status", "texto"],
];

function abrir(arquivo) {
  const db = new DatabaseSync(arquivo);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cartas (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria      TEXT    NOT NULL,
      codigo         TEXT    NOT NULL,
      administradora TEXT    NOT NULL DEFAULT '',
      tipo           TEXT    NOT NULL DEFAULT '',
      credito        REAL    NOT NULL DEFAULT 0,
      entrada        REAL    NOT NULL DEFAULT 0,
      qtd_parcelas   INTEGER NOT NULL DEFAULT 0,
      valor_parcela  REAL    NOT NULL DEFAULT 0,
      saldo          REAL    NOT NULL DEFAULT 0,
      vencimento     TEXT    NOT NULL DEFAULT '',
      status         TEXT    NOT NULL DEFAULT 'Disponível',
      atualizado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS cartas_codigo ON cartas (categoria, codigo);
  `);
  return db;
}

const paraApi = (l) => ({
  id: l.id,
  codigo: l.codigo,
  administradora: l.administradora,
  tipo: l.tipo,
  credito: l.credito,
  entrada: l.entrada,
  qtdParcelas: l.qtd_parcelas,
  valorParcela: l.valor_parcela,
  saldo: l.saldo, // 0 = calcular como parcelas × valor
  vencimento: l.vencimento,
  status: l.status,
});

function listar(db, categoria) {
  return db.prepare("SELECT * FROM cartas WHERE categoria = ? ORDER BY credito").all(categoria).map(paraApi);
}

// Valida e normaliza uma carta vinda do navegador. Lança Error com mensagem amigável.
function validar(c, posicao) {
  if (!c || typeof c !== "object") throw new Error(`Registro ${posicao} inválido.`);
  const out = {};
  for (const [campo, , tipo] of CAMPOS) {
    const v = c[campo];
    if (tipo === "texto") {
      out[campo] = String(v ?? "").trim().slice(0, 100);
    } else {
      const n = Number(v ?? 0);
      if (!Number.isFinite(n) || n < 0) throw new Error(`Registro ${posicao}: valor inválido em "${campo}".`);
      out[campo] = tipo === "inteiro" ? Math.round(n) : Math.round(n * 100) / 100;
    }
  }
  if (!out.codigo) throw new Error(`Registro ${posicao}: o código é obrigatório.`);
  if (!out.status) out.status = "Disponível";
  if (!STATUS.includes(out.status)) throw new Error(`Registro ${posicao}: status deve ser ${STATUS.join(", ")}.`);
  return out;
}

// Aplica inserções, alterações e remoções de uma vez (tudo ou nada).
function salvarLote(db, categoria, { inserir = [], atualizar = [], remover = [] }) {
  const cols = CAMPOS.map(([, col]) => col);
  const ins = db.prepare(
    `INSERT INTO cartas (categoria, ${cols.join(", ")}) VALUES (?, ${cols.map(() => "?").join(", ")})`);
  const upd = db.prepare(
    `UPDATE cartas SET ${cols.map((c) => `${c} = ?`).join(", ")}, atualizado_em = datetime('now')
     WHERE id = ? AND categoria = ?`);
  const del = db.prepare("DELETE FROM cartas WHERE id = ? AND categoria = ?");
  const valores = (c) => CAMPOS.map(([campo]) => c[campo]);

  const novos = inserir.map((c, i) => validar(c, `novo ${i + 1}`));
  const alterados = atualizar.map((c, i) => {
    const id = Number(c && c.id);
    if (!Number.isInteger(id)) throw new Error(`Registro alterado ${i + 1} sem id.`);
    return { id, ...validar(c, `código ${c.codigo || i + 1}`) };
  });
  const removidos = remover.map(Number).filter(Number.isInteger);

  db.exec("BEGIN");
  try {
    // Remove primeiro para permitir reaproveitar o código de uma carta excluída.
    for (const id of removidos) del.run(id, categoria);
    for (const c of alterados) {
      if (upd.run(...valores(c), c.id, categoria).changes === 0)
        throw new Error(`A carta ${c.codigo} não existe mais. Recarregue a página.`);
    }
    for (const c of novos) ins.run(categoria, ...valores(c));
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    if (/UNIQUE/.test(e.message)) throw new Error("Existem duas cartas com o mesmo código.");
    throw e;
  }
  return listar(db, categoria);
}

// ---------- Importação de CSV (planilha exportada) ----------

function lerCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === ",") { linha.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some((x) => x.trim())) linhas.push(linha);
      linha = [];
    } else campo += ch;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim())) linhas.push(linha);
  return linhas;
}

const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const NOMES = {
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

function numeroBr(v) {
  let s = String(v || "").replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
  return parseFloat(s) || 0;
}

function cartasDoCsv(texto) {
  const [cab, ...linhas] = lerCsv(texto.replace(/^﻿/, ""));
  if (!cab) return [];
  const indice = {};
  for (const [campo, nomes] of Object.entries(NOMES)) indice[campo] = cab.findIndex((h) => nomes.includes(norm(h)));
  const pega = (l, campo) => (indice[campo] >= 0 ? (l[indice[campo]] || "").trim() : "");
  const statusOk = (s) => STATUS.find((x) => norm(x) === norm(s)) || "Disponível";
  return linhas.map((l) => ({
    codigo: pega(l, "codigo"),
    administradora: pega(l, "administradora"),
    tipo: pega(l, "tipo"),
    credito: numeroBr(pega(l, "credito")),
    entrada: numeroBr(pega(l, "entrada")),
    qtdParcelas: parseInt(pega(l, "qtdParcelas"), 10) || 0,
    valorParcela: numeroBr(pega(l, "valorParcela")),
    saldo: numeroBr(pega(l, "saldo")),
    vencimento: pega(l, "vencimento"),
    status: statusOk(pega(l, "status")),
  })).filter((c) => c.codigo);
}

// Na primeira execução, preenche o banco vazio com a planilha de exemplo.
function popularSeVazio(db, categoria, arquivoCsv) {
  const { n } = db.prepare("SELECT COUNT(*) n FROM cartas WHERE categoria = ?").get(categoria);
  if (n > 0 || !fs.existsSync(arquivoCsv)) return 0;
  const cartas = cartasDoCsv(fs.readFileSync(arquivoCsv, "utf8"));
  salvarLote(db, categoria, { inserir: cartas });
  return cartas.length;
}

module.exports = {
  abrir, listar, salvarLote, validar, cartasDoCsv, popularSeVazio, STATUS, CATEGORIAS,
  ARQUIVO_PADRAO: path.join(__dirname, "cartas.db"),
};
