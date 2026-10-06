// Servidor do portal: entrega as páginas e a API da tabela de cartas.
//
//   GET    /api/cartas?categoria=imoveis   lista pública
//   POST   /api/login        { senha }     devolve um token de edição (válido por 2 horas)
//   POST   /api/sair                       encerra o token
//   POST   /api/cartas?categoria=imoveis   { inserir, atualizar, remover }  (exige token)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const banco = require("./banco");

const RAIZ = path.join(__dirname, "..");
if (fs.existsSync(path.join(RAIZ, ".env"))) process.loadEnvFile(path.join(RAIZ, ".env"));

const TOKEN_VALIDADE_MS = 2 * 60 * 60 * 1000;
const MAX_TENTATIVAS = 5;                 // senhas erradas permitidas…
const JANELA_TENTATIVAS_MS = 15 * 60 * 1000; // …a cada 15 minutos, por IP
const CATEGORIAS_BANCO = ["imoveis"];     // categorias de cartas guardadas no banco

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
};
// Pastas e arquivos do projeto que nunca devem ser entregues ao navegador.
const BLOQUEADOS = /^\/(servidor|node_modules)(\/|$)|^\/(package(-lock)?\.json|\.env.*|\.gitignore)$/;

const hash = (s) => crypto.createHash("sha256").update(String(s)).digest();

function criarServidor({ senha, arquivoBanco = banco.ARQUIVO_PADRAO, corsOrigem = "" }) {
  if (!senha) throw new Error("Defina a variável SENHA_EDICAO (veja o README).");
  const hashSenha = hash(senha);
  const db = banco.abrir(arquivoBanco);

  const tokens = new Map();     // token -> expira em (ms)
  const tentativas = new Map(); // ip -> { n, desde }

  function json(res, status, corpo) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(corpo));
  }

  function lerCorpo(req) {
    return new Promise((resolve, reject) => {
      let dados = "";
      req.on("data", (p) => {
        dados += p;
        if (dados.length > 1e6) { reject(new Error("Requisição muito grande.")); req.destroy(); }
      });
      req.on("end", () => {
        try { resolve(dados ? JSON.parse(dados) : {}); } catch { reject(new Error("JSON inválido.")); }
      });
    });
  }

  function autorizado(req) {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const expira = tokens.get(token);
    if (!expira) return false;
    if (expira < Date.now()) { tokens.delete(token); return false; }
    return true;
  }

  function categoriaDe(url) {
    const cat = url.searchParams.get("categoria") || "imoveis";
    return CATEGORIAS_BANCO.includes(cat) ? cat : null;
  }

  async function api(req, res, url) {
    const ip = req.socket.remoteAddress;

    if (url.pathname === "/api/login" && req.method === "POST") {
      const t = tentativas.get(ip);
      if (t && Date.now() - t.desde < JANELA_TENTATIVAS_MS && t.n >= MAX_TENTATIVAS)
        return json(res, 429, { erro: "Muitas tentativas. Aguarde 15 minutos e tente novamente." });
      const { senha: enviada } = await lerCorpo(req);
      if (!crypto.timingSafeEqual(hash(enviada ?? ""), hashSenha)) {
        const atual = t && Date.now() - t.desde < JANELA_TENTATIVAS_MS ? t : { n: 0, desde: Date.now() };
        atual.n++;
        tentativas.set(ip, atual);
        return json(res, 401, { erro: "Senha incorreta." });
      }
      tentativas.delete(ip);
      const token = crypto.randomBytes(32).toString("hex");
      tokens.set(token, Date.now() + TOKEN_VALIDADE_MS);
      return json(res, 200, { token, validadeMinutos: TOKEN_VALIDADE_MS / 60000 });
    }

    if (url.pathname === "/api/sair" && req.method === "POST") {
      tokens.delete((req.headers.authorization || "").replace(/^Bearer /, ""));
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/api/cartas") {
      const cat = categoriaDe(url);
      if (!cat) return json(res, 404, { erro: "Categoria inexistente." });
      if (req.method === "GET") return json(res, 200, banco.listar(db, cat));
      if (req.method === "POST") {
        if (!autorizado(req)) return json(res, 401, { erro: "Sessão de edição expirada. Digite a senha novamente." });
        const lote = await lerCorpo(req);
        try {
          return json(res, 200, banco.salvarLote(db, cat, lote));
        } catch (e) {
          return json(res, 400, { erro: e.message });
        }
      }
    }
    return json(res, 404, { erro: "Rota não encontrada." });
  }

  function arquivoEstatico(req, res, url) {
    let rota = decodeURIComponent(url.pathname);
    if (rota.endsWith("/")) rota += "index.html";
    const arquivo = path.normalize(path.join(RAIZ, rota));
    const tipo = TIPOS[path.extname(arquivo).toLowerCase()];
    if (!arquivo.startsWith(RAIZ + path.sep) || BLOQUEADOS.test(rota) || !tipo) {
      res.writeHead(404); return res.end("Não encontrado");
    }
    fs.readFile(arquivo, (err, conteudo) => {
      if (err) { res.writeHead(404); return res.end("Não encontrado"); }
      res.writeHead(200, { "Content-Type": tipo });
      res.end(conteudo);
    });
  }

  const servidor = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) {
        if (corsOrigem) {
          res.setHeader("Access-Control-Allow-Origin", corsOrigem);
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
        }
        return await api(req, res, url);
      }
      if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
      arquivoEstatico(req, res, url);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) json(res, 400, { erro: e.message || "Erro na requisição." });
    }
  });
  servidor.on("close", () => db.close());
  return servidor;
}

if (require.main === module) {
  const porta = Number(process.env.PORTA || process.env.PORT || 3000);
  const servidor = criarServidor({
    senha: process.env.SENHA_EDICAO,
    arquivoBanco: process.env.BANCO_ARQUIVO || banco.ARQUIVO_PADRAO,
    corsOrigem: process.env.CORS_ORIGEM || "",
  });
  servidor.listen(porta, () => console.log(`Portal no ar em http://localhost:${porta}`));
}

module.exports = { criarServidor };
