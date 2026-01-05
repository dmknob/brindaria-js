// scripts/add-key.js
require('dotenv').config();
const db = require('../database/db');

// 1. Captura o argumento
const args = process.argv.slice(2);
const rawKey = args[0];

if (!rawKey) {
    console.error('❌ Erro: Nenhuma chave fornecida.');
    console.error('   Uso: node scripts/add-key.js <CHAVE>');
    process.exit(1);
}

const keyToSet = rawKey.trim().toUpperCase();
console.log(`🔍 Preparando para definir a próxima chave como: "${keyToSet}"...`);

try {
    // 2. Verificação de Segurança: A chave já foi usada em uma peça vendida?
    const checkPecas = db.prepare('SELECT 1 FROM pecas WHERE chave_acesso = ?').get(keyToSet);
    
    if (checkPecas) {
        console.error(`⛔ Ação abortada: A chave "${keyToSet}" JÁ ESTÁ EM USO em uma peça.`);
        process.exit(1);
    }

    // 3. Verificação de Segurança: A chave já é a próxima da fila?
    // Busca a primeira chave da fila (a mais antiga/próxima a ser usada)
    const nextKey = db.prepare('SELECT id, chave FROM chaves_reserva ORDER BY created_at ASC LIMIT 1').get();

    if (!nextKey) {
        // Caso raro: não há chaves na reserva. Nesse caso, inserimos.
        console.log('⚠️  Nenhuma chave na reserva para substituir. Criando novo registro...');
        const insert = db.prepare('INSERT INTO chaves_reserva (chave) VALUES (?)');
        insert.run(keyToSet);
        console.log(`✅ Sucesso! Chave "${keyToSet}" inserida.`);
        process.exit(0);
    }

    if (nextKey.chave === keyToSet) {
        console.log(`⚠️  A chave "${keyToSet}" já é a primeira da fila. Nenhuma ação necessária.`);
        process.exit(0);
    }

    // 4. Ação: Sobreescrever (Swap)
    // Substituímos a chave aleatória gerada pelo sistema pela sua chave personalizada
    const update = db.prepare('UPDATE chaves_reserva SET chave = ? WHERE id = ?');
    const info = update.run(keyToSet, nextKey.id);

    if (info.changes > 0) {
        console.log(`✅ Sucesso! A chave antiga "${nextKey.chave}" foi substituída por "${keyToSet}".`);
        console.log(`🚀 Ela agora é a primeira da fila e deve aparecer no topo da lista do site.`);
    } else {
        console.error('❌ Erro ao tentar atualizar o registro.');
    }

} catch (error) {
    console.error('❌ Erro de execução:', error.message);
    process.exit(1);
}