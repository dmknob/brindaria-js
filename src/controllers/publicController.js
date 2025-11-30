// src/controllers/publicController.js
const db = require('../../database/db');

const publicController = {

    // Adicione isso dentro do objeto publicController, antes do getDetalhe
    getHome: (req, res) => {
        // Busca todos os modelos (limitado a 20 para não pesar se tiver muitos)
        const modelos = db.prepare('SELECT * FROM modelos ORDER BY nome ASC LIMIT 20').all();

        res.render('pages/home', {
            title: 'Brindaria - Arte Sacra e Presentes',
            modelos,
            // Canonical null na home é padrão (ou aponta para si mesma)
            canonical: 'https://brindaria.com.br'
        });
    },

    getContato: (req, res) => {
        res.render('pages/contato', {
            title: 'Contato - Vamos Conversar?',
            canonical: 'https://brindaria.com.br/contato'
        });
    },

    getCatalogo: (req, res) => {
        // Busca todos os modelos para exibir no grid
        const modelos = db.prepare('SELECT * FROM modelos ORDER BY nome ASC').all();

        res.render('pages/colecao', {
            title: 'Nossa Coleção - Brindaria',
            description: 'Conheça nosso acervo de arte sacra e imagens personalizadas.',
            modelos,
            canonical: 'https://brindaria.com.br/pecas'
        });
    },

    // Rota: /pecas/:categoria/:slug/:codigo?
    getDetalhe: (req, res) => {
        const { slug, codigo } = req.params;

        // 1. Buscar o Modelo (Dados Genéricos)
        // Note que IGNORAMOS a categoria da URL na busca, confiando apenas no SLUG
        const modelo = db.prepare('SELECT * FROM modelos WHERE slug = ?').get(slug);

        if (!modelo) {
            return res.status(404).render('pages/404', { title: 'Modelo não encontrado' });
        }

        let peca = null;
        let pageTitle = modelo.nome;
        let canonical = `https://brindaria.com.br/pecas/espiritual/${slug}`; // URL "Pai"
        let metaDescription = modelo.subtitulo || `Conheça a história de ${modelo.nome}`;

        // 2. Se houver código, buscar a Peça (Dados Específicos)
        if (codigo) {
            peca = db.prepare(`
                SELECT * FROM pecas 
                WHERE modelo_id = ? AND codigo_exibicao = ?
            `).get(modelo.id, codigo); // Aqui assumimos que o código vem como string ("#001" ou "001")

            // Tenta buscar com # se não achar sem (resiliência)
            if (!peca && !codigo.startsWith('#')) {
                peca = db.prepare(`
                    SELECT * FROM pecas 
                    WHERE modelo_id = ? AND codigo_exibicao = ?
                `).get(modelo.id, '#' + codigo);
            }

            if (peca) {
                // Personaliza o título para o Cliente
                pageTitle = `Peça #${peca.codigo_sequencial} - ${modelo.nome}`;
                // Se é uma peça específica, o canonical aponta para o Pai (evita duplicação SEO)
                // Se fosse a página do Pai, o canonical seria null (ou self)
            } else {
                // Se o usuário digitou um código que não existe, podemos renderizar apenas o modelo
                // ou avisar que a peça não foi encontrada. Por enquanto, segue sem peça.
            }
        }

        // 3. Renderizar
        res.render('pages/peca-detalhe', {
            modelo,
            peca,
            title: pageTitle,
            description: metaDescription,
            canonical: peca ? canonical : null // Só manda canonical se for página filha
        });
    },
    // Rota: /sitemap.xml
    getSitemap: (req, res) => {
        const modelos = db.prepare('SELECT slug FROM modelos').all();
        const baseUrl = 'https://brindaria.com.br';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
            <url><loc>${baseUrl}/contato</loc><priority>0.5</priority></url>
            <url><loc>${baseUrl}/pecas</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
        `;

        modelos.forEach(m => {
            xml += `
            <url>
                <loc>${baseUrl}/pecas/espiritual/${m.slug}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.9</priority>
            </url>`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    },

    // Rota: POST /validar
    postValidarPeca: (req, res) => {
        let { codigo } = req.body;

        if (!codigo) {
            return res.redirect('/');
        }

        codigo = codigo.trim().toUpperCase().replace('#', '');

        // 1. Tenta buscar pela CHAVE DE ACESSO (Única)
        const pecaPorChave = db.prepare(`
            SELECT p.*, m.slug as modelo_slug 
            FROM pecas p
            JOIN modelos m ON p.modelo_id = m.id
            WHERE p.chave_acesso = ?
        `).get(codigo);

        if (pecaPorChave) {
            return res.redirect(`/pecas/espiritual/${pecaPorChave.modelo_slug}/${pecaPorChave.codigo_exibicao}?key=${codigo}#certificado`);
        }

        // 2. Tenta buscar pelo CÓDIGO LEGADO (Pode ter duplicatas: 001 do Santo A, 001 do Santo B)
        // Normaliza para 3 dígitos se for numérico (1 -> 001)
        let codigoLegado = codigo;
        if (/^\d+$/.test(codigo)) {
            codigoLegado = codigo.padStart(3, '0');
        }

        // Busca todas as peças com esse código de exibição (ex: "001" ou "#001")
        // Tenta com e sem #
        const pecasPorCodigo = db.prepare(`
            SELECT p.*, m.nome as modelo_nome, m.slug as modelo_slug, m.imagem_url
            FROM pecas p
            JOIN modelos m ON p.modelo_id = m.id
            WHERE p.codigo_exibicao = ? OR p.codigo_exibicao = ?
        `).all(codigoLegado, '#' + codigoLegado);

        if (pecasPorCodigo.length === 1) {
            // Só achou um, redireciona direto (mas sem a chave na URL, pois é acesso legado público ou o usuário terá que digitar a chave lá?)
            // O requisito diz: "digita a 'chave' para ter acesso aos detalhes".
            // Se ele digitou o código legado "001", ele cai na página do modelo.
            // Mas se ele digitou "001", ele NÃO tem a chave.
            // O sistema antigo exibia os dados com base no código.
            // O novo sistema EXIGE chave para ver dados sensíveis.
            // PORÉM, o usuário disse: "Hoje os detalhes da Peça são exibidos na parte de baixo da página... quero manter isso funcionando."
            // E "quero implementar o campo de busca pela Chave... exibo igualmente os dados do Modelo e da Peça."
            // Então se ele buscar por "001", ele vê a peça 001.
            const p = pecasPorCodigo[0];
            return res.redirect(`/pecas/espiritual/${p.modelo_slug}/${p.codigo_exibicao}#certificado`);
        } else if (pecasPorCodigo.length > 1) {
            // Ambiguidade! Exibe página de seleção.
            return res.render('pages/selecao-modelo', {
                title: 'Selecione seu Modelo',
                codigo: codigoLegado,
                pecas: pecasPorCodigo
            });
        }

        // 3. Nada encontrado
        // Redireciona para busca com erro (poderíamos fazer uma página de erro melhor)
        return res.render('pages/404', { title: 'Peça não encontrada' });
    }
};

module.exports = publicController;