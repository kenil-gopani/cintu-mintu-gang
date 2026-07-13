const router  = require('express').Router()
const ctrl    = require('../controllers/adminController')
const protect = require('../middleware/authMiddleware')
const admin   = require('../middleware/adminMiddleware')

router.use(protect, admin)

router.get('/members',          ctrl.getAllMembers)
router.post('/members',         ctrl.addMember)
router.post('/fix-passwords',   ctrl.fixPasswords)
router.put('/members/:id/role', ctrl.changeRole)
router.delete('/members/:id',   ctrl.removeMember)

router.get('/invites',          ctrl.getInvites)
router.post('/invites',         ctrl.createInvite)

router.delete('/memory/:id',    ctrl.adminDeleteMemory)

router.get('/analytics',        ctrl.getAnalytics)
router.post('/push',            ctrl.pushNotification)

module.exports = router
