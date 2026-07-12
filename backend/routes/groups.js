const { Router } = require('express');
const { listGroups, getGroup, createGroup } = require('../controllers/groupsController');

const router = Router();

router.get('/', listGroups);
router.post('/', createGroup);
router.get('/:id', getGroup);

module.exports = router;
