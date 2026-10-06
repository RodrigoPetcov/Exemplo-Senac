// Importa uma planilha (CSV) para o banco, substituindo as cartas da categoria.
// Uso: npm run importar -- caminho/da/planilha.csv [imoveis]
const fs = require("node:fs");
const path = require("node:path");
const banco = require("./banco");

const RAIZ = path.join(__dirname, "..");
if (fs.existsSync(path.join(RAIZ, ".env"))) process.loadEnvFile(path.join(RAIZ, ".env"));

const [arquivo, categoria = "imoveis"] = process.argv.slice(2);
if (!arquivo) {
  console.error("Uso: npm run importar -- caminho/da/planilha.csv [imoveis]");
  process.exit(1);
}

const db = banco.abrir(process.env.BANCO_ARQUIVO || banco.ARQUIVO_PADRAO);
const cartas = banco.cartasDoCsv(fs.readFileSync(arquivo, "utf8"));
const remover = banco.listar(db, categoria).map((c) => c.id);
banco.salvarLote(db, categoria, { remover, inserir: cartas });
console.log(`${cartas.length} cartas importadas para "${categoria}" (${remover.length} removidas).`);
db.close();
