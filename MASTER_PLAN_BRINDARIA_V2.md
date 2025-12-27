# MASTER PLAN — Brindaria V2 (Engenharia & Produto)

**Versão do Documento:** 1.0 (Pós-Lançamento V2.0)
**Status:** Produção Estável — Iniciando Planejamento V2.1

## 1. Identidade do Projeto e Escopo

**Nome do Sistema:** Brindaria CMS & Auth (V2)

**Problema (dor):** Substituir um site estático (V1) de difícil manutenção (JSON) por um sistema dinâmico que permita gestão de conteúdo e criação de páginas únicas para peças físicas.

**Pivotagem Estratégica:**
- De: foco inicial em links de compartilhamento viral
- Para: sistema de autenticação phygital (validação por Chave de Acesso + curadoria de conteúdo)

**Evolução:** O sistema está se transformando em um ERP leve de produção.

**Stack Tecnológica:**
- Runtime: Node.js (LTS v20+)
- Framework: Express.js
- Database: SQLite3 (better-sqlite3)
- Frontend: EJS (Server-Side Rendering) + Tailwind CSS
- Infraestrutura: Debian 12, Nginx (Proxy reverso), PM2, Git

## 2. Snapshot do Estado Atual (V2.0 — Produção)

**Funcionalidades Operacionais**

- **Público:** Home institucional, catálogo de peças, página de detalhe rica (história/oração/iconografia), certificado de autenticidade (acessível via chave ou código), busca por chave (`/validar`), sitemap XML dinâmico.
- **Admin:** Login seguro (hash + rate limit), dashboard com métricas, CRUD de figuras (upload de imagem e texto rico), CRUD de peças (geração de chave única), backup do sistema (zip).

**Arquitetura de Pastas**

- MVC: `src/controllers`, `src/routes`, `views/` (modelo implícito via SQL)

**Arquitetura de Views**

- Layout "sanduíche": `layout-top.ejs` + content + `layout-bottom.ejs` (garante estabilidade do header/footer)

### 2.1 Issues Conhecidas (Status/Observações)

- **Filtro de Figuras Ativas (bug):** o site filtra corretamente `WHERE ativo = 1` para o público, mas quando um admin está logado a aplicação deveria mostrar Figuras inativas também; atualmente o acesso retorna **404**. Passos para reproduzir: (1) logar como admin; (2) acessar página da figura inativa; (3) recebe 404. Suspeita: rota pública ou middleware está retornando 404 ao aplicar filtro ao invés de ignorá-lo para admins.

- **Cadastro de Peças (bug):** ao tentar cadastrar uma peça sem informar `codigo_exibicao` o processo falha ou gera comportamento inesperado. Comportamento esperado: aceitar `codigo_exibicao` vazio (se permitido pelo esquema) ou gerar um código temporário/placeholder; validar e mostrar mensagem clara ao usuário.

- **Testes (pendente):** cobertura de testes ainda inexistente; TODO: implementar testes end-to-end e unitários para rotas críticas (login, criação de peça, geração de chave, rota `/v/:chave`, filtro de `ativo`).



## 3. Registros de Decisão de Arquitetura (ADR)

- **ADR-01 — Banco de Dados:** SQLite escolhido pela portabilidade (arquivo único) e baixo custo de manutenção.
- **ADR-02 — WAL desativado:** Write-Ahead Logging desativado após incidentes durante deploys; usamos arquivo `.db` único para facilitar backups frios/quentes.
- **ADR-03 — Chaves de Acesso:** Crockford Base32 com chaves de 5 caracteres (ex.: `A7X2M`) para URLs curtas e identificação única de peças.
- **ADR-04 — Separação de Ambientes:**
  - Prod = fonte da verdade dos DADOS
  - Staging/Dev = fonte da verdade do CÓDIGO
  - Sincronização: dump de Prod -> Staging; código sobe via Git Push -> Prod
- **ADR-05 — Imagens no Filesystem:** Uploads em `public/uploads/`; backups de imagens via ZIP no painel Admin

## 4. Backlog Consolidado (Roadmap V2.1)

Esta é a especificação técnica para o próximo ciclo de desenvolvimento.

