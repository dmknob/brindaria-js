PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS pecas;
DROP TABLE IF EXISTS chaves_reserva;
--DROP TABLE IF EXISTS oracoes;
DROP TABLE IF EXISTS figuras;
DROP TABLE IF EXISTS categorias;

-- 1. Categorias
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- 2. Figuras
CREATE TABLE figuras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    
    -- Identidade
    nome TEXT NOT NULL,
    subtitulo TEXT,
    slug TEXT UNIQUE NOT NULL,
    colecao TEXT,
    imagem_url TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 0, -- 0: Rascunho, 1: Publicado
    
    -- Dados Estruturados
    conhecido_como TEXT,
    dia_celebracao TEXT,
    invocado_para TEXT,
    locais_devocao TEXT,
    variacoes_nome TEXT,
    
    -- Conteúdo Rico
    historia TEXT,
    oracao TEXT,
    detalhes_visuais TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX idx_figuras_slug ON figuras(slug);
CREATE INDEX idx_figuras_nome ON figuras(nome);

-- 3. Chaves de Reserva
CREATE TABLE chaves_reserva (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Peças Físicas
CREATE TABLE pecas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    figura_id INTEGER NOT NULL, -- Renomeado de modelo_id
    
    -- Autenticação (Obrigatória)
    chave_acesso TEXT UNIQUE NOT NULL,
    
    -- Identificadores (Agora Opcionais)
    codigo_sequencial INTEGER, 
    codigo_exibicao TEXT,      -- Pode ser preenchido depois
    
    -- Detalhes (Agora Opcionais)
    inscricao_base TEXT,
    tamanho TEXT,
    material TEXT,
    acabamento TEXT,
    
    -- Personalização (Agora Opcionais)
    cliente_nome TEXT,
    mensagem TEXT,
    
    data_producao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(figura_id) REFERENCES figuras(id) ON DELETE CASCADE
);

CREATE INDEX idx_pecas_codigo_exibicao ON pecas(codigo_exibicao);
CREATE UNIQUE INDEX idx_pecas_chave_acesso ON pecas(chave_acesso);