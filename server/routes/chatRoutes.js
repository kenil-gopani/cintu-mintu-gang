const router  = require('express').Router()
const ctrl    = require('../controllers/chatController')
const protect = require('../middleware/authMiddleware')
const { uploadChat } = require('../config/cloudinary')

router.use(protect)

// Rooms
router.get('/rooms',                         ctrl.getRooms)
router.post('/room/private/:userId',         ctrl.getOrCreatePrivateRoom)
router.post('/room/group',                   ctrl.createGroupRoom)

// Messages in a room
router.get('/room/:roomId/messages',         ctrl.getMessages)
router.post('/room/:roomId/message', uploadChat.single('media'), ctrl.sendMessage)

// Single message operations
router.put('/message/:msgId',                ctrl.editMessage)
router.delete('/message/:msgId',             ctrl.deleteMessage)
router.post('/message/:msgId/react',         ctrl.reactMessage)
router.post('/message/:msgId/read',          ctrl.markMessageRead)

// AI Assistant
router.post('/ai',                           ctrl.aiChat)

module.exports = router
