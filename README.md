# Brindaria V2

Sistema de gestão e catálogo digital para o ateliê Brindaria - Arte Sacra e Presentes.
Este projeto é uma aplicação web Node.js que gerencia o catálogo de peças, pedidos de produção e autenticidade de produtos.

## Funcionalidades Principais

-   **Catálogo Público**: Exibição de modelos e peças com detalhes ricos (história, oração, fotos).
-   **Sistema de Autenticidade**: Cada peça possui uma **Chave de Acesso** única (5 caracteres) impressa na base, garantindo privacidade e exclusividade.
-   **Painel Administrativo**:
    -   Gestão de Modelos (CRUD).
    -   Gestão de Peças (Registro de produção, vinculação de chaves).
    -   Dashboard com métricas e lista de chaves para produção.
-   **Certificado Digital**: Página exclusiva para o cliente visualizar os detalhes de sua peça personalizada.

## Tecnologias

-   **Backend**: Node.js, Express.
-   **Banco de Dados**: SQLite (com `better-sqlite3` e modo WAL).
-   **Frontend**: EJS (Server-side rendering), TailwindCSS.
-   **Segurança**: Helmet, Rate Limiting, Express Session, BCrypt.

## Estrutura de Arquivos

Abaixo, uma breve documentação dos principais arquivos do projeto:

### Raiz
-   `app.js`: Ponto de entrada da aplicação. Configura o servidor Express, middlewares e rotas.
-   `package.json`: Gerenciamento de dependências e scripts (`start`, `dev`, `build:css`).
-   `setup-db.js`: Script para inicializar o banco de dados SQLite com o esquema padrão.
-   `tailwind.config.js`: Configuração do framework CSS.

### `src/` (Código Fonte)
-   **`controllers/`**: Lógica de negócios.
    -   `adminController.js`: Gerencia as rotas do painel admin (dashboard, cadastro de peças/modelos, login).
    -   `publicController.js`: Gerencia as rotas públicas (home, catálogo, detalhes da peça, validação de chave).
-   **`middleware/`**: Interceptadores de requisição.
    -   `auth.js`: Verifica se o usuário está logado para acessar rotas administrativas.
-   **`routes/`**: Definição das rotas da API/Web.
    -   `adminRoutes.js`: Rotas protegidas (`/admin/*`).
    -   `publicRoutes.js`: Rotas públicas (`/`, `/pecas`, `/validar`).
-   **`utils/`**: Utilitários.
    -   `keyGenerator.js`: Gera chaves de acesso únicas (Base32 Crockford) e gerencia o pool de reserva.
-   **`styles/`**: Arquivos CSS fonte (Tailwind).

### `database/` (Dados)
-   `db.js`: Configuração da conexão com o SQLite (Singleton).
-   `schema.sql`: Definição das tabelas (`modelos`, `pecas`, `chaves_reserva`, `categorias`).
-   `brindaria.db`: Arquivo do banco de dados (não versionado).

### `views/` (Templates EJS)
-   **`pages/`**: Páginas principais.
    -   `home.ejs`: Página inicial com busca e apresentação.
    -   `peca-detalhe.ejs`: Exibe o certificado da peça (requer validação).
    -   `colecao.ejs`: Catálogo de modelos.
    -   `selecao-modelo.ejs`: Página de desambiguação para códigos legados duplicados.
-   **`admin/`**: Telas do painel.
    -   `dashboard.ejs`: Visão geral e widget de chaves.
    -   `form-peca.ejs`: Formulário de registro/edição de peças.
    -   `lista-pecas.ejs`: Listagem completa de peças.
    -   `login.ejs`: Tela de login.

### `deploy/` (Infraestrutura)
-   `setup.sh`: Script automatizado para instalação em servidor Debian.
-   `nginx.conf`: Configuração de proxy reverso para o Nginx.

## Instalação Local

1.  Instale as dependências:
    ```bash
    npm install
    ```
2.  Configure o banco de dados:
    ```bash
    node setup-db.js
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Acesse `http://localhost:3000`.

## Deploy

Consulte o arquivo [DEPLOY.md](DEPLOY.md) para instruções detalhadas de produção.
