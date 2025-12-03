const Database = require('better-sqlite3');
const path = require('path');

// --- ALTERAÇÃO PARA AMBIENTES MÚLTIPLOS (Dev/Staging/Prod) ---
// Lê o nome do arquivo do .env ou usa 'brindaria.db' como padrão se não estiver definido
const dbFileName = process.env.DB_FILE || 'brindaria.db';

// Define o caminho absoluto para o arquivo do banco na raiz do projeto
const dbPath = path.join(__dirname, '../', dbFileName);

// Configurações da conexão
const db = new Database(dbPath, {
    // Verbose: imprime no console as queries executadas (ótimo para debug em dev)
    verbose: process.env.NODE_ENV !== 'production' ? console.log : null
});

// OTIMIZAÇÃO DE PERFORMANCE
db.pragma('journal_mode = WAL');

console.log(`📦 Banco de dados conectado com sucesso: ${dbPath}`);

module.exports = db;