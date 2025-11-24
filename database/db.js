// database/db.js
const Database = require('better-sqlite3');
const path = require('path');

// Define o caminho absoluto para o arquivo do banco na raiz do projeto
// __dirname é a pasta atual (database/), então subimos um nível (../)
const dbPath = path.join(__dirname, '../brindaria.db');

// Configurações da conexão
const db = new Database(dbPath, {
    // Verbose: imprime no console as queries executadas (ótimo para debug em dev)
    // Desativamos em produção para não poluir os logs
    verbose: process.env.NODE_ENV !== 'production' ? console.log : null
});

// OTIMIZAÇÃO DE PERFORMANCE (CRÍTICO)
// Ativa o modo WAL (Write-Ahead Logging) para permitir leituras e escritas simultâneas.
// Sem isso, o site pode travar para visitantes enquanto você edita algo no Admin.
db.pragma('journal_mode = WAL');

console.log(`📦 Banco de dados conectado com sucesso: ${dbPath}`);

module.exports = db;