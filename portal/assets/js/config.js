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

  // Recarregar as tabelas automaticamente a cada N minutos (0 = desligado)
  ATUALIZAR_MINUTOS: 5,
};
