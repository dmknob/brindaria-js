// scripts/backup.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// --- ALTERAÇÃO: Ler o nome do banco do .env ---
const dbFileName = process.env.DB_FILE;
const DB_PATH = path.join(__dirname, '../', dbFileName);
const BACKUP_DIR = path.join(__dirname, '../backups');

// Garante que a pasta de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// Nome do arquivo com Sufixo do ambiente e Data
// Ex: backup-prod-2025-11-26-1500.db
const envSuffix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const BACKUP_NAME = `backup-${envSuffix}-${date}.db`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

console.log(`🔄 Iniciando backup de: ${dbFileName}...`);

try {
    // Abre conexão direta apenas para fazer o backup
    const db = new Database(DB_PATH);
    
    // .backup() consolida WAL + DB em um arquivo só
    db.backup(BACKUP_PATH)
        .then(() => {
            console.log(`✅ Backup concluído!`);
            console.log(`📂 Arquivo: ${BACKUP_PATH}`);
        })
        .catch((err) => {
            console.error('❌ Falha no backup:', err);
        });

} catch (error) {
    console.error(`❌ Erro ao localizar o banco de dados (${DB_PATH}):`, error.message);
}