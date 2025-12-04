require('dotenv').config();
const db = require('./database/db');
const { generateUniqueKey } = require('./src/utils/keyGenerator');

console.log('📦 Iniciando População V2.1 (Figuras)...');

const DADOS_FIGURAS = [
    // Seus dados de modelos aqui (mantive 1 exemplo para brevidade, use o conteúdo completo que você já tem)
    {
        slug: 'sao-luis-de-montfort',
        nome: 'São Luís Maria Grignion de Montfort',
        subtitulo: 'Ludovicus Maria Grignion de Montfort (Original em Latim)',
        colecao: 'Guerreiros da Fé',
        conhecido_como: 'O Guerreiro da Virgem',
        dia_celebracao: '28 de Abril',
        invocado_para: 'Consagração Total',
        variacoes_nome: 'Luís, Luiz',
        locais_devocao: 'França, Vaticano',
        historia: '<p>Texto rico...</p>',
        oracao: 'Oração...',
        detalhes_visuais: '<p>Detalhes...</p>',
        imagem_url: '/uploads/modelos/sao-luis.jpg',
        ativo: 1 // <--- IMPORTANTE
    },
    // ... outros ...
];

const DADOS_PECAS = [
    {
        figura_slug: 'sao-luis-de-montfort', // mudou de modelo_slug
        codigo: '#001',
        inscricao: 'São Luís',
        cliente: 'Pedro Knob',
        mensagem: "Texto..."
    }
];

const runMigration = db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO categorias (nome, slug) VALUES ('Espiritual', 'espiritual')").run();
    const catId = db.prepare("SELECT id FROM categorias WHERE slug = 'espiritual'").get().id;

    const insertFigura = db.prepare(`
        INSERT INTO figuras (
            categoria_id, nome, subtitulo, slug, colecao, imagem_url, conhecido_como, 
            dia_celebracao, invocado_para, locais_devocao, variacoes_nome, 
            historia, oracao, detalhes_visuais, ativo
        ) VALUES (@catId, @nome, @subtitulo, @slug, @colecao, @imagem_url, @conhecido_como, 
            @dia_celebracao, @invocado_para, @locais_devocao, @variacoes_nome, 
            @historia, @oracao, @detalhes_visuais, @ativo)
    `);

    for (const f of DADOS_FIGURAS) {
        const exists = db.prepare('SELECT id FROM figuras WHERE slug = ?').get(f.slug);
        if (!exists) {
            console.log(`✨ Criando figura: ${f.nome}`);
            insertFigura.run({ ...f, catId });
        }
    }

    const insertPeca = db.prepare(`
        INSERT INTO pecas (
            figura_id, codigo_exibicao, inscricao_base, cliente_nome, mensagem, 
            data_producao, chave_acesso, codigo_sequencial
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of DADOS_PECAS) {
        const figura = db.prepare('SELECT id FROM figuras WHERE slug = ?').get(p.figura_slug);
        if (figura) {
            const exists = db.prepare('SELECT id FROM pecas WHERE figura_id = ? AND codigo_exibicao = ?').get(figura.id, p.codigo);
            if (!exists) {
                console.log(`🔨 Peça ${p.codigo}`);
                const chave = generateUniqueKey(db);
                insertPeca.run(
                    figura.id, 
                    p.codigo, 
                    p.inscricao,
                    p.cliente,
                    p.mensagem,
                    '2025-11',
                    chave,
                    parseInt(p.codigo.replace(/\D/g, ''))
                );
            }
        }
    }
});

try {
    runMigration();
    console.log('✅ População V2.1 concluída!');
} catch (error) {
    console.error('❌ Erro:', error);
}