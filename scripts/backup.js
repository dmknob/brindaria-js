// scripts/backup.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Configuração
const DB_PATH = path.join(__dirname, '../brindaria.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Garante que a pasta de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// Nome do arquivo com Data/Hora (ex: brindaria-2025-11-25-1500.db)
const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const BACKUP_NAME = `brindaria-${date}.db`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

console.log(`🔄 Iniciando backup de ${DB_PATH}...`);

try {
    // Abre conexão direta apenas para fazer o backup
    const db = new Database(DB_PATH);
    
    // A Mágica: .backup() consolida WAL + DB em um arquivo só, a quente.
    db.backup(BACKUP_PATH)
        .then(() => {
            console.log(`✅ Backup concluído com sucesso!`);
            console.log(`📂 Arquivo gerado: ${BACKUP_PATH}`);
        })
        .catch((err) => {
            console.error('❌ Falha no backup:', err);
        });

} catch (error) {
    console.error('Erro ao conectar para backup:', error);
}