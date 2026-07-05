const router  = require('express').Router()
const ctrl    = require('../controllers/chatController')
const protect = require('../middleware/authMiddleware')
const { uploadChat } = require('../config/cloudinary')

router.use(protect)

router.get('/rooms', ctrl.getRooms)
router.post('/room/private/:userId', ctrl.getOrCreatePrivateRoom)
router.post('/room/group', ctrl.createGroupRoom)

router.get('/room/:roomId/messages', ctrl.getMessages)
router.post('/room/:roomId/message', uploadChat.single('media'), ctrl.sendMessage)

router.post('/message/:msgId/read', ctrl.markMessageRead)

module.exports = router
