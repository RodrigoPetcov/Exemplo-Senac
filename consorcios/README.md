# Consórcios Contemplados de Imóveis: tabela alimentada por planilha

Página HTML estática que mostra as cartas contempladas numa tabela. Os dados vêm de uma planilha no Google Drive.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Visual (tabela no computador e cartões no celular) |
| `app.js` | Lê a planilha, filtra, ordena, soma as selecionadas e gera o link do WhatsApp |
| `config.js` | **Onde você configura** o link da planilha e o número do WhatsApp |
| `dados-exemplo.csv` | Dados de exemplo, usados enquanto `PLANILHA_URL` estiver vazio |

## Funcionalidades

- Busca por código ou administradora
- Filtros por administradora, faixa de crédito, entrada máxima e "só disponíveis"
- Ordenação ao clicar no cabeçalho da coluna
- Seleção de várias cartas, com soma do crédito, da entrada e das parcelas
- Botão **Reservar** (por carta ou para as selecionadas), que abre o WhatsApp com a mensagem já preenchida
- Atualização automática a cada N minutos (`ATUALIZAR_MINUTOS`)

## Como ligar a planilha do Google Drive

O navegador não consegue ler um arquivo `.xlsx` direto do Drive porque o Google bloqueia esse acesso (CORS). Por isso a planilha precisa estar no formato **Planilhas Google**:

1. No Drive, abra o arquivo Excel e vá em **Arquivo → Salvar como Planilhas Google**. Continue editando essa versão.
2. Na planilha, vá em **Arquivo → Compartilhar → Publicar na Web**, escolha a aba e o formato **Valores separados por vírgula (.csv)** e clique em **Publicar**.
3. Copie o link gerado (ele termina em `pub?output=csv`) e cole em `config.js`:

   ```js
   PLANILHA_URL: "https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?output=csv",
   ```

   Outra opção: compartilhe a planilha como "Qualquer pessoa com o link: Leitor" e cole o link normal (`.../spreadsheets/d/ID/edit#gid=0`). A página converte esse link sozinha.

4. Coloque seu número em `WHATSAPP` (só dígitos, com DDI e DDD, ex.: `5511987654321`).

Depois disso, toda alteração na planilha aparece no site sozinha. No modo "Publicar na Web", o Google pode levar alguns minutos para refletir a mudança.

## Colunas da planilha

A primeira linha precisa ter os cabeçalhos. Maiúsculas e acentos não importam, e alguns nomes alternativos também funcionam:

| Coluna | Nomes aceitos | Exemplo |
|---|---|---|
| Código | Código, Cod, ID, Carta | 1001 |
| Administradora | Administradora, Adm, Empresa | Porto Seguro |
| Tipo | Tipo, Segmento | Imóvel |
| Crédito | Crédito, Valor Crédito | R$ 150.000,00 |
| Entrada | Entrada, Ágio | R$ 45.000,00 |
| Qtd Parcelas | Qtd Parcelas, Parcelas, Prazo | 120 |
| Valor Parcela | Valor Parcela, Parcela | R$ 1.350,00 |
| Saldo devedor *(opcional)* | Saldo Devedor, Saldo | Se ficar vazio, é calculado como parcelas × valor |
| Vencimento | Vencimento, Dia Vencimento | 10 |
| Status | Status, Situação | Disponível / Reservada / Vendida |

Os valores podem estar como `R$ 1.234,56`, `1234,56` ou como número.

## Como testar no seu computador

Abrir o `index.html` com dois cliques não funciona com o CSV local, porque o navegador bloqueia a leitura de arquivos locais. Suba um servidor simples na pasta:

```bash
cd consorcios
python3 -m http.server 8000
# abra http://localhost:8000
```

Para publicar, basta enviar a pasta para qualquer hospedagem estática (GitHub Pages, Netlify, a hospedagem do seu site etc.).
