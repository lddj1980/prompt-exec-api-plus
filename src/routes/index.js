const express = require('express');
const SolicitacaoController = require('../controllers/SolicitacaoController');
const ApiKeyMiddleware = require('../middlewares/ApiKeyMiddleware');

const router = express.Router();

// Middleware que ignora rotas específicas
const excludeRoutesMiddleware = (middleware, excludedPaths) => {
  return (req, res, next) => {
    if (excludedPaths.includes(req.path)) {
      return next();
    }
    return middleware(req, res, next);
  };
};

// Lista de rotas excluídas do middleware
const excludedPaths = ['/api-docs', '/openapi.json', '/callback'];

// Aplicação das rotas
router.post(
  '/solicitacoes',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.create
);
router.post(
  '/solicitacoes/:protocoloUid/resume',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.resume
);
router.post(
  '/solicitacoes/:protocoloUid/process',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.process
);
router.get(
  '/solicitacoes/:protocoloUid/progress',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.getProgress
);
router.get(
  '/solicitacoes/:protocoloUid/result',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.getResultado
);

router.get(
  '/callback',
  excludeRoutesMiddleware(ApiKeyMiddleware, excludedPaths),
  SolicitacaoController.callback
);

module.exports = router;