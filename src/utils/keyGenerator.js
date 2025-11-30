/**
 * Gerador de Chaves de Acesso (Base32 Crockford simplificado)
 * Evita caracteres ambíguos (I, L, 1, O, 0)
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 32 caracteres
const KEY_LENGTH = 5;

/**
 * Gera uma chave aleatória de 5 caracteres
 * @returns {string} Chave gerada (ex: "A7X2M")
 */
function generateKey() {
    let key = '';
    for (let i = 0; i < KEY_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * ALPHABET.length);
        key += ALPHABET[randomIndex];
    }
    return key;
}

/**
 * Garante que a chave é única no banco de dados
 * @param {Object} db Instância do better-sqlite3
 * @returns {string} Chave única
 */
function generateUniqueKey(db) {
    let key;
    let exists = true;

    // Tenta gerar até encontrar uma livre (probabilidade de colisão é baixa com 33 milhões de combinações)
    while (exists) {
        key = generateKey();

        // Verifica na tabela de peças
        const inPecas = db.prepare('SELECT 1 FROM pecas WHERE chave_acesso = ?').get(key);

        // Verifica na tabela de reserva (se existir a tabela)
        let inReserva = false;
        try {
            inReserva = db.prepare('SELECT 1 FROM chaves_reserva WHERE chave = ?').get(key);
        } catch (e) {
            // Tabela pode não existir ainda durante migração inicial
        }

        if (!inPecas && !inReserva) {
            exists = false;
        }
    }

    return key;
}

/**
 * Garante que existam chaves pré-geradas na tabela de reserva
 * @param {Object} db Instância do better-sqlite3
 * @param {number} count Quantidade mínima de chaves
 * @returns {Array} Lista das chaves de reserva atuais
 */
function ensureReserveKeys(db, count = 10) {
    // 1. Conta quantas temos
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM chaves_reserva').get().count;

    // 2. Gera as que faltam
    if (currentCount < count) {
        const needed = count - currentCount;
        const insert = db.prepare('INSERT INTO chaves_reserva (chave) VALUES (?)');

        const transaction = db.transaction(() => {
            for (let i = 0; i < needed; i++) {
                const key = generateUniqueKey(db);
                insert.run(key);
            }
        });

        transaction();
    }

    // 3. Retorna a lista atualizada
    return db.prepare('SELECT * FROM chaves_reserva ORDER BY created_at ASC LIMIT ?').all(count);
}

module.exports = { generateKey, generateUniqueKey, ensureReserveKeys };
