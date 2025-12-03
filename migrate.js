require('dotenv').config();
const db = require('./database/db');
const { generateUniqueKey } = require('./src/utils/keyGenerator'); // Importa o gerador

console.log('📦 Iniciando População de Dados (Seed)...');

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
        variacoes_nome: 'Luís, Luiz, Luigi, Ludovico, Aluísio, Clóvis',
        locais_devocao: 'Basílica de Saint-Laurent-sur-Sèvre (França) e Basílica de São Pedro (Vaticano).',
        detalhes_visuais: `<p>A imagem de São Luís é rica e varia conforme a faceta da sua missão. Existem três representações clássicas:</p><ul><li><strong>O Missionário da Cruz:</strong> Representado abraçando um Crucifixo junto ao peito ou erguendo-o com vigor.</li><li><strong>O Profeta Mariano:</strong> Segurando o livro do "Tratado da Verdadeira Devoção", muitas vezes com um demônio aos pés tentando esconder a obra.</li><li><strong>O Escravo de Amor:</strong> Com correntes quebradas ou nos pulsos, simbolizando a sua "santa escravidão" de amor.</li></ul>`,
        historia: `<p>Muito mais do que um escritor, Luís Maria foi um verdadeiro <strong>"Guerreiro Espiritual"</strong> (o significado original do seu nome franco <em>Hlōdowik</em>). Nascido na França em 1673, ele rompeu com o passado ao ponto de abandonar o sobrenome do pai para adotar o nome do seu batismo e da sua fortaleza espiritual: <strong>Montfort</strong>.</p><p>A sua vida foi marcada por uma tenacidade impressionante: em 1706, caminhou 1.700 km a pé até Roma para pedir ao Papa uma direção para a sua vida.</p><p>Uma curiosidade quase cinematográfica envolve a sua obra-prima, o <strong>"Tratado da Verdadeira Devoção à Santíssima Virgem"</strong>. O próprio santo profetizou que "bestas raivosas" viriam para esconder o livro na escuridão de um baú.</p><p>O fato realmente aconteceu: para protegê-lo da Revolução Francesa, o manuscrito foi ocultado e permaneceu "enterrado" no silêncio de um caixote por exatos <strong>126 anos</strong>, sendo redescoberto acidentalmente apenas em 1842.</p><p>Foi este livro "sobrevivente" que moldou a espiritualidade de grandes gigantes da fé, incluindo o <strong>Papa São João Paulo II</strong>, que escolheu o lema de Montfort, <em>"Totus Tuus"</em> (Todo Teu), para guiar o seu pontificado e mudar a história do século XX.</p>`,
        oracao: `Eu vos escolho hoje, ó Maria,<br>na presença de toda a corte celeste,<br>por minha Mãe e minha Rainha.<br><br>Entrego-vos e consagro-vos,<br>com toda a submissão e amor,<br>o meu corpo e a minha alma,<br>os meus bens interiores e exteriores,<br>e até o valor das minhas boas obras<br>passadas, presentes e futuras.<br><br>Concedo-vos inteiro e pleno direito<br>de dispor de mim e de tudo o que me pertence,<br>sem exceção, segundo o vosso beneplácito,<br>para a maior glória de Deus,<br>no tempo e na eternidade.<br>Amém.<br><br><em>(Totus Tuus ego sum, et omnia mea tua sunt)</em>`,
        imagem_url: '/uploads/modelos/sao-luis.jpg'
    },
    {
        slug: 'anjo-da-guarda',
        nome: 'Anjo da Guarda',
        subtitulo: 'Angelus Custos (Original em Latim)',
        colecao: 'Angelus Custos',
        conhecido_como: 'O Protetor Celeste e Mensageiro Pessoal de Deus',
        dia_celebracao: '2 de Outubro',
        invocado_para: 'Proteção constante contra perigos físicos e espirituais, orientação nas decisões difíceis, consolo na solidão e para <strong>iluminar o caminho</strong> de crianças e adultos.',
        variacoes_nome: 'Santo Anjo, Anjinho, Custódio',
        locais_devocao: 'Embora não tenham um grande santuário físico único (pois estão em toda parte e ao lado de cada pessoa), a devoção aos Santos Anjos é central na tradição católica e ortodoxa mundial, sendo celebrada em toda a <strong>Igreja Universal</strong>.',
        detalhes_visuais: `<p>A figura do Anjo transcende a forma humana, sendo descrita teologicamente como um espírito puro dotado de inteligência e vontade. Na arte, porém, eles ganharam formas visíveis para que possamos compreender a sua missão.</p><p>O atributo universal são as <strong>asas</strong>, símbolo da sua natureza celeste, da sua velocidade em socorrer e da sua liberdade espiritual. Diferente dos santos humanos, eles não envelhecem, apresentando sempre uma beleza atemporal.</p><p>Você encontrará três representações clássicas na arte sacra:</p><ul><li><strong>O Querubim (A Criança Alada):</strong> Muito comum na arte Barroca e para presentes infantis. Representa a pureza absoluta, a inocência e a proximidade com Deus. É a face "amável" e reconfortante da proteção divina.</li><li><strong>O Jovem Guardião:</strong> Representado como um adolescente ou jovem adulto de beleza serena, muitas vezes vestindo túnicas longas. Simboliza a força, a vigília constante e a maturidade espiritual necessária para guiar uma alma durante toda a vida.</li><li><strong>O Intercessor (Mãos Postas):</strong> Independente da idade (criança ou jovem), quando representado com as mãos unidas em oração, o Anjo simboliza a sua função sacerdotal: ele recolhe as nossas orações para as levar a Deus e intercede perpetuamente por nós diante do Trono.</li></ul>`,
        historia: `<p>A devoção ao Anjo da Guarda é uma jornada fascinante através da história, da linguagem e da lei. A própria evolução do seu nome revela a profundidade da sua missão: nas escrituras hebraicas, ele é o <em>Mal'akh</em> ("Mensageiro"), mas também o <em>Shomer</em> ("Sentinela"), aquele que vigia a cidade ou o rebanho.</p><p>Os gregos chamavam-no de <em>Phylax</em> ("Guardião"), e os alemães usam o termo <em>Schutzengel</em> ("Anjo de Proteção"). Todos estes nomes apontam para uma verdade comovente: Deus não nos deixa caminhar sozinhos.</p><p>Mas foi em Roma que o título ganhou o peso que usamos hoje: <strong>Angelus Custos</strong>. No Direito Romano, <em>Custos</em> definia aquele que tinha responsabilidade jurídica total sobre alguém que não podia se defender sozinho. Ter um "Anjo Custódio" significa, literalmente, que a sua alma está sob a jurisdição e responsabilidade legal de um espírito celeste poderoso.</p><p>A teologia católica, refinada por <strong>São Tomás de Aquino</strong>, traz um consolo absoluto: o Anjo da Guarda nunca nos abandona. Mesmo que a pessoa se afaste de Deus ou cometa erros graves, o anjo permanece ao seu lado, protegendo-a de males piores e aguardando o momento de a reconduzir à luz.</p><p>Como pregava <strong>São Bernardo de Claraval</strong>, a presença deste guardião exige de nós três atitudes: respeito pela sua presença, devoção pela sua benevolência e confiança total na sua guarda.</p><p>A história está repleta de santos que viviam com seus anjos de forma visível. Além do famoso <strong>Padre Pio</strong> (que usava seu anjo como "correio"), temos <strong>Santa Gemma Galgani</strong>, que entregava cartas fechadas ao seu anjo. Já <strong>Santa Francisca Romana</strong> via o seu anjo constantemente ao seu lado não como um guerreiro, mas como um menino de túnica luminosa, cuja luz mudava de intensidade conforme ela rezava, servindo como uma bússola moral visível.</p><p>Até mesmo os <strong>Jesuítas</strong> levavam essa devoção tão a sério que designavam um "anjo visível" para os novos monges: um irmão mais velho cuja única função era acompanhar e proteger o novato, tornando palpável o cuidado invisível de Deus.</p>`,
        oracao: `Anjo santo, meu conselheiro, inspirai-me.<br>Anjo santo, meu defensor, protegei-me.<br>Anjo santo, meu fiel amigo, pedi por mim.<br>Anjo santo, meu consolador, fortificai-me.<br>Anjo santo, meu irmão, defendei-me.<br>Anjo santo, meu mestre, ensinai-me.<br>Anjo santo, testemunha de todas as minhas ações, purificai-me.<br>Anjo santo, meu auxiliar, amparai-me.<br>Anjo santo, meu intercessor, falai por mim.<br>Anjo santo, meu guia, dirigi-me.<br>Anjo santo, minha luz, iluminai-me.<br>Anjo santo, a quem Deus encarregou de conduzir-me, governai-me.<br><br>Santo Anjo do Senhor,<br>meu zeloso guardador,<br>se a ti me confiou<br>a piedade divina,<br>sempre me rege,<br>guarda, governa e ilumina.<br>Amém.`,
        imagem_url: '/uploads/modelos/anjo-da-guarda.jpg'
    },
    {
        slug: 'sao-miguel',
        nome: 'São Miguel Arcanjo',
        subtitulo: "Mikha'el (Original em Hebraico)",
        colecao: 'Guerreiros da Fé',
        conhecido_como: 'O Príncipe da Milícia Celeste, Guardião de Israel e Regente do Fogo',
        dia_celebracao: '29 de Setembro',
        invocado_para: '<strong>Proteção suprema</strong> contra o mal e demandas espirituais, <strong>justiça em causas difíceis</strong>, coragem em batalhas ("Guerra dos Filhos da Luz"), limpeza de caminhos e como o guia seguro (psicopompo) na hora da morte.',
        variacoes_nome: 'Miguel, Michael, Michel, Mikael, Maicon, Miqueias, Maicol, Maiquel',
        locais_devocao: '<strong>Santuário do Monte Gargano (Itália)</strong>, <strong>Mont Saint-Michel (França)</strong> e <strong>Sacra di San Michele (Itália)</strong>.',
        detalhes_visuais: `<p>São Miguel é o arquétipo universal do guerreiro divino. Sua iconografia é dinâmica e carrega símbolos de poder cósmico:</p><ul><li><strong>O Comandante (Archistrategos):</strong> Representado vestindo armadura romana ou bizantina, empunhando uma espada (muitas vezes flamejante) ou lança, subjugando o dragão ou demônio. Simboliza a vitória da ordem sobre o caos.</li><li><strong>O Juiz das Almas (Psicostasia):</strong> Representado segurando uma balança de precisão. Nesta faceta, ele pesa as obras das almas no Juízo. Uma variação rara mostra a Virgem Maria tocando no prato da balança para favorecer a misericórdia.</li><li><strong>O Peregrino do Monte:</strong> Em tradições antigas (como no Monte Gargano), aparece sem asas, marcando a terra com sua pegada, simbolizando a sacralização do espaço físico.</li></ul>`,
        historia: `<p>O nome Miguel não é uma afirmação, mas um grito de guerra. Em hebraico, <em>Mikha'el</em> é uma pergunta retórica: <strong>"Quem é como Deus?"</strong>. Foi com este desafio que ele expulsou a soberba de Lúcifer.</p><p>Mas sua história começa muito antes: nas tradições judaicas antigas e nos manuscritos dos Essênios (Mar Morto), ele já era venerado não apenas como anjo, mas como o "Grande Príncipe" e guardião teopolítico de Israel, o motor central da escatológica "Guerra dos Filhos da Luz contra os Filhos das Trevas".</p><p>A sua geografia sagrada é um mistério à parte. Existe uma linha reta imaginária, a <strong>"Espada de São Miguel"</strong>, que conecta sete santuários antiquíssimos, alinhados perfeitamente com o pôr do sol no solstício de verão:</p><ul><li><strong>Skellig Michael (Irlanda):</strong> Uma ilha rochosa no "fim do mundo", símbolo de ascetismo extremo.</li><li><strong>St. Michael's Mount (Reino Unido):</strong> Uma ilha de maré na Cornualha, antigo porto.</li><li><strong>Mont Saint-Michel (França):</strong> A icônica abadia fundada após o anjo tocar o crânio do bispo para provar sua presença.</li><li><strong>Sacra di San Michele (Itália):</strong> Uma abadia imponente nos Alpes, o ponto central exato da linha.</li><li><strong>Monte Sant'Angelo (Itália):</strong> O santuário mais antigo do Ocidente, uma gruta consagrada pelo próprio Arcanjo.</li><li><strong>Mosteiro de Panormitis (Grécia):</strong> Um porto de ilha que guarda os marinheiros.</li><li><strong>Mosteiro Stella Maris (Israel):</strong> No Monte Carmelo, o "punho" da espada, conectando a tradição angélica à dos profetas.</li></ul><p>Sua força transcende fronteiras religiosas. No Islã, ele é <em>Mīkāl</em>, o anjo da natureza e do sustento. Uma tradição profunda diz que ele jamais riu desde que o Inferno foi criado, tal é a sua seriedade diante da justiça divina.</p><p>No esoterismo moderno e na Antroposofia de Rudolf Steiner, acredita-se que desde 1879 vivemos na "Era de Micael", um tempo onde a humanidade deve usar a inteligência espiritual para vencer o materialismo frio. Há também mistérios ocultos na própria Igreja: em 1890, o <strong>Papa Leão XIII</strong> compôs um exorcismo profético descrevendo demônios atacando o Vaticano e clamando a Miguel para purificar o santuário.</p><p>Nas Américas, a sua força guerreira fundiu-se profundamente com as tradições africanas. No Brasil, sua espada o conecta a <strong>Ogum</strong> (o orixá da guerra e tecnologia) e sua balança a <strong>Xangô</strong> (justiça). No Caribe, ele aparece como <em>Belie Belcan</em>, um espírito que protege contra o mal e que, <strong>curiosamente</strong>, trabalha em parceria sagrada com Santa Ana <strong>(Anaisa)</strong>, unindo a força masculina de proteção ao acolhimento feminino do lar.</p>`,
        oracao: `São Miguel Arcanjo,<br>defendei-nos no combate.<br>Sede o nosso refúgio contra as maldades e ciladas do demônio.<br><br>Ordene-lhe Deus, instantemente o pedimos,<br>e vós, Príncipe da Milícia Celeste,<br>pela virtude divina,<br>precipitai no inferno a Satanás<br>e aos outros espíritos malignos,<br>que andam pelo mundo para perder as almas.<br>Amém.`,
        imagem_url: '/uploads/modelos/sao-miguel.jpg'
    },
    {
        slug: 'sao-pedro-apostolo',
        nome: 'São Pedro (Petrus)',
        subtitulo: 'Képhas (Original em Aramaico)',
        colecao: 'Apóstolos',
        conhecido_como: 'A Rocha da Igreja e Guardião das Portas do Céu',
        dia_celebracao: '29 de Junho',
        invocado_para: '<strong>Abrir caminhos fechados</strong>, proteção do lar e dos negócios (o porteiro), tomada de decisões difíceis, justiça, chuvas para as colheitas e o poder de <strong>"ligar e desligar"</strong> as situações da vida.',
        variacoes_nome: 'Pedro, Pietro, Pierre, Peter, Petrus, Peder, Boutros',
        locais_devocao: '<strong>Basílica de São Pedro (Vaticano)</strong> e <strong>Prisão Mamertina em Roma</strong>.',
        detalhes_visuais: `<p>A figura de São Pedro é inconfundível pela sua autoridade patriarcal: quase sempre é retratado como um homem maduro, de barba curta e cabelos encaracolados, transmitindo a solidez de quem foi escolhido como alicerce.</p><p>Existem três representações clássicas que você pode encontrar na arte sacra:</p><ul><li><strong>O Mestre das Chaves (Apostólico):</strong> Representado de pé, vestindo túnica e manto, segurando firmemente as Chaves do Reino (uma ou duas) e o Livro das Escrituras. Esta é a imagem da autoridade doutrinária e do poder de decisão.</li><li><strong>O Príncipe dos Apóstolos (Pontifical):</strong> Representado sentado em um trono (Cátedra), vestindo paramentos litúrgicos e segurando o báculo com a cruz tripla, abençoando com a mão direita. É a imagem que vemos na famosa estátua de bronze no Vaticano.</li><li><strong>O Mártir da Humildade:</strong> Representado crucificado de cabeça para baixo, atendendo ao seu pedido final de não ser igualado ao Mestre, simbolizando a humildade absoluta diante do sagrado.</li></ul>`,
        historia: `<p>A transformação de Pedro é um dos eventos onomásticos mais impactantes da história. Seu nome de nascimento era <em>Shimon</em> (Simão), que em hebraico vem da raiz <em>shama</em>, significando "Aquele que ouve". Mas o seu destino não era apenas ouvir, era sustentar. Por isso, recebeu de Jesus um nome que nunca tinha sido usado como nome próprio antes: <strong>Képhas</strong> (em aramaico), que significa literalmente "A Rocha" ou "O Penhasco".</p><p>Antropologicamente, Pedro é o arquétipo universal do "Guardião do Limiar". Na cultura ocidental, ele preencheu o espaço do antigo deus romano <strong>Janus</strong>, o porteiro das transições. Nas tradições de matriz africana e no sincretismo brasileiro, a sua função de "Senhor das Chaves" conecta-o funcionalmente a <strong>Exu</strong> (o mensageiro que abre e fecha os caminhos) e, pela sua sabedoria anciã e justiça, a <strong>Xangô Airá</strong>.</p><p>No Brasil, ele é o responsável pelo "Grand Finale" das <strong>Festas Juninas</strong>. Celebrado com fogueiras e grandes procissões marítimas (por ser o padroeiro dos pescadores), ele também assumiu no folclore as funções de antigo "fazedor de chuva", sendo aquele a quem o sertanejo recorre para abrir as torneiras do céu.</p><p>Uma curiosidade profunda envolve a sua morte. A famosa <strong>Cruz Invertida</strong> é na verdade o símbolo máximo da humildade petrina. Segundo os registros antigos (<em>Atos de Pedro</em>), ao ser condenado à morte em Roma, ele suplicou para ser crucificado de cabeça para baixo, pois não se sentia digno de morrer na mesma posição que o seu Mestre, Jesus.</p>`,
        oracao: `Glorioso São Pedro,<br>tu que tens as chaves do céu e da terra,<br>eu te peço: abre os meus caminhos.<br><br>Fecha o meu corpo contra o mal,<br>contra a inveja e contra as más línguas.<br><br>Com a tua chave de ouro,<br>abre as portas da minha felicidade e prosperidade.<br>Com a tua chave de prata,<br>fecha os caminhos para a tristeza e o fracasso.<br><br>Que eu tenha a firmeza da tua Rocha<br>e a coragem da tua fé.<br>Amém.`,
        imagem_url: '/uploads/modelos/sao-pedro.jpg'
    },
    {
        slug: 'nossa-senhora-da-piedade-pieta',
        nome: 'Nossa Senhora da Piedade (Pietà)',
        subtitulo: 'Vesperbild (Original em Alemão Medieval)',
        colecao: 'Marianos',
        conhecido_como: 'A Mãe da Compaixão e o Colo da Humanidade',
        dia_celebracao: '15 de Setembro',
        invocado_para: '<strong>Consolo na perda</strong> de entes queridos, <strong>cura da depressão</strong> e da angústia, proteção dos filhos e harmonia familiar. É a padroeira oficial de Minas Gerais.',
        variacoes_nome: 'Piedade, Pietá, Dolores, Soledade, Angústias',
        locais_devocao: '<strong>Santuário Basílica N.S. da Piedade (Caeté/MG)</strong>, <strong>Santuário da Mãe Soberana (Portugal)</strong> e a <strong>Basílica de São Pedro (Vaticano)</strong>.',
        detalhes_visuais: `<p>Esta é talvez a imagem mais universal da dor e do amor materno. A Piedade é identificada pela cena da Virgem Maria sentada, segurando o corpo de Jesus morto em seu colo logo após a descida da cruz.</p><p>Existem duas representações clássicas que definem a estética desta devoção:</p><ul><li><strong>A Pietà Renascentista (Idealizada):</strong> Inspirada na obra de Michelangelo, mostra uma Maria jovem e serena, vestida com mantos volumosos, segurando um Cristo que parece apenas adormecido. Transmite paz, resignação e beleza divina.</li><li><strong>A Pietà Gótica/Dramática:</strong> Esta é a versão original histórica (<em>Vesperbild</em>). Mostra uma Maria com expressão de choro visível, muitas vezes com o coração trespassado por espadas (ligação com as Sete Dores), segurando um Cristo com as feridas da Paixão expostas. Transmite a realidade crua do sacrifício.</li></ul>`,
        historia: `<p>A imagem que conhecemos mundialmente pelo nome italiano <em>Pietà</em> nasceu, na verdade, nos vales da Alemanha no século XIV, sob o nome de <em>Vesperbild</em> ("Imagem das Vésperas"). Historicamente, os Evangelhos não descrevem esse momento; a Bíblia passa da Cruz direto para o Túmulo. A Piedade foi uma criação dos místicos para gerar um tempo suspenso onde a mãe pudesse se despedir do filho.</p><p>A versão definitiva desta devoção, contudo, surgiu de um desafio quase impossível. Em 1498, um cardeal francês encomendou a obra exigindo "a mais bela obra de mármore de Roma". <strong>Michelangelo</strong>, com apenas 24 anos, aceitou. Ele viajou pessoalmente às pedreiras de Carrara e passou nove meses apenas escolhendo o bloco de mármore perfeito.</p><p>O resultado foi tão sublime que, reza a lenda, ao ouvir visitantes atribuírem a escultura a outro artista, Michelangelo invadiu a igreja à noite e entalhou seu nome na faixa que cruza o peito da Virgem. É a única obra que ele assinou em toda a sua vida.</p><p>Teologicamente, esta imagem fecha o ciclo da vida de Cristo: o mesmo colo que O segurou no nascimento (o berço) agora O segura na morte (o altar). Essa função de "acolhimento final" explica por que a imagem é tão comum em locais de passagem: ela oferece um modelo visual de conforto, mostrando que ninguém parte sozinho.</p><p>Essa devoção viajou o mundo. Em Portugal (Loulé), é a "Mãe Soberana"; no Sri Lanka, é "Nossa Senhora dos Milagres". No Brasil, ela reina no alto da Serra da Piedade (MG), dominando a paisagem do ferro e do ouro.</p><p>Mas é na riqueza do sincretismo brasileiro que a sua universalidade brilha: pela conexão com as águas (as lágrimas salgadas) e o manto azul, a Piedade é associada na Umbanda e Candomblé às vibrações de <strong>Iemanjá</strong> (a Grande Mãe) e à sabedoria ancestral de <strong>Nanã Buruquê</strong> (mistério da passagem). Assim, ela se torna a mãe que acolhe e cura a dor emocional de todos os filhos, independente do credo.</p>`,
        oracao: `Ó Mãe de Piedade,<br>Senhora das Dores e do Amor Infinito.<br><br>Tu, que recebeste em teus braços<br>o corpo ferido de teu Filho,<br>acolhe agora em teu colo as nossas dores,<br>as nossas angústias e as nossas esperanças.<br><br>Ensina-nos que o amor é mais forte que a morte.<br>Enxuga as nossas lágrimas,<br>como enxugaste o rosto de Cristo,<br>e transforma o nosso sofrimento<br>em semente de ressurreição.<br><br>Mãe Soberana, rogai por nós.<br>Amém.`,
        imagem_url: '/uploads/modelos/pieta.jpg'
    }
];

