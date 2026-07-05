const router  = require('express').Router()
const ctrl    = require('../controllers/pollController')
const protect = require('../middleware/authMiddleware')

router.use(protect)
router.get('/',          ctrl.getAllPolls)
router.post('/',         ctrl.createPoll)
router.post('/:id/vote', ctrl.votePoll)

module.exports = router
