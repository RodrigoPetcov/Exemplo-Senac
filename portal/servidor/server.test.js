const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { criarServidor } = require("./app");

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cartas-"));
let servidor, base;

before(async () => {
  servidor = criarServidor({ senha: "segredo", arquivoBanco: path.join(pasta, "teste.db") });
  await new Promise((r) => servidor.listen(0, r));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => { servidor.close(); fs.rmSync(pasta, { recursive: true, force: true }); });

const req = (rota, opcoes = {}) =>
  fetch(base + rota, { ...opcoes, headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) } });
const login = async (senha = "segredo") => (await req("/api/login", { method: "POST", body: JSON.stringify({ senha }) })).json();
const salvar = (token, lote) =>
  req("/api/cartas?categoria=imoveis", { method: "POST", body: JSON.stringify(lote), headers: { Authorization: `Bearer ${token}` } });

test("banco começa vazio e grava as cartas enviadas", async () => {
  assert.deepStrictEqual(await (await req("/api/cartas?categoria=imoveis")).json(), []);
  const { token } = await login();
  const inserir = ["1001", "1002", "1003"].map((codigo, i) =>
    ({ codigo, administradora: "Adm", credito: 100000 * (i + 1), entrada: 30000, qtdParcelas: 100, valorParcela: 900 }));
  const res = await salvar(token, { inserir });
  assert.strictEqual(res.status, 200);
  const cartas = await (await req("/api/cartas?categoria=imoveis")).json();
  assert.strictEqual(cartas.length, 3);
  assert.strictEqual(cartas.find((c) => c.codigo === "1001").credito, 100000);
});

test("recusa salvar sem senha e com senha errada", async () => {
  assert.strictEqual((await salvar("", { inserir: [] })).status, 401);
  assert.strictEqual((await login("errada")).erro, "Senha incorreta.");
});

test("insere, altera e remove em um lote", async () => {
  const { token } = await login();
  const antes = await (await req("/api/cartas")).json();
  const alvo = antes.find((c) => c.codigo === "1002");
  const removida = antes.find((c) => c.codigo === "1003");

  const res = await salvar(token, {
    inserir: [{ codigo: "9999", administradora: "Nova", credito: 123456.789, entrada: 1000, status: "Disponível" }],
    atualizar: [{ ...alvo, entrada: 50000, status: "Reservada" }],
    remover: [removida.id],
  });
  assert.strictEqual(res.status, 200);
  const depois = await res.json();
  assert.strictEqual(depois.length, 3);
  assert.strictEqual(depois.find((c) => c.codigo === "9999").credito, 123456.79);
  assert.strictEqual(depois.find((c) => c.codigo === "1002").status, "Reservada");
  assert.ok(!depois.some((c) => c.codigo === "1003"));
});

test("rejeita código duplicado sem gravar nada", async () => {
  const { token } = await login();
  const res = await salvar(token, { inserir: [{ codigo: "8888" }, { codigo: "8888" }] });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).erro, /mesmo código/);
  const cartas = await (await req("/api/cartas")).json();
  assert.ok(!cartas.some((c) => c.codigo === "8888"));
});

test("rejeita valores inválidos", async () => {
  const { token } = await login();
  const res = await salvar(token, { inserir: [{ codigo: "7777", credito: -5 }] });
  assert.strictEqual(res.status, 400);
});

test("não entrega arquivos do servidor nem o banco", async () => {
  for (const rota of ["/servidor/server.js", "/servidor/teste.db", "/package.json", "/.env", "/%2e%2e/README.md"])
    assert.strictEqual((await req(rota)).status, 404, rota);
  assert.strictEqual((await req("/imoveis.html")).status, 200);
});

test("bloqueia após muitas senhas erradas", async () => {
  for (let i = 0; i < 5; i++) await login("x");
  const res = await req("/api/login", { method: "POST", body: JSON.stringify({ senha: "segredo" }) });
  assert.strictEqual(res.status, 429);
});

test("sem SENHA_EDICAO o site continua no ar e a edição fica desativada", async () => {
  const outro = criarServidor({ senha: "", arquivoBanco: path.join(pasta, "sem-senha.db") });
  await new Promise((r) => outro.listen(0, r));
  const url = `http://localhost:${outro.address().port}`;
  try {
    assert.strictEqual((await fetch(`${url}/api/cartas`)).status, 200);
    const res = await fetch(`${url}/api/login`, { method: "POST", body: JSON.stringify({ senha: "" }) });
    assert.strictEqual(res.status, 503);
  } finally {
    outro.close();
  }
});

test("/api/status responde para diagnóstico", async () => {
  const st = await (await req("/api/status")).json();
  assert.strictEqual(st.ok, true);
  assert.strictEqual(st.edicaoAtiva, true);
  assert.match(st.node, /^v\d+/);
});
