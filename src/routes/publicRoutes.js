// src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');


router.get('/', publicController.getHome);

router.get('/contato', publicController.getContato);

router.get('/pecas', publicController.getCatalogo);

// Rota Curta para Compartilhamento (Redirecionador Inteligente)
// ex: brindaria.com.br/v/anjo-da-guarda/001 -> Redireciona para a URL longa canônica
router.get('/v/:slug/:codigo', (req, res) => {
    const { slug, codigo } = req.params;
    // Aqui assumimos categoria "espiritual" por padrão ou buscamos no banco.
    // Para simplificar V2, vamos hardcodar 'espiritual' ou buscar.
    // Melhor: Redirecionar para URL longa.
    res.redirect(`/pecas/espiritual/${slug}/${codigo}`);
});

// Rota Principal (Modelo e Peça)
// O :codigo? com interrogação diz que é opcional
router.get('/pecas/:categoria/:slug/:codigo?', publicController.getDetalhe);

module.exports = router;