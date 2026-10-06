// Configurações do portal. Altere aqui e todas as páginas são atualizadas.
window.CONFIG = {
  // Nome e contatos da empresa (aparecem no topo, no rodapé e nas mensagens)
  EMPRESA: "Sua Marca Consórcios",
  SLOGAN: "Cartas de crédito contempladas com segurança",
  WHATSAPP: "5511999999999",        // DDI + DDD + número, só dígitos
  TELEFONE: "(11) 99999-9999",
  EMAIL: "contato@suamarca.com.br",
  ENDERECO: "Rua Exemplo, 123 – São Paulo/SP",
  CNPJ: "00.000.000/0001-00",
  INSTAGRAM: "https://instagram.com/",

  // Planilhas do Google Drive (uma por categoria). Aceita:
  //  - link "Publicar na Web" em CSV: https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv
  //  - link de compartilhamento comum: https://docs.google.com/spreadsheets/d/ID/edit#gid=0
  // Deixe vazio para usar os arquivos de exemplo da pasta /dados.
  PLANILHAS: {
    imoveis: "",
    veiculos: "",
  },

  // Categorias cujas cartas ficam no banco de dados do servidor (editáveis pelo botão "Editar").
  // As demais continuam lendo a planilha acima. Requer o site rodando pelo servidor (npm start).
  BANCO: ["imoveis"],
  // Endereço do servidor. Deixe vazio quando o site é entregue pelo próprio servidor.
  // Preencha só se as páginas estiverem hospedadas em outro lugar, ex.: "https://api.seusite.com.br"
  API_URL: "",

  // Recarregar as tabelas automaticamente a cada N minutos (0 = desligado)
  ATUALIZAR_MINUTOS: 5,
};
