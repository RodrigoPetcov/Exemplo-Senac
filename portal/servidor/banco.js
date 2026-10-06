// Banco de dados SQLite das cartas (usa o SQLite embutido no Node 22+).
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const STATUS = ["Disponível", "Reservada", "Vendida"];

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

module.exports = {
  abrir, listar, salvarLote, validar, STATUS,
  ARQUIVO_PADRAO: path.join(__dirname, "cartas.db"),
};
