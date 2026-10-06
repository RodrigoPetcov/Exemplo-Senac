// Ponto de entrada do servidor (npm start e hospedagens como a Hostinger).
// Chama listen() sempre, sem "if (require.main === module)", que a Hostinger não suporta.
const fs = require("node:fs");
const path = require("node:path");

// Lê o .env (se existir). Variáveis definidas no painel da hospedagem têm prioridade.
const arquivoEnv = path.join(__dirname, "..", ".env");
if (fs.existsSync(arquivoEnv)) process.loadEnvFile(arquivoEnv);

const banco = require("./banco");
const { criarServidor } = require("./app");

// A hospedagem informa a porta em PORT; PORTA (do .env) vale só para rodar no computador.
const porta = Number(process.env.PORT || process.env.PORTA || 3000);

const servidor = criarServidor({
  senha: process.env.SENHA_EDICAO,
  arquivoBanco: process.env.BANCO_ARQUIVO || banco.ARQUIVO_PADRAO,
  corsOrigem: process.env.CORS_ORIGEM || "",
});

servidor.listen(porta, () => console.log(`Portal no ar na porta ${porta}`));
