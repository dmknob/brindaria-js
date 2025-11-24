require('dotenv').config();
const db = require('./database/db');

console.log('📦 Iniciando Migração V2 (Schema Rico)...');

// Dados extraídos dos seus arquivos de texto
const DADOS_MODELOS = [
    {
        slug: 'sao-luis-de-montfort',
        nome: 'São Luís Maria Grignion de Montfort',
        subtitulo: 'Ludovicus Maria Grignion de Montfort (Original em Latim)',
        colecao: 'Guerreiros da Fé',
        conhecido_como: 'O Guerreiro da Virgem e Apóstolo dos Últimos Tempos',
        dia_celebracao: '28 de Abril',
        invocado_para: 'A Consagração Total a Maria (Totus Tuus), renovação das promessas do Batismo e Sabedoria Divina.',
        locais_devocao: 'Basílica de Saint-Laurent-sur-Sèvre (França) e Basílica de São Pedro (Vaticano).',
        variacoes_nome: 'Luís, Luiz, Luigi, Ludovico, Aluísio, Clóvis',
        detalhes_visuais: `<p>A imagem de São Luís é rica e varia conforme a faceta da sua missão. Existem três representações clássicas:</p><ul><li><strong>O Missionário da Cruz:</strong> Representado abraçando um Crucifixo junto ao peito ou erguendo-o com vigor.</li><li><strong>O Profeta Mariano:</strong> Segurando o livro do "Tratado da Verdadeira Devoção", muitas vezes com um demônio aos pés tentando esconder a obra.</li><li><strong>O Escravo de Amor:</strong> Com correntes quebradas ou nos pulsos, simbolizando a sua "santa escravidão" de amor.</li></ul>`,
        historia: `<p>Muito mais do que um escritor, Luís Maria foi um verdadeiro "Guerreiro Espiritual" (significado de Hlōdowik). Nascido na França em 1673, rompeu com o passado adotando o nome Montfort.</p><p>Uma curiosidade cinematográfica envolve sua obra-prima, o "Tratado da Verdadeira Devoção": o santo profetizou que "bestas raivosas" esconderiam o livro. De fato, o manuscrito ficou oculto num caixote por 126 anos durante a Revolução Francesa, sendo redescoberto em 1842.</p><p>Foi este livro que moldou a espiritualidade do Papa São João Paulo II e seu lema "Totus Tuus".</p>`,
        oracao: `Eu vos escolho hoje, ó Maria, na presença de toda a corte celeste, por minha Mãe e minha Rainha. Entrego-vos e consagro-vos, com toda a submissão e amor, o meu corpo e a minha alma... (Totus Tuus ego sum).`,
        imagem_url: '/uploads/modelos/sao-luis.jpg'
    },
    {
        slug: 'anjo-da-guarda',
        nome: 'Anjo da Guarda',
        subtitulo: 'Angelus Custos (Original em Latim)',
        colecao: 'Angelus Custos',
        conhecido_como: 'O Protetor Celeste e Mensageiro Pessoal de Deus',
        dia_celebracao: '2 de Outubro',
        invocado_para: 'Proteção constante contra perigos físicos e espirituais, orientação e consolo.',
        locais_devocao: 'Toda a Igreja Universal (não possuem santuário físico único).',
        variacoes_nome: 'Santo Anjo, Anjinho, Custódio',
        detalhes_visuais: `<p>O atributo universal são as asas. Diferente dos santos humanos, eles não envelhecem. Três representações clássicas:</p><ul><li><strong>O Querubim (A Criança Alada):</strong> Comum na arte Barroca, representa a inocência.</li><li><strong>O Jovem Guardião:</strong> Um adolescente de beleza serena, simbolizando a força e a vigília.</li><li><strong>O Intercessor:</strong> Com mãos postas, simbolizando sua função sacerdotal de levar nossas orações a Deus.</li></ul>`,
        historia: `<p>A devoção ao Anjo da Guarda é antiga. No Direito Romano, "Custos" definia aquele com responsabilidade jurídica total sobre alguém indefeso. Ter um Anjo Custódio significa estar sob jurisdição legal de um espírito celeste.</p><p>São Tomás de Aquino ensina que o anjo nunca nos abandona. Grandes santos como Padre Pio e Santa Gemma Galgani tinham convívio visível com seus guardiões.</p>`,
        oracao: `Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, me guarde, me governe e me ilumine. Amém.`,
        imagem_url: '/uploads/modelos/anjo-da-guarda.jpg'
    },
    {
        slug: 'sao-miguel',
        nome: 'São Miguel Arcanjo',
        subtitulo: "Mikha'el (Original em Hebraico)",
        colecao: 'Guerreiros da Fé',
        conhecido_como: 'O Príncipe da Milícia Celeste e Regente do Fogo',
        dia_celebracao: '29 de Setembro',
        invocado_para: 'Proteção suprema contra o mal, justiça em causas difíceis e coragem em batalhas.',
        locais_devocao: 'Santuário do Monte Gargano (Itália), Mont Saint-Michel (França) e Sacra di San Michele (Itália).',
        variacoes_nome: 'Miguel, Michael, Michel, Mikael, Maicon',
        detalhes_visuais: `<p>O arquétipo universal do guerreiro divino:</p><ul><li><strong>O Comandante (Archistrategos):</strong> Vestindo armadura, empunhando espada e subjugando o dragão.</li><li><strong>O Juiz das Almas:</strong> Segurando uma balança de precisão para o Juízo.</li><li><strong>O Peregrino do Monte:</strong> Sem asas, marcando a terra com sua pegada.</li></ul>`,
        historia: `<p>O nome Miguel é um grito de guerra: "Quem é como Deus?". Foi com este desafio que ele expulsou a soberba de Lúcifer.</p><p>Existe uma linha imaginária, a "Espada de São Miguel", que conecta sete santuários antiquíssimos alinhados com o pôr do sol no solstício, incluindo o Mont Saint-Michel na França e o Monte Gargano na Itália.</p>`,
        oracao: `São Miguel Arcanjo, defendei-nos no combate. Sede o nosso refúgio contra as maldades e ciladas do demônio... Amém.`,
        imagem_url: '/uploads/modelos/sao-miguel.jpg'
    },
    {
        slug: 'sao-pedro-apostolo', // <--- CORRIGIDO
        nome: 'São Pedro (Petrus)',
        subtitulo: 'Képhas (Original em Aramaico)',
        colecao: 'Apóstolos',
        conhecido_como: 'A Rocha da Igreja e Guardião das Portas do Céu',
        dia_celebracao: '29 de Junho',
        invocado_para: 'Abrir caminhos fechados, proteção do lar (o porteiro) e chuvas para as colheitas.',
        locais_devocao: '',
        variacoes_nome: 'Pedro, Pietro, Pierre, Peter, Petrus',
        detalhes_visuais: `<p>Inconfundível pela autoridade patriarcal e as chaves:</p><ul><li><strong>O Mestre das Chaves:</strong> De pé, segurando as Chaves do Reino e o Livro.</li><li><strong>O Príncipe dos Apóstolos:</strong> Sentado na Cátedra, abençoando.</li><li><strong>O Mártir da Humildade:</strong> Crucificado de cabeça para baixo.</li></ul>`,
        historia: `<p>Seu nome de nascimento era Simão ("Aquele que ouve"), mas Jesus o chamou de Képhas ("A Rocha").</p><p>Antropologicamente, Pedro é o guardião dos limiares. Uma curiosidade: a Cruz Invertida é o símbolo máximo da sua humildade, pois ele pediu para morrer assim por não se sentir digno de morrer como Cristo.</p>`,
        oracao: `Glorioso São Pedro, tu que tens as chaves do céu e da terra, eu te peço: abre os meus caminhos... Amém.`,
        imagem_url: '/uploads/modelos/sao-pedro.jpg'
    },
    {
        slug: 'nossa-senhora-da-piedade-pieta',
        nome: 'Nossa Senhora da Piedade (Pietà)',
        subtitulo: 'Vesperbild (Original em Alemão Medieval)',
        colecao: 'Marianos',
        conhecido_como: 'A Mãe da Compaixão e o Colo da Humanidade',
        dia_celebracao: '15 de Setembro',
        invocado_para: 'Consolo na perda de entes queridos, cura da depressão e harmonia familiar.',
        locais_devocao: '',
        variacoes_nome: 'Piedade, Pietá, Dolores, Soledade',
        detalhes_visuais: `<p>A imagem universal da dor materna:</p><ul><li><strong>A Pietà Renascentista:</strong> Inspirada em Michelangelo, mostra uma Maria jovem e serena.</li><li><strong>A Pietà Gótica:</strong> A versão original (Vesperbild), mostrando a dor crua e as feridas de Cristo.</li></ul>`,
        historia: `<p>A famosa Pietà de Michelangelo nasceu de um desafio: fazer "a mais bela obra de mármore de Roma". O artista tinha apenas 24 anos.</p><p>Teologicamente, esta imagem fecha o ciclo: o mesmo colo que segurou Jesus no berço agora O segura na morte. É a padroeira de Minas Gerais.</p>`,
        oracao: `Ó Mãe de Piedade, Senhora das Dores... transforma o nosso sofrimento em semente de ressurreição. Amém.`,
        imagem_url: '/uploads/modelos/pieta.jpg'
    }
];

