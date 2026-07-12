const { Router } = require('express');
const {
  listCriterios,
  listCriteriosByEvaluacion,
  getCriterioById,
  createCriterio,
  updateCriterio,
  deleteCriterio,
} = require('../controllers/criteriosController');

const router = Router();

router.get('/', listCriterios);
router.get('/evaluacion/:id_evaluacion', listCriteriosByEvaluacion);
router.get('/:id', getCriterioById);
router.post('/', createCriterio);
router.put('/:id', updateCriterio);
router.delete('/:id', deleteCriterio);

module.exports = router;
