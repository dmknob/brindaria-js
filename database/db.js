// database/db.js
const Database = require('better-sqlite3');
const path = require('path');

const dbFileName = process.env.DB_FILE;
const dbPath = path.join(__dirname, '../', dbFileName);

const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV !== 'production' ? console.log : null
});

console.log(`📦 Banco de dados conectado: ${dbPath}`);

module.exports = db;