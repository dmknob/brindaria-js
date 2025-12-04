require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const DUMP_FILE = path.join(__dirname, '../database/seeds/data_dump.json');

if (!fs.existsSync(DUMP_FILE)) {
    console.error('❌ Arquivo de dump não encontrado.');
    process.exit(1);
}

console.log(`♻️  Iniciando Restauração V2.1...`);

const rawData = fs.readFileSync(DUMP_FILE, 'utf-8');
const dump = JSON.parse(rawData);

const restore = db.transaction(() => {
    // 1. Limpeza
    console.log('   🧹 Limpando tabelas...');
    db.prepare('DELETE FROM pecas').run();
    db.prepare('DELETE FROM chaves_reserva').run();
    db.prepare('DELETE FROM figuras').run(); // Novo nome
    db.prepare('DELETE FROM categorias').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('pecas', 'figuras', 'categorias', 'chaves_reserva')").run();

    // Função de inserção genérica
    const insertData = (tableName, rows, colMap = {}) => {
        if (!rows || rows.length === 0) return;
        
        // Pega colunas do primeiro item
        let columns = Object.keys(rows[0]);
        
        // Aplica mapeamento de colunas (ex: modelo_id -> figura_id)
        const mappedColumns = columns.map(c => colMap[c] || c);
        
        // Se a tabela alvo tiver colunas extras (ex: 'ativo') que não estão no JSON,
        // o SQLite preenche com DEFAULT. Não precisamos fazer nada se a ordem bater.
        
        const placeholders = mappedColumns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${mappedColumns.join(', ')}) VALUES (${placeholders})`;
        const stmt = db.prepare(sql);
        
        for (const row of rows) {
            // Se precisarmos transformar dados (ex: setar ativo=1), faríamos aqui.
            // Por enquanto, assumimos compatibilidade direta ou defaults.
            stmt.run(Object.values(row));
        }
        console.log(`   ✅ ${rows.length} registros em ${tableName}.`);
    };

    // 2. Inserção
    if (dump.tables.categorias) insertData('categorias', dump.tables.categorias);
    
    // Importa Figuras (Aceita vindo de 'modelos' ou 'figuras')
    const figurasData = dump.tables.figuras || dump.tables.modelos;
    if (figurasData) {
        // Se o JSON for antigo, não tem 'ativo'. O banco vai por 0 (default).
        // Vamos forçar ativo=1 se for migração de legado? 
        // Melhor não complicar o script genérico. Rodamos um update depois se precisar.
        insertData('figuras', figurasData);
    }

    if (dump.tables.chaves_reserva) insertData('chaves_reserva', dump.tables.chaves_reserva);
    
    // Importa Peças (Mapeando modelo_id -> figura_id se necessário)
    if (dump.tables.pecas) {
        insertData('pecas', dump.tables.pecas, { 'modelo_id': 'figura_id' });
    }
});

try {
    restore();
    console.log('🎉 Restauração concluída!');
    
    // Pós-Restore: Ativar figuras legadas se estiverem como 0
    // (Opcional, descomente se quiser que tudo importado nasça ativo)
    // db.prepare('UPDATE figuras SET ativo = 1 WHERE ativo IS NULL OR ativo = 0').run();
    
} catch (err) {
    console.error('❌ Erro na restauração:', err);
    process.exit(1);
}