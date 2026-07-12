const { Router } = require('express');
const { listVotes, createVote } = require('../controllers/votacionesController');

const router = Router();

router.get('/', listVotes);
router.post('/', createVote);

module.exports = router;
