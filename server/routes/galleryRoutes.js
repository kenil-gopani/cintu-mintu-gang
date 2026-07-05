const router  = require('express').Router()
const ctrl    = require('../controllers/galleryController')
const protect = require('../middleware/authMiddleware')
const { uploadGallery } = require('../config/cloudinary')

router.use(protect)

router.get('/',                           ctrl.getAllMemories)
router.get('/albums',                     ctrl.getAlbums)
router.post('/',            uploadGallery.single('media'), ctrl.uploadMemory)
router.delete('/:id',       ctrl.deleteMemory)
router.post('/:id/like',    ctrl.toggleLike)
router.post('/:id/favorite',ctrl.toggleFavorite)
router.post('/:id/comment', ctrl.addComment)
router.delete('/:id/comment/:commentId', ctrl.deleteComment)

module.exports = router
