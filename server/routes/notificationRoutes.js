const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/notificationController')
const protect = require('../middleware/authMiddleware')

router.use(protect)

router.get('/', ctrl.getUserNotifications)
router.get('/unread-count', ctrl.getUnreadCount)
router.put('/mark-all-read', ctrl.markAllAsRead)
router.put('/:id/read', ctrl.markAsRead)

module.exports = router
