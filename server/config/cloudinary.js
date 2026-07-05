const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Gallery/memory upload storage
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'cintu-mintu-gang/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'],
    resource_type:  'auto',
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
})

// Avatar upload storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'cintu-mintu-gang/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
  },
})

// Chat upload storage
const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cintu-mintu-gang/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'ogg', 'wav', 'mp3'],
    resource_type: 'auto',
    transformation: [{ width: 800, crop: 'scale', quality: 'auto', fetch_format: 'auto' }],
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/') || file.mimetype.includes('webm')) {
    cb(null, true)
  } else {
    cb(new Error('Only images, videos, and audio are allowed'), false)
  }
}

module.exports = {
  cloudinary,
  uploadGallery: multer({ storage: galleryStorage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }),
  uploadAvatar:  multer({ storage: avatarStorage,  fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }),
  uploadChat:    multer({ storage: chatStorage,    fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }),
}
