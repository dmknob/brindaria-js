// src/controllers/adminController.js
const db = require('../../database/db');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const https = require('https');
const slugify = require('slugify');

// --- FUNÇÕES AUXILIARES ---

// Faz download de uma imagem externa e salva na pasta public/uploads
const downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        // Garante que o diretório existe
        const dir = path.join(__dirname, '../../public/uploads/modelos');
        if (!fs.existsSync(dir)){
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
                file.close(() => resolve(`/uploads/modelos/${filename}`));
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Apaga arquivo corrompido se der erro
            reject(err);
        });
    });
};

module.exports = {
    
    // =========================================
    // AUTENTICAÇÃO
    // =========================================

    getLogin: (req, res) => {
        res.render('admin/login', { title: 'Acesso Restrito', error: null });
    },

    postLogin: (req, res) => {
        const { password } = req.body;
        // Verifica a senha usando o hash do .env
        if (auth.checkPassword(password)) {
            req.session.admin = true;
            const redirect = req.session.returnTo || '/admin/dashboard';
            delete req.session.returnTo;
            res.redirect(redirect);
        } else {
            // Renderiza novamente com mensagem de erro
            res.render('admin/login', { title: 'Acesso Restrito', error: 'Senha incorreta.' });
        }
    },

    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/');
    },

    // =========================================
    // DASHBOARD
    // =========================================

    getDashboard: (req, res) => {
        // Estatísticas para os cards
        const totalPecas = db.prepare('SELECT COUNT(*) as count FROM pecas').get().count;
        const totalModelos = db.prepare('SELECT COUNT(*) as count FROM modelos').get().count;

        // Tabela de últimas vendas (Join para pegar o nome do modelo)
        const ultimasVendas = db.prepare(`
            SELECT p.*, m.nome as modelo_nome, m.slug 
            FROM pecas p 
            JOIN modelos m ON p.modelo_id = m.id 
            ORDER BY p.id DESC LIMIT 5
        `).all();

        res.render('admin/dashboard', { 
            title: 'Painel Admin', 
            totalPecas, 
            totalModelos,
            ultimasVendas 
        });
    },

    // =========================================
    // GESTÃO DE CATEGORIAS (AQUI ESTÁ!)
    // =========================================

    getCategorias: (req, res) => {
        const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome ASC').all();
        
        // Conta quantos modelos existem em cada categoria (para info visual)
        const contagem = db.prepare('SELECT categoria_id, COUNT(*) as total FROM modelos GROUP BY categoria_id').all();
        const mapContagem = {};
        contagem.forEach(c => mapContagem[c.categoria_id] = c.total);

        res.render('admin/categorias', { 
            title: 'Categorias', 
            categorias,
            mapContagem 
        });
    },

    postNovaCategoria: (req, res) => {
        const { nome } = req.body;
        const slug = slugify(nome, { lower: true, strict: true });

        try {
            const insert = db.prepare('INSERT INTO categorias (nome, slug) VALUES (?, ?)');
            insert.run(nome, slug);
            res.redirect('/admin/categorias');
        } catch (err) {
            console.error(err);
            // Se der erro (ex: slug duplicado), redireciona com flag de erro
            res.redirect('/admin/categorias?error=duplicate');
        }
    },

    // =========================================
    // GESTÃO DE MODELOS (CRUD)
    // =========================================

    // Listagem com Paginação
    getModelos: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const offset = (page - 1) * limit;

        const modelos = db.prepare(`
            SELECT id, nome, categoria_id, imagem_url, slug 
            FROM modelos 
            ORDER BY nome ASC 
            LIMIT ? OFFSET ?
        `).all(limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM modelos').get().count;
        const totalPages = Math.ceil(total / limit);

        // Mapa de categorias para exibir nome em vez de ID
        const categorias = db.prepare('SELECT id, nome FROM categorias').all();
        const catMap = {};
        categorias.forEach(c => catMap[c.id] = c.nome);

        res.render('admin/lista-modelos', {
            title: 'Gerenciar Modelos',
            modelos,
            catMap,
            currentPage: page,
            totalPages
        });
    },

    // Formulário de Criação
    getNovoModelo: (req, res) => {
        const categorias = db.prepare('SELECT * FROM categorias').all();
        res.render('admin/form-modelo', { 
            title: 'Novo Modelo', 
            categorias,
            modelo: null // null indica que é cadastro novo
        });
    },

    // Processar Criação (POST)
    postNovoModelo: async (req, res) => {
        const { 
            nome, categoria_id, subtitulo, colecao, 
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais, 
            imagem_url_externa, imagem_arquivo_manual, slug
        } = req.body;
        
        // Usa o slug do form, ou gera do nome se estiver vazio. Limpa caracteres inválidos.
        const finalSlug = slugify(slug || nome, { lower: true, strict: true });

        try {
            let finalImagePath = '/images/placeholder.jpg'; // Padrão

            // Prioridade: URL Externa > Arquivo Manual
            if (imagem_url_externa && imagem_url_externa.trim() !== "") {
                const ext = path.extname(imagem_url_externa.split('?')[0]) || '.jpg';
                const filename = `${slug}${ext}`;
                finalImagePath = await downloadImage(imagem_url_externa, filename);
            } else if (imagem_arquivo_manual && imagem_arquivo_manual.trim() !== "") {
                finalImagePath = `/uploads/modelos/${imagem_arquivo_manual.trim()}`;
            }

            const insert = db.prepare(`
                INSERT INTO modelos (
                    categoria_id, nome, slug, subtitulo, colecao, imagem_url,
                    conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                    historia, oracao, detalhes_visuais
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            insert.run(
                categoria_id, nome, slug, subtitulo, colecao, finalImagePath,
                conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                historia, oracao, detalhes_visuais
            );
            
            res.redirect('/admin/modelos');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao criar modelo: " + err.message);
        }
    },

    // Formulário de Edição
    getEditarModelo: (req, res) => {
        const { id } = req.params;
        const modelo = db.prepare('SELECT * FROM modelos WHERE id = ?').get(id);
        const categorias = db.prepare('SELECT * FROM categorias').all();

        if (!modelo) return res.status(404).send('Modelo não encontrado');

        res.render('admin/form-modelo', {
            title: `Editar ${modelo.nome}`,
            categorias,
            modelo // Envia dados existentes para preencher os inputs
        });
    },

    // Processar Edição (POST)
    postEditarModelo: async (req, res) => {
        const { id } = req.params;
        const { 
            nome, categoria_id, subtitulo, colecao, 
            conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
            historia, oracao, detalhes_visuais, 
            imagem_url_externa, imagem_arquivo_manual,
            slug // <--- Recebe do form
        } = req.body;

        try {
            // Tratamento do Slug na Edição
            // Se o usuário apagou o slug, regenera do nome. Se preencheu, sanitiza.
            const finalSlug = slugify(slug || nome, { lower: true, strict: true });

            let imageSqlFragment = "";
            const params = [
                categoria_id, nome, subtitulo, colecao,
                conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome,
                historia, oracao, detalhes_visuais,
                finalSlug // <--- Adiciona na lista de params
            ];
            // Só baixa nova imagem se o usuário preencheu algum campo
            if (imagem_url_externa && imagem_url_externa.trim() !== "") {
                const currentSlug = db.prepare('SELECT slug FROM modelos WHERE id = ?').get(id).slug;
                const ext = path.extname(imagem_url_externa.split('?')[0]) || '.jpg';
                const filename = `${currentSlug}${ext}`;
                const localImagePath = await downloadImage(imagem_url_externa, filename);
                
                imageSqlFragment = ", imagem_url = ?";
                params.push(localImagePath);

            } else if (imagem_arquivo_manual && imagem_arquivo_manual.trim() !== "") {
                const localImagePath = `/uploads/modelos/${imagem_arquivo_manual.trim()}`;
                imageSqlFragment = ", imagem_url = ?";
                params.push(localImagePath);
            }

            params.push(id); // ID para o WHERE

            const update = db.prepare(`
                UPDATE modelos SET 
                    categoria_id = ?, nome = ?, subtitulo = ?, colecao = ?,
                    conhecido_como = ?, dia_celebracao = ?, invocado_para = ?, locais_devocao = ?, variacoes_nome = ?,
                    historia = ?, oracao = ?, detalhes_visuais = ?,
                    slug = ? 
                    ${imageSqlFragment}
                WHERE id = ?
            `);
            
            update.run(...params);
            res.redirect('/admin/modelos');

        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao editar modelo: " + err.message);
        }
    },

    // =========================================
    // GESTÃO DE PEÇAS (CRUD)
    // =========================================

    // Listagem com Filtro e Paginação
    getPecas: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // 20 itens por página
        const offset = (page - 1) * limit;
        const filtroModelo = req.query.modelo || ''; // ID do modelo vindo do dropdown

        // 1. Prepara a Query Base
        let sql = `
            SELECT p.*, m.nome as modelo_nome, m.slug as modelo_slug 
            FROM pecas p
            JOIN modelos m ON p.modelo_id = m.id
        `;
        const params = [];

        // 2. Aplica Filtro se houver
        if (filtroModelo) {
            sql += ` WHERE p.modelo_id = ?`;
            params.push(filtroModelo);
        }

        // 3. Ordenação e Paginação (Mais recentes primeiro)
        sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const pecas = db.prepare(sql).all(...params);

        // 4. Conta total para paginação (respeitando o filtro)
        let countSql = `SELECT COUNT(*) as count FROM pecas`;
        let countParams = [];
        if (filtroModelo) {
            countSql += ` WHERE modelo_id = ?`;
            countParams.push(filtroModelo);
        }
        const total = db.prepare(countSql).get(...countParams).count;
        const totalPages = Math.ceil(total / limit);

        // 5. Busca lista de modelos para preencher o Dropdown de filtro
        const modelos = db.prepare('SELECT id, nome FROM modelos ORDER BY nome ASC').all();

        res.render('admin/lista-pecas', {
            title: 'Gerenciar Peças',
            pecas,
            modelos,      // Para o dropdown
            filtroModelo, // Para manter o dropdown selecionado
            currentPage: page,
            totalPages
        });
    },

    getNovaPeca: (req, res) => {
        const modelos = db.prepare('SELECT id, nome FROM modelos ORDER BY nome').all();
        res.render('admin/form-peca', { title: 'Registrar Peça', modelos, peca: null });
    },

    postNovaPeca: (req, res) => {
        // Adicione data_producao na extração do body
        const { 
            modelo_id, codigo_exibicao, codigo_sequencial, 
            inscricao_base, tamanho, material, acabamento,
            cliente_nome, mensagem, data_producao 
        } = req.body;
        
        try {
            const insert = db.prepare(`
                INSERT INTO pecas (
                    modelo_id, codigo_sequencial, codigo_exibicao, 
                    inscricao_base, tamanho, material, acabamento,
                    cliente_nome, mensagem, data_producao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            // Removemos a geração automática de data. Usamos a variável data_producao direto.
            insert.run(
                modelo_id, codigo_sequencial, codigo_exibicao,
                inscricao_base, tamanho, material, acabamento,
                cliente_nome, mensagem, data_producao
            );
            
            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao salvar peça: " + err.message);
        }
    },

    // --- EDIÇÃO DE PEÇAS ---
    
    getEditarPeca: (req, res) => {
        const { id } = req.params;
        const peca = db.prepare('SELECT * FROM pecas WHERE id = ?').get(id);
        const modelos = db.prepare('SELECT id, nome FROM modelos ORDER BY nome').all();

        if (!peca) return res.status(404).send('Peça não encontrada');

        res.render('admin/form-peca', {
            title: `Editar Peça #${peca.codigo_exibicao}`,
            modelos,
            peca // Passamos a peça para preencher o form
        });
    },

    postEditarPeca: (req, res) => {
        const { id } = req.params;
        // Adicione data_producao aqui
        const { 
            modelo_id, codigo_exibicao, inscricao_base, 
            tamanho, material, acabamento, cliente_nome, mensagem, data_producao 
        } = req.body;

        try {
            const update = db.prepare(`
                UPDATE pecas SET 
                    modelo_id = ?, codigo_exibicao = ?, inscricao_base = ?,
                    tamanho = ?, material = ?, acabamento = ?,
                    cliente_nome = ?, mensagem = ?, data_producao = ?
                WHERE id = ?
            `);
            
            // Adicione data_producao nos parâmetros (antes do ID)
            update.run(
                modelo_id, codigo_exibicao, inscricao_base,
                tamanho, material, acabamento, cliente_nome, mensagem, data_producao,
                id
            );
            
            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao editar peça: " + err.message);
        }
    },

    postDeletarPeca: (req, res) => {
        const { id } = req.params;
        try {
            db.prepare('DELETE FROM pecas WHERE id = ?').run(id);
            res.redirect('/admin/pecas');
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao excluir peça: " + err.message);
        }
    }
};