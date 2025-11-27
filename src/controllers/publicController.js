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
                <changefreq>monthly</changefreq>
                <priority>0.9</priority>
            </url>`;
        });

        xml += '</urlset>';
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    }
};

module.exports = publicController;