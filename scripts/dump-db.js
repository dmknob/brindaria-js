require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const SEEDS_DIR = path.join(__dirname, '../database/seeds');
const DUMP_FILE = path.join(SEEDS_DIR, 'data_dump.json');

if (!fs.existsSync(SEEDS_DIR)) {
    fs.mkdirSync(SEEDS_DIR, { recursive: true });
}

console.log(`📦 Iniciando Dump do banco de dados (V2.2)...`);

try {
    const data = {
        metadata: {
            timestamp: new Date().toISOString(),
            source_env: process.env.NODE_ENV,
            version: '2.2'
        },
        tables: {}
    };

    // 1. Categorias
    data.tables.categorias = db.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
    console.log(`   - ${data.tables.categorias.length} categorias.`);

    // 2. Figuras (Ex-Modelos)
    // Tenta ler 'figuras', se falhar (banco velho), avisa
    try {
        data.tables.figuras = db.prepare('SELECT * FROM figuras ORDER BY id ASC').all();
        console.log(`   - ${data.tables.figuras.length} figuras.`);
    } catch (e) {
        console.warn('   ⚠️ Tabela "figuras" não encontrada. Tentando "modelos"...');
        data.tables.figuras = db.prepare('SELECT * FROM modelos ORDER BY id ASC').all();
        console.log(`   - ${data.tables.figuras.length} modelos (serão importados como figuras).`);
    }

    // 3. Chaves
    data.tables.chaves_reserva = db.prepare('SELECT * FROM chaves_reserva ORDER BY id ASC').all();
    console.log(`   - ${data.tables.chaves_reserva.length} chaves reserva.`);

    // 4. Peças
    data.tables.pecas = db.prepare('SELECT * FROM pecas ORDER BY id ASC').all();
    console.log(`   - ${data.tables.pecas.length} peças.`);

    fs.writeFileSync(DUMP_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Dump salvo em: ${DUMP_FILE}`);

} catch (err) {
    console.error('❌ Erro ao gerar dump:', err);
    process.exit(1);
}