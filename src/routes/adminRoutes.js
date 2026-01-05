// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const systemController = require('../controllers/systemController');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
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

router.get('/login', adminController.getLogin);
router.post('/login', loginLimiter, adminController.postLogin);
router.get('/logout', adminController.logout);

//  ####################################################
// ROTAS PROTEGIDAS
router.use(isAuthenticated);

router.get('/dashboard', adminController.getDashboard);

// --- SISTEMA & BACKUP ---
// Verifica se o controller existe antes de rotear (segurança caso arquivo falte)
if (systemController) {
    router.get('/sistema', systemController.getIndex);
    router.get('/sistema/backup', systemController.downloadBackup);
}

// --- CATEGORIAS ---
router.get('/categorias', adminController.getCategorias);
router.post('/categorias', adminController.postNovaCategoria);

// --- FIGURAS ---
// Agora a URL oficial é /admin/figuras
router.get('/figuras', adminController.getFiguras);
router.get('/figuras/novo', adminController.getNovaFigura); // Atenção: /novo e não /nova (padronizado)
router.post('/figuras/novo', adminController.postNovaFigura);
router.get('/figuras/:id/editar', adminController.getEditarFigura);
router.post('/figuras/:id/editar', adminController.postEditarFigura);
router.post('/figuras/:id/delete', adminController.postDeletarFigura);

// --- PEÇAS ---
router.get('/pecas', adminController.getPecas);
router.get('/pecas/nova', adminController.getNovaPeca); // Atenção: /nova (feminino)
router.post('/pecas/nova', adminController.postNovaPeca);
router.get('/pecas/:id/editar', adminController.getEditarPeca);
router.post('/pecas/:id/editar', adminController.postEditarPeca);
router.post('/pecas/:id/delete', adminController.postDeletarPeca);

module.exports = router;