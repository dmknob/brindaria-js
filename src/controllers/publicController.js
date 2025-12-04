// src/controllers/publicController.js
const db = require('../../database/db');

const publicController = {

    getHome: (req, res) => {
        // Apenas figuras ATIVAS na Home
        const figuras = db.prepare('SELECT * FROM figuras WHERE ativo = 1 ORDER BY nome ASC LIMIT 20').all();
        res.render('pages/home', { 
            title: 'Brindaria - Arte Sacra', 
            figuras: figuras,
            canonical: 'https://brindaria.com.br' 
        });
    },

    getContato: (req, res) => {
        res.render('pages/contato', { title: 'Contato', canonical: 'https://brindaria.com.br/contato' });
    },

    getCatalogo: (req, res) => {
        // Apenas figuras ATIVAS no Catálogo
        const figuras = db.prepare('SELECT * FROM figuras WHERE ativo = 1 ORDER BY nome ASC').all();
        res.render('pages/colecao', { 
            title: 'Nossa Coleção', 
            description: 'Acervo de arte sacra.', 
            figuras: figuras, 
            canonical: 'https://brindaria.com.br/pecas' 
        });
    },

    // Rota: /pecas/:categoria/:slug/:codigo?
    getDetalhe: (req, res) => {
        const { slug, codigo } = req.params;

        // Verifica se é admin (baseado na sessão configurada no app.js/adminRoutes.js)
        const isAdmin = req.session && req.session.admin;

        // 1. Buscar Figura (Removemos o filtro de ativo na query SQL para verificar via código)
        const figura = db.prepare('SELECT * FROM figuras WHERE slug = ?').get(slug);

        // Cenário 1: Figura não existe no banco
        if (!figura) {
            return res.status(404).render('pages/404', { title: 'Figura não encontrada' });
        }
        
        // Cenário 2: Figura existe, mas está INATIVA
        // Se NÃO estiver ativa E o usuário NÃO for admin -> 404
        if (figura.ativo !== 1 && !isAdmin) {
            return res.status(404).render('pages/404', { title: 'Figura não encontrada' });
        }

        let peca = null;
        let pageTitle = figura.nome;
        let canonical = `https://brindaria.com.br/pecas/espiritual/${slug}`;

        // 2. Buscar Peça Específica (Se houver código legado)
        if (codigo) {
            peca = db.prepare(`
                SELECT * FROM pecas 
                WHERE figura_id = ? AND codigo_exibicao = ?
            `).get(figura.id, codigo);

            if (!peca && !codigo.startsWith('#')) {
                peca = db.prepare(`
                    SELECT * FROM pecas 
                    WHERE figura_id = ? AND codigo_exibicao = ?
                `).get(figura.id, '#' + codigo);
            }
            
            if (peca) pageTitle = `Peça ${peca.codigo_exibicao} - ${figura.nome}`;
        }

        res.render('pages/peca-detalhe', { 
            figura: figura, 
            peca, 
            title: pageTitle, 
            description: figura.subtitulo, 
            canonical: peca ? canonical : null,
            isAdmin: isAdmin // Passamos essa flag para a view caso queira mostrar um aviso visual
        });
    },

    getSitemap: (req, res) => {
        // Apenas ativos no sitemap
        const figuras = db.prepare('SELECT slug FROM figuras WHERE ativo = 1').all();
        const baseUrl = 'https://brindaria.com.br';
        let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc><priority>1.0</priority></url><url><loc>${baseUrl}/pecas</loc><priority>0.8</priority></url>`;

        figuras.forEach(f => {
            xml += `<url><loc>${baseUrl}/pecas/espiritual/${f.slug}</loc><priority>0.9</priority></url>`;
        });
        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    },

    // Busca por Chave (Lógica nova V2.1)
    getPecaByKey: (req, res) => {
        const { chave } = req.params;
        
        const dados = db.prepare(`
            SELECT p.*, 
                   f.nome, f.subtitulo, f.slug as figura_slug, f.colecao, f.imagem_url,
                   f.conhecido_como, f.dia_celebracao, f.invocado_para, f.locais_devocao, f.variacoes_nome,
                   f.historia, f.oracao, f.detalhes_visuais,
                   c.slug as categoria_slug
            FROM pecas p
            JOIN figuras f ON p.figura_id = f.id
            LEFT JOIN categorias c ON f.categoria_id = c.id
            WHERE p.chave_acesso = ?
        `).get(chave);

        if (!dados) return res.status(404).render('pages/404', { title: 'Peça não encontrada' });

        // Remonta objetos para a view
        const figura = {
            nome: dados.nome, subtitulo: dados.subtitulo, slug: dados.figura_slug,
            colecao: dados.colecao, imagem_url: dados.imagem_url, conhecido_como: dados.conhecido_como,
            dia_celebracao: dados.dia_celebracao, invocado_para: dados.invocado_para, locais_devocao: dados.locais_devocao,
            variacoes_nome: dados.variacoes_nome, historia: dados.historia, oracao: dados.oracao, detalhes_visuais: dados.detalhes_visuais
        };

        const peca = {
            id: dados.id, codigo_exibicao: dados.codigo_exibicao || 'PENDENTE',
            inscricao_base: dados.inscricao_base, tamanho: dados.tamanho,
            material: dados.material, acabamento: dados.acabamento,
            data_producao: dados.data_producao, mensagem: dados.mensagem, cliente_nome: dados.cliente_nome
        };

        const canonical = `https://brindaria.com.br/pecas/${dados.categoria_slug || 'espiritual'}/${dados.figura_slug}`;

        res.render('pages/peca-detalhe', {
            title: `Autenticidade: ${figura.nome}`,
            description: `Verificação de autenticidade`,
            figura, peca, canonical
        });
    },

    postValidarPeca: (req, res) => {
        let { codigo } = req.body;
        if (!codigo) return res.redirect('/');
        codigo = codigo.trim().toUpperCase().replace('#', '');

        // 1. Tenta CHAVE (5 chars)
        const pecaPorChave = db.prepare(`
            SELECT p.chave_acesso FROM pecas p WHERE p.chave_acesso = ?
        `).get(codigo);

        if (pecaPorChave) {
            return res.redirect(`/v/${pecaPorChave.chave_acesso}`);
        }

        // 2. Tenta Código Legado (#001)
        let codigoLegado = codigo;
        if (/^\d+$/.test(codigo)) codigoLegado = codigo.padStart(3, '0');

        const pecasPorCodigo = db.prepare(`
            SELECT p.*, f.nome as figura_nome, f.slug as figura_slug, f.imagem_url
            FROM pecas p
            JOIN figuras f ON p.figura_id = f.id
            WHERE p.codigo_exibicao = ? OR p.codigo_exibicao = ?
        `).all(codigoLegado, '#' + codigoLegado);

        if (pecasPorCodigo.length === 1) {
            const p = pecasPorCodigo[0];
            // Se achou por código legado, redireciona para a rota de chave se possível, ou rota antiga
            return res.redirect(`/v/${p.chave_acesso}`);
        } else if (pecasPorCodigo.length > 1) {
            return res.render('pages/selecao-figura', { title: 'Selecione', codigo: codigoLegado, pecas: pecasPorCodigo });
        }

        return res.render('pages/404', { title: 'Não encontrado' });
    }
};

module.exports = publicController;