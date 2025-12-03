require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

// Caminho do arquivo de Dump
const SEEDS_DIR = path.join(__dirname, '../database/seeds');
const DUMP_FILE = path.join(SEEDS_DIR, 'data_dump.json');

// Garante que a pasta existe
if (!fs.existsSync(SEEDS_DIR)) {
    fs.mkdirSync(SEEDS_DIR, { recursive: true });
}

console.log(`📦 Iniciando Dump do banco de dados...`);

try {
    const data = {
        metadata: {
            timestamp: new Date().toISOString(),
            source_env: process.env.NODE_ENV || 'development'
        },
        tables: {}
    };

    // 1. Ler Categorias
    data.tables.categorias = db.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
    console.log(`   - ${data.tables.categorias.length} categorias exportadas.`);

    // 2. Ler Modelos
    data.tables.modelos = db.prepare('SELECT * FROM modelos ORDER BY id ASC').all();
    console.log(`   - ${data.tables.modelos.length} modelos exportados.`);

    // 3. Ler Chaves Reserva
    data.tables.chaves_reserva = db.prepare('SELECT * FROM chaves_reserva ORDER BY id ASC').all();
    console.log(`   - ${data.tables.chaves_reserva.length} chaves reserva exportadas.`);

    // 4. Ler Peças
    data.tables.pecas = db.prepare('SELECT * FROM pecas ORDER BY id ASC').all();
    console.log(`   - ${data.tables.pecas.length} peças exportadas.`);

    // Salvar arquivo
    fs.writeFileSync(DUMP_FILE, JSON.stringify(data, null, 2));
    
    console.log(`✅ Dump salvo com sucesso em:`);
    console.log(`   ${DUMP_FILE}`);
    console.log(`⚠️  ATENÇÃO: Este arquivo contém dados reais. Não comite no Git!`);

} catch (err) {
    console.error('❌ Erro ao gerar dump:', err);
    process.exit(1);
}