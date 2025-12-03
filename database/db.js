// database/db.js
const Database = require('better-sqlite3');
const path = require('path');

const dbFileName = process.env.DB_FILE || 'brindaria.db';
const dbPath = path.join(__dirname, '../', dbFileName);

const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV !== 'production' ? console.log : null
});

// REMOVIDO: db.pragma('journal_mode = WAL'); 
// Agora usamos o modo padrão (DELETE/TRUNCATE) que é arquivo único.

console.log(`📦 Banco de dados conectado: ${dbPath}`);

module.exports = db;