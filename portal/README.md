# Portal de Cartas Contempladas

Portal para compra e venda de cartas de crédito contempladas de imóveis, em HTML, CSS e JavaScript puros, com um servidor Node.js.

As cartas ficam num **banco de dados SQLite** no servidor e são editadas pela própria página, no botão **Editar**, protegido por senha.

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Início: simulador rápido, cartas em destaque (lidas do banco), como funciona, vantagens, depoimentos |
| `imoveis.html` | **Tabela de cartas de imóveis** (banco de dados, editável com senha) |
| `como-funciona.html` | Explicação, passo a passo, documentos |
| `venda-sua-carta.html` | Formulário para vender uma carta (envia pelo WhatsApp) |
| `sobre.html` | Quem somos |
| `contato.html` | Formulário de contato (WhatsApp) e dúvidas frequentes |

## Estrutura

```
portal/
├── *.html                 páginas
├── assets/css/site.css    visual de todo o site
├── assets/js/config.js    ⚙️  CONFIGURAÇÕES (nome da empresa, contatos)
├── assets/js/dados.js     leitura das cartas no banco
├── assets/js/layout.js    topo, menu, rodapé e botão do WhatsApp (iguais em todas as páginas)
├── assets/js/tabela.js    tabela com filtros, ordenação e seleção
├── assets/js/home.js      destaques e simulador da página inicial
├── assets/js/edicao.js    modo de edição da tabela (senha, inserir, remover, salvar)
├── servidor/server.js     ▶️  arquivo de entrada: inicia o servidor (npm start / hospedagem)
├── servidor/app.js        servidor: entrega as páginas e a API do banco
├── servidor/banco.js      banco SQLite (criado sozinho em servidor/cartas.db)
├── package.json           comandos npm start / npm test
└── .env.exemplo           modelo das configurações secretas (senha)
```

O topo e o rodapé ficam em `layout.js`. Para mudar o menu, basta editar a lista `MENU` nesse arquivo.

## Configuração

- **Dados da empresa:** ficam em `assets/js/config.js` (nome, telefone, WhatsApp, e-mail, endereço e CNPJ).
- **Senha de edição:** fica no `.env` ou nas variáveis de ambiente da hospedagem (veja abaixo).

## Rodar no computador

O servidor não tem dependências: usa o SQLite que já vem no Node.js. Requisito: **Node.js 22.13 ou mais novo**.

```bash
cd portal
cp .env.exemplo .env      # depois edite o .env e defina SENHA_EDICAO
npm start
# abra http://localhost:3000
```

Na primeira execução o banco (`servidor/cartas.db`) é criado **vazio**. Cadastre as cartas pelo botão **Editar**.

Abrir os arquivos HTML com dois cliques não funciona: as cartas vêm do servidor.

## Editar a tabela

1. Abra **Imóveis** e clique em **Editar**, abaixo da tabela.
2. Digite a senha (`SENHA_EDICAO`).
3. Altere os campos, use **+ Adicionar carta** e **Remover**. As linhas alteradas ficam amarelas e as novas, verdes.
4. Clique em **Salvar alterações**. Tudo é gravado no banco de uma vez: se algo estiver errado (código repetido, valor negativo), nada é salvo e aparece a mensagem do problema.
5. Clique em **Sair da edição**.

Se o "Saldo devedor" ficar vazio, ele é calculado como parcelas × valor da parcela.

## Segurança

- A senha fica só no servidor (`.env` ou variável de ambiente) e nunca aparece no código da página.
- Depois da senha certa, o navegador recebe um acesso temporário que vale 2 horas (ou até "Sair da edição").
- Depois de 5 senhas erradas, o mesmo endereço fica bloqueado por 15 minutos.
- O servidor não entrega o banco, o `.env` nem os próprios arquivos de código.
- Use HTTPS em produção. As hospedagens abaixo já oferecem.

## Publicar

O site precisa de uma hospedagem que rode Node.js e tenha **disco persistente** para o arquivo do banco. Exemplos: Render (com Disk), Railway (com Volume), Fly.io ou uma VPS.

- **Comando de início:** `npm start`, na pasta `portal`
- **Variáveis de ambiente:**
  - `SENHA_EDICAO`: obrigatória
  - `BANCO_ARQUIVO`: caminho dentro do disco persistente, ex.: `/var/data/cartas.db`
  - A porta vem da hospedagem (`PORT`)

Sem disco persistente, o banco é apagado a cada nova publicação.

O servidor entrega o site inteiro (todas as páginas), então não precisa de outra hospedagem. Se as páginas ficarem em outro lugar, preencha `API_URL` em `config.js` com o endereço do servidor e `CORS_ORIGEM` no servidor com o endereço do site.

**Backup:** copie periodicamente o arquivo `cartas.db`.

### Hostinger (Node.js)

No painel da Hostinger, configure o app Node.js assim:

| Campo | Valor |
|---|---|
| Diretório raiz do app | `portal` (a pasta onde está o `package.json`) |
| Arquivo de entrada (*entry file*) | `servidor/server.js` |
| Comando de início | `npm start` |
| Versão do Node.js | **22.x ou mais nova** (precisa ser 22.13+, por causa do SQLite) |
| Variáveis de ambiente | `SENHA_EDICAO` (obrigatória) e, se possível, `BANCO_ARQUIVO` |

- **Porta:** não defina `PORTA` na Hostinger. O servidor usa a porta que a Hostinger informa em `PORT`.
- **Sem `SENHA_EDICAO`:** o site fica no ar, mas o botão Editar avisa que a edição está desativada. O motivo também aparece nos logs.
- **Banco:** para não perder as cartas a cada nova publicação, aponte `BANCO_ARQUIVO` para uma pasta fora da pasta do app, se o seu plano permitir (ex.: `/home/SEU_USUARIO/dados/cartas.db`). E faça backup do arquivo.

**Erro "App did not call listen() within 3 seconds":**
1. Confira se o arquivo de entrada é `servidor/server.js`.
2. Confira se a versão do Node.js é 22.13 ou mais nova.
3. Veja os logs do app.

## Testes

```bash
npm test
```

## O que personalizar antes de publicar

- `config.js`: dados reais da empresa
- `sobre.html`: história da empresa
- `index.html`: números da faixa azul e depoimentos (hoje são exemplos)
