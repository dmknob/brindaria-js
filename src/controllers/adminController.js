// src/controllers/adminController.js
const db = require('../../database/db');
const auth = require('../middleware/auth');
//const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const https = require('https');
const slugify = require('slugify');
const { ensureReserveKeys, generateUniqueKey } = require('../utils/keyGenerator');
const { log } = require('console');

// --- FUNÇÕES AUXILIARES ---

const downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        // Caminho definitivo para V2.1
        const dir = path.join(__dirname, '../../public/uploads/figuras');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filepath = path.join(dir, filename);
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Falha ao baixar: Status ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(`/uploads/figuras/${filename}`));
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

module.exports = {

    // =========================================
    // AUTENTICAÇÃO
    // =========================================

    getLogin: (req, res) => {

        //logger.info("Admin login page accessed");

        res.render('admin/login', { title: 'Acesso Restrito', error: null });
    },

    postLogin: (req, res) => {
        //logger.info("Admin login attempt", { ip: req.ip });

        const { password } = req.body;
        if (auth.checkPassword(password)) {
            req.session.admin = true;
            const redirect = req.session.returnTo || '/admin/dashboard';
            delete req.session.returnTo;
            res.redirect(redirect);
        } else {
            res.render('admin/login', { title: 'Acesso Restrito', error: 'Senha incorreta.' });
        }
    },

    logout: (req, res) => {
        logger.info("Admin logged out", { ip: req.ip });

        req.session.destroy();
        res.redirect('/');
    },

    // =========================================
    // DASHBOARD
    // =========================================

    getDashboard: (req, res) => {

        //logger.info("Admin dashboard accessed");

        const totalPecas = db.prepare('SELECT COUNT(*) as count FROM pecas').get().count;
        const totalFiguras = db.prepare('SELECT COUNT(*) as count FROM figuras').get().count;

        const limitePecas = parseInt(process.env.PAGINACAO_PECAS, 10) || 8;
        
        const ultimasPecas = db.prepare(`
            SELECT p.*, f.nome as figura_nome, f.slug 
            FROM pecas p 
            JOIN figuras f ON p.figura_id = f.id 
            ORDER BY p.id DESC LIMIT ?
        `).all(limitePecas);

        const chavesReserva = ensureReserveKeys(db, 10);

        res.render('admin/dashboard', {
            title: 'Painel Admin',
            totalPecas,
            totalFiguras,
            ultimasPecas
        });
    },

    // ==========================================
    // GESTÃO DE CATEGORIAS - FALTA CONCLUIR CRUD
    // ==========================================

    getCategorias: (req, res) => {

        //logger.info("Admin categorias page accessed");

        const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome ASC').all();
        
        const contagem = db.prepare('SELECT categoria_id, COUNT(*) as total FROM figuras GROUP BY categoria_id').all();
        const mapContagem = {};
        contagem.forEach(c => mapContagem[c.categoria_id] = c.total);

        res.render('admin/categorias', {
            title: 'Categorias',
            categorias,
            mapContagem
        });
    },

    postNovaCategoria: (req, res) => {

        //logger.info("Admin creating new categoria", { nome: req.body.nome });

        const { nome } = req.body;
        const slug = slugify(nome, { lower: true, strict: true });

        try {
            const insert = db.prepare('INSERT INTO categorias (nome, slug) VALUES (?, ?)');
            insert.run(nome, slug);
            res.redirect('/admin/categorias');
        } catch (err) {
            console.error(err);
            res.redirect('/admin/categorias?error=duplicate');
        }
    },

    // =========================================
    // GESTÃO DE FIGURAS
    // =========================================

    getFiguras: (req, res) => {

        //logger.info("Admin figuras page accessed", { query: req.query });
            
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(process.env.PAGINACAO_FIGURAS, 10) || 9;
        const offset = (page - 1) * limit;

        const figuras = db.prepare(`
            SELECT * FROM figuras
            ORDER BY nome ASC 
            LIMIT ? OFFSET ?
        `).all(limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM figuras').get().count;
        const totalPages = Math.ceil(total / limit);

        const categorias = db.prepare('SELECT id, nome FROM categorias').all();
        // Full list used for quick-select dropdown in admin UI
        const figurasAll = db.prepare('SELECT id, nome FROM figuras ORDER BY nome ASC').all();
        const catMap = {};
        categorias.forEach(c => catMap[c.id] = c.nome);

        console.log("Figuras All: ", figurasAll);

        res.render('admin/lista-figuras', {
            title: 'Gerenciar Figuras',
            figuras,
            catMap,
            figurasAll,
            currentPage: page,
            totalPages
        });
    },

    getNovaFigura: (req, res) => {

        //logger.info("Admin new figura page accessed");

        const categorias = db.prepare('SELECT * FROM categorias').all();
        res.render('admin/form-figura', {
            title: 'Nova Figura',
            categorias,
            figura: null
        });
    },

    postNovaFigura: async (req, res) => {

        //logger.info("Admin creating new figura", { nome: req.body.nome });

        const {
            nome, categoria_id, subtitulo, colecao,
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais,
            imagem_url_externa, imagem_arquivo_manual, slug, ativo_check
        } = req.body;

        const finalSlug = slugify(slug || nome, { lower: true, strict: true });
        const ativo = ativo_check ? 1 : 0;

        try {
            let finalImagePath = '/images/placeholder-brindaria.webp';

            if (imagem_url_externa && imagem_url_externa.trim() !== "") {
                const ext = path.extname(imagem_url_externa.split('?')[0]) || '.jpg';
                const filename = `${finalSlug}${ext}`;
                finalImagePath = await downloadImage(imagem_url_externa, filename);
            } else if (imagem_arquivo_manual && imagem_arquivo_manual.trim() !== "") {
                finalImagePath = `/uploads/figuras/${imagem_arquivo_manual.trim()}`;
            }

            const insert = db.prepare(`
                INSERT INTO figuras (
                    categoria_id, nome, slug, subtitulo, colecao, imagem_url,
                    conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                    historia, oracao, detalhes_visuais, ativo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insert.run(
                categoria_id, nome, finalSlug, subtitulo, colecao, finalImagePath,
                conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                historia, oracao, detalhes_visuais, ativo
            );

            res.redirect('/admin/figuras'); // Rota atualizada no adminRoutes
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao criar figura: " + err.message);
        }
    },

    getEditarFigura: (req, res) => {

        //logger.info("Admin editing figura page accessed", { id: req.params.id });

        const { id } = req.params;
        const figura = db.prepare('SELECT * FROM figuras WHERE id = ?').get(id);
        const categorias = db.prepare('SELECT * FROM categorias').all();

        if (!figura) return res.status(404).send('Figura não encontrada');

        res.render('admin/form-figura', {
            title: `Editar ${figura.nome}`,
            categorias,
            figura
        });
    },

    postEditarFigura: async (req, res) => {

        //logger.info("Admin updating figura", { id: req.params.id, nome: req.body.nome });

        const { id } = req.params;
        const {
            nome, categoria_id, subtitulo, colecao,
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais,
            imagem_url_externa, imagem_arquivo_manual, slug, ativo_check
        } = req.body;

        try {
            const finalSlug = slugify(slug || nome, { lower: true, strict: true });
            const ativo = ativo_check ? 1 : 0;

            let imageSqlFragment = "";
            const params = [
                categoria_id, nome, subtitulo, colecao,
                conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                historia, oracao, detalhes_visuais, finalSlug, ativo
            ];

            if (imagem_url_externa && imagem_url_externa.trim() !== "") {
                const currentSlug = db.prepare('SELECT slug FROM figuras WHERE id = ?').get(id).slug;
                const ext = path.extname(imagem_url_externa.split('?')[0]) || '.jpg';
                const filename = `${currentSlug}${ext}`;
                const localPath = await downloadImage(imagem_url_externa, filename);
                imageSqlFragment = ", imagem_url = ?";
                params.push(localPath);
            } else if (imagem_arquivo_manual && imagem_arquivo_manual.trim() !== "") {
                imageSqlFragment = ", imagem_url = ?";
                params.push(`/uploads/figuras/${imagem_arquivo_manual.trim()}`);
            }

            params.push(id);

            db.prepare(`
                UPDATE figuras SET 
                    categoria_id = ?, nome = ?, subtitulo = ?, colecao = ?,
                    conhecido_como = ?, dia_celebracao = ?, invocado_para = ?, locais_devocao = ?, variacoes_nome = ?,
                    historia = ?, oracao = ?, detalhes_visuais = ?, slug = ?, ativo = ?
                    ${imageSqlFragment}
                WHERE id = ?
            `).run(...params);

            res.redirect('/admin/figuras');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao editar figura: " + err.message);
        }
    },

    postDeletarFigura: (req, res) => {
        try {
            const { id } = req.params;

            // Verifica se existem peças vinculadas a esta figura
            const linkedCount = db.prepare('SELECT COUNT(*) as count FROM pecas WHERE figura_id = ?').get(id).count;
            if (linkedCount > 0) {
                console.warn(`Tentativa de excluir figura ${id} com ${linkedCount} peça(s) vinculada(s)`);
                // Redireciona com flag de erro para que a UI possa exibir uma mensagem amigável
                return res.redirect('/admin/figuras?error=linked');
            }

            db.prepare('DELETE FROM figuras WHERE id = ?').run(id);
            res.redirect('/admin/figuras');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao excluir figura: " + err.message);
        }
    },

    // =========================================
    // GESTÃO DE PEÇAS
    // =========================================

    getPecas: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(process.env.PAGINACAO_PECAS, 10) || 10;
        const offset = (page - 1) * limit;
        const filtroFigura = req.query.figura || '';

        let sql = `
            SELECT p.*, f.nome as figura_nome, f.slug as figura_slug 
            FROM pecas p
            JOIN figuras f ON p.figura_id = f.id
        `;
        const params = [];

        if (filtroFigura) {
            sql += ` WHERE p.figura_id = ?`;
            params.push(filtroFigura);
        }

        sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const pecas = db.prepare(sql).all(...params);

        let countSql = `SELECT COUNT(*) as count FROM pecas`;
        let countParams = [];
        if (filtroFigura) {
            countSql += ` WHERE figura_id = ?`;
            countParams.push(filtroFigura);
        }
        const total = db.prepare(countSql).get(...countParams).count;

        const figuras = db.prepare('SELECT id, nome FROM figuras ORDER BY nome ASC').all();

        res.render('admin/lista-pecas', {
            title: 'Gerenciar Peças',
            pecas,
            figuras,
            filtroFigura,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    },

    getNovaPeca: (req, res) => {
        const figuras = db.prepare('SELECT id, nome FROM figuras ORDER BY nome').all();
        const chavesReserva = ensureReserveKeys(db, 10);
        res.render('admin/form-peca', {
            title: 'Registrar Peça',
            figuras,
            peca: null,
            chavesReserva
        });
    },

    postNovaPeca: (req, res) => {
        const {
            figura_id,
            codigo_exibicao, inscricao_base, tamanho, material, acabamento,
            cliente_nome, mensagem, data_producao, chave_acesso
        } = req.body;

        try {
            let finalKey = chave_acesso;
            if (finalKey) {
                // Se usou uma reserva, remove da tabela de reserva
                const inReserva = db.prepare('SELECT id FROM chaves_reserva WHERE chave = ?').get(finalKey);
                if (inReserva) db.prepare('DELETE FROM chaves_reserva WHERE id = ?').run(inReserva.id);
            } else {
                finalKey = generateUniqueKey(db);
            }

            // Código Sequencial (Opcional)
            const codigo_sequencial = codigo_exibicao ? (parseInt(codigo_exibicao.replace(/\D/g, ''), 10) || 0) : null;

            const insert = db.prepare(`
                INSERT INTO pecas (
                    figura_id, codigo_sequencial, codigo_exibicao, 
                    inscricao_base, tamanho, material, acabamento,
                    cliente_nome, mensagem, data_producao, chave_acesso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // IMPORTANTE: || null garante que campos vazios virem NULL no banco
            insert.run(
                figura_id, 
                codigo_sequencial || null, 
                codigo_exibicao || null,
                inscricao_base || null, 
                tamanho || null, 
                material || null, 
                acabamento || null,
                cliente_nome || null, 
                mensagem || null, 
                data_producao || null, 
                finalKey
            );

            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao salvar peça: " + err.message);
        }
    },

    getEditarPeca: (req, res) => {
        const peca = db.prepare('SELECT * FROM pecas WHERE id = ?').get(req.params.id);
        const figuras = db.prepare('SELECT id, nome FROM figuras ORDER BY nome').all();

        if (!peca) return res.status(404).send('Peça não encontrada');

        res.render('admin/form-peca', {
            title: `Editar Peça #${peca.codigo_exibicao || peca.chave_acesso}`,
            figuras,
            peca,
            chavesReserva: []
        });
    },

    postEditarPeca: (req, res) => {
        const { id } = req.params;
        const {
            figura_id, codigo_exibicao, inscricao_base,
            tamanho, material, acabamento, cliente_nome, mensagem, data_producao
        } = req.body;

        try {
            const codigo_sequencial = codigo_exibicao ? (parseInt(codigo_exibicao.replace(/\D/g, ''), 10) || 0) : null;

            db.prepare(`
                UPDATE pecas SET 
                    figura_id = ?, codigo_exibicao = ?, codigo_sequencial = ?, inscricao_base = ?,
                    tamanho = ?, material = ?, acabamento = ?,
                    cliente_nome = ?, mensagem = ?, data_producao = ?
                WHERE id = ?
            `).run(
                figura_id, 
                codigo_exibicao || null, 
                codigo_sequencial || null, 
                inscricao_base || null,
                tamanho || null, 
                material || null, 
                acabamento || null,
                cliente_nome || null, 
                mensagem || null, 
                data_producao || null, 
                id
            );
            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao editar peça: " + err.message);
        }
    },

    postDeletarPeca: (req, res) => {
        try {
            db.prepare('DELETE FROM pecas WHERE id = ?').run(req.params.id);
            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao excluir peça: " + err.message);
        }
    }
};