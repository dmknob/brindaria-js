require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const DUMP_FILE = path.join(__dirname, '../database/seeds/data_dump.json');

if (!fs.existsSync(DUMP_FILE)) {
    console.error('❌ Arquivo de dump não encontrado:', DUMP_FILE);
    console.error('   Rode "npm run db:dump" primeiro (ou copie o arquivo de produção).');
    process.exit(1);
}

console.log(`♻️  Iniciando Restauração de Dados...`);

const rawData = fs.readFileSync(DUMP_FILE, 'utf-8');
const dump = JSON.parse(rawData);

const restore = db.transaction(() => {
    // 1. Limpar tabelas existentes (Ordem reversa para respeitar Foreign Keys)
    console.log('   🧹 Limpando tabelas atuais...');
    db.prepare('DELETE FROM pecas').run();
    db.prepare('DELETE FROM chaves_reserva').run();
    db.prepare('DELETE FROM modelos').run();
    db.prepare('DELETE FROM categorias').run();
    
    // Zera os contadores de ID (Autoincrement)
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('pecas', 'modelos', 'categorias', 'chaves_reserva')").run();

    // 2. Função genérica para inserir mantendo IDs
    const insertData = (tableName, rows) => {
        if (rows.length === 0) return;
        
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        const stmt = db.prepare(sql);
        
        for (const row of rows) {
            stmt.run(Object.values(row));
        }
        console.log(`   ✅ ${rows.length} registros inseridos em ${tableName}.`);
    };

    // 3. Inserir na ordem correta
    if (dump.tables.categorias) insertData('categorias', dump.tables.categorias);
    if (dump.tables.modelos) insertData('modelos', dump.tables.modelos);
    if (dump.tables.chaves_reserva) insertData('chaves_reserva', dump.tables.chaves_reserva);
    if (dump.tables.pecas) insertData('pecas', dump.tables.pecas);
});

try {
    restore();
    console.log('🎉 Restauração concluída com sucesso!');
    console.log(`   Dados sincronizados do dump de: ${dump.metadata.timestamp}`);
} catch (err) {
    console.error('❌ Erro na restauração:', err);
    process.exit(1);
}