**Nota:** Refatoração semântica e estrutural (anteriormente 4.1) — concluída; detalhes registrados no histórico de commits e changelog.

### 4.2 Workflow de Cadastro e Publicação

**Status (Ativo/Inativo / Rascunho)**
- Adicionar coluna `ativo` em `figuras` (padrão: 0)
- Site público deve filtrar `WHERE ativo = 1`

**Cadastro de Peça 'Express'**
- Objetivo: permitir cadastro imediato após saída de produção
- Técnica: tornar campos `codigo_exibicao`, `mensagem`, `cliente`, `data`, `acabamento` **NULLABLE**
- Obrigatórios ao criar: `figura_id`, `chave_acesso`

### 4.3 Gestão de Categorias (CRUD)

- Permitir edição de nome de categoria
- Impedir exclusão (RESTRICT) se houver figuras vinculadas
- Bloquear alteração de `slug` para não quebrar links/QR codes

### 4.4 Melhorias de Interface Pública — **Status: Concluído (testes pendentes)**

- **UX:** rota curta `/v/:chave` para acesso via QR Code  
  **Status:** Implementada
- **SEO:** tag `rel="canonical"` nas páginas de peças apontando para a página da `figura` pai  
  **Status:** Implementada

**Próximo passo:** Implementar testes E2E e unitários para validar comportamento (CI).

## 5. O "Laboratório de Ideias" (V3.0+)

**Arquitetura Vanguard (V3.0)**
- Migrar o frontend público para uma abordagem SSG on-demand: gerar .html estáticos quando o Admin atualiza conteúdo.
- Nginx serve arquivos estáticos para máxima performance e menores riscos de exposição ao runtime.

**Módulo ERP (V3.x)**
- Criar tabela satélite `producao` (1:1 com `pecas`) para dados sensíveis (custo, status, impressora)
- Suportar impressão de ordem de produção (HTML/CSS — A5)

**Busca Avançada (V3.1)**
- Implementar sistema de tags (`atributos_visuais`) para filtros como "Santos com Espada"

## 6. Próximos Passos Imediatos (Action Plan)

**Status atual:** As migrações fundamentais para V2.1 foram aplicadas (renomeação de `modelos` → `figuras`, coluna `ativo` adicionada, ajustes iniciais nos constraints de `pecas`). O foco agora é corrigir bugs remanescentes, concluir refatores de campos ricos e preparar a integração ERP.

**Tarefas sugeridas (prioridade alta)**
- **Corrigir bug do filtro de Figuras Ativas (admin -> 404):** reproduzir em ambiente de staging, ajustar middleware/rota para permitir visualização de Figuras inativas quando `req.session.admin` = true, adicionar teste que valida comportamento.
- **Corrigir bug no cadastro de Peças sem `codigo_exibicao`:** aceitar `codigo_exibicao` vazio ou gerar placeholder; melhorar validação e mensagens de erro; adicionar testes.
- **Refatorar campos ricos das Figuras (pendente):** renomear campo `oracao` -> `texto_ritual` (ou outro nome aprovado), migrar dados, ajustar views e traduções de front/admin.
- **Planejar integração ERP no schema do banco:** criar documento de especificação e esquema inicial (tabela `producao` satélite com FK para `pecas`), incluir restrições de acesso/privacidade.
- **Implementar testes por todo o site:** adicionar suite de testes (jest + supertest / cypress para E2E), integrar `npm test` no CI, criar testes para rotas críticas (login, criação de peça, rota `/v/:chave`, filtros `ativo`).
- **Verificação e rollbacks:** criar scripts de verificação (ex.: `scripts/verify_migration.js`, `scripts/check_data_integrity.js`) e documentar procedimento de rollback.

**Comando de referência (local / exemplo)**
```bash
# executar migrações e verificações (exemplo)
node scripts/verify_migration.js && npm test
```

**Observação:** remover tarefas de renomeação (já realizadas) da lista de prioridades e focar em correções, testes e planejamento ERP.



---
Nota Técnica (Layout):
> O projeto utiliza um layout sandwich: `layout-top.ejs` + content + `layout-bottom.ejs`. O arquivo legado `views/layouts/main.ejs` foi removido.
