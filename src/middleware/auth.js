// src/middleware/auth.js
const crypto = require('crypto');

// Middleware para proteger rotas
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    // Salva a url que ele tentou acessar para redirecionar depois
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin/login');
};

// Helper para injetar variavel 'isAdmin' em todas as views (para mostrar/esconder menu)
exports.injectUserVar = (req, res, next) => {
    res.locals.isAdmin = !!req.session.admin;
    next();
};

// Função de verificação de senha (SHA-256)
exports.checkPassword = (inputPassword) => {
    const hash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    return hash === process.env.ADMIN_HASH;
};