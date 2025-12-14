// src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');


router.get('/', publicController.getHome);

router.get('/contato', publicController.getContato);

router.get('/pecas', publicController.getCatalogo);

// Rota para Sitemap XML
router.get('/sitemap.xml', publicController.getSitemap);

// 1. Acesso Direto por Chave (Rota Curta do QR Code)
// Ex: brindaria.com.br/v/K6RS9
router.get('/v/:chave', publicController.getPecaByKey);

// --- HARD REDIRECTS (CORREÇÃO DE QR-CODE) ---
// Corrige links impressos com o slug antigo `sao-pedro` para a peça específica
// (caso isolado): redireciona para a CHAVE de acesso da peça (QR Key).
// Caso: /pecas/espiritual/sao-pedro/001 -> /v/6TPYK
router.get('/pecas/espiritual/sao-pedro/:codigo?', (req, res) => {
    // Código antigo impresso errado: queremos apontar diretamente para a peça
    // correta usando sua chave (chave_acesso = 6TPYK).
    return res.redirect(301, '/v/6TPYK');
});

router.get('/pecas/:categoria/:slug/:codigo?', publicController.getDetalhe);

// Validação de Peça (Busca por Código ou Chave)
router.post('/validar', publicController.postValidarPeca);
router.get('/validar', (req, res) => res.redirect('/')); // Redireciona se tentar acessar via GET

module.exports = router;