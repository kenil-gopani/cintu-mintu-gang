const router  = require('express').Router()
const ctrl    = require('../controllers/userController')
const protect = require('../middleware/authMiddleware')
const { uploadAvatar } = require('../config/cloudinary')

router.use(protect)

router.get('/',                 ctrl.getAllUsers)
router.get('/birthdays',        ctrl.getBirthdays)
router.get('/dashboard-stats',  ctrl.getDashboardStats)
router.get('/activities',       ctrl.getActivities)
router.get('/tree',             ctrl.getFamilyTree)
router.post('/tree/member',     ctrl.createFamilyMember)
router.delete('/tree/member/:id', ctrl.deleteFamilyMember)
router.get('/:id',              ctrl.getUserById)
router.put('/:id',              ctrl.updateUser)
router.put('/:id/password',     ctrl.updatePassword)
router.put('/:id/admin-reset-password', ctrl.adminResetPassword)
router.put('/:id/admin-update-points',  ctrl.adminUpdatePoints)
router.put('/:id/admin-update-game-points', ctrl.adminUpdateGamePoints)
router.put('/:id/relations',    ctrl.updateRelations)
router.put('/:id/avatar', uploadAvatar.single('avatar'), ctrl.updateAvatar)

module.exports = router
