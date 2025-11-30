require('dotenv').config();
const db = require('../database/db');
const { generateUniqueKey } = require('../src/utils/keyGenerator');

console.log('🔐 Iniciando Migração de Chaves de Acesso...');

const migrate = db.transaction(() => {
    // 1. Adicionar coluna chave_acesso na tabela pecas
    try {
        // Verifica se a coluna já existe
        const tableInfo = db.prepare("PRAGMA table_info(pecas)").all();
        const hasColumn = tableInfo.some(col => col.name === 'chave_acesso');

        if (!hasColumn) {
            console.log('📝 Adicionando coluna chave_acesso...');
            db.prepare("ALTER TABLE pecas ADD COLUMN chave_acesso TEXT").run();
            console.log('✅ Coluna adicionada.');
        } else {
            console.log('ℹ️ Coluna chave_acesso já existe.');
        }
    } catch (error) {
        console.error('❌ Erro ao alterar tabela pecas:', error);
        throw error;
    }

    // 2. Criar tabela de chaves de reserva
    try {
        console.log('📝 Criando tabela chaves_reserva...');
        db.prepare(`
            CREATE TABLE IF NOT EXISTS chaves_reserva (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        console.log('✅ Tabela chaves_reserva pronta.');
    } catch (error) {
        console.error('❌ Erro ao criar tabela chaves_reserva:', error);
        throw error;
    }

    // 3. Gerar chaves para peças existentes
    const pecasSemChave = db.prepare("SELECT id, codigo_exibicao FROM pecas WHERE chave_acesso IS NULL").all();

    if (pecasSemChave.length > 0) {
        console.log(`🔄 Gerando chaves para ${pecasSemChave.length} peças existentes...`);

        const updatePeca = db.prepare("UPDATE pecas SET chave_acesso = ? WHERE id = ?");

        for (const peca of pecasSemChave) {
            const novaChave = generateUniqueKey(db);
            updatePeca.run(novaChave, peca.id);
            console.log(`   > Peça ${peca.codigo_exibicao} (ID: ${peca.id}) -> Chave: ${novaChave}`);
        }
    } else {
        console.log('ℹ️ Nenhuma peça precisa de chave nova.');
    }

    // 4. Adicionar restrição UNIQUE e NOT NULL (SQLite não suporta adicionar NOT NULL em ALTER TABLE facilmente, 
    // então garantimos via índice único e validação na aplicação, ou recriamos a tabela. 
    // Para simplificar e ser seguro, vamos criar um índice único agora que todos têm dados)
    try {
        console.log('📝 Criando índice único para chaves...');
        db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_pecas_chave_acesso ON pecas(chave_acesso)").run();
        console.log('✅ Índice criado.');
    } catch (error) {
        console.error('❌ Erro ao criar índice:', error);
        throw error;
    }

});

try {
    migrate();
    console.log('✨ Migração de chaves concluída com sucesso!');
} catch (error) {
    console.error('💥 Falha fatal na migração:', error);
    process.exit(1);
}
