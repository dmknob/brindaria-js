// scripts/list-keys.js
require('dotenv').config();
const db = require('../database/db');

console.log('='.repeat(50));
console.log('🔑 RELATÓRIO DE CHAVES DE ACESSO - BRINDARIA');
console.log('='.repeat(50));

try {
    // ---------------------------------------------------------
    // 1. Listar Chaves DISPONÍVEIS (Reserva)
    // ---------------------------------------------------------
    const disponiveis = db.prepare(`
        SELECT chave, created_at 
        FROM chaves_reserva 
        ORDER BY created_at ASC
    `).all();

    console.log(`\n✅ DISPONÍVEIS (Fila de Espera): ${disponiveis.length}`);
    console.log('-'.repeat(50));
    
    if (disponiveis.length === 0) {
        console.log('   (Nenhuma chave disponível. Execute o sistema para gerar mais)');
    } else {
        disponiveis.forEach((row, index) => {
            // Marca a primeira com uma seta, pois é a que aparecerá no site
            const pointer = index === 0 ? '👉' : '  '; 
            console.log(`   ${pointer} ${row.chave}  (Criada em: ${row.created_at})`);
        });
    }

    // ---------------------------------------------------------
    // 2. Listar Chaves USADAS (Peças)
    // ---------------------------------------------------------
    // Fazemos um LEFT JOIN para mostrar o nome da figura associada
    const usadas = db.prepare(`
        SELECT p.chave_acesso, p.created_at, f.nome as nome_figura
        FROM pecas p
        LEFT JOIN figuras f ON p.figura_id = f.id
        ORDER BY p.created_at DESC
    `).all();

    console.log(`\n❌ USADAS (Já vinculadas a peças): ${usadas.length}`);
    console.log('-'.repeat(50));

    if (usadas.length === 0) {
        console.log('   (Nenhuma chave utilizada até o momento)');
    } else {
        usadas.forEach(row => {
            const figura = row.nome_figura || 'Desconhecido/Deletado';
            console.log(`   🔒 ${row.chave_acesso}  ->  ${figura}`);
            console.log(`      └─ Data de uso: ${row.created_at}`);
        });
    }

    console.log('\n' + '='.repeat(50));

} catch (error) {
    console.error('❌ Erro ao listar chaves:', error.message);
}