const DADOS_PECAS = [
    {
        modelo_slug: 'sao-luis-de-montfort',
        codigo: '#001',
        inscricao: 'São Luís',
        cliente: 'Pedro Knob',
        mensagem: "Peça gentilmente oferecida pelo Pedro Knob para o amigo Luís, no seu aniversário.\n\nQue a força e a sabedoria de São Luís, o 'Guerreiro da Virgem', sejam uma inspiração constante em sua jornada.\n\nUm presente de amizade e proteção."
    },
    {
        modelo_slug: 'anjo-da-guarda',
        codigo: '#001',
        inscricao: 'Protegei a Alicia',
        cliente: 'Pedro Knob',
        mensagem: "Peça gentilmente oferecida pelo Pedro Knob para a Alicia, celebrando este dia especial junto ao seu irmão Luís.\n\nQue a luz e a proteção do Santo Anjo sejam uma companhia constante em todos os seus caminhos.\n\nUm presente de amizade e carinho."
    },
    {
        modelo_slug: 'anjo-da-guarda',
        codigo: '#002',
        inscricao: 'Protegei a Maitê',
        cliente: 'Ana Sofia Knob',
        mensagem: "Peça gentilmente oferecida pela Ana Sofia Knob para a amiga Maitê nas celebrações do final de ano de 2025.\n\nQue a luz e a proteção do Santo Anjo sejam uma companhia constante em todos os seus caminhos.\n\nUm presente de amizade e carinho."
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

    // 3. Inserir Peças (COM CHAVES)
    const insertPeca = db.prepare(`
        INSERT INTO pecas (modelo_id, codigo_sequencial, codigo_exibicao, inscricao_base, tamanho, material, acabamento, cliente_nome, mensagem, data_producao, chave_acesso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of DADOS_PECAS) {
        const modelo = db.prepare('SELECT id FROM modelos WHERE slug = ?').get(p.modelo_slug);
        if (modelo) {
            const exists = db.prepare('SELECT id FROM pecas WHERE modelo_id = ? AND codigo_exibicao = ?').get(modelo.id, p.codigo);
            if (!exists) {
                console.log(`🔨 Registrando peça ${p.codigo} de ${p.modelo_slug}`);
                // Gera chave única para cada peça
                const chave = generateUniqueKey(db);
                
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
                    '2025-11', // Formato YYYY-MM
                    chave
                );
            }
        }
    }
});

try {
    runMigration();
    console.log('✅ População Completa! Dados iniciais restaurados.');
} catch (error) {
    console.error('❌ Erro na população:', error);
}