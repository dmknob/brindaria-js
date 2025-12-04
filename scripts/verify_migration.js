require('dotenv').config();
const db = require('../database/db');

console.log('🔍 Iniciando Auditoria Pós-Migração V2.1...\n');

function checkTable(tableName) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    return !!exists;
}

function getColumns(tableName) {
    return db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
}

function getCount(tableName) {
    return db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
}

// 1. Verificação de Tabelas (Renomeação)
console.log('--- 1. ESTRUTURA DE TABELAS ---');

if (!checkTable('modelos')) {
    console.log('✅ Tabela "modelos" foi removida corretamente.');
} else {
    console.error('❌ ERRO: Tabela "modelos" ainda existe!');
}

if (checkTable('figuras')) {
    console.log('✅ Tabela "figuras" existe.');
    
    const cols = getColumns('figuras');
    if (cols.includes('ativo')) {
        console.log('✅ Coluna "ativo" encontrada em "figuras".');
    } else {
        console.error('❌ ERRO: Coluna "ativo" NÃO encontrada em "figuras".');
    }
    
    const count = getCount('figuras');
    console.log(`📊 Total de Figuras migradas: ${count}`);

} else {
    console.error('❌ ERRO: Tabela "figuras" NÃO foi criada.');
}

// 2. Verificação de Peças (Refatoração)
console.log('\n--- 2. ESTRUTURA DE PEÇAS ---');

if (checkTable('pecas')) {
    const cols = getColumns('pecas');
    
    if (cols.includes('figura_id') && !cols.includes('modelo_id')) {
        console.log('✅ Coluna FK renomeada para "figura_id".');
    } else {
        console.error('❌ ERRO: Problema na coluna de chave estrangeira (modelo_id vs figura_id).');
    }

    // Teste de Nulidade (Constraints)
    // Tenta inserir uma peça Rascunho (sem campos opcionais)
    try {
        const testeRascunho = db.transaction(() => {
            // Pega primeira figura e chave aleatória fake
            const fig = db.prepare('SELECT id FROM figuras LIMIT 1').get();
            db.prepare(`
                INSERT INTO pecas (figura_id, chave_acesso) 
                VALUES (?, 'TESTE')
            `).run(fig.id);
            // Se passou, rollback para não sujar o banco
            throw new Error('ROLLBACK_TEST'); 
        });
        testeRascunho();
    } catch (err) {
        if (err.message === 'ROLLBACK_TEST') {
            console.log('✅ Teste de Constraints: Sucesso! É possível criar peça Rascunho (apenas ID e Chave).');
        } else {
            console.error('❌ Teste de Constraints FALHOU:', err.message);
            console.log('   (Isso significa que algum campo opcional ainda está como NOT NULL)');
        }
    }

    const count = getCount('pecas');
    console.log(`📊 Total de Peças migradas: ${count}`);

} else {
    console.error('❌ ERRO: Tabela "pecas" não encontrada.');
}

console.log('\n🏁 Auditoria Finalizada.');