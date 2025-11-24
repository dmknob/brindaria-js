// setup-db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./database/db'); // Importa nossa conexão

const schemaPath = path.join(__dirname, 'database', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

console.log('🔄 Recriando tabelas do banco de dados...');

try {
    // O método .exec() do better-sqlite3 roda várias linhas de SQL de uma vez
    db.exec(schemaSql);
    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📂 Arquivo criado: brindaria.db');
} catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
}