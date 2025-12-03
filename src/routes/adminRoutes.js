// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/auth');
const systemController = require('../controllers/systemController');

// --- SEGURANÇA: Limitador de Tentativas (Brute Force) ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limite de 5 tentativas por IP
    message: 'Muitas tentativas de acesso. Por segurança, aguarde 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// --- ROTAS PÚBLICAS DO ADMIN ---

router.get('/', (req, res) => {
    if (req.session && req.session.admin) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

// GET Login (Mostra o formulário)
router.get('/login', adminController.getLogin);

// POST Login (Processa a senha) - AQUI entra o limitador
router.post('/login', loginLimiter, adminController.postLogin);

// Logout
router.get('/logout', adminController.logout);

//  ####################################################
// Rotas Protegidas (Middleware aplicado a todas abaixo)
router.use(isAuthenticated);

router.get('/dashboard', adminController.getDashboard);

// --- CATEGORIAS ---
router.get('/categorias', adminController.getCategorias);
router.post('/categorias', adminController.postNovaCategoria);

// MODELOS
router.get('/modelos', adminController.getModelos);
router.get('/modelos/novo', adminController.getNovoModelo);
router.post('/modelos/novo', adminController.postNovoModelo);
// --- ROTAS DE EDIÇÃO DE MODELO ---
router.get('/modelos/:id/editar', adminController.getEditarModelo);
router.post('/modelos/:id/editar', adminController.postEditarModelo);

// Cadastro de Peça
router.get('/pecas', adminController.getPecas);
router.get('/pecas/nova', adminController.getNovaPeca);
router.post('/pecas/nova', adminController.postNovaPeca);

// --- ROTAS DE EDIÇÃO DE PEÇA ---
router.get('/pecas/:id/editar', adminController.getEditarPeca);
router.post('/pecas/:id/editar', adminController.postEditarPeca);
router.post('/pecas/:id/delete', adminController.postDeletarPeca); // Rota de Exclusão

// --- CONFIGURAÇÕES DO SISTEMA ---
router.get('/sistema', systemController.getIndex);
router.get('/sistema/backup', systemController.downloadBackup);
//  ####################################################

module.exports = router;