const { Router } = require('express');
const { 
  getEvaluacionCriterios, 
  saveEvaluacionCriterios, 
  submitRespuestas,
  createSession,
  getSessionByCode,
  getGroupEvaluations,
  calculateGroupGrade,
  getGroupEvaluationResults,
  getEvaluacionById,
  linkGroupToEvaluation
} = require('../controllers/evaluacionesController');

const router = Router();

router.get('/:id', getEvaluacionById);
router.get('/:id/criterios', getEvaluacionCriterios);
router.post('/:id/criterios', saveEvaluacionCriterios);
router.post('/respuestas', submitRespuestas);

// Nuevas rutas para sesiones y evaluaciones de grupos
router.post('/sesiones', createSession);
router.get('/sesiones/:codigo', getSessionByCode);
router.get('/grupo/:id_grupo/evaluaciones', getGroupEvaluations);
router.get('/grupo/:id_grupo/evaluacion/:id_evaluacion/calcular', calculateGroupGrade);
router.get('/grupo/:id_grupo/evaluacion/:id_evaluacion/resultados', getGroupEvaluationResults);
router.post('/link', linkGroupToEvaluation);

module.exports = router;
