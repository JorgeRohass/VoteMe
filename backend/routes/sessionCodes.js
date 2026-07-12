const { Router } = require('express');
const { listSessionCodes, createSessionCode, validateSessionCode } = require('../controllers/sessionCodesController');

const router = Router();

router.get('/', listSessionCodes);
router.post('/', createSessionCode);
router.get('/:codigo/validate', validateSessionCode);

module.exports = router;
