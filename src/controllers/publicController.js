// src/controllers/publicController.js
const db = require('../../database/db');

const publicController = {

    getHome: (req, res) => {
        const figuras = db.prepare('SELECT * FROM figuras WHERE ativo = 1 ORDER BY nome ASC LIMIT 20').all();

        res.render('pages/home', {
            title: 'Brindaria - Arte Sacra e Presentes',
            figuras: figuras, 
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
        const figuras = db.prepare('SELECT * FROM figuras WHERE ativo = 1 ORDER BY nome ASC').all();

        res.render('pages/colecao', {
            title: 'Nossa Coleção - Brindaria',
            description: 'Conheça nosso acervo de arte sacra e imagens personalizadas.',
            figuras: figuras, 
            canonical: 'https://brindaria.com.br/pecas'
        });
    },

    // Rota: /pecas/:categoria/:slug/:codigo?
    getDetalhe: (req, res) => {
        const { slug, codigo } = req.params;

        const figura = db.prepare('SELECT * FROM figuras WHERE slug = ?').get(slug);

        if (!figura || figura.ativo !== 1) {
            return res.status(404).render('pages/404', { title: 'Figura não encontrada' });
        }

        let peca = null;
        let pageTitle = figura.nome;
        let canonical = `https://brindaria.com.br/pecas/espiritual/${slug}`;
        let metaDescription = figura.subtitulo || `Conheça a história de ${figura.nome}`;

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
            
            if (peca) {
                pageTitle = `Peça ${peca.codigo_exibicao} - ${figura.nome}`;
            }
        }

        res.render('pages/peca-detalhe', {
            figura: figura, 
            peca,
            title: pageTitle,
            description: metaDescription,
            canonical: peca ? canonical : null
        });
    },

    // Rota: /v/:chave
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

        const figura = {
            nome: dados.nome,
            subtitulo: dados.subtitulo,
            slug: dados.figura_slug,
            colecao: dados.colecao,
            imagem_url: dados.imagem_url,
            conhecido_como: dados.conhecido_como,
            dia_celebracao: dados.dia_celebracao,
            invocado_para: dados.invocado_para,
            locais_devocao: dados.locais_devocao,
            variacoes_nome: dados.variacoes_nome,
            historia: dados.historia,
            oracao: dados.oracao,
            detalhes_visuais: dados.detalhes_visuais
        };

        const peca = {
            id: dados.id,
            codigo_exibicao: dados.codigo_exibicao || 'PENDENTE',
            chave_acesso: dados.chave_acesso,
            inscricao_base: dados.inscricao_base,
            tamanho: dados.tamanho,
            material: dados.material,
            acabamento: dados.acabamento,
            data_producao: dados.data_producao,
            mensagem: dados.mensagem,
            cliente_nome: dados.cliente_nome
        };

        const canonical = `https://brindaria.com.br/pecas/${dados.categoria_slug || 'espiritual'}/${dados.figura_slug}`;

        res.render('pages/peca-detalhe', {
            title: `Autenticidade: ${figura.nome}`,
            description: `Verificação de autenticidade`,
            figura,
            peca,
            canonical
        });
    },

    getSitemap: (req, res) => {
        const figuras = db.prepare('SELECT slug FROM figuras WHERE ativo = 1').all();
        const baseUrl = 'https://brindaria.com.br';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
            <url><loc>${baseUrl}/contato</loc><priority>0.5</priority></url>
            <url><loc>${baseUrl}/pecas</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
        `;

        figuras.forEach(f => {
            xml += `
            <url>
                <loc>${baseUrl}/pecas/espiritual/${f.slug}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.9</priority>
            </url>`;
        });

        xml += '</urlset>';
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    },

    // Validação de Peça (Busca por Código ou Chave)
    postValidarPeca: (req, res) => {
        let { codigo } = req.body;

        if (!codigo) {
            return res.redirect('/');
        }

        // 1. LIMPEZA BÁSICA
        const inputLimpo = codigo.trim().toUpperCase().replace('#', '');
        
        // 2. MAPEAMENTO EXPLÍCITO (ALIAS - CASOS ESPECIAIS)
        // Aqui tratamos o N00A e outras exceções não numéricas
        const ALIAS_MAP = {
            'N00A': 'NFEUZ',
            '00A': 'NFEUZ',
            '0A': 'NFEUZ',
            'A': 'NFEUZ'
        };

        if (ALIAS_MAP[inputLimpo]) {
            return res.redirect(`/v/${ALIAS_MAP[inputLimpo]}`);
        }

        // 3. BUSCA POR CHAVE DE ACESSO (Prioridade Máxima)
        const pecaPorChave = db.prepare(`
            SELECT p.chave_acesso FROM pecas p WHERE p.chave_acesso = ?
        `).get(inputLimpo);

        if (pecaPorChave) {
            return res.redirect(`/v/${pecaPorChave.chave_acesso}`);
        }

        // 4. BUSCA POR CÓDIGO SEQUENCIAL (LEGADO - COM TRAVA DE SEGURANÇA)
        let codigoLegado = inputLimpo;
        if (/^\d+$/.test(inputLimpo)) {
            codigoLegado = inputLimpo.padStart(3, '0');
        }

        // === LISTA BRANCA: Apenas estes códigos históricos podem ser buscados publicamente ===
        // Isso impede que alguém digite "003" e ache a peça nova.
        const CODIGOS_PUBLICOS_PERMITIDOS = ['001', '002'];

        if (!CODIGOS_PUBLICOS_PERMITIDOS.includes(codigoLegado)) {
            // Se não for chave e não for um código permitido, fingimos que não existe
            return res.render('pages/404', { title: 'Peça não encontrada' });
        }

        // Se passou pela trava, busca no banco
        const pecasPorCodigo = db.prepare(`
            SELECT p.*, f.nome as figura_nome, f.slug as figura_slug, f.imagem_url
            FROM pecas p
            JOIN figuras f ON p.figura_id = f.id
            WHERE p.codigo_exibicao = ? OR p.codigo_exibicao = ?
        `).all(codigoLegado, '#' + codigoLegado);

        if (pecasPorCodigo.length === 1) {
            const p = pecasPorCodigo[0];
            return res.redirect(`/v/${p.chave_acesso}`);
        } else if (pecasPorCodigo.length > 1) {
            return res.render('pages/selecao-figura', {
                title: 'Selecione a Figura',
                codigo: codigoLegado,
                pecas: pecasPorCodigo
            });
        }

        // 5. Nada encontrado
        return res.render('pages/404', { title: 'Peça não encontrada' });
    }
};

module.exports = publicController;