const DADOS_PECAS = [
    {
        modelo_slug: 'sao-luis-de-montfort',
        codigo: '#001',
        inscricao: 'São Luís',
        cliente: 'Pedro Knob',
        mensagem: "Peça gentilmente oferecida pelo Pedro Knob para o amigo Luís, no seu aniversário. Que a força e a sabedoria de São Luís, o 'Guerreiro da Virgem', sejam uma inspiração constante em sua jornada. Um presente de amizade e proteção."
    },
    {
        modelo_slug: 'anjo-da-guarda',
        codigo: '#001',
        inscricao: 'Protegei a Alicia',
        cliente: 'Pedro Knob',
        mensagem: "Peça gentilmente oferecida pelo Pedro Knob para a Alicia, celebrando este dia especial junto ao seu irmão Luís. Que a luz e a proteção do Santo Anjo sejam uma companhia constante em todos os seus caminhos."
    },
    {
        modelo_slug: 'anjo-da-guarda',
        codigo: '#002',
        inscricao: 'Protegei a Maitê',
        cliente: 'Ana Sofia Knob',
        mensagem: "Peça gentilmente oferecida pela Ana Sofia Knob para a amiga Maitê nas celebrações do final de ano de 2025. Que a luz e a proteção do Santo Anjo sejam uma companhia constante em todos os seus caminhos."
    }
];

