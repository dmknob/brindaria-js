require('dotenv').config();
const db = require('../database/db');

console.log('🚀 Iniciando Migração para V2.1 (Refatoração Semântica e Workflow)...');

const migrate = db.transaction(() => {
    // 0. Verificação de Segurança
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='figuras'").get();
    if (tableCheck) {
        console.log('⚠️  A tabela "figuras" já existe. Parece que a migração já foi rodada.');
        return;
    }

    // Desativa Foreign Keys temporariamente para permitir a cirurgia nas tabelas
    db.pragma('foreign_keys = OFF');

    console.log('--- 1. CRIANDO TABELA FIGURAS (Antiga Modelos) ---');
    // Cria nova tabela com campo 'ativo' e nome 'figuras'
    db.prepare(`
        CREATE TABLE figuras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_id INTEGER,
            
            -- Identidade
            nome TEXT NOT NULL,
            subtitulo TEXT,
            slug TEXT UNIQUE NOT NULL,
            colecao TEXT,
            imagem_url TEXT,
            
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
            
            -- NOVO CAMPO V2.1
            ativo INTEGER DEFAULT 0, 
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
        )
    `).run();

    console.log('🔄 Migrando dados de Modelos -> Figuras...');
    // Copia dados e define ativo = 1 para todos os existentes (legado)
    db.prepare(`
        INSERT INTO figuras (
            id, categoria_id, nome, subtitulo, slug, colecao, imagem_url,
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais, created_at, ativo
        )
        SELECT 
            id, categoria_id, nome, subtitulo, slug, colecao, imagem_url,
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais, created_at, 1
        FROM modelos
    `).run();


    console.log('--- 2. RECRIANDO TABELA PECAS (Relaxamento de Constraints) ---');
    // Cria tabela temporária com a nova estrutura (campos opcionais e FK renomeada)
    db.prepare(`
        CREATE TABLE pecas_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            figura_id INTEGER NOT NULL, -- Renomeado de modelo_id
            
            -- Autenticação (Obrigatória)
            chave_acesso TEXT UNIQUE NOT NULL,
            
            -- Identificadores (Agora Opcionais)
            codigo_sequencial INTEGER, -- NULLABLE
            codigo_exibicao TEXT,      -- NULLABLE
            
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
        )
    `).run();

    console.log('🔄 Migrando dados de Pecas Antigas -> Pecas Novas...');
    // Copia dados mapeando modelo_id para figura_id
    db.prepare(`
        INSERT INTO pecas_new (
            id, figura_id, chave_acesso, codigo_sequencial, codigo_exibicao,
            inscricao_base, tamanho, material, acabamento,
            cliente_nome, mensagem, data_producao, created_at
        )
        SELECT 
            id, modelo_id, chave_acesso, codigo_sequencial, codigo_exibicao,
            inscricao_base, tamanho, material, acabamento,
            cliente_nome, mensagem, data_producao, created_at
        FROM pecas
    `).run();


    console.log('--- 3. LIMPEZA E FINALIZAÇÃO ---');
    
    // Drop tabelas antigas
    db.prepare('DROP TABLE pecas').run();
    db.prepare('DROP TABLE modelos').run();
    
    // Renomeia a nova tabela de peças para o nome oficial
    db.prepare('ALTER TABLE pecas_new RENAME TO pecas').run();

    // Recria Índices
    console.log('📝 Recriando índices...');
    db.prepare('CREATE INDEX idx_figuras_slug ON figuras(slug)').run();
    db.prepare('CREATE INDEX idx_figuras_nome ON figuras(nome)').run();
    // Índices de Peças (Adaptados para permitir NULL no código, mas UNIQUE se existir?)
    // Nota: SQLite trata NULL como distinto em UNIQUE indexes. 
    // Mas queremos permitir vários NULLs? Sim.
    // Vamos manter o índice de chave_acesso (Vital)
    db.prepare('CREATE UNIQUE INDEX idx_pecas_chave_acesso ON pecas(chave_acesso)').run();
    
    // O índice de codigo_exibicao precisa ser recriado se quisermos buscar rápido, 
    // mas não pode ser UNIQUE global se permitirmos NULLs repetidos (embora SQLite permita).
    // Vamos manter simples por enquanto:
    db.prepare('CREATE INDEX idx_pecas_codigo_exibicao ON pecas(codigo_exibicao)').run();

    // Reativa Foreign Keys e verifica integridade
    db.pragma('foreign_keys = ON');
    
    // Opcional: Verificar integridade
    // const integrity = db.pragma('foreign_key_check');
    // if (integrity.length > 0) throw new Error("Violação de chave estrangeira detectada!");

});

try {
    migrate();
    console.log('✅ Sucesso! Banco de dados migrado para a estrutura V2.1 (Figuras & Rascunhos).');
} catch (error) {
    console.error('❌ Falha na migração:', error);
    console.error('   O banco de dados foi revertido para o estado anterior.');
    process.exit(1);
}