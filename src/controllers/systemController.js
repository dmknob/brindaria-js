const db = require('../../database/db');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

module.exports = {
    // Renderiza a tela de opções
    getIndex: (req, res) => {
        // Pega informações básicas para mostrar na tela
        const dbStats = fs.statSync(db.name);
        const dbSizeMB = (dbStats.size / 1024 / 1024).toFixed(2);
        
        res.render('admin/sistema', {
            title: 'Configurações do Sistema',
            dbSizeMB
        });
    },

    // Processa o Download do Backup Completo
    downloadBackup: async (req, res) => {
        const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const filename = `backup-brindaria-${date}.zip`;
        const tempDbBackup = path.join(__dirname, '../../temp_backup.db');

        // Configura o Header para download
        res.attachment(filename);

        // 1. Cria o Stream do ZIP direto para a resposta (Browser)
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compressão máxima
        });

        // Se der erro no zip, aborta
        archive.on('error', (err) => {
            console.error('Erro no backup:', err);
            res.status(500).send({ error: err.message });
        });

        // Conecta o zip à resposta
        archive.pipe(res);

        try {
            // 2. Snapshot Seguro do Banco (Mesmo sem WAL, é bom usar a API de backup)
            await db.backup(tempDbBackup);
            
            // Adiciona o banco ao ZIP
            archive.file(tempDbBackup, { name: 'database.sqlite' });

            // 3. Adiciona as pastas de imagens
            const uploadsDir = path.join(__dirname, '../../public/uploads');
            const assetsDir = path.join(__dirname, '../../public/images');

            // Adiciona diretórios se existirem
            if (fs.existsSync(uploadsDir)) {
                archive.directory(uploadsDir, 'public/uploads');
            }
            if (fs.existsSync(assetsDir)) {
                archive.directory(assetsDir, 'public/images');
            }

            // 4. Finaliza (Isso envia o arquivo para o usuário)
            await archive.finalize();

            // Limpa o arquivo temporário do banco após terminar o envio
            // (O evento 'finish' da resposta pode ser usado, ou um timeout simples pois é arquivo temp)
            fs.unlink(tempDbBackup, (err) => { if(err) console.error(err); });

        } catch (err) {
            console.error('Falha ao gerar backup:', err);
            if (!res.headersSent) res.status(500).send('Erro ao gerar backup');
        }
    }
};