const runMigration = db.transaction(() => {
    // 1. Categoria Padrão
    db.prepare("INSERT OR IGNORE INTO categorias (nome, slug) VALUES ('Espiritual', 'espiritual')").run();
    const catId = db.prepare("SELECT id FROM categorias WHERE slug = 'espiritual'").get().id;

    // 2. Inserir Modelos
const insertModel = db.prepare(`
    INSERT INTO modelos (categoria_id, nome, subtitulo, slug, colecao, imagem_url, conhecido_como, dia_celebracao, invocado_para, locais_devocao, variacoes_nome, historia, oracao, detalhes_visuais)
    VALUES (@catId, @nome, @subtitulo, @slug, @colecao, @imagem_url, @conhecido_como, @dia_celebracao, @invocado_para, @locais_devocao, @variacoes_nome, @historia, @oracao, @detalhes_visuais)
`);

    for (const m of DADOS_MODELOS) {
        const exists = db.prepare('SELECT id FROM modelos WHERE slug = ?').get(m.slug);
        if (!exists) {
            console.log(`✨ Criando modelo: ${m.nome}`);
            insertModel.run({ ...m, catId });
        }
    }

    // 3. Inserir Peças
    const insertPeca = db.prepare(`
        INSERT INTO pecas (modelo_id, codigo_sequencial, codigo_exibicao, inscricao_base, tamanho, material, acabamento, cliente_nome, mensagem, data_producao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of DADOS_PECAS) {
        const modelo = db.prepare('SELECT id FROM modelos WHERE slug = ?').get(p.modelo_slug);
        if (modelo) {
            const exists = db.prepare('SELECT id FROM pecas WHERE modelo_id = ? AND codigo_exibicao = ?').get(modelo.id, p.codigo);
            if (!exists) {
                console.log(`🔨 Registrando peça ${p.codigo} de ${p.modelo_slug}`);
                insertPeca.run(
                    modelo.id, 
                    parseInt(p.codigo.replace(/\D/g, '')),
                    p.codigo, 
                    p.inscricao,
                    '20cm',
                    'Compósito Ecológico',
                    'Visual Mármore',
                    p.cliente,
                    p.mensagem,
                    'Novembro de 2025'
                );
            }
        }
    }
});

try {
    runMigration();
    console.log('✅ Migração Completa! Banco de dados atualizado com textos ricos.');
} catch (error) {
    console.error('❌ Erro na migração:', error);
}