const router  = require('express').Router()
const ctrl    = require('../controllers/gameController')
const protect = require('../middleware/authMiddleware')

router.use(protect)

router.post('/score', ctrl.submitScore)
router.get('/leaderboard', ctrl.getLeaderboard)
router.get('/history/:userId?', ctrl.getUserHistory)

module.exports = router
