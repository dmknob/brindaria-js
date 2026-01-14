// src/controllers/publicController.js
const db = require('../../database/db');
const logger = require('../logger');

const publicController = {

    getHome: (req, res) => {
        logger.info("Home page accessed");

        const title = 'Brindaria: Espiritualidade e Respeito';
        const canonical = 'https://brindaria.com.br';
        res.render('pages/home', {
            title: title,
            canonical: canonical,
            ogTitle: title,
            ogDescription: "Descubra a Brindaria: arte sacra, imagens personalizadas e presentes únicos para todas as ocasiões.",
            ogURL: canonical,
            ogImage: 'https://brindaria.com.br/images/FOTO_FAMILIA-brindaria.webp'
    });
    },

    getContato: (req, res) => {
        logger.info("Contato page accessed");

        const title = 'Contato - Vamos Conversar?';
        const canonical = 'https://brindaria.com.br/contato';
        
        res.render('pages/contato', {
            title: title,
            canonical: canonical,
            ogTitle: title,
            ogDescription: "Entre em contato com a Brindaria para dúvidas, orçamentos ou informações sobre nossos produtos e serviços.",
            ogURL: canonical,
            ogImage: 'https://brindaria.com.br/images/FOTO_FAMILIA-brindaria.webp'
        });
    },

    getCatalogo: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(process.env.PAGINACAO_FIGURAS, 10) || 9;
        const offset = (page - 1) * limit;

        const figuras = db.prepare(`SELECT * FROM figuras WHERE ativo = 1 ORDER BY nome ASC LIMIT ? OFFSET ?
        `).all(limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM figuras WHERE ativo = 1').get().count;
        const totalPages = Math.ceil(total / limit);

        console.log("Total figuras:", total, "Total páginas:", totalPages);
        //const categorias = db.prepare('SELECT id, nome FROM categorias').all();
        // Full list used for quick-select dropdown in admin UI
        //const figurasAll = db.prepare('SELECT id, nome FROM figuras ORDER BY nome ASC').all();
        //const catMap = {};
        //categorias.forEach(c => catMap[c.id] = c.nome);

        let canonical = 'https://brindaria.com.br/pecas';
        if (page > 1) {
            canonical = 'https://brindaria.com.br/pecas?page=' + page;
        }

        logger.info("Catalogo page accessed", canonical);

        const title = 'Nossa Coleção - Brindaria';
        const description = 'Conheça nosso acervo de arte sacra e imagens personalizadas.';

        res.render('pages/colecao', {
            title: title,
            description: description,
            figuras: figuras,
            currentPage: page,
            totalPages,
            canonical: canonical,
            ogTitle: title,
            ogDescription: description,
            ogURL: canonical,
            ogImage: 'https://brindaria.com.br/images/ATELIE_principal-brindaria.webp'
        });
/*
        res.render('pages/colecao', {
            title: 'Nossa Coleção - Brindaria',
            description: 'Conheça nosso acervo de arte sacra e imagens personalizadas.',
            figuras: figuras, 
            canonical: 'https://brindaria.com.br/pecas'
        });
*/
    },

    getSitemap: (req, res) => {

        logger.info("Sitemap requested");

        const baseUrl = 'https://brindaria.com.br';
        const pageLimit = parseInt(process.env.PAGINACAO_FIGURAS, 10) || 9;

        // Paginacao similar a getCatalogo
        const totalFiguras = db.prepare('SELECT COUNT(*) as count FROM figuras WHERE ativo = 1').get().count;
        const totalPages = Math.max(1, Math.ceil(totalFiguras / pageLimit));

        // Lista de slugs para URLs individuais
        const figuras = db.prepare('SELECT slug FROM figuras WHERE ativo = 1 ORDER BY nome ASC').all();

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
            <url><loc>${baseUrl}/contato</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`;

        // Incluir páginas paginadas do catálogo (page 1 sem query string)
        for (let p = 1; p <= totalPages; p++) {
            const loc = p === 1 ? `${baseUrl}/pecas` : `${baseUrl}/pecas?page=${p}`;
            xml += `
            <url>
                <loc>${loc}</loc>
                <changefreq>daily</changefreq>
                <priority>0.8</priority>
            </url>`;
        }

        // Incluir as páginas individuais das figuras
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

    // Ateliê gallery (JSON): returns small set of images for the 'Mostrar galeria' feature
    getAtelieGallery: (req, res) => {

        logger.info("Imagens Atelie gallery requested");
                            
        // NOTE: These images are stored in public/images/atelie/ per the user instruction.
        // Replace the file names with the actual filenames the admin will upload.
        const imgs = [
            { src: '/images/atelie/ATELIE_1-brindaria.webp', alt: "Estatueta com acabamento em bronze sobre uma prateleira de madeira, representando a figura alegórica do 'Self-Made Man': um homem a esculpir o seu próprio corpo a partir de um bloco de pedra bruta, empunhando um martelo e um cinzel. A base da peça é preta com a inscrição 'Ir.Terra'. À frente da escultura, encontra-se a palavra 'EVOLUÇÃO' em letras tridimensionais, também com acabamento em bronze." },
            { src: '/images/atelie/ATELIE_2-brindaria.webp', alt: "Estatueta do Anjo da Guarda com acabamento branco brilhante, representado de joelhos a ler um livro aberto, com grandes asas detalhadas e uma coroa de flores na cabeça." },
            { src: '/images/atelie/ATELIE_3-brindaria.webp', alt: "Estatueta de Jesus Cristo com acabamento branco perolado, de braços abertos e com uma pequena cruz dourada ao peito. A imagem ergue-se sobre uma base hexagonal com relevos de figuras humanas, assente num pedestal preto com a inscrição 'Acolhei teus Filhos' em dourado." },
            { src: '/images/atelie/ATELIE_4-brindaria.webp', alt: "Estatueta de três pequenos monges com acabamento em bronze, sentados nas posições de não ver, não falar e não ouvir o mal. A base preta contém a inscrição 'O Segredo da Paz'." },
            { src: '/images/atelie/ATELIE_5-brindaria.webp', alt: "Foto de uma escultura branca sobre uma base preta, retratando um homem musculoso esculpindo o próprio corpo para fora de um bloco de pedra bruta com um martelo e um cinzel (o conceito de 'Self-Made Man'). Na base da estátua, há uma placa com a inscrição 'Mestre de si' e, ao lado direito, o símbolo dourado do Esquadro e Compasso da Maçonaria. O fundo é um ambiente externo ensolarado e desfocado." },
            { src: '/images/atelie/ATELIE_6-brindaria.webp', alt: "Foto de uma estátua de um anjo na cor branco perolado, sentado com um livro aberto no colo e asas estendidas nas costas. A escultura está sobre uma base retangular preta. Na frente da base, há uma inscrição em letras douradas que diz: 'Protegei a Cila e Família'. O fundo mostra um ambiente externo ensolarado e desfocado, com grades brancas verticais." }
        ];

        
        // Provide srcset (optional) for responsive images if files exist with -400w / -800w suffix
        const mapped = imgs.map(i => ({
            src: i.src,
            // Provide a full-size (or fallback) image reference for the modal
            full: i.full || i.src,
//            srcset: `${i.src.replace('.jpg','-400w.jpg')} 400w, ${i.src.replace('.jpg','-800w.jpg')} 800w`,
            alt: i.alt,
            page: i.page || null
        }));
        
        res.json(mapped);
    },

/*
    // Rota: /pecas/:categoria/:slug/:codigo?
    getDetalhe: (req, res) => {

        logger.info("Peca detalhe page accessed", { params: req.params });

        const { categoria, slug, codigo } = req.params;

        // Também selecionamos a categoria slug para validar que a rota usa a categoria correta
        const figura = db.prepare(`
            SELECT f.*, c.slug as categoria_slug
            FROM figuras f
            LEFT JOIN categorias c ON f.categoria_id = c.id
            WHERE f.slug = ?
        `).get(slug);

        if (!figura || figura.ativo !== 1) {
            return res.status(404).render('pages/404', { title: 'Figura não encontrada' });
        }

        // Validação de categoria: se a categoria na URL não corresponder à categoria
        // do modelo/figura, devolvemos 404 para evitar confusões entre categorias.
        const figuraCategoriaSlug = (figura.categoria_slug).toLowerCase();
        if ((categoria || '').toLowerCase() !== figuraCategoriaSlug) {
            return res.status(404).render('pages/404', { title: 'Figura não encontrada' });
        }

        let peca = null;
        let pageTitle = figura.nome;
        let canonical = `https://brindaria.com.br/pecas/${figuraCategoriaSlug}/${slug}`;
        console.warn("CANONICAL: ",canonical);
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
            description: figura.conhecido_como || metaDescription,
            canonical: canonical,
            ogTitle: pageTitle,
            ogDescription: figura.conhecido_como || metaDescription,
            ogURL: canonical,
            ogImage: 'https://brindaria.com.br' + figura.imagem_url
        });
    },
    */

    // Rota: /v/:chave
    getPecaByKey: (req, res) => {
        const { chave } = req.params;
        
        logger.info("Peca validation requested", { chave: chave });

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
            canonical,
            ogTitle: peca.inscricao_base || `Peça ${peca.codigo_exibicao} - ${figura.nome}`,
            ogDescription: peca.mensagem,
            ogURL: canonical,
            ogImage: figura.imagem_url        });
    },

    // Validação de Peça (Busca por Código ou Chave)
    postValidarPeca: (req, res) => {
        let { codigo } = req.body;

        logger.info("Peca validation attempted", { codigo: codigo });

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
            //return res.render('pages/404', { title: 'Peça não encontrada' });
            return res.render('pages/erro-busca', { 
                title: 'Peça não localizada',
                codigoTentado: codigo // Passa o que o usuário digitou
            });
        }

        // Hardcoded exceptions (manual overrides for legacy misprints)
        // Mantemos isto no controlador por simplicidade; caso cresça, migrar para tabela DB 'codigo_aliases'.
        const HARDCODED_CODE_TO_PECAS = {
            '001': ['TH2KQ', 'G2C79']
        };

        const HARDCODED_CODE_TO_REDIRECT_KEY = {
            '002': 'H7BJX'
        };

        // Redirect on hardcoded single-key entries (ex: 002 -> H7BJX)
        if (HARDCODED_CODE_TO_REDIRECT_KEY[codigoLegado]) {
            return res.redirect(`/v/${HARDCODED_CODE_TO_REDIRECT_KEY[codigoLegado]}`);
        }

        // If this legacy code has a pre-approved list of piece keys, return only those
        if (HARDCODED_CODE_TO_PECAS[codigoLegado]) {
            const keys = HARDCODED_CODE_TO_PECAS[codigoLegado];
            const placeholders = keys.map(() => '?').join(',');
            const pecasPorCodigoHard = db.prepare(`
                SELECT p.*, f.nome as figura_nome, f.slug as figura_slug, f.imagem_url
                FROM pecas p
                JOIN figuras f ON p.figura_id = f.id
                WHERE p.chave_acesso IN (${placeholders})
            `).all(...keys);

            if (pecasPorCodigoHard.length === 1) {
                return res.redirect(`/v/${pecasPorCodigoHard[0].chave_acesso}`);
            }

            // Deduplicate by figura_slug to present one option per figura
            const uniq = [];
            const seen = new Set();
            for (const p of pecasPorCodigoHard) {
                if (!seen.has(p.figura_slug)) {
                    uniq.push(p);
                    seen.add(p.figura_slug);
                }
            }

            return res.render('pages/selecao-figura', {
                title: 'Selecione a Figura',
                codigo: codigoLegado,
                pecas: uniq
            });
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
            // UX Melhorada: Envia o código tentado para a view explicar melhor
            return res.render('pages/erro-busca', { 
                title: 'Peça não localizada',
                codigoTentado: codigo // Passa o que o usuário digitou
            });
        }
};

module.exports = publicController;