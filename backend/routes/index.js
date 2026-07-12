const { Router } = require('express');
const { getStatus } = require('../controllers/statusController');
const authRoutes = require('./auth');
const groupsRoutes = require('./groups');
const ramosRoutes = require('./ramos');
const sessionCodesRoutes = require('./sessionCodes');
const votacionesRoutes = require('./votaciones');
const evaluacionesRoutes = require('./evaluaciones');
const studentsImportRoutes = require('./studentsImport');
const criteriosRoutes = require('./criterios');

const router = Router();

router.get('/status', getStatus);
router.use('/auth', authRoutes);
router.use('/groups', groupsRoutes);
router.use('/ramos', ramosRoutes);
router.use('/session-codes', sessionCodesRoutes);
router.use('/votaciones', votacionesRoutes);
router.use('/evaluaciones', evaluacionesRoutes);
router.use('/students', studentsImportRoutes);
router.use('/criterios', criteriosRoutes);

module.exports = router;
