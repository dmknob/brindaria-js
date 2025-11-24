PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS pecas;
DROP TABLE IF EXISTS oracoes;
DROP TABLE IF EXISTS modelos;
DROP TABLE IF EXISTS categorias;

-- 1. Categorias (Estrutura simples para futuro)
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- 2. Modelos (A "Wikipédia" da Brindaria)
CREATE TABLE modelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    
    -- Identidade
    nome TEXT NOT NULL,                -- "São Miguel Arcanjo"
    subtitulo TEXT,                    -- "Mikha'el (Original em Hebraico)"
    slug TEXT UNIQUE NOT NULL,         -- "sao-miguel"
    colecao TEXT,                      -- "Guerreiros da Fé"
    imagem_url TEXT,                   -- "/uploads/modelos/sao-miguel.jpg"
    
    -- Dados Estruturados (Para SEO e Filtros)
    conhecido_como TEXT,               -- "O Príncipe da Milícia Celeste"
    dia_celebracao TEXT,               -- "29 de Setembro"
    invocado_para TEXT,                -- "Proteção, justiça..."
    locais_devocao TEXT,               -- "Igrejas, capelas..."
    variacoes_nome TEXT,               -- "Miguel, Michael, Maicon" (Para busca interna)
    
    -- Conteúdo Rico (HTML)
    historia TEXT,                     -- Texto completo "História e Curiosidades"
    oracao TEXT,                       -- Oração completa
    detalhes_visuais TEXT,             -- "Como identificar" (HTML com as variações)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Índices para busca rápida
CREATE INDEX idx_modelos_slug ON modelos(slug);
CREATE INDEX idx_modelos_nome ON modelos(nome);

-- 3. Peças Físicas (O Registro de Produção)
CREATE TABLE pecas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER NOT NULL,
    
    -- Identificadores
    codigo_sequencial INTEGER NOT NULL, -- 1, 2...
    codigo_exibicao TEXT NOT NULL,      -- "#001"
    
    -- O "Coração" da Peça (Mobile)
    inscricao_base TEXT,                -- "Protegei a Alicia"
    
    -- Detalhes Técnicos
    tamanho TEXT,                       -- "20cm"
    material TEXT,                      -- "Compósito Ecológico"
    acabamento TEXT,                    -- "Visual Mármore, pedestal preto"
    
    -- Personalização
    cliente_nome TEXT,                  -- "Pedro Knob"
    mensagem TEXT,                      -- Dedicatória completa
    
    data_producao TEXT,                 -- "Novembro de 2025"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(modelo_id) REFERENCES modelos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_pecas_modelo_codigo ON pecas(modelo_id, codigo_exibicao);