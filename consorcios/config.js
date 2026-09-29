// Configurações da página. Veja o README.md para saber como obter o link da planilha.
window.CONFIG = {
  // Link CSV da planilha no Google Drive. Aceita:
  //  - link "Publicar na Web" em CSV: https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv
  //  - link de compartilhamento comum: https://docs.google.com/spreadsheets/d/ID/edit#gid=0
  //    (convertido automaticamente para exportação CSV)
  // Deixe vazio para usar o arquivo de exemplo local (dados-exemplo.csv).
  PLANILHA_URL: "",

  // Número do WhatsApp para reservas (DDI + DDD + número, só dígitos).
  WHATSAPP: "5511999999999",

  // Recarregar os dados automaticamente a cada N minutos (0 = desligado).
  ATUALIZAR_MINUTOS: 5,
};
