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
const PORT = process.env.PORT;

app.set('trust proxy', 1);
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
    contentSecurityPolicy: {reportOnly: true}, // Desativado temporariamente para facilitar dev (imagens externas)
}));

// Body Parser: Para ler dados de formulários (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session: Necessário para o Login do Admin
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure true apenas em HTTPS
}));

app.use(injectUserVar);

// --- HELPER GLOBAL PARA DATAS (ATUALIZADO V2.1) ---
// Suporta YYYY-MM (Mês/Ano) e YYYY-MM-DD (Data Completa)
app.locals.formatarData = (dataISO) => {
    if (!dataISO) return 'Data não informada';
    
    try {
        // Caso 1: Data Completa (YYYY-MM-DD) -> "05 de Dezembro de 2025"
        if (dataISO.length === 10) {
            const [ano, mes, dia] = dataISO.split('-');
            const dataObj = new Date(ano, mes - 1, dia);
            return dataObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        // Caso 2: Apenas Mês (YYYY-MM) -> "Novembro de 2025"
        const [ano, mes] = dataISO.split('-');
        const dataObj = new Date(ano, mes - 1);
        const mesExtenso = dataObj.toLocaleString('pt-BR', { month: 'long' });
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
// Serve a pasta 'public' com Cache de 1 dia (86400000 ms)
// Isso faz o site carregar instantaneamente para quem volta
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // 1 dia de cache
    etag: true, // Habilita ETag para melhorar o cache
}));

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

// Middleware para erros de servidor (500)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log do erro no terminal para você ver
    res.status(500).render('pages/500', { title: 'Erro Interno' });
});

// ---------------------------------------------------------
// 6. Inicialização
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🔥 Servidor Brindaria V2.2 rodando em: http://localhost:${PORT}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV}`);
});