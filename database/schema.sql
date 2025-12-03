PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS pecas;
DROP TABLE IF EXISTS chaves_reserva;
DROP TABLE IF EXISTS oracoes;
DROP TABLE IF EXISTS modelos;
DROP TABLE IF EXISTS categorias;

-- 1. Categorias
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- 2. Modelos
CREATE TABLE modelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    nome TEXT NOT NULL,
    subtitulo TEXT,
    slug TEXT UNIQUE NOT NULL,
    colecao TEXT,
    imagem_url TEXT,
    conhecido_como TEXT,
    dia_celebracao TEXT,
    invocado_para TEXT,
    locais_devocao TEXT,
    variacoes_nome TEXT,
    historia TEXT,
    oracao TEXT,
    detalhes_visuais TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX idx_modelos_slug ON modelos(slug);
CREATE INDEX idx_modelos_nome ON modelos(nome);

-- 3. Chaves de Reserva (Autenticação)
CREATE TABLE chaves_reserva (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Peças Físicas
CREATE TABLE pecas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER NOT NULL,
    chave_acesso TEXT UNIQUE NOT NULL, -- Coluna Crítica
    codigo_sequencial INTEGER NOT NULL,
    codigo_exibicao TEXT NOT NULL,
    inscricao_base TEXT,
    tamanho TEXT,
    material TEXT,
    acabamento TEXT,
    cliente_nome TEXT,
    mensagem TEXT,
    data_producao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(modelo_id) REFERENCES modelos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_pecas_modelo_codigo ON pecas(modelo_id, codigo_exibicao);
CREATE UNIQUE INDEX idx_pecas_chave_acesso ON pecas(chave_acesso);