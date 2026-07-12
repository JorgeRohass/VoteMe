const { Router } = require('express');
const { verifySso, registerSso, promoteToProfesor, listUsers } = require('../controllers/authController');

const router = Router();

router.post('/verify-sso', verifySso);
router.post('/register', registerSso);
router.post('/promote-profesor', promoteToProfesor);
router.get('/users', listUsers);

module.exports = router;
