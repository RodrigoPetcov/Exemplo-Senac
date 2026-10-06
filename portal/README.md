# Portal de Cartas Contempladas

Portal para compra e venda de cartas de crédito contempladas, em HTML, CSS e JavaScript puros.

- **Cartas de imóveis:** ficam num **banco de dados SQLite** no servidor. Elas são editadas pela própria página (botão **Editar**, protegido por senha).
- **Cartas de veículos:** continuam lidas de uma planilha do Google Drive.

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Início: simulador rápido, cartas em destaque (lidas da planilha), como funciona, vantagens, depoimentos |
| `imoveis.html` | **Tabela de cartas de imóveis** (banco de dados, editável com senha) |
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
├── assets/js/edicao.js    modo de edição da tabela de imóveis (senha, inserir, remover, salvar)
├── dados/                 planilhas de exemplo
├── servidor/server.js     servidor: entrega as páginas e a API do banco
├── servidor/banco.js      banco SQLite (criado sozinho em servidor/cartas.db)
├── servidor/importar.js   importa uma planilha CSV para o banco
├── package.json           comandos npm start / npm test / npm run importar
└── .env.exemplo           modelo das configurações secretas (senha)
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

## Servidor e banco de dados (cartas de imóveis)

O servidor não tem dependências: usa o SQLite que já vem no Node.js. Requisito: **Node.js 22.13 ou mais novo**.

### Rodar no computador

```bash
cd portal
cp .env.exemplo .env      # depois edite o .env e defina SENHA_EDICAO
npm start
# abra http://localhost:3000
```

Na primeira execução o banco (`servidor/cartas.db`) é criado e preenchido com as cartas de `dados/imoveis-exemplo.csv`.

### Editar a tabela

1. Abra **Cartas de Imóveis** e clique em **Editar**, abaixo da tabela.
2. Digite a senha (`SENHA_EDICAO`).
3. Altere os campos, use **+ Adicionar carta** e **Remover**. As linhas alteradas ficam amarelas e as novas, verdes.
4. Clique em **Salvar alterações**. Tudo é gravado no banco de uma vez: se algo estiver errado (código repetido, valor negativo), nada é salvo e aparece a mensagem do problema.
5. Clique em **Sair da edição**.

Se o "Saldo devedor" ficar vazio, ele é calculado como parcelas × valor da parcela.

### Segurança

- A senha fica só no servidor (`.env` ou variável de ambiente) e nunca aparece no código da página.
- Depois da senha certa, o navegador recebe um acesso temporário que vale 2 horas (ou até "Sair da edição").
- Depois de 5 senhas erradas, o mesmo endereço fica bloqueado por 15 minutos.
- O servidor não entrega o banco, o `.env` nem os próprios arquivos de código.
- Use HTTPS em produção. As hospedagens abaixo já oferecem.

### Importar a planilha atual para o banco

Para levar as cartas da planilha do Drive para o banco: baixe a planilha em CSV (**Arquivo → Fazer download → .csv**) e rode:

```bash
npm run importar -- caminho/planilha.csv
```

Atenção: isso **substitui** todas as cartas de imóveis do banco pelas da planilha.

### Publicar o servidor

O site precisa de uma hospedagem que rode Node.js e tenha **disco persistente** para o arquivo do banco. Exemplos: Render (com Disk), Railway (com Volume), Fly.io ou uma VPS.

- **Comando de início:** `npm start`, na pasta `portal`
- **Variáveis de ambiente:**
  - `SENHA_EDICAO`: obrigatória
  - `BANCO_ARQUIVO`: caminho dentro do disco persistente, ex.: `/var/data/cartas.db`
  - A porta vem da hospedagem (`PORT`)

Sem disco persistente, o banco é apagado a cada nova publicação.

Com o servidor, o site inteiro (todas as páginas) é entregue por ele, então não precisa de outra hospedagem. Se as páginas ficarem em outro lugar (ex.: GitHub Pages), preencha `API_URL` em `config.js` com o endereço do servidor e `CORS_ORIGEM` no servidor com o endereço do site.

**Backup:** copie periodicamente o arquivo `cartas.db`.

### Testes

```bash
npm test
```

## Testar sem o servidor

```bash
cd portal
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir os arquivos com dois cliques não funciona, porque o navegador bloqueia a leitura das planilhas locais. Sem o servidor Node, a página de imóveis mostra um aviso de que não conseguiu conectar ao banco: use `npm start` para ela.


## O que personalizar antes de publicar

- `config.js`: dados reais da empresa
- `sobre.html`: história da empresa
- `index.html`: números da faixa azul e depoimentos (hoje são exemplos)
