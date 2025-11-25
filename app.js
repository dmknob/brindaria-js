// app.js
require('dotenv').config(); // Carrega variáveis de ambiente (.env)
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');

const { injectUserVar } = require('./src/middleware/auth');

// Inicializa o App
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------
// 1. Configurações de View Engine (EJS)
// ---------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------
// 2. Middlewares Globais (Segurança e Performance)
// ---------------------------------------------------------
// Compression: Comprime o HTML/CSS enviado (GZIP), vital para velocidade
app.use(compression());

// Helmet: Adiciona headers de segurança HTTP
// Nota: Ajustamos a Content-Security-Policy para permitir imagens externas se necessário
app.use(helmet({
    contentSecurityPolicy: false, // Desativado temporariamente para facilitar dev (imagens externas)
}));

// Body Parser: Para ler dados de formulários (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session: Necessário para o Login do Admin
app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo_temporario_dev',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure true apenas em HTTPS
}));

app.use(injectUserVar);

// --- HELPER GLOBAL PARA DATAS ---
// Disponível em todas as views (EJS)
app.locals.formatarData = (dataISO) => {
    if (!dataISO) return 'Data não informada';
    // Espera formato YYYY-MM
    try {
        const [ano, mes] = dataISO.split('-');
        const dataObj = new Date(ano, mes - 1); // Mês começa em 0 no JS
        const mesExtenso = dataObj.toLocaleString('pt-BR', { month: 'long' });
        // Capitaliza a primeira letra (novembro -> Novembro)
        const mesFinal = mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1);
        return `${mesFinal} de ${ano}`;
    } catch (e) {
        return dataISO; // Se der erro, retorna o original
    }
};

// ---------------------------------------------------------
// 3. Arquivos Estáticos
// ---------------------------------------------------------
// Serve a pasta 'public' (CSS, JS, Imagens, Uploads)
// Ex: public/css/styles.css fica acessível em /css/styles.css
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------
// 4. Rotas (Importação)
// ---------------------------------------------------------
// Vamos criar estes arquivos nos próximos passos
const publicRoutes = require('./src/routes/publicRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Prefixo /admin para rotas administrativas
app.use('/admin', adminRoutes);

// Rotas públicas (Home, Produtos, etc) na raiz
app.use('/', publicRoutes);

// ---------------------------------------------------------
// 5. Tratamento de Erros (404 e 500)
// ---------------------------------------------------------
// Middleware para 404 (Página não encontrada)
app.use((req, res, next) => {
    res.status(404).render('pages/404', { title: 'Página não encontrada' });
});

// Middleware para erros de servidor
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado no servidor da Brindaria.');
});

// ---------------------------------------------------------
// 6. Inicialização
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🔥 Servidor Brindaria V2 rodando em: http://localhost:${PORT}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
});