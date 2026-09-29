# Portal de Cartas Contempladas

Site estático (HTML, CSS e JavaScript puros, sem instalar nada) para compra e venda de cartas de crédito contempladas. As tabelas de cartas são alimentadas por planilhas do Google Drive.

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Início: simulador rápido, cartas em destaque (lidas da planilha), como funciona, vantagens, depoimentos |
| `imoveis.html` | **Tabela de cartas de imóveis** (planilha) |
| `veiculos.html` | **Tabela de cartas de veículos** (planilha) |
| `como-funciona.html` | Explicação, passo a passo, documentos |
| `venda-sua-carta.html` | Formulário para vender uma carta (envia pelo WhatsApp) |
| `sobre.html` | Quem somos |
| `contato.html` | Formulário de contato (WhatsApp) e dúvidas frequentes |

## Estrutura

```
portal/
├── *.html                 páginas
├── assets/css/site.css    visual de todo o site
├── assets/js/config.js    ⚙️  CONFIGURAÇÕES (nome, contatos, planilhas)
├── assets/js/dados.js     leitura das planilhas
├── assets/js/layout.js    topo, menu, rodapé e botão do WhatsApp (iguais em todas as páginas)
├── assets/js/tabela.js    tabela com filtros, ordenação e seleção
├── assets/js/home.js      destaques e simulador da página inicial
└── dados/                 planilhas de exemplo (usadas enquanto nenhuma planilha for configurada)
```

O topo e o rodapé ficam em `layout.js`. Para mudar o menu, basta editar a lista `MENU` nesse arquivo.

## Configuração

Tudo fica em `assets/js/config.js`: nome da empresa, telefone, WhatsApp, e-mail, endereço, CNPJ e os links das planilhas.

## Como ligar as planilhas do Google Drive

O navegador não consegue ler um `.xlsx` direto do Drive porque o Google bloqueia (CORS). Por isso cada planilha precisa estar no formato **Planilhas Google**:

1. No Drive, abra o arquivo Excel e vá em **Arquivo → Salvar como Planilhas Google**.
2. Vá em **Arquivo → Compartilhar → Publicar na Web**, escolha a aba e o formato **.csv** e clique em **Publicar**.
3. Cole o link em `config.js`:

   ```js
   PLANILHAS: {
     imoveis:  "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv",
     veiculos: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=123&single=true&output=csv",
   },
   ```

   As duas categorias podem ser abas diferentes da mesma planilha. Também funciona o link normal de compartilhamento (`.../spreadsheets/d/ID/edit#gid=0`) com "Qualquer pessoa com o link: Leitor".

## Colunas da planilha

A primeira linha precisa ter os cabeçalhos. Maiúsculas e acentos não importam:

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

## Testar no computador

```bash
cd portal
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir os arquivos com dois cliques não funciona, porque o navegador bloqueia a leitura das planilhas locais.

## Publicar

Envie a pasta `portal/` para qualquer hospedagem estática: GitHub Pages, Netlify, Vercel ou a hospedagem do seu domínio.

## O que personalizar antes de publicar

- `config.js`: dados reais da empresa
- `sobre.html`: história da empresa
- `index.html`: números da faixa azul e depoimentos (hoje são exemplos)
