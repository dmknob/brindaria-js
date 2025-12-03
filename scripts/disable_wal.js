// scripts/disable_wal.js
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Define qual banco usar (igual ao db.js)
const dbFileName = process.env.DB_FILE || 'brindaria.db';
const dbPath = path.join(__dirname, '../', dbFileName);

console.log(`🔌 Desativando WAL para: ${dbFileName}...`);

try {
    if (!fs.existsSync(dbPath)) {
        console.error("❌ Arquivo de banco não encontrado!");
        process.exit(1);
    }

    const db = new Database(dbPath);
    
    // Este comando força a consolidação dos dados e remove os arquivos -wal/-shm
    db.pragma('journal_mode = DELETE');
    
    db.close();
    console.log('✅ Modo WAL desativado com sucesso. Arquivo consolidado.');
    
    // Verificação extra
    if (!fs.existsSync(dbPath + '-wal')) {
        console.log('✅ Arquivo .db-wal desapareceu corretamente.');
    } else {
        console.warn('⚠️ O arquivo .db-wal ainda existe. Verifique permissões.');
    }

} catch (error) {
    console.error('❌ Erro:', error);
}